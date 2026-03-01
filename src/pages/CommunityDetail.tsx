import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Plus, Phone, MapPin, ChevronDown, ChevronUp, MessageCircle, Users, IndianRupee, Trophy, AlertTriangle, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  getCommunityById,
  getCommunityStudentCount,
  getCommunityRevenue,
  getSportStudentCount,
  getSportRevenue,
  getSportPaidCount,
  getSportPendingCount,
  getSportOverdueCount,
  getBatchRevenue,
  getBatchPaidCount,
  getBatchPendingCount,
  formatCurrency,
  formatCurrencyFull,
  getPaymentHealth,
  type Sport,
  type Batch,
  type Student,
} from "@/data/communitiesData";
import { AddStudentModal } from "@/components/AddStudentModal";
import { AddSportModal } from "@/components/AddSportModal";
import { AddBatchModal } from "@/components/AddBatchModal";

export default function CommunityDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const community = getCommunityById(id || "");

  const [search, setSearch] = useState("");
  const [batchFilter, setBatchFilter] = useState("all");
  const [ageFilter, setAgeFilter] = useState("all");
  const [feeFilter, setFeeFilter] = useState("all");
  const [expandedSports, setExpandedSports] = useState<Set<string>>(new Set());
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());

  // Modals
  const [addStudentOpen, setAddStudentOpen] = useState(false);
  const [addStudentSport, setAddStudentSport] = useState<Sport | null>(null);
  const [addStudentBatch, setAddStudentBatch] = useState<Batch | null>(null);
  const [addSportOpen, setAddSportOpen] = useState(false);
  const [addBatchSport, setAddBatchSport] = useState<Sport | null>(null);

  const allBatchTimes = useMemo(() => {
    if (!community) return [];
    const times = new Set<string>();
    community.sports.forEach(s => s.batches.forEach(b => times.add(`${b.startTime}-${b.endTime}`)));
    return Array.from(times);
  }, [community]);

  if (!community) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate("/communities")} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Communities
        </Button>
        <p className="text-muted-foreground">Community not found.</p>
      </div>
    );
  }

  const studentCount = getCommunityStudentCount(community);
  const revenue = getCommunityRevenue(community);
  const paidCount = community.sports.reduce((s, sp) => s + getSportPaidCount(sp), 0);
  const pendingFees = community.sports.reduce((s, sp) => s + getSportPendingCount(sp) + getSportOverdueCount(sp), 0);

  const toggleSport = (sportId: string) => {
    setExpandedSports(prev => {
      const n = new Set(prev);
      n.has(sportId) ? n.delete(sportId) : n.add(sportId);
      return n;
    });
  };

  const filterStudents = (students: Student[], batch: Batch) => {
    let list = students;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(s => s.name.toLowerCase().includes(q) || s.parentName.toLowerCase().includes(q) || s.phone.includes(q));
    }
    if (ageFilter !== "all" && batch.ageGroup !== ageFilter) return [];
    if (batchFilter !== "all" && `${batch.startTime}-${batch.endTime}` !== batchFilter) return [];
    if (feeFilter !== "all") list = list.filter(s => s.feeStatus === feeFilter);
    return list;
  };

  const shouldShowSport = (sport: Sport) => {
    if (batchFilter === "all" && ageFilter === "all" && feeFilter === "all" && !search) return true;
    return sport.batches.some(b => filterStudents(b.students, b).length > 0 || (batchFilter === "all" && ageFilter === "all"));
  };

  const toggleSelectAll = (batchStudents: Student[]) => {
    const ids = batchStudents.map(s => s.id);
    const allSelected = ids.every(id => selectedStudents.has(id));
    setSelectedStudents(prev => {
      const n = new Set(prev);
      ids.forEach(id => allSelected ? n.delete(id) : n.add(id));
      return n;
    });
  };

  const openAddStudent = (sport: Sport, batch?: Batch) => {
    setAddStudentSport(sport);
    setAddStudentBatch(batch || null);
    setAddStudentOpen(true);
  };

  // Active filter chips
  const activeFilters: { label: string; clear: () => void }[] = [];
  if (batchFilter !== "all") activeFilters.push({ label: batchFilter, clear: () => setBatchFilter("all") });
  if (ageFilter !== "all") activeFilters.push({ label: ageFilter === "kids" ? "Kids" : "Adults", clear: () => setAgeFilter("all") });
  if (feeFilter !== "all") activeFilters.push({ label: feeFilter.charAt(0).toUpperCase() + feeFilter.slice(1), clear: () => setFeeFilter("all") });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Button variant="ghost" onClick={() => navigate("/communities")} className="gap-2 w-fit">
          <ArrowLeft className="h-4 w-4" /> Back to Communities
        </Button>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">🏢 {community.name}</h1>
            <p className="text-muted-foreground flex items-center gap-2 mt-1">
              <MapPin className="h-4 w-4" /> {community.location}
            </p>
            <p className="text-sm mt-1 flex items-center gap-2">
              Contact: {community.contactPerson} |
              <a href={`tel:+91${community.contactPhone}`} className="text-primary hover:underline flex items-center gap-1">
                <Phone className="h-3 w-3" /> {community.contactPhone}
              </a>
            </p>
          </div>
          <Button onClick={() => setAddSportOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Add Sport
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: <Trophy className="h-5 w-5 text-primary" />, value: community.sports.length, label: "Sports" },
          { icon: <Users className="h-5 w-5 text-primary" />, value: studentCount, label: "Students" },
          { icon: <IndianRupee className="h-5 w-5 text-primary" />, value: formatCurrency(revenue), label: "This Month" },
          { icon: <AlertTriangle className="h-5 w-5 text-destructive" />, value: pendingFees, label: "Pending Fees" },
        ].map((s, i) => (
          <Card key={i}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">{s.icon}</div>
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search students..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={batchFilter} onValueChange={setBatchFilter}>
          <SelectTrigger className="w-[180px]"><Clock className="h-4 w-4 mr-1" /><SelectValue placeholder="Batch" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Batches</SelectItem>
            {allBatchTimes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={ageFilter} onValueChange={setAgeFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Age Group" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Ages</SelectItem>
            <SelectItem value="kids">Kids</SelectItem>
            <SelectItem value="adults">Adults</SelectItem>
          </SelectContent>
        </Select>
        <Select value={feeFilter} onValueChange={setFeeFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Fee Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-xs text-muted-foreground">Active Filters:</span>
          {activeFilters.map((f, i) => (
            <Badge key={i} variant="outline" className="gap-1 cursor-pointer" onClick={f.clear}>
              {f.label} <span className="text-destructive">×</span>
            </Badge>
          ))}
          <Button variant="ghost" size="sm" className="text-xs h-6" onClick={() => { setBatchFilter("all"); setAgeFilter("all"); setFeeFilter("all"); }}>
            Clear All
          </Button>
        </div>
      )}

      {/* Sport Cards */}
      <div className="space-y-4">
        {community.sports.filter(shouldShowSport).map(sport => {
          const expanded = expandedSports.has(sport.id);
          const totalStudents = getSportStudentCount(sport);
          const sportRevenue = getSportRevenue(sport);
          const paid = getSportPaidCount(sport);
          const pending = getSportPendingCount(sport);
          const overdue = getSportOverdueCount(sport);
          const paidPct = totalStudents > 0 ? Math.round((paid / totalStudents) * 100) : 0;

          return (
            <Card key={sport.id} className="overflow-hidden">
              <CardContent className="p-0">
                {/* Sport Header */}
                <div className="p-4 cursor-pointer hover:bg-accent/5 transition-colors" onClick={() => toggleSport(sport.id)}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{sport.icon}</span>
                      <div>
                        <h3 className="text-lg font-bold">{sport.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Coach: {sport.coach} |{" "}
                          <a href={`tel:+91${sport.coachPhone}`} className="text-primary hover:underline" onClick={e => e.stopPropagation()}>
                            📞 {sport.coachPhone}
                          </a>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {expanded ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-4 text-sm">
                    <span>{totalStudents} students</span>
                    <span className="text-muted-foreground">|</span>
                    <span>{formatCurrency(sportRevenue)} revenue</span>
                    <span className="text-muted-foreground">|</span>
                    <span className="text-primary">{paid} paid</span>
                    <span>, {pending} pending</span>
                    {overdue > 0 && <span className="text-destructive">, {overdue} overdue</span>}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {sport.batches.length} Batches: {sport.batches.map(b => `${b.startTime}-${b.endTime} (${b.ageGroup === "kids" ? "Kids" : "Adults"})`).join(", ")}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="outline" className="gap-1" onClick={e => { e.stopPropagation(); openAddStudent(sport); }}>
                      <Plus className="h-3 w-3" /> Add Student
                    </Button>
                    <Button size="sm" variant="ghost" onClick={e => { e.stopPropagation(); toast({ title: "Edit sport coming soon" }); }}>Edit Sport</Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={e => { e.stopPropagation(); toast({ title: "Delete sport coming soon" }); }}>Delete</Button>
                  </div>
                </div>

                {/* Expanded Content */}
                {expanded && (
                  <div className="border-t border-border">
                    {/* Sport Stats */}
                    <div className="p-4 grid grid-cols-4 gap-3 bg-secondary/30">
                      <div className="text-center"><p className="text-lg font-bold">{totalStudents}</p><p className="text-[10px] text-muted-foreground">Students</p></div>
                      <div className="text-center"><p className="text-lg font-bold text-primary">{paid} Paid</p><p className="text-[10px] text-muted-foreground">{paidPct}%</p></div>
                      <div className="text-center"><p className="text-lg font-bold text-warning">{pending} Pend</p><p className="text-[10px] text-muted-foreground">Pending</p></div>
                      <div className="text-center"><p className="text-lg font-bold text-destructive">{overdue} Over</p><p className="text-[10px] text-muted-foreground">Overdue</p></div>
                    </div>

                    {/* Batches */}
                    {sport.batches.map(batch => {
                      const filteredStudents = filterStudents(batch.students, batch);
                      if (batchFilter !== "all" && `${batch.startTime}-${batch.endTime}` !== batchFilter) return null;
                      if (ageFilter !== "all" && batch.ageGroup !== ageFilter) return null;
                      const batchRev = getBatchRevenue(batch);
                      const batchPaid = getBatchPaidCount(batch);
                      const batchPending = getBatchPendingCount(batch);
                      const collected = batchRev;
                      const totalPossible = batch.students.reduce((a, s) => a + s.fee, 0);
                      const pendingAmount = totalPossible - collected;
                      const occupancy = batch.maxStudents ? `${batch.students.length}/${batch.maxStudents}` : `${batch.students.length}`;
                      const occupancyPct = batch.maxStudents ? (batch.students.length / batch.maxStudents) * 100 : 0;
                      const occColor = occupancyPct > 95 ? "text-destructive" : occupancyPct > 80 ? "text-warning" : "text-primary";

                      return (
                        <div key={batch.id} className="border-t border-border">
                          <div className="p-4 bg-secondary/10">
                            <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                              <span>⏰ {batch.startTime} - {batch.endTime}</span>
                              <Badge variant="outline">{batch.ageGroup === "kids" ? "👶 KIDS" : "👨 ADULTS"}</Badge>
                              <Badge variant={batch.batchType === "premium" ? "default" : "secondary"}>
                                {batch.batchType === "premium" ? "⭐ PREMIUM" : "STANDARD"}
                              </Badge>
                              <span className={`text-xs ${occColor}`}>({occupancy} students)</span>
                            </div>
                            <div className="mt-1 text-xs text-muted-foreground">
                              {batch.students.length} students | {batchPaid} paid, {batchPending} pending | Revenue: {formatCurrencyFull(batchRev)}
                            </div>
                          </div>

                          {/* Student Table */}
                          <div className="overflow-x-auto scrollbar-hide">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-border bg-secondary/20 text-xs text-muted-foreground">
                                  <th className="p-2 text-left w-8">
                                    <Checkbox checked={filteredStudents.length > 0 && filteredStudents.every(s => selectedStudents.has(s.id))} onCheckedChange={() => toggleSelectAll(filteredStudents)} />
                                  </th>
                                  <th className="p-2 text-left">Name</th>
                                  <th className="p-2 text-left hidden sm:table-cell">Parent</th>
                                  <th className="p-2 text-left hidden md:table-cell">Phone</th>
                                  <th className="p-2 text-right">Fee</th>
                                  <th className="p-2 text-center">Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {filteredStudents.map(student => (
                                  <tr key={student.id} className="border-b border-border/50 hover:bg-accent/5 cursor-pointer transition-colors" onClick={() => navigate(`/students/${student.id}`)}>
                                    <td className="p-2" onClick={e => e.stopPropagation()}>
                                      <Checkbox checked={selectedStudents.has(student.id)} onCheckedChange={() => {
                                        setSelectedStudents(prev => {
                                          const n = new Set(prev);
                                          n.has(student.id) ? n.delete(student.id) : n.add(student.id);
                                          return n;
                                        });
                                      }} />
                                    </td>
                                    <td className="p-2 font-medium">{student.name}</td>
                                    <td className="p-2 text-muted-foreground hidden sm:table-cell">{student.parentName}</td>
                                    <td className="p-2 hidden md:table-cell">
                                      <div className="flex items-center gap-2">
                                        <a href={`tel:+91${student.phone}`} className="text-primary hover:underline" onClick={e => e.stopPropagation()}>
                                          {student.phone}
                                        </a>
                                        <a href={`https://wa.me/91${student.phone}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80" onClick={e => e.stopPropagation()} title="WhatsApp">
                                          <MessageCircle className="h-3 w-3" />
                                        </a>
                                      </div>
                                    </td>
                                    <td className="p-2 text-right">{formatCurrencyFull(student.fee)}</td>
                                    <td className="p-2 text-center">
                                      <Badge variant={student.feeStatus === "paid" ? "default" : student.feeStatus === "pending" ? "secondary" : "destructive"} className="text-[10px]">
                                        {student.feeStatus === "paid" ? "✅ Paid" : student.feeStatus === "pending" ? "⚠️ Due" : "🔴 Overdue"}
                                      </Badge>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {/* Batch footer */}
                          <div className="px-4 py-2 bg-secondary/10 flex flex-wrap justify-between items-center text-xs text-muted-foreground border-t border-border/50">
                            <span>Batch Total: {formatCurrencyFull(totalPossible)} | Collected: {formatCurrencyFull(collected)} | Pending: {formatCurrencyFull(pendingAmount)}</span>
                            <Button size="sm" variant="ghost" className="gap-1 text-xs h-7" onClick={() => openAddStudent(sport, batch)}>
                              <Plus className="h-3 w-3" /> Add Student to This Batch
                            </Button>
                          </div>
                        </div>
                      );
                    })}

                    {/* Bulk actions */}
                    {selectedStudents.size > 0 && (
                      <div className="p-3 bg-primary/5 border-t border-border flex items-center gap-3 flex-wrap">
                        <span className="text-sm">{selectedStudents.size} selected</span>
                        <Button size="sm" variant="outline" onClick={() => toast({ title: `Reminder sent to ${selectedStudents.size} students` })}>
                          Send Reminder to Selected ({selectedStudents.size})
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => { toast({ title: `Marked ${selectedStudents.size} as paid` }); setSelectedStudents(new Set()); }}>
                          Mark All as Paid
                        </Button>
                      </div>
                    )}

                    {/* Add batch button */}
                    <div className="p-3 border-t border-border">
                      <Button variant="outline" size="sm" className="gap-1" onClick={() => setAddBatchSport(sport)}>
                        <Plus className="h-3 w-3" /> Add New Batch to This Sport
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Modals */}
      {addStudentOpen && addStudentSport && community && (
        <AddStudentModal
          open={addStudentOpen}
          onClose={() => { setAddStudentOpen(false); setAddStudentSport(null); setAddStudentBatch(null); }}
          community={community}
          sport={addStudentSport}
          batch={addStudentBatch}
        />
      )}

      <AddSportModal
        open={addSportOpen}
        onClose={() => setAddSportOpen(false)}
        communityName={community.name}
      />

      {addBatchSport && (
        <AddBatchModal
          open={!!addBatchSport}
          onClose={() => setAddBatchSport(null)}
          sportName={addBatchSport.name}
          standardFee={addBatchSport.standardFee}
          premiumFee={addBatchSport.premiumFee}
        />
      )}
    </div>
  );
}
