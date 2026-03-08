import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { IndianRupee, AlertTriangle, CheckCircle, Clock, Phone, MessageSquare, Loader2, MoreVertical, Pause, X, AlertCircle } from "lucide-react";
import { useStudents, useCommunities, useSports, usePayments, useMarkPayment, useUpdateStudent, formatCurrencyFull, formatCurrency } from "@/hooks/useSupabaseData";
import { useToast } from "@/hooks/use-toast";

export default function Payments() {
  const { data: students = [], isLoading: loadingStudents } = useStudents();
  const { data: communities = [] } = useCommunities();
  const { data: sports = [] } = useSports();
  const { data: payments = [], isLoading: loadingPayments } = usePayments();
  const markPayment = useMarkPayment();
  const updateStudent = useUpdateStudent();
  const { toast } = useToast();

  const [markPaidStudentId, setMarkPaidStudentId] = useState<string | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: "", payment_date: new Date().toISOString().slice(0, 10), payment_mode: "PhonePe", transaction_id: "",
  });

  const markPaidStudent = students.find((s) => s.id === markPaidStudentId);
  const isLoading = loadingStudents || loadingPayments;

  const stats = useMemo(() => {
    const totalCollected = payments.reduce((s, p) => s + Number(p.amount), 0);
    const pending = students.filter((s) => s.fee_status === "pending" || s.fee_status === "awaiting_first" || s.fee_status === "unpaid");
    const overdue = students.filter((s) => s.fee_status === "overdue");
    const pendingAmount = pending.reduce((s, st) => s + Number(st.fee_amount), 0);
    const overdueAmount = overdue.reduce((s, st) => s + Number(st.fee_amount), 0);
    const today = new Date().toISOString().slice(0, 10);
    const todayPayments = payments.filter((p) => p.payment_date === today);
    const todayAmount = todayPayments.reduce((s, p) => s + Number(p.amount), 0);
    return { totalCollected, pendingCount: pending.length, pendingAmount, overdueCount: overdue.length, overdueAmount, todayAmount, todayCount: todayPayments.length };
  }, [students, payments]);

  const pendingStudents = useMemo(() => students.filter((s) => s.fee_status === "pending" || s.fee_status === "awaiting_first" || s.fee_status === "unpaid"), [students]);
  const overdueStudents = useMemo(() => students.filter((s) => s.fee_status === "overdue"), [students]);

  const openMarkPaid = (student: typeof students[0]) => {
    setPaymentForm({
      amount: String(student.fee_amount),
      payment_date: new Date().toISOString().slice(0, 10),
      payment_mode: "PhonePe",
      transaction_id: "",
    });
    setMarkPaidStudentId(student.id);
  };

  const handleMarkPaid = async () => {
    if (!markPaidStudent) return;
    await markPayment.mutateAsync({
      student_id: markPaidStudent.id,
      student_code: markPaidStudent.student_id,
      amount: Number(paymentForm.amount),
      payment_date: paymentForm.payment_date,
      payment_mode: paymentForm.payment_mode,
      transaction_id: paymentForm.transaction_id,
      plan_period: markPaidStudent.payment_plan,
    });
    setMarkPaidStudentId(null);
  };

  const handlePutOnHold = async (student: typeof students[0]) => {
    await updateStudent.mutateAsync({
      id: student.id,
      updates: { is_on_hold: true, hold_reason: "Fee not paid" },
    });
    toast({ title: `${student.name} put on hold` });
  };

  const handleDiscontinue = async (student: typeof students[0]) => {
    await updateStudent.mutateAsync({
      id: student.id,
      updates: { is_active: false },
    });
    toast({ title: `${student.name} marked as discontinued`, variant: "destructive" });
  };

  const getDaysInfo = (student: typeof students[0]) => {
    if (!student.next_due_date) return { text: "—", days: 0 };
    const now = new Date();
    const due = new Date(student.next_due_date);
    const diffMs = due.getTime() - now.getTime();
    const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (days === 0) return { text: "Due Today", days: 0 };
    if (days < 0) return { text: `${Math.abs(days)} days overdue`, days };
    return { text: `Due in ${days} days`, days };
  };

  const StudentCard = ({ student, showOverdue = false }: { student: typeof students[0]; showOverdue?: boolean }) => {
    const comm = communities.find((c) => c.id === student.community_id);
    const sport = sports.find((s) => s.id === student.sport_id);
    const daysInfo = getDaysInfo(student);

    return (
      <div className={`p-4 rounded-lg border ${showOverdue ? "border-destructive/40 bg-destructive/5" : "border-warning/30 bg-warning/5"}`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge variant={showOverdue ? "destructive" : "secondary"} className="text-xs">
                {showOverdue ? "🔴 OVERDUE" : student.fee_status === "awaiting_first" ? "✨ NEW" : "⚠️ PENDING"}
              </Badge>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${showOverdue ? "bg-destructive text-destructive-foreground" : "bg-warning/20 text-warning"}`}>
                {daysInfo.text}
              </span>
            </div>
            <p className="font-semibold">{student.student_id} • {student.name}</p>
            <p className="text-xs text-muted-foreground">Parent: {student.parent_name}</p>
            <p className="text-xs text-muted-foreground mt-1">{comm?.name} • {sport?.name} • {student.batch_type}</p>
            <p className="font-bold text-lg mt-2">{formatCurrencyFull(Number(student.fee_amount))}</p>
            {student.next_due_date && <p className="text-xs text-muted-foreground">Due: {student.next_due_date}</p>}
          </div>

          {/* 3-dot menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handlePutOnHold(student)}>
                <Pause className="h-4 w-4 mr-2" /> Put on Hold
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDiscontinue(student)} className="text-destructive">
                <X className="h-4 w-4 mr-2" /> Mark Discontinued
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex gap-2 mt-3">
          <Button variant="outline" size="sm" className="gap-1 text-xs" asChild>
            <a href={`tel:+91${student.parent_whatsapp}`}><Phone className="h-3 w-3" /> Call</a>
          </Button>
          <Button variant="outline" size="sm" className="gap-1 text-xs" asChild>
            <a href={`https://wa.me/91${student.parent_whatsapp}`} target="_blank">
              <MessageSquare className="h-3 w-3" /> {showOverdue ? "Urgent Remind" : "Remind"}
            </a>
          </Button>
          <Button size="sm" className="gap-1 text-xs" onClick={() => openMarkPaid(student)}>
            <CheckCircle className="h-3 w-3" /> Mark Paid
          </Button>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Payments</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Payments</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: <IndianRupee className="h-5 w-5 text-primary" />, value: formatCurrency(stats.totalCollected), label: "This Month", color: "" },
          { icon: <Clock className="h-5 w-5 text-warning" />, value: `${stats.pendingCount}`, label: `Pending (${formatCurrency(stats.pendingAmount)})`, color: "text-warning" },
          { icon: <AlertTriangle className="h-5 w-5 text-destructive" />, value: `${stats.overdueCount}`, label: `Overdue (${formatCurrency(stats.overdueAmount)})`, color: "text-destructive" },
          { icon: <CheckCircle className="h-5 w-5 text-primary" />, value: formatCurrency(stats.todayAmount), label: `Today (${stats.todayCount} payments)`, color: "" },
        ].map((s, i) => (
          <Card key={i}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">{s.icon}</div>
              <div><p className={`text-xl font-bold ${s.color}`}>{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Pending ({stats.pendingCount})</TabsTrigger>
          <TabsTrigger value="overdue">Overdue ({stats.overdueCount})</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          {pendingStudents.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No pending payments 🎉</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {pendingStudents.map((s) => <StudentCard key={s.id} student={s} />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="overdue" className="mt-4">
          {overdueStudents.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No overdue payments</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {overdueStudents.map((s) => <StudentCard key={s.id} student={s} showOverdue />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {payments.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No payment history yet</p>
              ) : (
                <div className="overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 border-b border-border">
                      <tr className="text-left text-xs text-muted-foreground">
                        <th className="p-3">Name</th>
                        <th className="p-3">Student ID</th>
                        <th className="p-3 hidden md:table-cell">Parent</th>
                        <th className="p-3 hidden lg:table-cell">Sport</th>
                        <th className="p-3">Amount</th>
                        <th className="p-3 hidden md:table-cell">Pack</th>
                        <th className="p-3">Date</th>
                        <th className="p-3 hidden md:table-cell">Mode</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.slice(0, 50).map((p) => {
                        const st = students.find((s) => s.id === p.student_id);
                        const sport = st ? sports.find((sp) => sp.id === st.sport_id) : null;
                        const planLabel = p.plan_period === "1m" ? "1 Month" : p.plan_period === "3m" ? "3 Months" : p.plan_period === "6m" ? "6 Months" : p.plan_period;
                        return (
                          <tr key={p.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                            <td className="p-3 font-medium">{st?.name ?? "—"}</td>
                            <td className="p-3"><code className="text-primary text-xs">{p.student_code ?? st?.student_id ?? "—"}</code></td>
                            <td className="p-3 hidden md:table-cell text-muted-foreground">{st?.parent_name ?? "—"}</td>
                            <td className="p-3 hidden lg:table-cell text-muted-foreground">{sport ? `${sport.icon} ${sport.name}` : "—"}</td>
                            <td className="p-3 font-bold text-success">{formatCurrencyFull(Number(p.amount))}</td>
                            <td className="p-3 hidden md:table-cell">
                              <span className="px-2 py-0.5 bg-primary/20 text-primary rounded-full text-xs">{planLabel}</span>
                            </td>
                            <td className="p-3 text-muted-foreground">{p.payment_date}</td>
                            <td className="p-3 hidden md:table-cell text-muted-foreground">{p.payment_mode}</td>
                            <td className="p-3"><Badge variant="default" className="text-xs">✅ Verified</Badge></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Mark Paid Modal */}
      <Dialog open={!!markPaidStudentId} onOpenChange={(v) => { if (!v) setMarkPaidStudentId(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Mark Payment - {markPaidStudent?.student_id}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-3 text-sm">
              <p>Student: <strong>{markPaidStudent?.name}</strong></p>
              <p>Plan: {markPaidStudent?.batch_type} {markPaidStudent?.payment_plan === "1m" ? "1 Month" : markPaidStudent?.payment_plan === "3m" ? "3 Months" : "6 Months"}</p>
            </div>
            <div><Label>Amount Received *</Label><Input type="number" value={paymentForm.amount} onChange={(e) => setPaymentForm((p) => ({ ...p, amount: e.target.value }))} /></div>
            <div><Label>Payment Date *</Label><Input type="date" value={paymentForm.payment_date} onChange={(e) => setPaymentForm((p) => ({ ...p, payment_date: e.target.value }))} /></div>
            <div>
              <Label>Payment Mode *</Label>
              <Select value={paymentForm.payment_mode} onValueChange={(v) => setPaymentForm((p) => ({ ...p, payment_mode: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["PhonePe", "GPay", "UPI", "Cash", "Bank Transfer"].map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Transaction ID</Label><Input value={paymentForm.transaction_id} onChange={(e) => setPaymentForm((p) => ({ ...p, transaction_id: e.target.value }))} placeholder="T2026031512345" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMarkPaidStudentId(null)}>Cancel</Button>
            <Button onClick={handleMarkPaid} disabled={markPayment.isPending}>
              {markPayment.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Processing...</> : "Confirm Payment →"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
