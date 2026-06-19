import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { addMonths, addDays, format } from "date-fns";
import type { PricingConfig } from "@/components/SportPricingFields";

const num = (v: string | number | null | undefined): number => {
  if (v === null || v === undefined || v === "") return 0;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
};
const numOrNull = (v: string | number | null | undefined): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
};

// Convert a PricingConfig from the UI into rows for sports / sport_pricing / session_pack_pricing.
// Legacy columns (standard_1month, premium_1month, etc.) are populated with adult values when
// adults are allowed, otherwise kid values — keeps existing enrollment / payment code working.
export function pricingConfigToRows(cfg: PricingConfig, community_id: string, sport_id?: string) {
  const useAdult = cfg.allows_adults;
  const pick = (k: "standard_1month" | "standard_3months" | "standard_6months" | "premium_1month" | "premium_3months" | "premium_6months") => {
    const key = k.replace("months", "month") as string;
    const prefix = useAdult ? "adult_" : "kid_";
    return num((cfg as any)[`${prefix}${k}`]);
  };
  const sportRow: Record<string, any> = {
    pricing_type: cfg.pricing_type,
    renewal_trigger: cfg.pricing_type === "custom_monthly" && cfg.renewal_trigger !== "date_based" && cfg.renewal_trigger !== "session_based" ? "session_based" : cfg.renewal_trigger,
    allows_kids: cfg.allows_kids,
    allows_adults: cfg.allows_adults,
    standard_fee: pick("standard_1month"),
    premium_fee: pick("premium_1month"),
    kid_custom_monthly_price: cfg.pricing_type === "custom_monthly" ? numOrNull(cfg.kid_custom_monthly_price) : null,
    kid_custom_monthly_sessions: cfg.pricing_type === "custom_monthly" ? numOrNull(cfg.kid_custom_monthly_sessions) : null,
    adult_custom_monthly_price: cfg.pricing_type === "custom_monthly" ? numOrNull(cfg.adult_custom_monthly_price) : null,
    adult_custom_monthly_sessions: cfg.pricing_type === "custom_monthly" ? numOrNull(cfg.adult_custom_monthly_sessions) : null,
    custom_monthly_price: cfg.pricing_type === "custom_monthly" ? numOrNull(useAdult ? cfg.adult_custom_monthly_price : cfg.kid_custom_monthly_price) : null,
    custom_monthly_sessions: cfg.pricing_type === "custom_monthly" ? numOrNull(useAdult ? cfg.adult_custom_monthly_sessions : cfg.kid_custom_monthly_sessions) : null,
    kid_sessions_per_month: cfg.pricing_type === "duration_based" && cfg.renewal_trigger === "session_based" ? numOrNull(cfg.kid_sessions_per_month) : null,
    adult_sessions_per_month: cfg.pricing_type === "duration_based" && cfg.renewal_trigger === "session_based" ? numOrNull(cfg.adult_sessions_per_month) : null,
    sessions_per_month: cfg.pricing_type === "duration_based" && cfg.renewal_trigger === "session_based" ? numOrNull(useAdult ? cfg.adult_sessions_per_month : cfg.kid_sessions_per_month) : null,
    renewal_days: cfg.renewal_trigger === "date_based" && cfg.pricing_type !== "duration_based" ? numOrNull(cfg.renewal_days) : null,
  };
  const pricingRow: Record<string, any> = {
    community_id, sport_id,
    standard_1month: pick("standard_1month"),
    standard_3months: pick("standard_3months"),
    standard_6months: pick("standard_6months"),
    premium_1month: pick("premium_1month"),
    premium_3months: pick("premium_3months"),
    premium_6months: pick("premium_6months"),
    kid_standard_1month: num(cfg.kid_standard_1month),
    kid_standard_3month: num(cfg.kid_standard_3months),
    kid_standard_6month: num(cfg.kid_standard_6months),
    kid_premium_1month: num(cfg.kid_premium_1month),
    kid_premium_3month: num(cfg.kid_premium_3months),
    kid_premium_6month: num(cfg.kid_premium_6months),
    adult_standard_1month: num(cfg.adult_standard_1month),
    adult_standard_3month: num(cfg.adult_standard_3months),
    adult_standard_6month: num(cfg.adult_standard_6months),
    adult_premium_1month: num(cfg.adult_premium_1month),
    adult_premium_3month: num(cfg.adult_premium_3months),
    adult_premium_6month: num(cfg.adult_premium_6months),
  };
  const packRows = (cfg.pricing_type === "session_pack" ? cfg.packs : [])
    .filter((p) => p.pack_name && p.session_count)
    .map((p) => ({
      community_id, sport_id,
      pack_name: p.pack_name,
      session_count: num(p.session_count),
      standard_price: num(useAdult ? p.adult_standard_price : p.kid_standard_price),
      premium_price: numOrNull(useAdult ? p.adult_premium_price : p.kid_premium_price),
      kid_standard_price: num(p.kid_standard_price),
      kid_premium_price: numOrNull(p.kid_premium_price),
      adult_standard_price: num(p.adult_standard_price),
      adult_premium_price: numOrNull(p.adult_premium_price),
      is_active: true,
    }));
  return { sportRow, pricingRow, packRows };
}



