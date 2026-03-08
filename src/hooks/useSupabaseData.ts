import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { addMonths, addDays, format } from "date-fns";

// ─── Communities ────────────────────────────────────────────────────

export function useCommunities() {
  return useQuery({
    queryKey: ["communities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("communities")
        .select("*")
        .order("name");
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
      const { data, error } = await supabase
        .from("communities")
        .select("*")
        .eq("id", id!)
        .maybeSingle();
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
      name: string;
      short_code: string;
      address: string;
      contact_person: string;
      contact_phone: string;
      sports: Array<{
        sportName: string;
        sportIcon: string;
        coach_name: string;
        coach_phone: string;
        standard_1month: number;
        standard_3months: number;
        standard_6months: number;
        premium_1month: number;
        premium_3months: number;
        premium_6months: number;
      }>;
    }) => {
      const { data: community, error: cErr } = await supabase
        .from("communities")
        .insert({
          name: input.name,
          short_code: input.short_code,
          address: input.address,
          contact_person: input.contact_person,
          contact_phone: input.contact_phone,
          total_sports: input.sports.length,
        })
        .select()
        .single();
      if (cErr) throw cErr;

      for (const s of input.sports) {
        const { data: sport, error: sErr } = await supabase
          .from("sports")
          .insert({
            name: s.sportName,
            icon: s.sportIcon,
            community_id: community.id,
            coach_name: s.coach_name,
            coach_phone: s.coach_phone,
            standard_fee: s.standard_1month,
            premium_fee: s.premium_1month,
          })
          .select()
          .single();
        if (sErr) throw sErr;

        const { error: pErr } = await supabase.from("sport_pricing").insert({
          community_id: community.id,
          sport_id: sport.id,
          standard_1month: s.standard_1month,
          standard_3months: s.standard_3months,
          standard_6months: s.standard_6months,
          premium_1month: s.premium_1month,
          premium_3months: s.premium_3months,
          premium_6months: s.premium_6months,
        });
        if (pErr) throw pErr;
      }

      return community;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["communities"] });
      toast({ title: "Community created!", description: data.name });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to create community", description: err.message, variant: "destructive" });
    },
  });
}

export function useUpdateCommunity() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      name: string;
      short_code: string;
      address: string;
      contact_person: string;
      contact_phone: string;
    }) => {
      const { error } = await supabase
        .from("communities")
        .update({
          name: input.name,
          short_code: input.short_code,
          address: input.address,
          contact_person: input.contact_person,
          contact_phone: input.contact_phone,
        })
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["communities"] });
      qc.invalidateQueries({ queryKey: ["community", vars.id] });
      toast({ title: "Community updated!" });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to update community", description: err.message, variant: "destructive" });
    },
  });
}

export function useUpdateSportPricing() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      community_id: string;
      standard_1month: number;
      standard_3months: number;
      standard_6months: number;
      premium_1month: number;
      premium_3months: number;
      premium_6months: number;
    }) => {
      const { error } = await supabase
        .from("sport_pricing")
        .update({
          standard_1month: input.standard_1month,
          standard_3months: input.standard_3months,
          standard_6months: input.standard_6months,
          premium_1month: input.premium_1month,
          premium_3months: input.premium_3months,
          premium_6months: input.premium_6months,
        })
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["sportPricing", vars.community_id] });
      toast({ title: "Pricing updated!" });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to update pricing", description: err.message, variant: "destructive" });
    },
  });
}

export function useDeleteCommunity() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("communities").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["communities"] });
      toast({ title: "Community deleted", variant: "destructive" });
    },
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
      name: string;
      icon: string;
      community_id: string;
      coach_name: string;
      coach_phone: string;
      standard_1month: number;
      standard_3months: number;
      standard_6months: number;
      premium_1month: number;
      premium_3months: number;
      premium_6months: number;
    }) => {
      const { data: sport, error: sErr } = await supabase
        .from("sports")
        .insert({
          name: input.name,
          icon: input.icon,
          community_id: input.community_id,
          coach_name: input.coach_name,
          coach_phone: input.coach_phone,
          standard_fee: input.standard_1month,
          premium_fee: input.premium_1month,
        })
        .select()
        .single();
      if (sErr) throw sErr;

      const { error: pErr } = await supabase.from("sport_pricing").insert({
        community_id: input.community_id,
        sport_id: sport.id,
        standard_1month: input.standard_1month,
        standard_3months: input.standard_3months,
        standard_6months: input.standard_6months,
        premium_1month: input.premium_1month,
        premium_3months: input.premium_3months,
        premium_6months: input.premium_6months,
      });
      if (pErr) throw pErr;

      return sport;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["sports", vars.community_id] });
      qc.invalidateQueries({ queryKey: ["community", vars.community_id] });
      qc.invalidateQueries({ queryKey: ["sportPricing", vars.community_id] });
      toast({ title: "Sport added!" });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to add sport", description: err.message, variant: "destructive" });
    },
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
      community_id: string;
      sport_id: string;
      start_time: string;
      end_time: string;
      age_group: string;
      batch_type: string;
      active_days: string[];
      max_students: number;
    }) => {
      const { data, error } = await supabase
        .from("time_slots")
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["timeSlots", vars.community_id] });
      toast({ title: "Time slot created!" });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to create time slot", description: err.message, variant: "destructive" });
    },
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
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .eq("id", id!)
        .maybeSingle();
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
      student_id: string;
      name: string;
      age: number;
      parent_name: string;
      parent_whatsapp: string;
      parent_phone: string;
      community_id: string;
      sport_id: string;
      time_slot_id: string;
      batch_type: string;
      age_group: string;
      payment_plan: string;
      fee_amount: number;
      joining_date: string;
      batch_time: string;
    }) => {
      const { data, error } = await supabase
        .from("students")
        .insert({
          student_id: input.student_id,
          name: input.name,
          age: input.age,
          parent_name: input.parent_name,
          parent_whatsapp: input.parent_whatsapp,
          parent_phone: input.parent_phone || input.parent_whatsapp,
          community_id: input.community_id,
          sport_id: input.sport_id,
          time_slot_id: input.time_slot_id,
          batch_type: input.batch_type,
          age_group: input.age_group,
          payment_plan: input.payment_plan,
          fee_amount: input.fee_amount,
          fee_status: "awaiting_first",
          next_due_date: input.joining_date,
          joining_date: input.joining_date,
          batch_time: input.batch_time,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data, vars) => {
      qc.invalidateQueries({ queryKey: ["students", vars.community_id] });
      qc.invalidateQueries({ queryKey: ["timeSlots", vars.community_id] });
      qc.invalidateQueries({ queryKey: ["communities"] });
      toast({ title: "Student enrolled!", description: `${data.name} — ${data.student_id}` });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to enroll student", description: err.message, variant: "destructive" });
    },
  });
}

