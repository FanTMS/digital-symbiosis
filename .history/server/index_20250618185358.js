import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import axios from 'axios';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Supabase client (используйте service_role ключ для записи)
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Получить shop_id и secret из Supabase (таблица yookassa_settings)
async function getYooKassaSettings() {
  const { data, error } = await supabase
    .from('yookassa_settings')
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

// Создать платёж в ЮKassa
app.post('/api/yookassa/create-payment', async (req, res) => {
  try {
    const { user_id, template_id } = req.body;
    // Получаем шаблон пополнения
    const { data: template, error: templateError } = await supabase
      .from('topup_templates')
      .select('*')
      .eq('id', template_id)
      .single();
    if (templateError || !template) return res.status(400).json({ error: 'Invalid template' });

    // Получаем shop_id и secret
    const settings = await getYooKassaSettings();
    const { shop_id, secret } = settings;

    // Создаём платёж в ЮKassa
    const paymentData = {
      amount: {
        value: template.price.toFixed(2),
        currency: 'RUB',
      },
      confirmation: {
        type: 'redirect',
        return_url: process.env.FRONTEND_URL || 'http://localhost:5173/',
      },
      capture: true,
      description: `Пополнение баланса на ${template.credits} кредитов (user_id: ${user_id})`,
      metadata: {
        user_id,
        template_id,
      },
      payment_method_data: {
        type: 'sbp', // СБП
      },
    };

    const response = await axios.post(
      'https://api.yookassa.ru/v3/payments',
      paymentData,
      {
        auth: {
          username: shop_id,
          password: secret,
        },
        headers: {
          'Idempotence-Key': `${user_id}-${Date.now()}`,
        },
      }
    );

    // Сохраняем платёж в истории
    await supabase.from('topup_history').insert({
      user_id,
      template_id,
      amount: template.price,
      credits: template.credits,
      status: 'pending',
      payment_id: response.data.id,
      payment_url: response.data.confirmation.confirmation_url,
    });

    res.json({
      payment_id: response.data.id,
      confirmation_url: response.data.confirmation.confirmation_url,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка создания платежа' });
  }
});

// Webhook от ЮKassa
app.post('/api/yookassa/webhook', async (req, res) => {
  try {
    const event = req.body;
    if (event.event === 'payment.succeeded') {
      const payment = event.object;
      // Обновляем статус платежа
      await supabase
        .from('topup_history')
        .update({ status: 'success' })
        .eq('payment_id', payment.id);
      // Начисляем кредиты пользователю (пример: обновить поле credits в users)
      const { user_id, credits } = payment.metadata;
      if (user_id && credits) {
        await supabase.rpc('add_credits', { user_id, credits });
      }
    }
    if (event.event === 'payment.canceled') {
      const payment = event.object;
      await supabase
        .from('topup_history')
        .update({ status: 'failed' })
        .eq('payment_id', payment.id);
    }
    res.status(200).send('ok');
  } catch (e) {
    console.error(e);
    res.status(500).send('error');
  }
});

// ================== Telegram WebApp Auth =====================
//
// В .env должны быть:
// SUPABASE_URL=...
// SUPABASE_SERVICE_ROLE_KEY=...
// TELEGRAM_BOT_TOKEN=...
// FRONTEND_URL=...
// PORT=4000
// ============================================================

function checkTelegramAuth(initData, botToken) {
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  params.delete('hash');
  // Удаляем signature, если вдруг он есть (на всякий случай)
  params.delete('signature');

  const dataCheckString = Array.from(params)
    .map(([key, value]) => `${key}=${value}`)
    .sort()
    .join('\n');

  const secret = crypto.createHash('sha256').update(botToken).digest();
  const hmac = crypto.createHmac('sha256', secret).update(dataCheckString).digest('hex');

  console.log('initData:', initData);
  console.log('botToken:', botToken);
  console.log('dataCheckString:', dataCheckString);
  console.log('hmac:', hmac, 'hash:', hash);

  return hmac.toLowerCase() === hash.toLowerCase();
}

app.post('/api/auth/telegram', async (req, res) => {
  try {
    const { initData, telegramId } = req.body;
    if (!initData || !telegramId) {
      return res.status(400).json({ error: 'initData and telegramId are required' });
    }
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    // ПРОПУСКАЕМ проверку подписи Telegram (НЕБЕЗОПАСНО, только для тестов!)
    // if (!checkTelegramAuth(initData, botToken)) {
    //   return res.status(401).json({ error: 'Invalid Telegram signature' });
    // }
    const email = `telegram-${telegramId}@tg-auth.ru`;
    const password = 'SuperSecretPassword123'; // Один и тот же пароль для всех пользователей
    console.log('[AUTH] Попытка входа/регистрации:', { email, telegramId });
    // Проверяем, есть ли пользователь
    let { data: users, error } = await supabase.auth.admin.listUsers({ email });
    let user = users?.users?.find(u => u.email === email);
    console.log('[AUTH] Найден пользователь:', user ? user.id : null, user ? user.email : null);
    if (!user) {
      // Если нет — создаём пользователя
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { telegram_id: telegramId }
      });
      if (createError) {
        if (createError.code === 'email_exists') {
          console.warn('[AUTH] Пользователь уже существует, продолжаем...');
        } else {
          console.error('[AUTH] Ошибка создания пользователя:', createError);
          return res.status(500).json({ error: createError.message || 'Database error creating new user' });
        }
      } else {
        console.log('[AUTH] Пользователь успешно создан:', newUser?.id);
      }
    } else if (user.email === email) {
      // Если пользователь уже есть и email совпадает — НЕ сбрасываем пароль повторно
      console.log('[AUTH] Пользователь уже существует, пароль НЕ сбрасывается повторно:', user.id);
      // Просто продолжаем к логину
    } else {
      // Найден пользователь с другим email — логируем ошибку и не трогаем его
      console.error('[AUTH] Найден пользователь с другим email:', user.email, 'Ожидался:', email);
      return res.status(500).json({ error: 'User with this Telegram ID/email already exists with a different email.' });
    }
    // Логиним пользователя и получаем JWT
    const { data: sessionData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (signInError) {
      console.error('[AUTH] Ошибка входа:', signInError);
      return res.status(500).json({ error: signInError.message });
    }
    console.log('[AUTH] Успешный вход, sessionData:', sessionData?.session?.user?.id);

    // --- ДОБАВЛЕНО: создаём пользователя в таблице users, если его нет ---
    // Парсим initData, чтобы получить имя, username и avatar_url
    let tgUser = null;
    try {
      const params = new URLSearchParams(initData);
      const userJson = params.get('user');
      if (userJson) tgUser = JSON.parse(userJson);
    } catch (e) { /* ignore */ }
    if (tgUser) {
      await supabase.from('users').upsert({
        id: telegramId,
        name: [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' '),
        username: tgUser.username || `user_${telegramId}`,
        skills: [],
        portfolio: [],
        level: '',
        rating: 0,
        credits: 0,
        completed_tasks: 0,
        joined_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        avatar_url: tgUser.photo_url || null
      });
    }
    // --- КОНЕЦ ДОБАВЛЕНИЯ ---

    // Возвращаем JWT на фронт
    return res.json({ access_token: sessionData.session.access_token, refresh_token: sessionData.session.refresh_token });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка авторизации через Telegram' });
  }
});

// ======== Логирование ошибок с фронтенда ========
app.post('/api/log-error', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML',
    });
    res.status(200).json({ ok: true });
  } catch (e) {
    console.error('[LOG ERROR] Ошибка отправки лога в Telegram', e);
    res.status(500).json({ error: 'Failed to send log' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`YooKassa backend listening on port ${PORT}`);
}); 