// ─── Communities ────────────────────────────────────────────────────

export function useCommunities() {
  return useQuery({
    queryKey: ["communities"],
    queryFn: async () => {
      const { data, error } = await supabase.from("communities").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });
}

export function useCommunity(id: string | undefined) {
  return useQuery({
    queryKey: ["community", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from("communities").select("*").eq("id", id!).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateCommunity() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (input: {
      name: string; short_code: string; address: string; contact_person: string; contact_phone: string;
      sports: Array<{
        sportName: string; sportIcon: string; coach_name: string; coach_phone: string;
        coach_ids?: string[];
        pricing: PricingConfig;
      }>;
    }) => {
      const { data: community, error: cErr } = await supabase.from("communities").insert({
        name: input.name, short_code: input.short_code, address: input.address,
        contact_person: input.contact_person, contact_phone: input.contact_phone, total_sports: input.sports.length,
      }).select().single();
      if (cErr) throw cErr;
      for (const s of input.sports) {
        const { sportRow, pricingRow, packRows } = pricingConfigToRows(s.pricing, community.id);
        const { data: sport, error: sErr } = await supabase.from("sports").insert({
          name: s.sportName, icon: s.sportIcon, community_id: community.id,
          coach_name: s.coach_name, coach_phone: s.coach_phone,
          ...sportRow,
        }).select().single();
        if (sErr) throw sErr;
        const { error: pErr } = await supabase.from("sport_pricing").insert({ ...pricingRow, sport_id: sport.id });
        if (pErr) throw pErr;
        if (packRows.length > 0) {
          const { error: packErr } = await supabase.from("session_pack_pricing").insert(
            packRows.map((p) => ({ ...p, sport_id: sport.id }))
          );
          if (packErr) throw packErr;
        }
        if (s.coach_ids && s.coach_ids.length > 0) {
          const { error: aErr } = await supabase.from("coach_assignments").insert(
            s.coach_ids.map((coach_id) => ({ coach_id, community_id: community.id, sport_id: sport.id }))
          );
          if (aErr) throw aErr;
        }
      }
      return community;
    },

    onSuccess: (data) => { qc.invalidateQueries({ queryKey: ["communities"] }); toast({ title: "Community created!", description: data.name }); },
    onError: (err: Error) => { toast({ title: "Failed to create community", description: err.message, variant: "destructive" }); },
  });
}

export function useUpdateCommunity() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (input: { id: string; name: string; short_code: string; address: string; contact_person: string; contact_phone: string }) => {
      const { error } = await supabase.from("communities").update({
        name: input.name, short_code: input.short_code, address: input.address,
        contact_person: input.contact_person, contact_phone: input.contact_phone,
      }).eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => { qc.invalidateQueries({ queryKey: ["communities"] }); qc.invalidateQueries({ queryKey: ["community", vars.id] }); toast({ title: "Community updated!" }); },
    onError: (err: Error) => { toast({ title: "Failed to update community", description: err.message, variant: "destructive" }); },
  });
}

