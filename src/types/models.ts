import type { Database } from './supabase';

// Базовые типы из базы данных
export type User = Database['public']['Tables']['users']['Row'] & { role?: string | null };
export type Service = Database['public']['Tables']['services']['Row'];
export type Order = Database['public']['Tables']['orders']['Row'];
export type Review = Database['public']['Tables']['reviews']['Row'];
export type Notification = Database['public']['Tables']['notifications']['Row'];
export type Referral = Database['public']['Tables']['referrals']['Row'];

// Расширенные типы с дополнительными данными
export type ServiceWithUser = Service & {
  user: User;
};

export type OrderWithDetails = Order & {
  service: Service;
  client: User;
  provider: User;
  review?: Review;
};

export type UserWithBadges = User & {
  badges: {
    badge: {
      id: string;
      name: string;
      description: string | null;
      image_url: string | null;
    };
  }[];
};

// Перечисления
export type ServiceCategory = 
  | 'education'
  | 'it'
  | 'design'
  | 'languages'
  | 'business'
  | 'lifestyle';

export type OrderStatus = 
  | 'pending'
  | 'accepted'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type ReferralStatus = 
  | 'invited'
  | 'registered'
  | 'active';

export type NotificationType = 
  | 'order_new'
  | 'order_status'
  | 'review_new'
  | 'referral_new'
  | 'system'; 