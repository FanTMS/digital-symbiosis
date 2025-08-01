BEGIN;

-- Обновляем тип данных в таблице subscriptions
ALTER TABLE IF EXISTS public.subscriptions 
  ALTER COLUMN follower_id TYPE bigint,
  ALTER COLUMN followed_id TYPE bigint;

-- Обновляем тип данных в таблице favorites (если она существует)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'favorites') THEN
    ALTER TABLE public.favorites ALTER COLUMN user_id TYPE bigint;
  END IF;
END
$$;

-- Обновляем тип данных в таблице wallet_history
ALTER TABLE IF EXISTS public.wallet_history
  ALTER COLUMN user_id TYPE bigint;

-- Обновляем тип данных в таблице user_badges (если она существует)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_badges') THEN
    ALTER TABLE public.user_badges ALTER COLUMN user_id TYPE bigint;
  END IF;
END
$$;

-- Обновляем тип данных в таблице reviews (если она существует)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reviews') THEN
    ALTER TABLE public.reviews ALTER COLUMN user_id TYPE bigint;
  END IF;
END
$$;

-- Обновляем тип данных в таблице orders
ALTER TABLE IF EXISTS public.orders
  ALTER COLUMN client_id TYPE bigint,
  ALTER COLUMN provider_id TYPE bigint;

-- Обновляем тип данных в таблице chat_messages (если она существует)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'chat_messages') THEN
    ALTER TABLE public.chat_messages ALTER COLUMN sender_id TYPE bigint;
  END IF;
END
$$;

-- Обновляем тип данных в таблице chats (если она существует)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'chats') THEN
    ALTER TABLE public.chats 
      ALTER COLUMN user1_id TYPE bigint,
      ALTER COLUMN user2_id TYPE bigint;
  END IF;
END
$$;

-- Обновляем тип данных в таблице notifications (если она существует)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notifications') THEN
    ALTER TABLE public.notifications ALTER COLUMN user_id TYPE bigint;
  END IF;
END
$$;

-- Обновляем тип данных в таблице price_proposals (если она существует)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'price_proposals') THEN
    ALTER TABLE public.price_proposals 
      ALTER COLUMN client_id TYPE bigint,
      ALTER COLUMN provider_id TYPE bigint;
  END IF;
END
$$;

-- Обновляем тип данных в таблице services
ALTER TABLE IF EXISTS public.services
  ALTER COLUMN user_id TYPE bigint;

COMMIT;