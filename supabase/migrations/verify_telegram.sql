create or replace function verify_telegram_signature(
  init_data text,
  bot_token text
) returns boolean as $$
declare
  data_check_string text;
  secret_key text;
  hash text;
begin
  -- Извлекаем hash из init_data
  hash := split_part(init_data, '&hash=', 2);
  
  -- Формируем строку для проверки
  data_check_string := regexp_replace(
    split_part(init_data, '&hash=', 1),
    '([^a-zA-Z0-9_-])',
    '',
    'g'
  );
  
  -- Создаем секретный ключ
  secret_key := encode(
    hmac(
      bot_token::bytea,
      'WebAppData'::bytea,
      'sha256'
    ),
    'hex'
  );
  
  -- Проверяем подпись
  return encode(
    hmac(
      data_check_string::bytea,
      secret_key::bytea,
      'sha256'
    ),
    'hex'
  ) = hash;
end;
$$ language plpgsql security definer; 