import { useState, useMemo, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronLeft, ChevronRight, Download, Users, BarChart3, Pause, Play, X, Eye, MoreVertical, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useStudents, useSports, useUpdateStudent } from "@/hooks/useSupabaseData";
import { useToast } from "@/hooks/use-toast";
import { format, addMonths, subMonths, isAfter } from "date-fns";

interface AttendanceTabProps {
  communityId: string;
}

interface StudentWithStats {
  id: string;
  name: string;
  student_id: string;
  sport_id: string;
  is_on_hold: boolean | null;
  is_active: boolean;
  stats: {
    present: number;
    absent: number;
    leave: number;
    total: number;
    percentage: number;
  };
}

export default function AttendanceTab({ communityId }: AttendanceTabProps) {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const { data: allStudents = [] } = useStudents(communityId);
  const { data: commSports = [] } = useSports(communityId);
  const updateStudent = useUpdateStudent();
  const { toast } = useToast();

  const activeStudents = useMemo(() => allStudents.filter((s) => s.is_active), [allStudents]);

  useEffect(() => {
    if (activeStudents.length > 0) loadAttendanceData();
  }, [communityId, selectedMonth, activeStudents.length]);

  const loadAttendanceData = async () => {
    setLoading(true);
    const startOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
    const endOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0);

    const ids = activeStudents.map((s) => s.id);
    if (ids.length === 0) { setLoading(false); return; }

    const { data } = await supabase
      .from("attendance")
      .select("*")
      .in("student_id", ids)
      .gte("date", format(startOfMonth, "yyyy-MM-dd"))
      .lte("date", format(endOfMonth, "yyyy-MM-dd"));

    setAttendanceData(data || []);
    setLoading(false);
  };

  const studentsWithStats: StudentWithStats[] = useMemo(() => {
    return activeStudents.map((student) => {
      const sa = attendanceData.filter((a) => a.student_id === student.id);
      const present = sa.filter((a) => a.status === "present").length;
      const absent = sa.filter((a) => a.status === "absent").length;
      const leave = sa.filter((a) => a.status === "leave").length;
      const total = present + absent + leave;
      const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
      return { ...student, stats: { present, absent, leave, total, percentage } };
    });
  }, [activeStudents, attendanceData]);

  const summary = useMemo(() => {
    const avgPct = studentsWithStats.length > 0
      ? Math.round(studentsWithStats.reduce((s, st) => s + st.stats.percentage, 0) / studentsWithStats.length)
      : 0;
    const onHold = studentsWithStats.filter((s) => s.is_on_hold).length;
    const totalClasses = studentsWithStats.reduce((s, st) => s + st.stats.total, 0);
    return { total: studentsWithStats.length, avgPct, onHold, totalClasses };
  }, [studentsWithStats]);

  const handlePutOnHold = async (student: StudentWithStats) => {
    const reason = prompt("Reason for hold:");
    if (reason === null) return;
    await updateStudent.mutateAsync({ id: student.id, updates: { is_on_hold: true, hold_reason: reason || "On hold" } });
    toast({ title: `${student.name} put on hold` });
    loadAttendanceData();
  };

  const handleReactivate = async (student: StudentWithStats) => {
    await updateStudent.mutateAsync({ id: student.id, updates: { is_on_hold: false, hold_reason: null } });
    toast({ title: `${student.name} reactivated` });
    loadAttendanceData();
  };

  const handleDiscontinue = async (student: StudentWithStats) => {
    if (!confirm(`Mark ${student.name} as discontinued? This cannot be undone.`)) return;
    await updateStudent.mutateAsync({ id: student.id, updates: { is_active: false } });
    toast({ title: `${student.name} discontinued`, variant: "destructive" });
  };

  const getSportInfo = (sportId: string) => {
    const sport = commSports.find((s) => s.id === sportId);
    return sport ? `${sport.icon} ${sport.name}` : "—";
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h3 className="text-lg font-bold">Monthly Attendance</h3>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedMonth(subMonths(selectedMonth, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[120px] text-center">{format(selectedMonth, "MMMM yyyy")}</span>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedMonth(addMonths(selectedMonth, 1))} disabled={isAfter(selectedMonth, new Date())}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4 text-center">
          <Users className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
          <p className="text-2xl font-bold">{summary.total}</p>
          <p className="text-xs text-muted-foreground">Total Students</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <BarChart3 className="h-5 w-5 mx-auto text-primary mb-1" />
          <p className="text-2xl font-bold text-primary">{summary.avgPct}%</p>
          <p className="text-xs text-muted-foreground">Avg Attendance</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <Pause className="h-5 w-5 mx-auto text-warning mb-1" />
          <p className="text-2xl font-bold text-warning">{summary.onHold}</p>
          <p className="text-xs text-muted-foreground">On Hold</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold">{summary.totalClasses}</p>
          <p className="text-xs text-muted-foreground">Total Classes</p>
        </CardContent></Card>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : studentsWithStats.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="h-10 w-10 mx-auto mb-3" />
          <p className="font-medium">No Students Found</p>
          <p className="text-sm mt-1">No active students enrolled in this community yet.</p>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b border-border">
                  <tr className="text-left text-xs text-muted-foreground">
                    <th className="p-3">Student</th>
                    <th className="p-3 hidden md:table-cell">Sport</th>
                    <th className="p-3 text-center">Present</th>
                    <th className="p-3 text-center">Absent</th>
                    <th className="p-3 text-center">Leave</th>
                    <th className="p-3 text-center hidden sm:table-cell">Total</th>
                    <th className="p-3">Attendance %</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {studentsWithStats.map((student) => (
                    <tr key={student.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="p-3">
                        <p className="font-medium">{student.name}</p>
                        <p className="text-xs text-muted-foreground">{student.student_id}</p>
                      </td>
                      <td className="p-3 hidden md:table-cell text-muted-foreground">{getSportInfo(student.sport_id)}</td>
                      <td className="p-3 text-center text-success font-medium">{student.stats.present}</td>
                      <td className="p-3 text-center text-destructive font-medium">{student.stats.absent}</td>
                      <td className="p-3 text-center text-warning font-medium">{student.stats.leave}</td>
                      <td className="p-3 text-center hidden sm:table-cell">{student.stats.total}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Progress value={student.stats.percentage} className="h-2 flex-1 min-w-[60px]" />
                          <span className="text-xs font-medium min-w-[36px] text-right">{student.stats.percentage}%</span>
                        </div>
                      </td>
                      <td className="p-3">
                        {student.is_on_hold ? (
                          <Badge variant="secondary" className="text-xs"><Pause className="h-3 w-3 mr-1" /> Hold</Badge>
                        ) : (
                          <Badge variant="default" className="text-xs">Active</Badge>
                        )}
                      </td>
                      <td className="p-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7"><MoreVertical className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {student.is_on_hold ? (
                              <DropdownMenuItem onClick={() => handleReactivate(student)}>
                                <Play className="h-4 w-4 mr-2" /> Reactivate
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => handlePutOnHold(student)}>
                                <Pause className="h-4 w-4 mr-2" /> Put on Hold
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleDiscontinue(student)} className="text-destructive">
                              <X className="h-4 w-4 mr-2" /> Mark Discontinued
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
