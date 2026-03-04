import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";
import type { Community, Sport, Student, Payment, GlobalSport, SportPricing, TimeSlot } from "@/types/database";

interface AppStore {
  // Data
  communities: Community[];
  sports: Sport[];
  students: Student[];
  payments: Payment[];
  globalSports: GlobalSport[];
  sportPricing: SportPricing[];
  timeSlots: TimeSlot[];

  // Loading
  loading: boolean;
  error: string | null;

  // Actions
  fetchCommunities: () => Promise<void>;
  fetchSports: (communityId?: string) => Promise<void>;
  fetchStudents: (communityId?: string) => Promise<void>;
  fetchPayments: () => Promise<void>;
  fetchGlobalSports: () => Promise<void>;
  fetchSportPricing: (communityId?: string) => Promise<void>;
  fetchTimeSlots: (communityId?: string, sportId?: string) => Promise<void>;
  fetchAll: () => Promise<void>;
}

export const useStore = create<AppStore>((set, get) => ({
  communities: [],
  sports: [],
  students: [],
  payments: [],
  globalSports: [],
  sportPricing: [],
  timeSlots: [],
  loading: false,
  error: null,

  fetchCommunities: async () => {
    const { data, error } = await supabase.from("communities").select("*").order("name");
    if (data) set({ communities: data as unknown as Community[] });
    if (error) set({ error: error.message });
  },

  fetchSports: async (communityId) => {
    let q = supabase.from("sports").select("*").order("name");
    if (communityId) q = q.eq("community_id", communityId);
    const { data, error } = await q;
    if (data) set({ sports: data as unknown as Sport[] });
    if (error) set({ error: error.message });
  },

  fetchStudents: async (communityId) => {
    let q = supabase.from("students").select("*").order("student_id");
    if (communityId) q = q.eq("community_id", communityId);
    const { data, error } = await q;
    if (data) set({ students: data as unknown as Student[] });
    if (error) set({ error: error.message });
  },

  fetchPayments: async () => {
    const { data, error } = await supabase.from("payments").select("*").order("payment_date", { ascending: false });
    if (data) set({ payments: data as unknown as Payment[] });
    if (error) set({ error: error.message });
  },

  fetchGlobalSports: async () => {
    const { data, error } = await supabase.from("global_sports").select("*").order("name");
    if (data) set({ globalSports: data as unknown as GlobalSport[] });
    if (error) set({ error: error.message });
  },

  fetchSportPricing: async (communityId) => {
    let q = supabase.from("sport_pricing").select("*");
    if (communityId) q = q.eq("community_id", communityId);
    const { data, error } = await q;
    if (data) set({ sportPricing: data as unknown as SportPricing[] });
    if (error) set({ error: error.message });
  },

  fetchTimeSlots: async (communityId, sportId) => {
    let q = supabase.from("time_slots").select("*").order("start_time");
    if (communityId) q = q.eq("community_id", communityId);
    if (sportId) q = q.eq("sport_id", sportId);
    const { data, error } = await q;
    if (data) set({ timeSlots: data as unknown as TimeSlot[] });
    if (error) set({ error: error.message });
  },

  fetchAll: async () => {
    set({ loading: true, error: null });
    const store = get();
    await Promise.all([
      store.fetchCommunities(),
      store.fetchSports(),
      store.fetchStudents(),
      store.fetchPayments(),
      store.fetchGlobalSports(),
      store.fetchSportPricing(),
      store.fetchTimeSlots(),
    ]);
    set({ loading: false });
  },
}));
