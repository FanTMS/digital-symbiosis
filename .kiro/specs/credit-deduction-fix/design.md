# Design Document: Credit Deduction Fix

## Overview

This design document outlines the solution for fixing the issue where user credits are being deducted multiple times when a page is reloaded during or after a transaction. The solution implements idempotent transactions using a combination of transaction IDs, database constraints, and client-side safeguards to ensure that credit operations are executed exactly once.

## Architecture

The solution will be implemented across several layers of the application:

1. **Database Layer**: Implement transaction tracking and idempotency checks
2. **API Layer**: Add transaction ID generation and validation
3. **Client Layer**: Add safeguards against duplicate submissions and provide clear feedback

The architecture will follow these principles:
- Use idempotent operations for all credit transactions
- Implement optimistic concurrency control
- Provide clear transaction status feedback to users
- Maintain audit logs of all credit operations

## Components and Interfaces

### 1. Transaction Tracking System

A new database table `credit_transactions` will be created to track all credit-related operations:

```sql
CREATE TABLE IF NOT EXISTS public.credit_transactions (
    id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id    text NOT NULL UNIQUE,
    user_id           integer REFERENCES public.users(id) ON DELETE CASCADE,
    amount            numeric NOT NULL,
    operation_type    text NOT NULL CHECK (operation_type IN ('deduct', 'add', 'lock', 'unlock')),
    related_order_id  uuid REFERENCES public.orders(id) ON DELETE SET NULL,
    status            text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    created_at        timestamptz NOT NULL DEFAULT now(),
    completed_at      timestamptz,
    metadata          jsonb
);

CREATE INDEX IF NOT EXISTS credit_transactions_user_id_idx ON public.credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS credit_transactions_transaction_id_idx ON public.credit_transactions(transaction_id);
```

### 2. Updated Database Functions

The existing credit-related functions will be modified to be idempotent:

#### Modified `lock_credits` Function

```sql
CREATE OR REPLACE FUNCTION public.lock_credits(
    user_id integer, 
    amount numeric, 
    transaction_id text
)
RETURNS void
LANGUAGE plpgsql
AS $function$
DECLARE
    existing_transaction record;
BEGIN
    -- Check if this transaction already exists
    SELECT * INTO existing_transaction 
    FROM public.credit_transactions 
    WHERE transaction_id = $3 AND operation_type = 'lock';
    
    -- If transaction exists and is completed, return success
    IF FOUND AND existing_transaction.status = 'completed' THEN
        RETURN;
    END IF;
    
    -- If transaction exists but is pending, raise exception
    IF FOUND AND existing_transaction.status = 'pending' THEN
        RAISE EXCEPTION 'transaction_in_progress';
    END IF;
    
    -- Validate amount
    IF amount <= 0 THEN
        RAISE EXCEPTION 'amount must be positive';
    END IF;
    
    -- Create transaction record
    INSERT INTO public.credit_transactions(
        transaction_id, user_id, amount, operation_type, related_order_id, status
    ) VALUES (
        transaction_id, user_id, amount, 'lock', NULL, 'pending'
    );
    
    -- Try to lock credits
    UPDATE public.users
    SET credits = credits - amount,
        locked_credits = locked_credits + amount
    WHERE id = user_id
      AND credits >= amount;
      
    IF NOT FOUND THEN
        -- Update transaction status to failed
        UPDATE public.credit_transactions
        SET status = 'failed'
        WHERE transaction_id = transaction_id;
        
        RAISE EXCEPTION 'insufficient_funds';
    END IF;
    
    -- Record in wallet history
    INSERT INTO public.wallet_history(user_id, amount, direction, description)
    VALUES (user_id, amount, 'lock', 'Escrow lock');
    
    -- Update transaction status to completed
    UPDATE public.credit_transactions
    SET status = 'completed',
        completed_at = now()
    WHERE transaction_id = transaction_id;
END;
$function$;
```

