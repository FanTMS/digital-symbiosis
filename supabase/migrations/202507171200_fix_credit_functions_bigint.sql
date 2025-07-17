BEGIN;

-- 1. Обновляем функцию lock_credits для поддержки bigint
CREATE OR REPLACE FUNCTION public.lock_credits(user_id bigint, amount numeric, transaction_id text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
AS $function$
DECLARE
    existing_transaction record;
BEGIN
    -- Проверка на существование транзакции, если указан transaction_id
    IF transaction_id IS NOT NULL THEN
        -- Проверяем, существует ли таблица credit_transactions
        IF EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'credit_transactions'
        ) THEN
            -- Проверяем существующую транзакцию
            SELECT * INTO existing_transaction 
            FROM public.credit_transactions 
            WHERE transaction_id = $3 AND operation_type = 'lock';
            
            -- Если транзакция существует и завершена, возвращаем успех
            IF FOUND AND existing_transaction.status = 'completed' THEN
                RETURN;
            END IF;
            
            -- Если транзакция существует, но в процессе, выбрасываем исключение
            IF FOUND AND existing_transaction.status = 'pending' THEN
                RAISE EXCEPTION 'transaction_in_progress';
            END IF;
            
            -- Создаем запись о транзакции
            INSERT INTO public.credit_transactions(
                transaction_id, user_id, amount, operation_type, status
            ) VALUES (
                transaction_id, user_id, amount, 'lock', 'pending'
            );
        END IF;
    END IF;

    -- Проверка суммы
    IF amount <= 0 THEN
        RAISE EXCEPTION 'amount must be positive';
    END IF;

    -- Блокируем кредиты
    UPDATE public.users
    SET credits = credits - amount,
        locked_credits = locked_credits + amount
    WHERE id = user_id
      AND credits >= amount;

    IF NOT FOUND THEN
        -- Если указан transaction_id и таблица существует, обновляем статус транзакции
        IF transaction_id IS NOT NULL AND EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'credit_transactions'
        ) THEN
            UPDATE public.credit_transactions
            SET status = 'failed'
            WHERE transaction_id = $3;
        END IF;
        
        RAISE EXCEPTION 'insufficient_funds';
    END IF;

    -- Записываем в историю кошелька
    INSERT INTO public.wallet_history(user_id, amount, direction, description)
    VALUES (user_id, amount, 'lock', 'Escrow lock');
    
    -- Если указан transaction_id и таблица существует, обновляем статус транзакции
    IF transaction_id IS NOT NULL AND EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'credit_transactions'
    ) THEN
        UPDATE public.credit_transactions
        SET status = 'completed',
            completed_at = now()
        WHERE transaction_id = $3;
    END IF;
END;
$function$;

-- 2. Обновляем функцию unlock_credits для поддержки bigint
CREATE OR REPLACE FUNCTION public.unlock_credits(user_id bigint, amount numeric, transaction_id text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
AS $function$
DECLARE
    existing_transaction record;
BEGIN
    -- Проверка на существование транзакции, если указан transaction_id
    IF transaction_id IS NOT NULL THEN
        -- Проверяем, существует ли таблица credit_transactions
        IF EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'credit_transactions'
        ) THEN
            -- Проверяем существующую транзакцию
            SELECT * INTO existing_transaction 
            FROM public.credit_transactions 
            WHERE transaction_id = $3 AND operation_type = 'unlock';
            
            -- Если транзакция существует и завершена, возвращаем успех
            IF FOUND AND existing_transaction.status = 'completed' THEN
                RETURN;
            END IF;
            
            -- Если транзакция существует, но в процессе, выбрасываем исключение
            IF FOUND AND existing_transaction.status = 'pending' THEN
                RAISE EXCEPTION 'transaction_in_progress';
            END IF;
            
            -- Создаем запись о транзакции
            INSERT INTO public.credit_transactions(
                transaction_id, user_id, amount, operation_type, status
            ) VALUES (
                transaction_id, user_id, amount, 'unlock', 'pending'
            );
        END IF;
    END IF;

    -- Проверка суммы
    IF amount <= 0 THEN
        RAISE EXCEPTION 'amount must be positive';
    END IF;

    -- Разблокируем кредиты
    UPDATE public.users
    SET credits = credits + amount,
        locked_credits = locked_credits - amount
    WHERE id = user_id
      AND locked_credits >= amount;

    IF NOT FOUND THEN
        -- Если указан transaction_id и таблица существует, обновляем статус транзакции
        IF transaction_id IS NOT NULL AND EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'credit_transactions'
        ) THEN
            UPDATE public.credit_transactions
            SET status = 'failed'
            WHERE transaction_id = $3;
        END IF;
        
        RAISE EXCEPTION 'not_enough_locked_credits';
    END IF;

    -- Записываем в историю кошелька
    INSERT INTO public.wallet_history(user_id, amount, direction, description)
    VALUES (user_id, amount, 'unlock', 'Escrow unlock');
    
    -- Если указан transaction_id и таблица существует, обновляем статус транзакции
    IF transaction_id IS NOT NULL AND EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'credit_transactions'
    ) THEN
        UPDATE public.credit_transactions
        SET status = 'completed',
            completed_at = now()
        WHERE transaction_id = $3;
    END IF;