export function useUpdateStudent() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (input: { id: string; updates: Record<string, unknown> }) => {
      const { error } = await supabase
        .from("students")
        .update(input.updates)
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["students"] });
      qc.invalidateQueries({ queryKey: ["student"] });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to update student", description: err.message, variant: "destructive" });
    },
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
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("student_id", studentId!)
        .order("payment_date", { ascending: false });
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
      student_id: string;
      student_code: string;
      amount: number;
      payment_date: string;
      payment_mode: string;
      transaction_id: string;
      plan_period: string;
    }) => {
      const { data: student } = await supabase
        .from("students")
        .select("*")
        .eq("id", input.student_id)
        .single();
      if (!student) throw new Error("Student not found");

      const baseDate = student.next_due_date ? new Date(student.next_due_date) : new Date(input.payment_date);
      const monthsMap: Record<string, number> = { "1m": 1, "3m": 3, "6m": 6 };
      const months = monthsMap[input.plan_period] || monthsMap[student.payment_plan] || 1;
      const periodEnd = addMonths(baseDate, months);
      const nextDue = addDays(periodEnd, 1);

      const receiptNumber = `REC-${format(new Date(), "yyyy")}-${String(Date.now()).slice(-6)}`;

      const { data: payment, error: pErr } = await supabase
        .from("payments")
        .insert({
          student_id: input.student_id,
          student_code: input.student_code,
          receipt_number: receiptNumber,
          amount: input.amount,
          payment_date: input.payment_date,
          payment_mode: input.payment_mode,
          transaction_id: input.transaction_id || null,
          plan_period: input.plan_period || student.payment_plan,
          period_start: format(baseDate, "yyyy-MM-dd"),
          period_end: format(periodEnd, "yyyy-MM-dd"),
          verification_method: "manual",
          verified_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (pErr) throw pErr;

      const { error: sErr } = await supabase
        .from("students")
        .update({
          fee_status: "paid",
          payment_start_date: format(baseDate, "yyyy-MM-dd"),
          payment_end_date: format(periodEnd, "yyyy-MM-dd"),
          next_due_date: format(nextDue, "yyyy-MM-dd"),
        })
        .eq("id", input.student_id);
      if (sErr) throw sErr;

      return payment;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["students"] });
      qc.invalidateQueries({ queryKey: ["payments"] });
      qc.invalidateQueries({ queryKey: ["communities"] });
      toast({ title: "Payment recorded!" });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to record payment", description: err.message, variant: "destructive" });
    },
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
    onError: (err: Error) => {
      toast({ title: "Failed to mark attendance", description: err.message, variant: "destructive" });
    },
  });
}

// ─── Global Sports ──────────────────────────────────────────────────

export function useGlobalSports() {
  return useQuery({
    queryKey: ["globalSports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("global_sports")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });
}

// ─── Batch Promotion ────────────────────────────────────────────────

export function usePromoteStudent() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (input: {
      student_id: string;
      student_code: string;
      from_batch: string;
      to_batch: string;
      old_fee: number;
      new_fee: number;
      reason?: string;
    }) => {
      const { error: sErr } = await supabase
        .from("students")
        .update({ batch_type: input.to_batch, fee_amount: input.new_fee })
        .eq("id", input.student_id);
      if (sErr) throw sErr;

      const { error: pErr } = await supabase.from("batch_promotions").insert({
        student_id: input.student_id,
        student_code: input.student_code,
        from_batch: input.from_batch,
        to_batch: input.to_batch,
        old_fee: input.old_fee,
        new_fee: input.new_fee,
        reason: input.reason || "Performance excellence",
      });
      if (pErr) throw pErr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["students"] });
      qc.invalidateQueries({ queryKey: ["student"] });
      toast({ title: "Student promoted to Premium!" });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to promote student", description: err.message, variant: "destructive" });
    },
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