Similar modifications will be made to `unlock_credits` and `payout_to_provider` functions.

### 3. API Layer Changes

The API layer will be updated to generate and track transaction IDs:

```typescript
// New utility for generating transaction IDs
export const generateTransactionId = (userId: number, actionType: string, entityId?: string): string => {
  const timestamp = Date.now();
  const randomPart = Math.random().toString(36).substring(2, 10);
  return `${actionType}_${userId}_${entityId || 'general'}_${timestamp}_${randomPart}`;
};

// Updated createOrder function in ordersApi
async createOrder(order: Omit<Order, 'id' | 'created_at' | 'updated_at' | 'completed_at' | 'escrow_locked' | 'payout_done'> & { quiz_answers?: any, deadline_at?: string }) {
  // Generate a transaction ID for this order creation
  const transactionId = generateTransactionId(order.client_id, 'order_create', order.service_id);
  
  // 1. Reserve client's funds with transaction ID
  const lockRes = await supabase.rpc('lock_credits', {
    user_id: order.client_id,
    amount: order.price,
    transaction_id: transactionId
  });
  
  if (lockRes.error) {
    // Handle specific error types
    if (lockRes.error.message.includes('transaction_in_progress')) {
      throw new Error('TRANSACTION_IN_PROGRESS');
    } else if (lockRes.error.message.includes('insufficient_funds')) {
      throw new Error('NOT_ENOUGH_CREDITS');
    }
    throw lockRes.error;
  }

  // 2. Create the order with transaction ID reference
  const insertData = { 
    ...order, 
    escrow_locked: true,
    transaction_id: transactionId 
  } as any;

  try {
    const { data, error } = await supabase
      .from('orders')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    // No need to unlock credits on error - the transaction ID prevents duplicate locks
    throw error;
  }
}
```

### 4. Client-Side Implementation

The client-side code will be updated to handle transaction states and prevent duplicate submissions:

```typescript
// In ServiceDetailPage.tsx
const [isProcessingOrder, setIsProcessingOrder] = useState(false);
const [orderTransactionId, setOrderTransactionId] = useState<string | null>(null);

const handleCreateOrder = async (deadlineIso: string) => {
  if (isProcessingOrder) return;
  
  if (service && provider?.id && user?.id) {
    if (user.id === provider.id) {
      alert("Вы не можете заказать свою собственную услугу");
      return;
    }
    
    // Check for existing orders
    const { data: existingOrders } = await supabase
      .from("orders")
      .select("*")
      .eq("service_id", service.id)
      .eq("client_id", user.id)
      .in("status", ["pending", "accepted", "in_progress"]);
      
    if (existingOrders && existingOrders.length > 0) {
      alert("Вы уже заказали эту услугу и она ещё не завершена");
      return;
    }

    try {
      setIsProcessingOrder(true);
      
      // Generate transaction ID on client side if needed
      const transactionId = orderTransactionId || 
        `order_${user.id}_${service.id}_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
      
      // Store transaction ID in state to prevent duplicates on reload
      setOrderTransactionId(transactionId);
      
      // Store transaction ID in sessionStorage to persist across reloads
      sessionStorage.setItem(`order_transaction_${service.id}`, transactionId);
      
      // Create order with transaction ID
      const order = await ordersApi.createOrder({
        service_id: service.id,
        client_id: user.id,
        provider_id: provider.id,
        status: "pending",
        price: service.price,
        max_price: service.price,
        deadline_at: deadlineIso,
        transaction_id: transactionId
      });

      // Create or find chat
      const chat = await chatApi.getOrCreateChat(user.id, provider.id);

      // Send system messages
      await chatApi.sendMessage(
        chat.id,
        user.id,
        `Здравствуйте! Вы только что заказали услугу: "${service.title}", стоимость: ${service.price} кр., ожидает подтверждения у исполнителя.`,
        { type: "system", orderId: order.id, role: "client" },
      );

      await chatApi.sendMessage(
        chat.id,
        provider.id,
        `Здравствуйте, пользователь: ${user.name} приобрёл вашу услугу за ${service.price} кредитов.\nВам необходимо принять или отклонить.`,
        {
          type: "system_action",
          orderId: order.id,
          role: "provider",
          clientName: user.name,
          serviceTitle: service.title,
          price: service.price,
          max_price: service.price,
          providerId: provider.id,
        },
      );

      // Clear transaction ID from storage after successful completion
      sessionStorage.removeItem(`order_transaction_${service.id}`);
      
      // Navigate to chat
      navigate(`/chat/${chat.id}`);
    } catch (err: any) {
      const msg = err?.message || String(err);
      
      if (msg.includes('TRANSACTION_IN_PROGRESS')) {
        alert('Транзакция уже обрабатывается. Пожалуйста, подождите.');
      } else if (msg.includes('NOT_ENOUGH_CREDITS')) {
        alert('Недостаточно кредитов для заказа услуги. Пожалуйста, пополните баланс.');
      } else {
        console.error(err);
        alert('Ошибка создания заказа: ' + msg);
      }
    } finally {
      setIsProcessingOrder(false);
    }
  }
};

