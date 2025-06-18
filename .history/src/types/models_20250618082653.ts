import type { Database } from './supabase';

// Базовые типы из базы данных
export type User = Database['public']['Tables']['users']['Row'] & { role?: string | null };
export type Service = Database['public']['Tables']['services']['Row'] & {
  min_price?: number | null;
};
export type Order = Database['public']['Tables']['orders']['Row'] & {
  max_price?: number | null;
};
export type Review = Database['public']['Tables']['reviews']['Row'];
export type Notification = Database['public']['Tables']['notifications']['Row'];
export type Referral = Database['public']['Tables']['referrals']['Row'];
export type PriceProposal = Database['public']['Tables']['price_proposals']['Row'];

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

// Квизы
export type Quiz = {
  id: string;
  user_id: number;
  title: string;
  description: string | null;
  created_at: string;
};

export type QuizQuestion = {
  id: string;
  quiz_id: string;
  question: string;
  type: 'single' | 'multiple' | 'text';
  options: string[] | null; // для single/multiple
  order: number;
};

export type QuizAnswer = {
  questionId: string;
  answer: string | string[]; // строка для single/text, массив для multiple
};

export type QuizAnswers = QuizAnswer[];

export type ServiceWithQuiz = Service & { quiz_id?: string | null };
export type OrderWithQuizAnswers = Order & { quiz_answers?: QuizAnswers | null };

// Челленджи
export type Challenge = Database['public']['Tables']['challenges']['Row'] & {
  my_participation?: boolean;
};

export type ChallengeSubmission = {
  id: string;
  challenge_id: string;
  user_id: number;
  title: string;
  description: string | null;
  file_url: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  votes_count?: number;
  has_voted?: boolean;
};

export type ChallengeComment = {
  id: string;
  submission_id: string;
  user_id: number;
  text: string;
  created_at: string;
  user?: User;
};

export type ChallengeVote = {
  id: string;
  submission_id: string;
  voter_id: number;
  created_at: string;
}; 