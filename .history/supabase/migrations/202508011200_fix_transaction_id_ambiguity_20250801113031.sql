BEGIN;

-- Исправление: избегаем неоднозначности имени transaction_id внутри функций,
-- используя позиционный параметр $3 вместо необъяснённого идентификатора.

-- 1. lock_credits
CREATE OR REPLACE FUNCTION public.lock_credits(user_id bigint, amount numeric, transaction_id text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    existing_transaction record;
BEGIN
    IF transaction_id IS NOT NULL THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'credit_transactions'
        ) THEN
            SELECT * INTO existing_transaction 
            FROM public.credit_transactions 
            WHERE transaction_id = $3 AND operation_type = 'lock';
            IF FOUND AND existing_transaction.status = 'completed' THEN RETURN; END IF;
            IF FOUND AND existing_transaction.status = 'pending'   THEN RAISE EXCEPTION 'transaction_in_progress'; END IF;
            INSERT INTO public.credit_transactions(transaction_id, user_id, amount, operation_type, status)
            VALUES ($3, user_id, amount, 'lock', 'pending');
        END IF;
    END IF;
    IF amount <= 0 THEN RAISE EXCEPTION 'amount must be positive'; END IF;
    UPDATE public.users
    SET credits = credits - amount,
        locked_credits = locked_credits + amount
    WHERE id = user_id AND credits >= amount;
    IF NOT FOUND THEN
        IF transaction_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'credit_transactions'
        ) THEN
            UPDATE public.credit_transactions SET status = 'failed' WHERE transaction_id = $3;
        END IF;
        RAISE EXCEPTION 'insufficient_funds';
    END IF;
    INSERT INTO public.wallet_history(user_id, amount, direction, description)
    VALUES (user_id, amount, 'lock', 'Escrow lock');
    IF transaction_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'credit_transactions'
    ) THEN
        UPDATE public.credit_transactions SET status = 'completed', completed_at = now() WHERE transaction_id = $3;
    END IF;
END;
$$;

-- 2. unlock_credits
CREATE OR REPLACE FUNCTION public.unlock_credits(user_id bigint, amount numeric, transaction_id text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    existing_transaction record;
BEGIN
    IF transaction_id IS NOT NULL THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'credit_transactions'
        ) THEN
            SELECT * INTO existing_transaction 
            FROM public.credit_transactions 
            WHERE transaction_id = $3 AND operation_type = 'unlock';
            IF FOUND AND existing_transaction.status = 'completed' THEN RETURN; END IF;
            IF FOUND AND existing_transaction.status = 'pending'   THEN RAISE EXCEPTION 'transaction_in_progress'; END IF;
            INSERT INTO public.credit_transactions(transaction_id, user_id, amount, operation_type, status)
            VALUES ($3, user_id, amount, 'unlock', 'pending');
        END IF;
    END IF;
    IF amount <= 0 THEN RAISE EXCEPTION 'amount must be positive'; END IF;
    UPDATE public.users
    SET credits = credits + amount,
        locked_credits = locked_credits - amount
    WHERE id = user_id AND locked_credits >= amount;
    IF NOT FOUND THEN
        IF transaction_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'credit_transactions'
        ) THEN
            UPDATE public.credit_transactions SET status = 'failed' WHERE transaction_id = $3;
        END IF;
        RAISE EXCEPTION 'not_enough_locked_credits';
    END IF;
    INSERT INTO public.wallet_history(user_id, amount, direction, description)
    VALUES (user_id, amount, 'unlock', 'Escrow unlock');
    IF transaction_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'credit_transactions'
    ) THEN
        UPDATE public.credit_transactions SET status = 'completed', completed_at = now() WHERE transaction_id = $3;
    END IF;
END;
$$;

-- Аналогично можно обновить payout_to_provider, но там конфликт не проявляется при создании заказа.

COMMIT;