// Check for existing transaction on component mount
useEffect(() => {
  if (service?.id) {
    const existingTransactionId = sessionStorage.getItem(`order_transaction_${service.id}`);
    if (existingTransactionId) {
      setOrderTransactionId(existingTransactionId);
    }
  }
}, [service?.id]);
```

## Data Models

### New Database Table

```
credit_transactions
- id (UUID, PK)
- transaction_id (TEXT, UNIQUE)
- user_id (INTEGER, FK to users)
- amount (NUMERIC)
- operation_type (TEXT: 'deduct', 'add', 'lock', 'unlock')
- related_order_id (UUID, FK to orders, nullable)
- status (TEXT: 'pending', 'completed', 'failed')
- created_at (TIMESTAMPTZ)
- completed_at (TIMESTAMPTZ, nullable)
- metadata (JSONB, nullable)
```

### Modified Database Tables

```
orders
- [existing fields]
- transaction_id (TEXT, nullable)
```

## Error Handling

The solution implements comprehensive error handling:

1. **Transaction-in-progress errors**: When a transaction is already being processed, the system will inform the user and prevent duplicate submissions.

2. **Insufficient funds errors**: Clear error messages will be displayed when a user doesn't have enough credits.

3. **Network failures**: If a network failure occurs during a transaction, the transaction ID ensures that the operation won't be duplicated when connectivity is restored.

4. **Database constraints**: Unique constraints on transaction IDs prevent duplicate entries at the database level.

5. **Client-side validation**: The UI will disable submission buttons during processing and store transaction state to prevent duplicate submissions.

## Testing Strategy

The testing strategy will focus on ensuring that credit transactions are idempotent and resilient:

1. **Unit Tests**:
   - Test transaction ID generation
   - Test modified database functions with various scenarios
   - Test API layer handling of transaction IDs

2. **Integration Tests**:
   - Test the complete order creation flow with transaction IDs
   - Test error handling and recovery scenarios
   - Test concurrent transactions

3. **Specific Test Cases**:
   - Create an order and reload the page during processing
   - Attempt to create the same order multiple times
   - Simulate network failures during transactions
   - Test with insufficient funds scenarios
   - Test with concurrent transactions for the same user

4. **Performance Tests**:
   - Ensure that the addition of transaction tracking does not significantly impact performance
   - Test with high concurrency to ensure the system remains responsive

## Implementation Plan

1. Create the `credit_transactions` table in the database
2. Modify the existing credit-related database functions to be idempotent
3. Update the API layer to generate and handle transaction IDs
4. Implement client-side safeguards against duplicate submissions
5. Add comprehensive error handling and user feedback
6. Test thoroughly with various scenarios
7. Deploy the changes with careful monitoring