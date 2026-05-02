import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MessageSquare, Loader2, TrendingUp, Calendar, ChevronLeft, ChevronRight, CalendarClock, Send, Repeat, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useStudent, useCommunities, useSports, useStudentPayments, useSportPricing, usePromoteStudent, useStudentAttendance, formatCurrencyFull } from "@/hooks/useSupabaseData";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function StudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: student, isLoading, refetch } = useStudent(id);
  const { data: communities = [] } = useCommunities();
  const { data: sports = [] } = useSports();
  const { data: studentPayments = [] } = useStudentPayments(id);
  const { data: allPricing = [] } = useSportPricing();
  const { data: attendanceRecords = [] } = useStudentAttendance(id);
  const promoteStudent = usePromoteStudent();

  // Month navigation for attendance
  const [attendanceMonth, setAttendanceMonth] = useState(new Date());
  
  // Extend due date modal
  const [extendOpen, setExtendOpen] = useState(false);
  const [extendDate, setExtendDate] = useState("");
  const [extendMessage, setExtendMessage] = useState("");
  const [extending, setExtending] = useState(false);

  // Change Plan modal
  const [planOpen, setPlanOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"1m" | "3m" | "6m" | "">("");
  const [changingPlan, setChangingPlan] = useState(false);

  const attendanceStats = useMemo(() => {
    const startOfMonth = new Date(attendanceMonth.getFullYear(), attendanceMonth.getMonth(), 1).toISOString().slice(0, 10);
    const endOfMonth = new Date(attendanceMonth.getFullYear(), attendanceMonth.getMonth() + 1, 0).toISOString().slice(0, 10);
    const monthRecords = attendanceRecords.filter((a) => a.date >= startOfMonth && a.date <= endOfMonth);
    const present = monthRecords.filter((a) => a.status === "present").length;
    const absent = monthRecords.filter((a) => a.status === "absent").length;
    const total = present + absent;
    const pct = total > 0 ? Math.round((present / total) * 100) : 0;
    return { present, absent, total, pct };
  }, [attendanceRecords, attendanceMonth]);

  const monthLabel = attendanceMonth.toLocaleString("default", { month: "long", year: "numeric" });

  const canGoPrevMonth = useMemo(() => {
    if (!student) return false;
    const joiningDate = new Date(student.joining_date);
    const viewMonth = new Date(attendanceMonth.getFullYear(), attendanceMonth.getMonth(), 1);
    const joiningMonth = new Date(joiningDate.getFullYear(), joiningDate.getMonth(), 1);
    return viewMonth > joiningMonth;
  }, [student, attendanceMonth]);

  const canGoNextMonth = useMemo(() => {
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const viewMonth = new Date(attendanceMonth.getFullYear(), attendanceMonth.getMonth(), 1);
    return viewMonth < currentMonth;
  }, [attendanceMonth]);

  const handleExtendDueDate = async () => {
    if (!extendDate || !extendMessage.trim() || !student) return;
    setExtending(true);
    try {
      const newDueDate = new Date(extendDate);
      const newEndDate = new Date(newDueDate);
      newEndDate.setDate(newEndDate.getDate() - 1);

      const { error } = await supabase
        .from("students")
        .update({
          next_due_date: extendDate,
          payment_end_date: newEndDate.toISOString().slice(0, 10),
          fee_status: "paid",
          days_overdue: 0,
        })
        .eq("id", student.id);

      if (error) throw error;

      toast({ title: "Due date extended successfully", description: `New due date: ${extendDate}` });
      setExtendOpen(false);
      setExtendDate("");
      setExtendMessage("");
      refetch();
    } catch (err) {
      console.error(err);
      toast({ title: "Failed to extend due date", variant: "destructive" });
    } finally {
      setExtending(false);
    }
  };

  // Plan pricing helpers (uses sport_pricing for student's community + sport)
  const planPrices = useMemo(() => {
    if (!student) return null;
    const p = allPricing.find((pp) => pp.sport_id === student.sport_id && pp.community_id === student.community_id);
    if (!p) return null;
    const tier = student.batch_type === "premium" ? "premium" : "standard";
    return {
      "1m": Number(tier === "premium" ? p.premium_1month : p.standard_1month),
      "3m": Number(tier === "premium" ? p.premium_3months : p.standard_3months),
      "6m": Number(tier === "premium" ? p.premium_6months : p.standard_6months),
    };
  }, [student, allPricing]);

  const handleChangePlan = async () => {
    if (!student || !selectedPlan || selectedPlan === student.payment_plan || !planPrices) return;
    setChangingPlan(true);
    try {
      const newAmount = planPrices[selectedPlan];
      const { error } = await supabase
        .from("students")
        .update({
          payment_plan: selectedPlan,
          fee_amount: newAmount,
          plan_change_effective_from: student.next_due_date,
          plan_change_requested_at: new Date().toISOString(),
        })
        .eq("id", student.id);
      if (error) throw error;

      await supabase.from("plan_change_logs").insert({
        student_id: student.id,
        student_code: student.student_id,
        previous_plan: student.payment_plan,
        new_plan: selectedPlan,
        effective_from: student.next_due_date,
        note: "Plan changed by admin",
      });

      const niceDate = student.next_due_date
        ? new Date(student.next_due_date + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
        : "next cycle";
      toast({ title: "Plan updated!", description: `Takes effect from ${niceDate}` });
      setPlanOpen(false);
      setSelectedPlan("");
      refetch();
    } catch (err) {
      console.error(err);
      toast({ title: "Failed to change plan", variant: "destructive" });
    } finally {
      setChangingPlan(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!student) return <div className="p-6 text-muted-foreground">Student not found. <Button variant="link" onClick={() => navigate(-1)}>Go back</Button></div>;

  const community = communities.find((c) => c.id === student.community_id);
  const sport = sports.find((s) => s.id === student.sport_id);
  const pricing = allPricing.find((p) => p.sport_id === student.sport_id && p.community_id === student.community_id);

  const canPromote = student.batch_type === "standard" && pricing;
  const premiumFee = pricing ? Number(pricing.premium_1month) : 0;

  const handlePromote = async () => {
    if (!canPromote || !pricing) return;
    const confirmed = window.confirm(
      `Promote ${student.name} from Standard to Premium?\n\nCurrent Fee: ₹${student.fee_amount}/month\nNew Fee: ₹${premiumFee}/month`
    );
    if (!confirmed) return;

    await promoteStudent.mutateAsync({
      student_id: student.id,
      student_code: student.student_id,
      from_batch: "standard",
      to_batch: "premium",
      old_fee: Number(student.fee_amount),
      new_fee: premiumFee,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-2 -ml-2 text-muted-foreground">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3 flex-wrap">
          <button onClick={() => navigate("/communities")} className="hover:text-primary">Communities</button>
          <span>›</span>
          <button onClick={() => navigate(`/communities/${community?.id}`)} className="hover:text-primary">{community?.name}</button>
          <span>›</span>
          <span className="text-foreground">{student.name}</span>
        </div>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{student.name}</h1>
            <p className="text-muted-foreground text-sm font-mono">{student.student_id}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={student.fee_status === "paid" ? "default" : student.fee_status === "awaiting_first" ? "secondary" : student.fee_status === "overdue" ? "destructive" : "secondary"}>
              {student.fee_status === "paid" ? "✅ Paid" : student.fee_status === "awaiting_first" ? "✨ New" : student.fee_status === "overdue" ? "🔴 Overdue" : "⚠️ Pending"}
            </Badge>
            {student.next_due_date && (
              <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => setExtendOpen(true)}>
                <CalendarClock className="h-3 w-3" /> Extend Due
              </Button>
            )}
            {canPromote && (
              <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={handlePromote} disabled={promoteStudent.isPending}>
                {promoteStudent.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <TrendingUp className="h-3 w-3" />}
                Promote to Premium
              </Button>
            )}
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="payments">Payments ({studentPayments.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">Student Info</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Age</span><span>{student.age}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Community</span><span>{community?.name}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Sport</span><span>{sport?.icon} {sport?.name}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Batch</span><span>{student.batch_time} • {student.age_group} • {student.batch_type}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Joining Date</span><span>{student.joining_date}</span></div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Parent / Contact</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Parent</span><span>{student.parent_name}</span></div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">WhatsApp</span>
                  <div className="flex items-center gap-2">
                    <a href={`tel:+91${student.parent_whatsapp}`} className="text-primary hover:underline">{student.parent_whatsapp}</a>
                    <a href={`https://wa.me/91${student.parent_whatsapp}`} target="_blank" className="text-primary"><MessageSquare className="h-3.5 w-3.5" /></a>
                  </div>
                </div>
                {student.parent_phone && <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><a href={`tel:+91${student.parent_phone}`} className="text-primary hover:underline">{student.parent_phone}</a></div>}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Payment Info</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Plan</span>
                  <div className="flex items-center gap-2">
                    <span>{student.batch_type} • {student.payment_plan === "1m" ? "1 Month" : student.payment_plan === "3m" ? "3 Months" : "6 Months"}</span>
                    <Button size="sm" variant="outline" className="h-6 text-[10px] gap-1 px-2 border-primary/40 text-primary hover:bg-primary/10" onClick={() => { setSelectedPlan(""); setPlanOpen(true); }}>
                      <Repeat className="h-3 w-3" /> Change
                    </Button>
                  </div>
                </div>
                <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span className="font-semibold">{formatCurrencyFull(Number(student.fee_amount))}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Period</span><span>{student.payment_start_date} → {student.payment_end_date}</span></div>
                {student.next_due_date && <div className="flex justify-between"><span className="text-muted-foreground">Next Due</span><span className="text-warning">{student.next_due_date}</span></div>}
              </CardContent>
            </Card>

            {/* Attendance with month navigation */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    Attendance
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      disabled={!canGoPrevMonth}
                      onClick={() => setAttendanceMonth(new Date(attendanceMonth.getFullYear(), attendanceMonth.getMonth() - 1, 1))}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-xs font-medium min-w-[120px] text-center">{monthLabel}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      disabled={!canGoNextMonth}
                      onClick={() => setAttendanceMonth(new Date(attendanceMonth.getFullYear(), attendanceMonth.getMonth() + 1, 1))}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-2 rounded-lg bg-muted/50">
                    <p className="text-xl font-bold">{attendanceStats.total}</p>
                    <p className="text-[10px] text-muted-foreground">Total Classes</p>
                  </div>
                  <div className="p-2 rounded-lg bg-success/10">
                    <p className="text-xl font-bold text-success">{attendanceStats.present}</p>
                    <p className="text-[10px] text-muted-foreground">Present</p>
                  </div>
                  <div className="p-2 rounded-lg bg-destructive/10">
                    <p className="text-xl font-bold text-destructive">{attendanceStats.absent}</p>
                    <p className="text-[10px] text-muted-foreground">Absent</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Attendance Rate</span>
                    <span className={`font-medium ${attendanceStats.pct >= 80 ? "text-success" : attendanceStats.pct >= 60 ? "text-warning" : "text-destructive"}`}>
                      {attendanceStats.pct}%
                    </span>
                  </div>
                  <Progress value={attendanceStats.pct} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="payments" className="mt-4">
          <Card>
            <CardContent className="p-4">
              {studentPayments.length > 0 ? (
                <div className="space-y-2">
                  {studentPayments.map((p) => (
                    <div key={p.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0 text-sm">
                      <div>
                        <p className="font-medium">{formatCurrencyFull(Number(p.amount))}</p>
                        <p className="text-xs text-muted-foreground">{p.payment_date} • {p.payment_mode} {p.receipt_number && `• ${p.receipt_number}`}</p>
                        {p.period_start && p.period_end && (
                          <p className="text-xs text-muted-foreground">Period: {p.period_start} → {p.period_end}</p>
                        )}
                      </div>
                      <Badge variant="default" className="text-xs">✅ Verified ({p.verification_method})</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">No payment records yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Extend Due Date Dialog */}
      <Dialog open={extendOpen} onOpenChange={setExtendOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Extend Payment Due Date</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Student info banner */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
              <span className="text-2xl">{sport?.icon}</span>
              <div>
                <p className="font-semibold text-sm">{student.name}</p>
                <p className="text-xs text-muted-foreground">{student.student_id} • {community?.name}</p>
              </div>
            </div>

            {/* Current due date */}
            <div>
              <Label className="text-muted-foreground text-xs">Current Due Date</Label>
              <div className="flex items-center gap-2 mt-1">
                <p className="font-semibold">
                  {student.next_due_date ? new Date(student.next_due_date + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "Not set"}
                </p>
                {student.next_due_date && (
                  <span className="text-xs text-muted-foreground">
                    ({new Date(student.next_due_date + "T00:00:00").toLocaleDateString("en-IN", { weekday: "long" })})
                  </span>
                )}
                {(student.days_overdue ?? 0) > 0 && (
                  <Badge variant="destructive" className="text-[10px]">{student.days_overdue} days overdue</Badge>
                )}
              </div>
            </div>

            {/* New due date */}
            <div>
              <Label>New Due Date *</Label>
              <Input
                type="date"
                value={extendDate}
                onChange={e => setExtendDate(e.target.value)}
                min={student.next_due_date || undefined}
              />
              {extendDate && (
                <div className="mt-2 p-2 rounded-md bg-primary/10 border border-primary/20 text-xs">
                  <p className="font-medium text-primary">
                    {new Date(extendDate + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    <span className="text-muted-foreground ml-1">
                      ({new Date(extendDate + "T00:00:00").toLocaleDateString("en-IN", { weekday: "long" })})
                    </span>
                  </p>
                  {student.next_due_date && (
                    <p className="text-muted-foreground mt-0.5">
                      Extension: {Math.round((new Date(extendDate).getTime() - new Date(student.next_due_date).getTime()) / (1000 * 60 * 60 * 24))} days
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Message */}
            <div>
              <Label>Message to Parent *</Label>
              <Textarea
                value={extendMessage}
                onChange={e => setExtendMessage(e.target.value)}
                placeholder="e.g., Due date extended as requested due to vacation"
                rows={3}
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground mt-1">{extendMessage.length}/200 characters</p>
            </div>

            {/* Warning */}
            <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 text-xs space-y-1">
              <p className="font-medium text-warning">⚠️ Important:</p>
              <ul className="text-muted-foreground space-y-0.5 list-disc list-inside">
                <li>Fee status will be set to "Paid"</li>
                <li>Parent will receive WhatsApp notification</li>
                <li>This action cannot be undone</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExtendOpen(false)}>Cancel</Button>
            <Button
              onClick={handleExtendDueDate}
              disabled={extending || !extendDate || !extendMessage.trim()}
              className="gap-1"
            >
              {extending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Extend & Notify Parent
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Plan Dialog */}
      <Dialog open={planOpen} onOpenChange={setPlanOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Change Payment Plan</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
              <span className="text-2xl">{sport?.icon}</span>
              <div className="flex-1">
                <p className="font-semibold text-sm">{student.name}</p>
                <p className="text-xs text-muted-foreground">{student.student_id} • {sport?.name} • {student.batch_type}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground">Current</p>
                <p className="text-sm font-semibold">{student.payment_plan === "1m" ? "1M" : student.payment_plan === "3m" ? "3M" : "6M"} • {formatCurrencyFull(Number(student.fee_amount))}</p>
              </div>
            </div>

            {!planPrices ? (
              <p className="text-sm text-muted-foreground text-center py-4">Pricing not configured for this sport.</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {(["1m", "3m", "6m"] as const).map((p) => {
                  const isCurrent = p === student.payment_plan;
                  const isSelected = p === selectedPlan;
                  const price = planPrices[p];
                  const months = p === "1m" ? 1 : p === "3m" ? 3 : 6;
                  const savings = months > 1 ? planPrices["1m"] * months - price : 0;
                  return (
                    <button
                      key={p}
                      type="button"
                      disabled={isCurrent}
                      onClick={() => setSelectedPlan(p)}
                      className={`relative p-3 rounded-lg border-2 text-left transition-all duration-200 ${
                        isCurrent
                          ? "border-border bg-muted/30 opacity-60 cursor-not-allowed"
                          : isSelected
                          ? "border-primary bg-primary/10 shadow-[0_0_12px_hsl(var(--primary)/0.25)]"
                          : "border-border hover:border-primary/50 hover:shadow-[0_0_12px_hsl(var(--primary)/0.15)]"
                      }`}
                    >
                      {isCurrent && <span className="absolute -top-2 right-2 text-[9px] px-1.5 py-0.5 rounded-full bg-muted border border-border">current</span>}
                      {isSelected && !isCurrent && <Check className="absolute top-2 right-2 h-3.5 w-3.5 text-primary" />}
                      <p className="text-xs text-muted-foreground">{p === "1m" ? "1 Month" : p === "3m" ? "3 Months" : "6 Months"}</p>
                      <p className="font-bold text-sm mt-1">{formatCurrencyFull(price)}</p>
                      {savings > 0 && (
                        <span className="inline-block mt-1 text-[9px] px-1.5 py-0.5 rounded-full bg-success/20 text-success font-medium">
                          Save ₹{savings.toLocaleString("en-IN")}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {selectedPlan && selectedPlan !== student.payment_plan && planPrices && (() => {
              const planLabel = selectedPlan === "1m" ? "1 Month" : selectedPlan === "3m" ? "3 Months" : "6 Months";
              const fmt = (d?: string | null) => d ? new Date(d + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
              const months = selectedPlan === "1m" ? 1 : selectedPlan === "3m" ? 3 : 6;
              const newPeriodEnd = student.next_due_date ? (() => {
                const d = new Date(student.next_due_date + "T00:00:00");
                d.setMonth(d.getMonth() + months);
                d.setDate(d.getDate() - 1);
                return d.toISOString().slice(0, 10);
              })() : null;
              return (
                <>
                  <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2 text-xs">
                    <p className="font-semibold text-primary">⚡ How plan change works</p>
                    <ul className="text-muted-foreground space-y-0.5 list-disc list-inside">
                      <li>Current plan runs until <span className="text-foreground font-medium">{fmt(student.payment_end_date)}</span> — fully honored</li>
                      <li>New plan ({planLabel}) starts from <span className="text-foreground font-medium">{fmt(student.next_due_date)}</span></li>
                      <li>Next payment due: <span className="text-foreground font-medium">{fmt(student.next_due_date)}</span> — amount: <span className="text-primary font-semibold">{formatCurrencyFull(planPrices[selectedPlan])}</span></li>
                      <li>WhatsApp reminder sent 2 days before due date</li>
                    </ul>
                  </div>

                  {/* Visual timeline */}
                  <div className="rounded-lg border border-border bg-muted/20 p-3">
                    <div className="flex items-center gap-1 text-[10px] mb-2">
                      <div className="flex-1 text-center text-muted-foreground">{fmt(student.payment_start_date)}</div>
                      <div className="flex-[2] text-center text-muted-foreground">{fmt(student.next_due_date)}</div>
                      <div className="flex-1 text-right text-muted-foreground">{fmt(newPeriodEnd)}</div>
                    </div>
                    <div className="flex items-stretch gap-1 h-8">
                      <div className="flex-1 rounded bg-primary/70 flex items-center justify-center text-[10px] font-semibold text-background">
                        Current paid
                      </div>
                      <div className="flex-[2] rounded border-2 border-dashed border-primary flex items-center justify-center text-[10px] font-semibold text-primary">
                        New {planLabel}
                      </div>
                    </div>
                    <p className="text-[10px] text-center text-primary mt-1">↑ Plan change effective from {fmt(student.next_due_date)}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20 text-sm">
                    <div>
                      <p className="text-[10px] text-muted-foreground">Next Due Date</p>
                      <p className="font-semibold">{fmt(student.next_due_date)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">New Amount Due</p>
                      <p className="font-semibold text-primary">{formatCurrencyFull(planPrices[selectedPlan])}</p>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPlanOpen(false)}>Cancel</Button>
            <Button
              onClick={handleChangePlan}
              disabled={changingPlan || !selectedPlan || selectedPlan === student.payment_plan}
            >
              {changingPlan ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Updating…</> : "Confirm Plan Change"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
