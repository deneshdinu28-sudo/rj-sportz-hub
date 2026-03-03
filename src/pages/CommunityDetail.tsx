import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Phone, MessageSquare, Plus, ChevronDown, ChevronUp, Search, Edit2, Users, Trophy, IndianRupee, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { mockCommunities, mockSports, mockStudents, formatCurrencyFull, formatCurrency } from "@/lib/mock-data";
import type { Student, Sport } from "@/types/database";

export default function CommunityDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const community = mockCommunities.find((c) => c.id === id);
  const commSports = useMemo(() => mockSports.filter((s) => s.community_id === id), [id]);
  const commStudents = useMemo(() => mockStudents.filter((s) => s.community_id === id), [id]);

  const [search, setSearch] = useState("");
  const [timeFilter, setTimeFilter] = useState("all");
  const [ageFilter, setAgeFilter] = useState("all");
  const [feeFilter, setFeeFilter] = useState("all");
  const [expandedSports, setExpandedSports] = useState<Set<string>>(new Set());
  const [addStudentOpen, setAddStudentOpen] = useState(false);
  const [addSportOpen, setAddSportOpen] = useState(false);

  const [studentForm, setStudentForm] = useState({
    name: "", age: "", parent_name: "", parent_whatsapp: "", parent_phone: "",
    sport_id: "", batch_time: "", age_group: "kids", batch_type: "standard",
    payment_plan: "1m", first_payment: "later",
  });

  const [sportForm, setSportForm] = useState({
    name: "", coach_name: "", coach_phone: "",
    time_slots: [] as string[], active_days: [] as string[],
  });

  const stats = useMemo(() => {
    const paid = commStudents.filter((s) => s.fee_status === "paid").length;
    const pending = commStudents.filter((s) => s.fee_status !== "paid").length;
    const revenue = commStudents.filter((s) => s.fee_status === "paid").reduce((sum, s) => sum + s.fee_amount, 0);
    return { students: commStudents.length, sports: commSports.length, revenue, pending };
  }, [commStudents, commSports]);

  const allTimeSlots = useMemo(() => [...new Set(commSports.flatMap((s) => s.time_slots))].sort(), [commSports]);

  if (!community) return <div className="p-6">Community not found</div>;

  const toggleSport = (sportId: string) => {
    setExpandedSports((prev) => {
      const next = new Set(prev);
      next.has(sportId) ? next.delete(sportId) : next.add(sportId);
      return next;
    });
  };

  const getFilteredStudents = (sport: Sport) => {
    let students = commStudents.filter((s) => s.sport_id === sport.id);
    if (search) {
      const q = search.toLowerCase();
      students = students.filter((s) => s.name.toLowerCase().includes(q) || s.student_id.toLowerCase().includes(q) || s.parent_name.toLowerCase().includes(q));
    }
    if (timeFilter !== "all") students = students.filter((s) => s.batch_time === timeFilter);
    if (ageFilter !== "all") students = students.filter((s) => s.age_group === ageFilter);
    if (feeFilter !== "all") students = students.filter((s) => s.fee_status === feeFilter);
    return students;
  };

  // allTimeSlots already defined above

  const openAddStudent = (sport?: Sport, batch?: string) => {
    setStudentForm({
      name: "", age: "", parent_name: "", parent_whatsapp: "", parent_phone: "",
      sport_id: sport?.id ?? commSports[0]?.id ?? "",
      batch_time: batch ?? "", age_group: "kids", batch_type: "standard",
      payment_plan: "1m", first_payment: "later",
    });
    setAddStudentOpen(true);
  };

  const getFeeAmount = () => {
    const plan = studentForm.payment_plan as "1m" | "3m" | "6m";
    const type = studentForm.batch_type as "standard" | "premium";
    return community.pricing[type][plan];
  };

  const handleSaveStudent = () => {
    toast({ title: "Student added!", description: `${studentForm.name} enrolled successfully` });
    setAddStudentOpen(false);
  };

  const handleSaveSport = () => {
    toast({ title: "Sport added!", description: `${sportForm.name} added to ${community.name}` });
    setAddSportOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Button variant="ghost" size="sm" onClick={() => navigate("/communities")} className="mb-2 -ml-2 text-muted-foreground">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <h1 className="text-2xl font-bold">{community.name} <span className="text-muted-foreground">({community.short_code})</span></h1>
          <p className="text-sm text-muted-foreground">{community.address}</p>
          {community.contact_person && (
            <p className="text-sm text-muted-foreground mt-1">
              {community.contact_person} • <a href={`tel:+91${community.contact_phone}`} className="text-primary hover:underline">📞 {community.contact_phone}</a>
            </p>
          )}
        </div>
        <Button variant="outline" size="sm" className="gap-1"><Edit2 className="h-3 w-3" /> Edit</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: <Trophy className="h-5 w-5 text-primary" />, value: stats.sports, label: "Sports" },
          { icon: <Users className="h-5 w-5 text-primary" />, value: stats.students, label: "Students" },
          { icon: <IndianRupee className="h-5 w-5 text-primary" />, value: formatCurrency(stats.revenue), label: "Revenue" },
          { icon: <AlertTriangle className="h-5 w-5 text-warning" />, value: stats.pending, label: "Pending" },
        ].map((s, i) => (
          <Card key={i}><CardContent className="p-4 flex items-center gap-3"><div className="p-2 rounded-lg bg-primary/10">{s.icon}</div><div><p className="text-xl font-bold">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div></CardContent></Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search students..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={timeFilter} onValueChange={setTimeFilter}>
          <SelectTrigger className="w-[130px]"><SelectValue placeholder="Time Slot" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All Slots</SelectItem>{allTimeSlots.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={ageFilter} onValueChange={setAgeFilter}>
          <SelectTrigger className="w-[110px]"><SelectValue placeholder="Age" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="kids">Kids</SelectItem><SelectItem value="adults">Adults</SelectItem></SelectContent>
        </Select>
        <Select value={feeFilter} onValueChange={setFeeFilter}>
          <SelectTrigger className="w-[120px]"><SelectValue placeholder="Fee" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="paid">Paid</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="overdue">Overdue</SelectItem></SelectContent>
        </Select>
        <Button onClick={() => openAddStudent()} className="gap-1"><Plus className="h-4 w-4" /> Add Student</Button>
        <Button variant="outline" onClick={() => { setSportForm({ name: "", coach_name: "", coach_phone: "", time_slots: [], active_days: [] }); setAddSportOpen(true); }} className="gap-1"><Plus className="h-4 w-4" /> Add Sport</Button>
      </div>

      <div className="space-y-4">
        {commSports.map((sport) => {
          const sportStudents = getFilteredStudents(sport);
          const expanded = expandedSports.has(sport.id);
          const paid = sportStudents.filter((s) => s.fee_status === "paid").length;
          const pending = sportStudents.length - paid;
          const revenue = sportStudents.filter((s) => s.fee_status === "paid").reduce((sum, s) => sum + s.fee_amount, 0);
          const batches = [...new Set(sportStudents.map((s) => s.batch_time))].sort();

          return (
            <Card key={sport.id} className="overflow-hidden">
              <div className="p-4 cursor-pointer hover:bg-muted/30 transition-colors flex items-start justify-between" onClick={() => toggleSport(sport.id)}>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{sport.icon}</span>
                    <h3 className="font-bold text-lg">{sport.name}</h3>
                    {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Coach: {sport.coach_name} • <a href={`tel:+91${sport.coach_phone}`} className="text-primary hover:underline" onClick={(e) => e.stopPropagation()}>{sport.coach_phone}</a>
                  </p>
                  {!expanded && <p className="text-sm text-muted-foreground mt-1">Standard: {formatCurrencyFull(sport.standard_fee)} | Premium: {formatCurrencyFull(sport.premium_fee)}</p>}
                </div>
                <div className="text-right text-sm">
                  <p className="font-semibold">👥 {sportStudents.length} • 💰 {formatCurrency(revenue)}</p>
                  <p className="text-muted-foreground">{paid} paid, {pending} pending</p>
                </div>
              </div>

              {expanded && (
                <div className="border-t border-border">
                  <div className="px-4 pt-3 pb-2">
                    <p className="text-sm text-muted-foreground">Standard: {formatCurrencyFull(sport.standard_fee)} | Premium: {formatCurrencyFull(sport.premium_fee)}</p>
                  </div>
                  {batches.map((batchTime) => {
                    const batchStudents = sportStudents.filter((s) => s.batch_time === batchTime);
                    const bPaid = batchStudents.filter((s) => s.fee_status === "paid").length;
                    const bRevenue = batchStudents.filter((s) => s.fee_status === "paid").reduce((sum, s) => sum + s.fee_amount, 0);
                    const ageGroups = [...new Set(batchStudents.map((s) => s.age_group))];
                    const batchTypes = [...new Set(batchStudents.map((s) => s.batch_type))];

                    return (
                      <div key={batchTime} className="border-t border-border/50 px-4 py-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold">⏰ {batchTime}</span>
                            {ageGroups.map((ag) => <Badge key={ag} variant="secondary" className="text-xs">{ag === "kids" ? "👶 Kids" : "👨 Adults"}</Badge>)}
                            {batchTypes.map((bt) => <Badge key={bt} variant={bt === "premium" ? "default" : "secondary"} className="text-xs">{bt === "premium" ? "⭐ Premium" : "Standard"}</Badge>)}
                          </div>
                          <span className="text-xs text-muted-foreground">{batchStudents.length} students • {bPaid} paid</span>
                        </div>

                        <div className="rounded-lg border border-border overflow-auto max-h-[300px] scrollbar-hide">
                          <table className="w-full text-sm">
                            <thead className="bg-muted/50 sticky top-0">
                              <tr className="text-left text-xs text-muted-foreground">
                                <th className="p-2">ID</th><th className="p-2">Name</th>
                                <th className="p-2 hidden sm:table-cell">Parent</th>
                                <th className="p-2 hidden md:table-cell">Phone</th>
                                <th className="p-2">Fee</th><th className="p-2">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {batchStudents.map((st) => (
                                <tr key={st.id} onClick={() => navigate(`/students/${st.id}`)} className="border-t border-border/30 cursor-pointer hover:bg-muted/30 transition-colors">
                                  <td className="p-2 font-mono text-xs text-muted-foreground">{st.student_id}</td>
                                  <td className="p-2 font-medium">{st.name}</td>
                                  <td className="p-2 hidden sm:table-cell text-muted-foreground">{st.parent_name}</td>
                                  <td className="p-2 hidden md:table-cell"><a href={`tel:+91${st.parent_whatsapp}`} className="text-primary hover:underline text-xs" onClick={(e) => e.stopPropagation()}>{st.parent_whatsapp}</a></td>
                                  <td className="p-2 text-xs">{formatCurrencyFull(st.fee_amount)}</td>
                                  <td className="p-2"><Badge variant={st.fee_status === "paid" ? "default" : st.fee_status === "pending" ? "secondary" : "destructive"} className="text-xs">{st.fee_status === "paid" ? "✅" : st.fee_status === "pending" ? "⚠️" : "🔴"} {st.fee_status}</Badge></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                          <span>Collected: {formatCurrencyFull(bRevenue)} | Pending: {formatCurrencyFull(batchStudents.filter((s) => s.fee_status !== "paid").reduce((sum, s) => sum + s.fee_amount, 0))}</span>
                          <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => openAddStudent(sport, batchTime)}><Plus className="h-3 w-3" /> Add Student</Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Add Student Modal */}
      <Dialog open={addStudentOpen} onOpenChange={setAddStudentOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-auto">
          <DialogHeader><DialogTitle>Add New Student</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Student Name *</Label><Input value={studentForm.name} onChange={(e) => setStudentForm((p) => ({ ...p, name: e.target.value }))} placeholder="Rahul Kumar" /></div>
            <div><Label>Age *</Label><Input type="number" value={studentForm.age} onChange={(e) => setStudentForm((p) => ({ ...p, age: e.target.value }))} placeholder="12" min={5} max={50} /></div>
            <div><Label>Parent Name *</Label><Input value={studentForm.parent_name} onChange={(e) => setStudentForm((p) => ({ ...p, parent_name: e.target.value }))} placeholder="Suresh Kumar" /></div>
            <div><Label>WhatsApp Number *</Label><Input value={studentForm.parent_whatsapp} onChange={(e) => setStudentForm((p) => ({ ...p, parent_whatsapp: e.target.value }))} placeholder="9876543210" maxLength={10} /></div>
            <div><Label>Phone Number</Label><Input value={studentForm.parent_phone} onChange={(e) => setStudentForm((p) => ({ ...p, parent_phone: e.target.value }))} placeholder="9876543210" maxLength={10} /></div>
            <div><Label>Sport *</Label><Select value={studentForm.sport_id} onValueChange={(v) => setStudentForm((p) => ({ ...p, sport_id: v }))}><SelectTrigger><SelectValue placeholder="Select sport" /></SelectTrigger><SelectContent>{commSports.map((s) => <SelectItem key={s.id} value={s.id}>{s.icon} {s.name}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Time Slot *</Label><Select value={studentForm.batch_time} onValueChange={(v) => setStudentForm((p) => ({ ...p, batch_time: v }))}><SelectTrigger><SelectValue placeholder="Select time" /></SelectTrigger><SelectContent>{allTimeSlots.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Age Group *</Label><RadioGroup value={studentForm.age_group} onValueChange={(v) => setStudentForm((p) => ({ ...p, age_group: v }))} className="flex gap-4 mt-1"><div className="flex items-center gap-2"><RadioGroupItem value="kids" id="ag-kids" /><Label htmlFor="ag-kids">Kids</Label></div><div className="flex items-center gap-2"><RadioGroupItem value="adults" id="ag-adults" /><Label htmlFor="ag-adults">Adults</Label></div></RadioGroup></div>
            <div><Label>Batch Type *</Label><RadioGroup value={studentForm.batch_type} onValueChange={(v) => setStudentForm((p) => ({ ...p, batch_type: v }))} className="flex gap-4 mt-1"><div className="flex items-center gap-2"><RadioGroupItem value="standard" id="bt-std" /><Label htmlFor="bt-std">Standard</Label></div><div className="flex items-center gap-2"><RadioGroupItem value="premium" id="bt-prm" /><Label htmlFor="bt-prm">Premium</Label></div></RadioGroup></div>
            <div>
              <Label>Payment Plan *</Label>
              <RadioGroup value={studentForm.payment_plan} onValueChange={(v) => setStudentForm((p) => ({ ...p, payment_plan: v }))} className="space-y-2 mt-1">
                {(["1m", "3m", "6m"] as const).map((plan) => {
                  const type = studentForm.batch_type as "standard" | "premium";
                  const amount = community.pricing[type][plan];
                  const monthly = community.pricing[type]["1m"];
                  const saved = monthly * (plan === "3m" ? 3 : plan === "6m" ? 6 : 1) - amount;
                  return (
                    <div key={plan} className="flex items-center gap-2">
                      <RadioGroupItem value={plan} id={`pp-${plan}`} />
                      <Label htmlFor={`pp-${plan}`} className="flex-1 flex justify-between">
                        <span>{plan === "1m" ? "1 Month" : plan === "3m" ? "3 Months" : "6 Months"} - {formatCurrencyFull(amount)}</span>
                        {saved > 0 && <span className="text-primary text-xs">Save {formatCurrencyFull(saved)}</span>}
                      </Label>
                    </div>
                  );
                })}
              </RadioGroup>
            </div>
            <div><Label>First Payment</Label><RadioGroup value={studentForm.first_payment} onValueChange={(v) => setStudentForm((p) => ({ ...p, first_payment: v }))} className="flex gap-4 mt-1"><div className="flex items-center gap-2"><RadioGroupItem value="paid" id="fp-paid" /><Label htmlFor="fp-paid">Already Paid</Label></div><div className="flex items-center gap-2"><RadioGroupItem value="later" id="fp-later" /><Label htmlFor="fp-later">Will Pay Later</Label></div></RadioGroup></div>
            <div className="bg-muted/50 rounded-lg p-3 text-sm"><p className="font-semibold mb-1">Summary</p><p>Amount: {formatCurrencyFull(getFeeAmount())}</p><p>Status: {studentForm.first_payment === "paid" ? "✅ Paid" : "⚠️ Pending"}</p></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setAddStudentOpen(false)}>Cancel</Button><Button onClick={handleSaveStudent}>Save Student →</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Sport Modal */}
      <Dialog open={addSportOpen} onOpenChange={setAddSportOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-auto">
          <DialogHeader><DialogTitle>Add Sport to {community.name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Sport Name *</Label><Select value={sportForm.name} onValueChange={(v) => setSportForm((p) => ({ ...p, name: v }))}><SelectTrigger><SelectValue placeholder="Select sport" /></SelectTrigger><SelectContent>{["Badminton", "Yoga", "Karate", "Swimming", "Cricket", "Football", "Table Tennis", "Basketball"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Coach Name *</Label><Input value={sportForm.coach_name} onChange={(e) => setSportForm((p) => ({ ...p, coach_name: e.target.value }))} placeholder="Ramesh Kumar" /></div>
            <div><Label>Coach Phone *</Label><Input value={sportForm.coach_phone} onChange={(e) => setSportForm((p) => ({ ...p, coach_phone: e.target.value }))} placeholder="9876543210" /></div>
            <div>
              <Label>Time Slots *</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {["3-4 PM", "4-5 PM", "5-6 PM", "6-7 PM", "7-8 PM"].map((t) => (
                  <label key={t} className="flex items-center gap-1.5 text-sm">
                    <Checkbox checked={sportForm.time_slots.includes(t)} onCheckedChange={(checked) => setSportForm((p) => ({ ...p, time_slots: checked ? [...p.time_slots, t] : p.time_slots.filter((x) => x !== t) }))} />
                    {t}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <Label>Active Days *</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                  <label key={d} className="flex items-center gap-1.5 text-sm">
                    <Checkbox checked={sportForm.active_days.includes(d)} onCheckedChange={(checked) => setSportForm((p) => ({ ...p, active_days: checked ? [...p.active_days, d] : p.active_days.filter((x) => x !== d) }))} />
                    {d}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setAddSportOpen(false)}>Cancel</Button><Button onClick={handleSaveSport}>Save Sport →</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
