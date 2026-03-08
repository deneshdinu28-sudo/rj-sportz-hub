import { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MessageSquare, Loader2, TrendingUp, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useStudent, useCommunities, useSports, useStudentPayments, useSportPricing, usePromoteStudent, useStudentAttendance, formatCurrencyFull } from "@/hooks/useSupabaseData";

export default function StudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: student, isLoading } = useStudent(id);
  const { data: communities = [] } = useCommunities();
  const { data: sports = [] } = useSports();
  const { data: studentPayments = [] } = useStudentPayments(id);
  const { data: allPricing = [] } = useSportPricing();
  const { data: attendanceRecords = [] } = useStudentAttendance(id);
  const promoteStudent = usePromoteStudent();

  const attendanceStats = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const monthRecords = attendanceRecords.filter((a) => a.date >= startOfMonth);
    const present = monthRecords.filter((a) => a.status === "present").length;
    const absent = monthRecords.filter((a) => a.status === "absent").length;
    const leave = monthRecords.filter((a) => a.status === "leave").length;
    const total = present + absent + leave;
    const pct = total > 0 ? Math.round((present / total) * 100) : 0;
    return { present, absent, leave, total, pct };
  }, [attendanceRecords]);

  const monthName = new Date().toLocaleString("default", { month: "long", year: "numeric" });

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
                <div className="flex justify-between"><span className="text-muted-foreground">Plan</span><span>{student.batch_type} • {student.payment_plan === "1m" ? "1 Month" : student.payment_plan === "3m" ? "3 Months" : "6 Months"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span className="font-semibold">{formatCurrencyFull(Number(student.fee_amount))}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Period</span><span>{student.payment_start_date} → {student.payment_end_date}</span></div>
                {student.next_due_date && <div className="flex justify-between"><span className="text-muted-foreground">Next Due</span><span className="text-warning">{student.next_due_date}</span></div>}
              </CardContent>
            </Card>

            {/* Attendance Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  Attendance — {monthName}
                </CardTitle>
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
                {attendanceStats.leave > 0 && (
                  <p className="text-xs text-muted-foreground">Leaves: {attendanceStats.leave}</p>
                )}
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
    </div>
  );
}
