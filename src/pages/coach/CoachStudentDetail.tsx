import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStudent, useCommunities, useSports, useStudentAttendance, formatCurrencyFull } from "@/hooks/useSupabaseData";

export default function CoachStudentDetail() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const { data: student, isLoading } = useStudent(studentId);
  const { data: communities = [] } = useCommunities();
  const { data: sports = [] } = useSports();
  const { data: attendanceRecords = [] } = useStudentAttendance(studentId);

  // Month selector for attendance
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);

  // Generate last 6 months for selector
  const monthOptions = useMemo(() => {
    const opts: Array<{ value: string; label: string }> = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      opts.push({
        value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
        label: d.toLocaleString("default", { month: "long", year: "numeric" }),
      });
    }
    return opts;
  }, []);

  const monthStats = useMemo(() => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const endDate = month === 12
      ? `${year + 1}-01-01`
      : `${year}-${String(month + 1).padStart(2, "0")}-01`;

    const monthRecords = attendanceRecords.filter(a => a.date >= startDate && a.date < endDate);
    const present = monthRecords.filter(a => a.status === "present").length;
    const absent = monthRecords.filter(a => a.status === "absent").length;
    const leave = monthRecords.filter(a => a.status === "leave").length;
    const total = present + absent + leave;
    const pct = total > 0 ? Math.round((present / total) * 100) : 0;
    return { present, absent, leave, total, pct };
  }, [attendanceRecords, selectedMonth]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 space-y-4">
        <Skeleton className="h-12 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  if (!student) return (
    <div className="min-h-screen bg-background p-6 text-muted-foreground">
      Student not found. <Button variant="link" onClick={() => navigate(-1)}>Go back</Button>
    </div>
  );

  const community = communities.find(c => c.id === student.community_id);
  const sport = sports.find(s => s.id === student.sport_id);

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <div className="sticky top-0 z-50 bg-card border-b border-border px-4 py-3">
        <div className="flex items-center gap-3 max-w-3xl mx-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <p className="font-bold text-sm">{student.name}</p>
            <p className="text-xs text-muted-foreground font-mono">{student.student_id}</p>
          </div>
          <Badge
            variant={student.fee_status === "paid" ? "default" : student.fee_status === "overdue" ? "destructive" : "secondary"}
          >
            {student.fee_status === "paid" ? "✓ Paid" : student.fee_status === "overdue" ? "🔴 Overdue" : student.fee_status === "awaiting_first" ? "✨ New" : "⚠ Pending"}
          </Badge>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 space-y-4">
        {/* Student Info */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Student Details</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Age</span><span>{student.age} • {student.age_group}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Community</span><span>{community?.name}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Sport</span><span>{sport?.icon} {sport?.name}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Batch</span><span>{student.batch_time} • {student.batch_type}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Fee</span><span className="font-semibold text-primary">{formatCurrencyFull(Number(student.fee_amount))}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Plan</span><span>{student.payment_plan === "1m" ? "1 Month" : student.payment_plan === "3m" ? "3 Months" : "6 Months"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Joining Date</span><span>{student.joining_date}</span></div>
            {student.next_due_date && (
              <div className="flex justify-between"><span className="text-muted-foreground">Next Due</span><span className="text-warning">{student.next_due_date}</span></div>
            )}
          </CardContent>
        </Card>

        {/* Parent Info */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Parent / Contact</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Parent Name</span><span>{student.parent_name}</span></div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">WhatsApp</span>
              <div className="flex items-center gap-2">
                <span>{student.parent_whatsapp}</span>
                <a href={`https://wa.me/91${student.parent_whatsapp}`} target="_blank" className="text-primary">
                  <MessageSquare className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
            {student.parent_phone && student.parent_phone !== student.parent_whatsapp && (
              <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span>{student.parent_phone}</span></div>
            )}
          </CardContent>
        </Card>

        {/* Attendance with month selector */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" /> Attendance
              </CardTitle>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[180px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-4 gap-3 text-center">
              <div className="p-2 rounded-lg bg-muted/50">
                <p className="text-xl font-bold">{monthStats.total}</p>
                <p className="text-[10px] text-muted-foreground">Total Classes</p>
              </div>
              <div className="p-2 rounded-lg bg-success/10">
                <p className="text-xl font-bold text-success">{monthStats.present}</p>
                <p className="text-[10px] text-muted-foreground">Present</p>
              </div>
              <div className="p-2 rounded-lg bg-destructive/10">
                <p className="text-xl font-bold text-destructive">{monthStats.absent}</p>
                <p className="text-[10px] text-muted-foreground">Absent</p>
              </div>
              <div className="p-2 rounded-lg bg-warning/10">
                <p className="text-xl font-bold text-warning">{monthStats.leave}</p>
                <p className="text-[10px] text-muted-foreground">Leave</p>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Attendance Rate</span>
                <span className={`font-medium ${monthStats.pct >= 80 ? "text-success" : monthStats.pct >= 60 ? "text-warning" : "text-destructive"}`}>
                  {monthStats.total > 0 ? `${monthStats.pct}%` : "N/A"}
                </span>
              </div>
              <Progress value={monthStats.pct} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
