create or replace function authenticate_telegram(
  init_data text,
  user_id bigint
) returns json as $$
declare
  session_id uuid;
begin
  -- Просто создаём или обновляем пользователя с Telegram ID
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

  -- Создаём или обновляем профиль в public.users (минимально)
  insert into public.users (id, name, username, joined_at, updated_at)
  values (
    user_id,
    user_id::text,
    user_id::text,
    now(),
    now()
  )
  on conflict (id) do update set
    updated_at = now();

  -- Создаём сессию
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
  returning id into session_id;

  if session_id is null then
    return json_build_object(
      'success', false,
      'message', 'Session not created'
    );
  end if;

  return json_build_object(
    'success', true,
    'session_id', session_id,
    'user_id', user_id
  );
end;
$$ language plpgsql security definer; 