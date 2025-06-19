BEGIN;

-- Enable uuid extension (for wallet_history.id)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Дополняем таблицу users замороженными средствами
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS locked_credits numeric NOT NULL DEFAULT 0;

-- 2. Дополняем таблицу orders полями эскроу, выплат и дедлайна
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS escrow_locked boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS payout_done  boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deadline_at  timestamptz;

-- 3. История движения средств
CREATE TABLE IF NOT EXISTS public.wallet_history (
    id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id           integer REFERENCES public.users(id) ON DELETE CASCADE,
    amount            numeric NOT NULL CHECK (amount > 0),
    direction         text    NOT NULL CHECK (direction IN ('in','out','lock','unlock')),
    related_order_id  uuid REFERENCES public.orders(id) ON DELETE SET NULL,
    description       text,
    created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS wallet_history_user_id_idx  ON public.wallet_history(user_id);
CREATE INDEX IF NOT EXISTS wallet_history_order_id_idx ON public.wallet_history(related_order_id);

-- 4. Функция lock_credits – резервирование средств клиента
CREATE OR REPLACE FUNCTION public.lock_credits(user_id integer, amount numeric)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    IF amount <= 0 THEN
        RAISE EXCEPTION 'amount must be positive';
    END IF;

    UPDATE public.users
    SET credits        = credits - amount,
        locked_credits = locked_credits + amount
    WHERE id = user_id
      AND credits >= amount;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'insufficient_funds';
    END IF;

    INSERT INTO public.wallet_history(user_id, amount, direction, description)
    VALUES (user_id, amount, 'lock', 'Escrow lock');
END;
$$;

-- 5. Функция unlock_credits – возврат средств при отмене заказа
CREATE OR REPLACE FUNCTION public.unlock_credits(user_id integer, amount numeric)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    IF amount <= 0 THEN
        RAISE EXCEPTION 'amount must be positive';
    END IF;

    UPDATE public.users
    SET credits        = credits + amount,
        locked_credits = locked_credits - amount
    WHERE id = user_id
      AND locked_credits >= amount;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'not_enough_locked_credits';
    END IF;

    INSERT INTO public.wallet_history(user_id, amount, direction, description)
    VALUES (user_id, amount, 'unlock', 'Escrow unlock');
END;
$$;

-- 6. Функция payout_to_provider – финальная выплата исполнителю
CREATE OR REPLACE FUNCTION public.payout_to_provider(
    client_id    integer,
    provider_id  integer,
    amount       numeric,
    order_id     uuid
) RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    IF amount <= 0 THEN
        RAISE EXCEPTION 'amount must be positive';
    END IF;

    -- Списываем замороженные средства клиента
    UPDATE public.users
    SET locked_credits = locked_credits - amount
    WHERE id = client_id
      AND locked_credits >= amount;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'client_locked_credits_not_enough';
    END IF;

    -- Начисляем исполнителю
    UPDATE public.users
    SET credits = credits + amount
    WHERE id = provider_id;

    -- Аудит
    INSERT INTO public.wallet_history(user_id, amount, direction, related_order_id, description)
    VALUES (client_id,  amount, 'out',  order_id, 'Order payout to provider'),
           (provider_id, amount, 'in',   order_id, 'Order payout from client');
END;
$$;

COMMIT; 