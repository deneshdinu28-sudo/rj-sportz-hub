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
  total_students: number;
  total_sports: number;
  total_revenue: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GlobalSport {
  id: string;
  name: string;
  icon: string;
  is_default: boolean;
  created_by: string | null;
  created_at: string;
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
  is_custom: boolean;
  total_students: number;
  revenue_collected: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SportPricing {
  id: string;
  community_id: string;
  sport_id: string;
  standard_1month: number;
  standard_3months: number;
  standard_6months: number;
  premium_1month: number;
  premium_3months: number;
  premium_6months: number;
  created_at: string;
  updated_at: string;
}

export interface TimeSlot {
  id: string;
  community_id: string;
  sport_id: string;
  start_time: string;
  end_time: string;
  age_group: "kids" | "adults";
  batch_type: "standard" | "premium";
  max_students: number;
  current_students: number;
  active_days: string[];
  is_active: boolean;
  created_at: string;
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
  time_slot_id: string | null;
  batch_time: string;
  age_group: "kids" | "adults";
  batch_type: "standard" | "premium";
  payment_plan: "1m" | "3m" | "6m";
  fee_amount: number;
  fee_status: "paid" | "pending" | "overdue" | "awaiting_first";
  payment_start_date: string | null;
  payment_end_date: string | null;
  next_due_date: string | null;
  joining_date: string;
  is_active: boolean;
  is_on_hold: boolean;
  hold_reason: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  student_id: string;
  receipt_number: string | null;
  student_code: string | null;
  amount: number;
  payment_date: string;
  payment_mode: string;
  transaction_id: string | null;
  plan_period: string;
  period_start: string | null;
  period_end: string | null;
  screenshot_url: string | null;
  verification_method: "auto" | "manual";
  verified_at: string | null;
  created_at: string;
}

export interface Attendance {
  id: string;
  student_id: string;
  time_slot_id: string | null;
  date: string;
  status: "present" | "absent" | "leave";
  marked_by: string | null;
  marked_at: string;
}

export type SportWithStudents = Sport & { students: Student[] };
export type CommunityWithSports = Community & { sports: SportWithStudents[] };