export function useUpdateSportPricing() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (input: {
      id: string; community_id: string;
      standard_1month: number; standard_3months: number; standard_6months: number;
      premium_1month: number; premium_3months: number; premium_6months: number;
    }) => {
      const { error } = await supabase.from("sport_pricing").update({
        standard_1month: input.standard_1month, standard_3months: input.standard_3months, standard_6months: input.standard_6months,
        premium_1month: input.premium_1month, premium_3months: input.premium_3months, premium_6months: input.premium_6months,
      }).eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => { qc.invalidateQueries({ queryKey: ["sportPricing", vars.community_id] }); toast({ title: "Pricing updated!" }); },
    onError: (err: Error) => { toast({ title: "Failed to update pricing", description: err.message, variant: "destructive" }); },
  });
}

export function useDeleteCommunity() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("communities").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["communities"] }); toast({ title: "Community deleted", variant: "destructive" }); },
  });
}

// ─── Sports ─────────────────────────────────────────────────────────

export function useSports(communityId?: string) {
  return useQuery({
    queryKey: ["sports", communityId],
    queryFn: async () => {
      let q = supabase.from("sports").select("*").order("name");
      if (communityId) q = q.eq("community_id", communityId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateSport() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (input: {
      name: string; icon: string; community_id: string; coach_name: string; coach_phone: string;
      pricing_type: "duration_based" | "custom_monthly" | "session_pack";
      renewal_trigger: "date_based" | "session_based";
      standard_1month: number; standard_3months: number; standard_6months: number;
      premium_1month: number; premium_3months: number; premium_6months: number;
      sessions_per_month?: number | null;
      custom_monthly_price?: number | null;
      custom_monthly_sessions?: number | null;
      packs?: Array<{ pack_name: string; session_count: number; standard_price: number; premium_price: number | null }>;
    }) => {
      const { data: sport, error: sErr } = await supabase.from("sports").insert({
        name: input.name, icon: input.icon, community_id: input.community_id,
        coach_name: input.coach_name, coach_phone: input.coach_phone,
        standard_fee: input.standard_1month, premium_fee: input.premium_1month,
        pricing_type: input.pricing_type,
        renewal_trigger: input.renewal_trigger,
        custom_monthly_price: input.custom_monthly_price ?? null,
        custom_monthly_sessions: input.custom_monthly_sessions ?? null,
        sessions_per_month: input.sessions_per_month ?? null,
      }).select().single();
      if (sErr) throw sErr;
      const { error: pErr } = await supabase.from("sport_pricing").insert({
        community_id: input.community_id, sport_id: sport.id,
        standard_1month: input.standard_1month, standard_3months: input.standard_3months, standard_6months: input.standard_6months,
        premium_1month: input.premium_1month, premium_3months: input.premium_3months, premium_6months: input.premium_6months,
      });
      if (pErr) throw pErr;
      if (input.pricing_type === "session_pack" && input.packs && input.packs.length > 0) {
        const { error: packErr } = await supabase.from("session_pack_pricing").insert(
          input.packs.map((p) => ({
            sport_id: sport.id, community_id: input.community_id,
            pack_name: p.pack_name, session_count: p.session_count,
            standard_price: p.standard_price, premium_price: p.premium_price,
            is_active: true,
          }))
        );
        if (packErr) throw packErr;
      }
      return sport;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["sports", vars.community_id] });
      qc.invalidateQueries({ queryKey: ["community", vars.community_id] });
      qc.invalidateQueries({ queryKey: ["sportPricing", vars.community_id] });
      qc.invalidateQueries({ queryKey: ["sessionPacks"] });
      toast({ title: "Sport added!" });
    },
    onError: (err: Error) => { toast({ title: "Failed to add sport", description: err.message, variant: "destructive" }); },
  });
}