END;
$function$;

-- 3. Обновляем функцию payout_to_provider для поддержки bigint
CREATE OR REPLACE FUNCTION public.payout_to_provider(
    client_id    bigint,
    provider_id  bigint,
    amount       numeric,
    order_id     uuid,
    transaction_id text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
AS $function$
DECLARE
    existing_transaction record;
BEGIN
    -- Проверка на существование транзакции, если указан transaction_id
    IF transaction_id IS NOT NULL THEN
        -- Проверяем, существует ли таблица credit_transactions
        IF EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'credit_transactions'
        ) THEN
            -- Проверяем существующую транзакцию
            SELECT * INTO existing_transaction 
            FROM public.credit_transactions 
            WHERE transaction_id = $5 AND operation_type = 'payout';
            
            -- Если транзакция существует и завершена, возвращаем успех
            IF FOUND AND existing_transaction.status = 'completed' THEN
                RETURN;
            END IF;
            
            -- Если транзакция существует, но в процессе, выбрасываем исключение
            IF FOUND AND existing_transaction.status = 'pending' THEN
                RAISE EXCEPTION 'transaction_in_progress';
            END IF;
            
            -- Создаем запись о транзакции
            INSERT INTO public.credit_transactions(
                transaction_id, user_id, amount, operation_type, related_order_id, status
            ) VALUES (
                transaction_id, client_id, amount, 'payout', order_id, 'pending'
            );
        END IF;
    END IF;

    -- Проверка суммы
    IF amount <= 0 THEN
        RAISE EXCEPTION 'amount must be positive';
    END IF;

    -- Списываем замороженные средства клиента
    UPDATE public.users
    SET locked_credits = locked_credits - amount
    WHERE id = client_id
      AND locked_credits >= amount;

    IF NOT FOUND THEN
        -- Если указан transaction_id и таблица существует, обновляем статус транзакции
        IF transaction_id IS NOT NULL AND EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'credit_transactions'
        ) THEN
            UPDATE public.credit_transactions
            SET status = 'failed'
            WHERE transaction_id = $5;
        END IF;
        
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
           
    -- Если указан transaction_id и таблица существует, обновляем статус транзакции
    IF transaction_id IS NOT NULL AND EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'credit_transactions'
    ) THEN
        UPDATE public.credit_transactions
        SET status = 'completed',
            completed_at = now()
        WHERE transaction_id = $5;
    END IF;
END;
$function$;

-- 4. Создаем таблицу credit_transactions для отслеживания транзакций
CREATE TABLE IF NOT EXISTS public.credit_transactions (
    id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id    text NOT NULL UNIQUE,
    user_id           bigint REFERENCES public.users(id) ON DELETE CASCADE,
    amount            numeric NOT NULL,
    operation_type    text NOT NULL CHECK (operation_type IN ('deduct', 'add', 'lock', 'unlock', 'payout')),
    related_order_id  uuid REFERENCES public.orders(id) ON DELETE SET NULL,
    status            text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    created_at        timestamptz NOT NULL DEFAULT now(),
    completed_at      timestamptz,
    metadata          jsonb
);

CREATE INDEX IF NOT EXISTS credit_transactions_user_id_idx ON public.credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS credit_transactions_transaction_id_idx ON public.credit_transactions(transaction_id);

-- 5. Добавляем поле transaction_id в таблицу orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS transaction_id text;

COMMIT;