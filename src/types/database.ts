export interface Community {
  id: string;
  name: string;
  short_code: string;
  address: string;
  contact_person: string;
  contact_phone: string;
  pricing: {
    standard: { "1m": number; "3m": number; "6m": number };
    premium: { "1m": number; "3m": number; "6m": number };
  };
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Sport {
  id: string;
  name: string;
  icon: string;
  community_id: string;
  coach_name: string;
  coach_phone: string;
  time_slots: string[];
  active_days: string[];
  standard_fee: number;
  premium_fee: number;
  created_at: string;
  updated_at: string;
}

export interface Student {
  id: string;
  student_id: string;
  name: string;
  age: number;
  parent_name: string;
  parent_whatsapp: string;
  parent_phone: string;
  community_id: string;
  sport_id: string;
  batch_time: string;
  age_group: "kids" | "adults";
  batch_type: "standard" | "premium";
  payment_plan: "1m" | "3m" | "6m";
  fee_amount: number;
  fee_status: "paid" | "pending" | "overdue";
  payment_start_date: string | null;
  payment_end_date: string | null;
  next_due_date: string | null;
  joining_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  student_id: string;
  amount: number;
  payment_date: string;
  payment_mode: string;
  transaction_id: string | null;
  plan_period: string;
  period_start: string | null;
  period_end: string | null;
  verification_method: "auto" | "manual";
  created_at: string;
}

export type SportWithStudents = Sport & { students: Student[] };
export type CommunityWithSports = Community & { sports: SportWithStudents[] };
