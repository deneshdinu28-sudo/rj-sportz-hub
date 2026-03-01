import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Search, Plus, Clock, Baby, Star, Users, ChevronDown, ChevronUp,
  IndianRupee, Pencil,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import {
  getSportById, getTotalStudents, getTotalRevenue, getBatchRevenue,
  getBatchPaidCount, getBatchPendingCount, type Batch, type Student,
} from "@/data/sportsData";

const feeStatusIcon: Record<Student["feeStatus"], string> = {
  paid: "✅", pending: "⚠️", overdue: "🔴",
};

const SportDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const sport = getSportById(id || "");

  const [search, setSearch] = useState("");
  const [batchFilter, setBatchFilter] = useState("all");
  const [ageFilter, setAgeFilter] = useState("all");
  const [feeFilter, setFeeFilter] = useState("all");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const [addBatchOpen, setAddBatchOpen] = useState(false);
  const [batchForm, setBatchForm] = useState({
    startTime: "05:00 PM", endTime: "06:00 PM", ageGroup: "kids" as "kids" | "adults",
    batchType: "standard" as "standard" | "premium", maxStudents: "",
  });

  const totalStudents = sport ? getTotalStudents(sport) : 0;
  const totalRevenue = sport ? getTotalRevenue(sport) : 0;

  const filteredBatches = useMemo(() => {
    if (!sport) return [];
    return sport.batches.filter((b) => {
      if (batchFilter !== "all" && `${b.startTime}-${b.endTime}` !== batchFilter) return false;
      if (ageFilter !== "all" && b.ageGroup !== ageFilter) return false;
      return true;
    });
  }, [sport, batchFilter, ageFilter]);

  if (!sport) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate("/sports")} className="gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Sports
        </Button>
        <p className="text-center text-muted-foreground py-20">Sport not found.</p>
      </div>
    );
  }

  const filterStudents = (students: Student[]) => {
    return students.filter((s) => {
      const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.parentName.toLowerCase().includes(search.toLowerCase());
      const matchFee = feeFilter === "all" || s.feeStatus === feeFilter;
      return matchSearch && matchFee;
    });
  };

  const toggleExpand = (batchId: string) => {
    setExpanded((prev) => ({ ...prev, [batchId]: !prev[batchId] }));
  };

  const handleAddBatch = () => {
    toast({ title: "Batch Added", description: `${batchForm.startTime} - ${batchForm.endTime} batch created.` });
    setAddBatchOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button variant="ghost" onClick={() => navigate("/sports")} className="gap-2 text-muted-foreground hover:text-foreground -ml-2">
        <ArrowLeft className="h-4 w-4" /> Back to Sports
      </Button>

      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold">
          {sport.icon} {sport.name} at {sport.community}
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setAddBatchOpen(true)} className="gap-1">
            <Plus className="h-4 w-4" /> Add Batch
          </Button>
          <Button size="sm" className="gap-1 neon-glow">
            <Pencil className="h-4 w-4" /> Edit Sport
          </Button>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Community", value: sport.community },
          { label: "Coach", value: sport.coach, clickable: true },
          { label: "Std Fee", value: `₹${sport.standardFee.toLocaleString()}` },
          { label: "Prem Fee", value: `₹${sport.premiumFee.toLocaleString()}` },
          { label: "Students", value: String(totalStudents) },
          { label: "Revenue", value: `₹${totalRevenue.toLocaleString()}`, accent: true },
        ].map((item) => (
          <Card key={item.label} className="bg-card border-border">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
              <p className={`font-semibold text-sm truncate ${item.accent ? "text-primary neon-text" : ""} ${item.clickable ? "text-primary cursor-pointer hover:underline" : ""}`}
                onClick={item.clickable ? () => navigate(`/coaches/${sport.coachId}`) : undefined}
              >
                {item.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search students..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-secondary border-border" />
        </div>
        <Select value={batchFilter} onValueChange={setBatchFilter}>
          <SelectTrigger className="w-full sm:w-[180px] bg-secondary border-border">
            <SelectValue placeholder="All Batches" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Batches</SelectItem>
            {sport.batches.map((b) => (
              <SelectItem key={b.id} value={`${b.startTime}-${b.endTime}`}>{b.startTime} - {b.endTime}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={ageFilter} onValueChange={setAgeFilter}>
          <SelectTrigger className="w-full sm:w-[140px] bg-secondary border-border">
            <SelectValue placeholder="Age Group" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Ages</SelectItem>
            <SelectItem value="kids">Kids</SelectItem>
            <SelectItem value="adults">Adults</SelectItem>
          </SelectContent>
        </Select>
        <Select value={feeFilter} onValueChange={setFeeFilter}>
          <SelectTrigger className="w-full sm:w-[140px] bg-secondary border-border">
            <SelectValue placeholder="Fee Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Batch Cards */}
      <div className="space-y-4">
        {filteredBatches.map((batch) => {
          const isOpen = expanded[batch.id] || false;
          const students = filterStudents(batch.students);
          const paid = getBatchPaidCount(batch);
          const pending = getBatchPendingCount(batch);
          const revenue = getBatchRevenue(batch);

          return (
            <Card key={batch.id} className="bg-card border-border overflow-hidden transition-all">
              {/* Batch Header */}
              <button
                className="w-full text-left p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 hover:bg-secondary/40 transition-colors"
                onClick={() => toggleExpand(batch.id)}
              >
                <div className="flex items-center gap-3 flex-wrap flex-1">
                  <Badge variant="outline" className="gap-1 border-border">
                    <Clock className="h-3 w-3" /> {batch.startTime} - {batch.endTime}
                  </Badge>
                  <Badge variant="outline" className="gap-1 border-border">
                    <Baby className="h-3 w-3" /> {batch.ageGroup.toUpperCase()}
                  </Badge>
                  <Badge className={batch.batchType === "premium" ? "bg-primary/20 text-primary border-primary/30" : "bg-secondary text-foreground"}>
                    {batch.batchType === "premium" && <Star className="h-3 w-3 mr-1" />}
                    {batch.batchType.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {batch.students.length} students</span>
                  <span>{paid} paid, {pending} pending</span>
                  <span className="text-primary font-semibold flex items-center gap-0.5">
                    <IndianRupee className="h-3 w-3" />{revenue.toLocaleString()}
                  </span>
                  {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {/* Expanded Students */}
              {isOpen && (
                <div className="border-t border-border">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent border-border">
                          <TableHead>Name</TableHead>
                          <TableHead className="hidden sm:table-cell">Parent</TableHead>
                          <TableHead className="hidden sm:table-cell">Phone</TableHead>
                          <TableHead className="text-center">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {students.map((st) => (
                          <TableRow
                            key={st.id}
                            className="cursor-pointer border-border hover:bg-secondary/40 transition-colors"
                            onClick={() => navigate(`/students/${st.id}`)}
                          >
                            <TableCell className="font-medium">{st.name}</TableCell>
                            <TableCell className="hidden sm:table-cell text-muted-foreground">{st.parentName}</TableCell>
                            <TableCell className="hidden sm:table-cell text-muted-foreground">{st.phone}</TableCell>
                            <TableCell className="text-center">{feeStatusIcon[st.feeStatus]}</TableCell>
                          </TableRow>
                        ))}
                        {students.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">No students match filters.</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="p-3 border-t border-border">
                    <Button variant="outline" size="sm" className="gap-1 w-full sm:w-auto">
                      <Plus className="h-3 w-3" /> Add Student to This Batch
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
        {filteredBatches.length === 0 && (
          <p className="text-center text-muted-foreground py-12">No batches match your filters.</p>
        )}
      </div>

      {/* Add Batch Modal */}
      <Dialog open={addBatchOpen} onOpenChange={setAddBatchOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Add New Batch</DialogTitle>
            <DialogDescription>Create a new batch for {sport.name}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input value={batchForm.startTime} onChange={(e) => setBatchForm({ ...batchForm, startTime: e.target.value })} className="bg-secondary border-border" />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input value={batchForm.endTime} onChange={(e) => setBatchForm({ ...batchForm, endTime: e.target.value })} className="bg-secondary border-border" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Age Group</Label>
              <RadioGroup value={batchForm.ageGroup} onValueChange={(v) => setBatchForm({ ...batchForm, ageGroup: v as "kids" | "adults" })} className="flex gap-4">
                <div className="flex items-center gap-2"><RadioGroupItem value="kids" id="age-kids" /><Label htmlFor="age-kids">Kids</Label></div>
                <div className="flex items-center gap-2"><RadioGroupItem value="adults" id="age-adults" /><Label htmlFor="age-adults">Adults</Label></div>
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <Label>Batch Type</Label>
              <RadioGroup value={batchForm.batchType} onValueChange={(v) => setBatchForm({ ...batchForm, batchType: v as "standard" | "premium" })} className="flex gap-4">
                <div className="flex items-center gap-2"><RadioGroupItem value="standard" id="type-std" /><Label htmlFor="type-std">Standard</Label></div>
                <div className="flex items-center gap-2"><RadioGroupItem value="premium" id="type-prem" /><Label htmlFor="type-prem">Premium</Label></div>
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <Label>Max Students (optional)</Label>
              <Input type="number" value={batchForm.maxStudents} onChange={(e) => setBatchForm({ ...batchForm, maxStudents: e.target.value })} placeholder="15" className="bg-secondary border-border" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddBatchOpen(false)}>Cancel</Button>
            <Button onClick={handleAddBatch} className="neon-glow">Save Batch</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SportDetail;