// ─── Session Pack Pricing ───────────────────────────────────────────

export function useSessionPacks(communityId?: string, sportId?: string) {
  return useQuery({
    queryKey: ["sessionPacks", communityId, sportId],
    queryFn: async () => {
      let q = supabase.from("session_pack_pricing").select("*").order("session_count");
      if (communityId) q = q.eq("community_id", communityId);
      if (sportId) q = q.eq("sport_id", sportId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateSportFull() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (input: {
      sport_id: string;
      community_id: string;
      pricing_type: "duration_based" | "custom_monthly" | "session_pack";
      renewal_trigger: "date_based" | "session_based";
      pricing_id?: string | null;
      standard_1month: number; standard_3months: number; standard_6months: number;
      premium_1month: number; premium_3months: number; premium_6months: number;
      sessions_per_month?: number | null;
      custom_monthly_price?: number | null;
      custom_monthly_sessions?: number | null;
      packs?: Array<{ pack_name: string; session_count: number; standard_price: number; premium_price: number | null }>;
    }) => {
      // Update sport row
      const { error: sErr } = await supabase.from("sports").update({
        pricing_type: input.pricing_type,
        renewal_trigger: input.renewal_trigger,
        custom_monthly_price: input.custom_monthly_price ?? null,
        custom_monthly_sessions: input.custom_monthly_sessions ?? null,
        sessions_per_month: input.sessions_per_month ?? null,
        standard_fee: input.standard_1month,
        premium_fee: input.premium_1month,
      }).eq("id", input.sport_id);
      if (sErr) throw sErr;

      // Update sport_pricing row (create one if missing)
      if (input.pricing_id) {
        const { error } = await supabase.from("sport_pricing").update({
          standard_1month: input.standard_1month, standard_3months: input.standard_3months, standard_6months: input.standard_6months,
          premium_1month: input.premium_1month, premium_3months: input.premium_3months, premium_6months: input.premium_6months,
        }).eq("id", input.pricing_id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("sport_pricing").insert({
          community_id: input.community_id, sport_id: input.sport_id,
          standard_1month: input.standard_1month, standard_3months: input.standard_3months, standard_6months: input.standard_6months,
          premium_1month: input.premium_1month, premium_3months: input.premium_3months, premium_6months: input.premium_6months,
        });
        if (error) throw error;
      }

      // Replace session packs (simple: deactivate old, insert new) — only when pricing_type is session_pack
      if (input.pricing_type === "session_pack") {
        const { error: delErr } = await supabase.from("session_pack_pricing").delete().eq("sport_id", input.sport_id);
        if (delErr) throw delErr;
        if (input.packs && input.packs.length > 0) {
          const { error: insErr } = await supabase.from("session_pack_pricing").insert(
            input.packs.map((p) => ({
              sport_id: input.sport_id, community_id: input.community_id,
              pack_name: p.pack_name, session_count: p.session_count,
              standard_price: p.standard_price, premium_price: p.premium_price,
              is_active: true,
            }))
          );
          if (insErr) throw insErr;
        }
      } else {
        // Deactivate any existing packs if user switched away from session_pack
        await supabase.from("session_pack_pricing").update({ is_active: false }).eq("sport_id", input.sport_id);
      }
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["sports", vars.community_id] });
      qc.invalidateQueries({ queryKey: ["sportPricing", vars.community_id] });
      qc.invalidateQueries({ queryKey: ["sessionPacks"] });
      toast({ title: "Sport pricing updated!" });
    },
    onError: (err: Error) => { toast({ title: "Failed to update sport", description: err.message, variant: "destructive" }); },
  });
}

// ─── Sport Pricing ──────────────────────────────────────────────────

export function useSportPricing(communityId?: string) {
  return useQuery({
    queryKey: ["sportPricing", communityId],
    queryFn: async () => {
      let q = supabase.from("sport_pricing").select("*");
      if (communityId) q = q.eq("community_id", communityId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
}

// ─── Time Slots ─────────────────────────────────────────────────────

export function useTimeSlots(communityId?: string, sportId?: string) {
  return useQuery({
    queryKey: ["timeSlots", communityId, sportId],
    queryFn: async () => {
      let q = supabase.from("time_slots").select("*").order("start_time");
      if (communityId) q = q.eq("community_id", communityId);
      if (sportId) q = q.eq("sport_id", sportId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateTimeSlot() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (input: {
      community_id: string; sport_id: string; start_time: string; end_time: string;
      age_group: string; batch_type: string; active_days: string[]; max_students: number;
    }) => {
      const { data, error } = await supabase.from("time_slots").insert(input).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => { qc.invalidateQueries({ queryKey: ["timeSlots", vars.community_id] }); toast({ title: "Time slot created!" }); },
    onError: (err: Error) => { toast({ title: "Failed to create time slot", description: err.message, variant: "destructive" }); },
  });
}

// ─── Students ───────────────────────────────────────────────────────

export function useStudents(communityId?: string, sportId?: string) {
  return useQuery({
    queryKey: ["students", communityId, sportId],
    queryFn: async () => {
      let q = supabase.from("students").select("*").order("student_id");
      if (communityId) q = q.eq("community_id", communityId);
      if (sportId) q = q.eq("sport_id", sportId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
}

export function useStudent(id: string | undefined) {
  return useQuery({
    queryKey: ["student", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from("students").select("*").eq("id", id!).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateStudent() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (input: {
      student_id: string; name: string; age: number; parent_name: string; parent_whatsapp: string; parent_phone: string;
      student_type: "kid" | "adult";
      community_id: string; sport_id: string; time_slot_id: string; batch_type: string; age_group: string;
      payment_plan: string; fee_amount: number; joining_date: string; batch_time: string;
    }) => {
      const { data, error } = await supabase.from("students").insert({
        student_id: input.student_id, name: input.name, age: input.age, parent_name: input.parent_name,
        parent_whatsapp: input.parent_whatsapp, parent_phone: input.parent_phone || input.parent_whatsapp,
        student_type: input.student_type,
        community_id: input.community_id, sport_id: input.sport_id, time_slot_id: input.time_slot_id,
        batch_type: input.batch_type, age_group: input.age_group, payment_plan: input.payment_plan,
        fee_amount: input.fee_amount, fee_status: "awaiting_first", next_due_date: input.joining_date,
        joining_date: input.joining_date, batch_time: input.batch_time,
      } as never).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data, vars) => {
      qc.invalidateQueries({ queryKey: ["students", vars.community_id] });
      qc.invalidateQueries({ queryKey: ["timeSlots", vars.community_id] });
      qc.invalidateQueries({ queryKey: ["communities"] });
      toast({ title: "Student enrolled!", description: `${data.name} — ${data.student_id}` });
    },
    onError: (err: Error) => { toast({ title: "Failed to enroll student", description: err.message, variant: "destructive" }); },
  });
}

export function useUpdateStudent() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (input: { id: string; updates: Record<string, unknown> }) => {
      const { error } = await supabase.from("students").update(input.updates).eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["students"] }); qc.invalidateQueries({ queryKey: ["student"] }); },
    onError: (err: Error) => { toast({ title: "Failed to update student", description: err.message, variant: "destructive" }); },
  });
}

// ─── Payments ───────────────────────────────────────────────────────

export function usePayments(limit?: number) {
  return useQuery({
    queryKey: ["payments", limit],
    queryFn: async () => {
      let q = supabase.from("payments").select("*").order("payment_date", { ascending: false });
      if (limit) q = q.limit(limit);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
}

export function useStudentPayments(studentId: string | undefined) {
  return useQuery({
    queryKey: ["payments", "student", studentId],
    enabled: !!studentId,
    queryFn: async () => {
      const { data, error } = await supabase.from("payments").select("*").eq("student_id", studentId!).order("payment_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useMarkPayment() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (input: {
      student_id: string; student_code: string; amount: number; payment_date: string;
      payment_mode: string; transaction_id: string; plan_period: string;
    }) => {
      const { data: student } = await supabase.from("students").select("*").eq("id", input.student_id).single();
      if (!student) throw new Error("Student not found");

      // Auto-detect plan from amount using sport_pricing for the student's sport+community+batch
      const { data: pricingRow } = await supabase
        .from("sport_pricing")
        .select("*")
        .eq("sport_id", student.sport_id)
        .eq("community_id", student.community_id)
        .maybeSingle();

      const batchType = student.batch_type === "premium" ? "premium" : "standard";
      const detectPlanFromAmount = (amt: number): string | null => {
        if (!pricingRow) return null;
        if (Number(amt) === Number(pricingRow[`${batchType}_1month`])) return "1m";
        if (Number(amt) === Number(pricingRow[`${batchType}_3months`])) return "3m";
        if (Number(amt) === Number(pricingRow[`${batchType}_6months`])) return "6m";
        return null;
      };

      // Effective plan: 1) admin-selected plan_period, 2) detected from amount, 3) student's current plan
      const detectedPlan = detectPlanFromAmount(input.amount);
      const effectivePlan = input.plan_period || detectedPlan || student.payment_plan || "1m";
      const planAutoUpgraded = !!detectedPlan && detectedPlan !== student.payment_plan && !input.plan_period;

      // CRITICAL: Calculate from original due date, NOT payment date
      const baseDate = student.next_due_date ? new Date(student.next_due_date) : new Date(input.payment_date);
      const monthsMap: Record<string, number> = { "1m": 1, "3m": 3, "6m": 6 };
      const months = monthsMap[effectivePlan] || 1;
      const periodEnd = addMonths(baseDate, months);
      const nextDue = addDays(periodEnd, 1);

      const receiptNumber = `REC-${format(new Date(), "yyyy")}-${String(Date.now()).slice(-6)}`;

      const { data: payment, error: pErr } = await supabase.from("payments").insert({
        student_id: input.student_id, student_code: input.student_code, receipt_number: receiptNumber,
        amount: input.amount, payment_date: input.payment_date, payment_mode: input.payment_mode,
        transaction_id: input.transaction_id || null, plan_period: effectivePlan,
        period_start: format(baseDate, "yyyy-MM-dd"), period_end: format(periodEnd, "yyyy-MM-dd"),
        verification_method: "manual", verified_at: new Date().toISOString(),
      }).select().single();
      if (pErr) throw pErr;

      const studentUpdate: Record<string, unknown> = {
        fee_status: "paid",
        payment_start_date: format(baseDate, "yyyy-MM-dd"),
        payment_end_date: format(periodEnd, "yyyy-MM-dd"),
        next_due_date: format(nextDue, "yyyy-MM-dd"),
      };
      // If plan was auto-upgraded by amount, persist the new plan and fee
      if (planAutoUpgraded && pricingRow) {
        const feeKey = `${batchType}_${effectivePlan === "1m" ? "1month" : effectivePlan === "3m" ? "3months" : "6months"}`;
        studentUpdate.payment_plan = effectivePlan;
        studentUpdate.fee_amount = Number(pricingRow[feeKey]);
        studentUpdate.plan_change_effective_from = null;
        studentUpdate.plan_change_requested_at = null;
      }
      const { error: sErr } = await supabase.from("students").update(studentUpdate).eq("id", input.student_id);
      if (sErr) throw sErr;

      // Log auto-upgrade
      if (planAutoUpgraded) {
        await supabase.from("plan_change_logs").insert({
          student_id: student.id,
          student_code: student.student_id,
          previous_plan: student.payment_plan,
          new_plan: effectivePlan,
          effective_from: format(baseDate, "yyyy-MM-dd"),
          note: "Plan auto-upgraded based on payment amount received",
        });
      }

      return payment;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["students"] });
      qc.invalidateQueries({ queryKey: ["payments"] });
      qc.invalidateQueries({ queryKey: ["communities"] });
      toast({ title: "Payment recorded!" });
    },
    onError: (err: Error) => { toast({ title: "Failed to record payment", description: err.message, variant: "destructive" }); },
  });
}

// ─── Attendance ─────────────────────────────────────────────────────

export function useCreateAttendance() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (records: Array<{ student_id: string; time_slot_id: string; date: string; status: string }>) => {
      const { error } = await supabase.from("attendance").insert(records);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      const present = vars.filter(r => r.status === "present").length;
      const absent = vars.filter(r => r.status === "absent").length;
      const leave = vars.filter(r => r.status === "leave").length;
      qc.invalidateQueries({ queryKey: ["attendance"] });
      toast({ title: `Attendance marked for ${vars.length} students!`, description: `Present: ${present} | Absent: ${absent} | Leave: ${leave}` });
    },
    onError: (err: Error) => { toast({ title: "Failed to mark attendance", description: err.message, variant: "destructive" }); },
  });
}

export function useStudentAttendance(studentId: string | undefined) {
  return useQuery({
    queryKey: ["attendance", "student", studentId],
    enabled: !!studentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .eq("student_id", studentId!)
        .order("date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useAttendanceByDate(date: string, studentIds: string[]) {
  return useQuery({
    queryKey: ["attendance", "date", date, studentIds],
    enabled: studentIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .eq("date", date)
        .in("student_id", studentIds);
      if (error) throw error;
      return data;
    },
  });
}

// ─── Global Sports ──────────────────────────────────────────────────

export function useGlobalSports() {
  return useQuery({
    queryKey: ["globalSports"],
    queryFn: async () => {
      const { data, error } = await supabase.from("global_sports").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });
}

// ─── Coaches ────────────────────────────────────────────────────────

export function useCoaches(sportName?: string) {
  return useQuery({
    queryKey: ["coaches", sportName],
    queryFn: async () => {
      let q = supabase.from("coaches").select("*").eq("is_active", true).order("name");
      if (sportName) q = q.eq("sport_name", sportName);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
}

export function useCoachAssignments(coachId?: string) {
  return useQuery({
    queryKey: ["coachAssignments", coachId],
    enabled: !!coachId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coach_assignments")
        .select("*")
        .eq("coach_id", coachId!);
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateCoachAssignment() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (input: { coach_id: string; community_id: string; sport_id: string }) => {
      const { data, error } = await supabase
        .from("coach_assignments")
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["coachAssignments"] });
      toast({ title: "Coach assigned!" });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to assign coach", description: err.message, variant: "destructive" });
    },
  });
}

// ─── Batch Promotion ────────────────────────────────────────────────

export function usePromoteStudent() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (input: {
      student_id: string; student_code: string; from_batch: string; to_batch: string;
      old_fee: number; new_fee: number; reason?: string;
    }) => {
      const { error: sErr } = await supabase.from("students").update({ batch_type: input.to_batch, fee_amount: input.new_fee }).eq("id", input.student_id);
      if (sErr) throw sErr;
      const { error: pErr } = await supabase.from("batch_promotions").insert({
        student_id: input.student_id, student_code: input.student_code,
        from_batch: input.from_batch, to_batch: input.to_batch,
        old_fee: input.old_fee, new_fee: input.new_fee, reason: input.reason || "Performance excellence",
      });
      if (pErr) throw pErr;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["students"] }); qc.invalidateQueries({ queryKey: ["student"] }); toast({ title: "Student promoted to Premium!" }); },
    onError: (err: Error) => { toast({ title: "Failed to promote student", description: err.message, variant: "destructive" }); },
  });
}

// ─── Helper formatters ──────────────────────────────────────────────

export function formatCurrency(amount: number): string {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function formatCurrencyFull(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function formatTime(time24: string): string {
  const [h, m] = time24.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
}
