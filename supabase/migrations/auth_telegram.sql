create or replace function authenticate_telegram(
  init_data text,
  user_id bigint
) returns json as $$
declare
  bot_token text := current_setting('app.telegram_bot_token', true);
  result json;
begin
  -- Проверяем, установлен ли токен бота
  if bot_token is null then
    return json_build_object(
      'success', false,
      'message', 'Bot token is not configured'
    );
  end if;

  -- Проверяем подпись
  if not verify_telegram_signature(init_data, bot_token) then
    return json_build_object(
      'success', false,
      'message', 'Invalid signature'
    );
  end if;

  -- Создаем или обновляем пользователя в auth.users
  insert into auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    last_sign_in_at
  )
  values (
    user_id,
    '00000000-0000-0000-0000-000000000000',
    user_id || '@telegram.user',
    crypt(init_data, gen_salt('bf')),
    now(),
    json_build_object(
      'provider', 'telegram',
      'providers', array['telegram']
    ),
    json_build_object(
      'telegram_id', user_id
    ),
    now(),
    now(),
    now()
  )
  on conflict (id) do update set
    last_sign_in_at = now(),
    updated_at = now();

  -- Создаем новую сессию
  insert into auth.sessions (
    id,
    user_id,
    created_at,
    updated_at
  )
  values (
    gen_random_uuid(),
    user_id,
    now(),
    now()
  )
  returning json_build_object(
    'success', true,
    'session_id', id,
    'user_id', user_id
  ) into result;

  return result;
end;
$$ language plpgsql security definer; 