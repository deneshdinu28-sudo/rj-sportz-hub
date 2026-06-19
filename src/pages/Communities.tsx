import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Building2, Users, Trophy, IndianRupee, Filter, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useCommunities, useStudents, usePayments, useSports, useGlobalSports, useCreateCommunity, useDeleteCommunity, useCoaches, formatCurrency, formatCurrencyFull } from "@/hooks/useSupabaseData";
import { Lock, X, MessageSquare, AlertTriangle } from "lucide-react";

import SportPricingFields, { defaultPricingConfig, type PricingConfig } from "@/components/SportPricingFields";

interface SportPricingEntry {
  sportName: string;
  sportIcon: string;
  coach_name: string;
  coach_phone: string;
  coach_ids: string[];
  pricing: PricingConfig;
}

export default function Communities() {
  const navigate = useNavigate();
  const { data: communities = [], isLoading } = useCommunities();
  const { data: students = [] } = useStudents();
  const { data: payments = [] } = usePayments();
  const { data: sports = [] } = useSports();
  const { data: globalSports = [] } = useGlobalSports();
  const createCommunity = useCreateCommunity();
  const deleteCommunityMut = useDeleteCommunity();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [deleteCommunityId, setDeleteCommunityId] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ name: "", short_code: "", address: "", contact_person: "", contact_phone: "" });
  const [sportPricings, setSportPricings] = useState<SportPricingEntry[]>([]);
  const [addSportPricingOpen, setAddSportPricingOpen] = useState(false);
  const [newSportPricing, setNewSportPricing] = useState<SportPricingEntry>({
    sportName: "", sportIcon: "", coach_name: "", coach_phone: "", coach_ids: [],
    pricing: defaultPricingConfig(),
  });
  const [isCustomSport, setIsCustomSport] = useState(false);
  const [customSportName, setCustomSportName] = useState("");
  const [customSportIcon, setCustomSportIcon] = useState("🏅");
  const { data: coachesForSport = [], isLoading: coachesLoading } = useCoaches(newSportPricing.sportName || undefined);

  const globalStats = useMemo(() => ({
    communities: communities.length,
    sports: sports.length,
    students: students.length,
    revenue: payments.reduce((s, p) => s + Number(p.amount), 0),
  }), [communities, sports, students, payments]);

  const filtered = useMemo(() => {
    let list = communities;
    if (statusFilter !== "all") list = list.filter((c) => c.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(q) || c.short_code.toLowerCase().includes(q) || c.address.toLowerCase().includes(q));
    }
    return list;
  }, [communities, search, statusFilter]);

  const getCommStats = (c: typeof communities[0]) => {
    const commStudents = students.filter((s) => s.community_id === c.id);
    const commSports = sports.filter((s) => s.community_id === c.id);
    const commPayments = payments.filter((p) => commStudents.some((s) => s.id === p.student_id));
    const revenue = commPayments.reduce((s, p) => s + Number(p.amount), 0);
    const paidPct = commStudents.length ? (commStudents.filter((s) => s.fee_status === "paid").length / commStudents.length) * 100 : 0;
    return { studentCount: commStudents.length, sportCount: commSports.length, revenue, paidPct };
  };

  const handleNameChange = (name: string) => {
    const code = name.replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase();
    setFormData((p) => ({ ...p, name, short_code: code }));
  };

  const openAddCommunity = () => {
    setFormData({ name: "", short_code: "", address: "", contact_person: "", contact_phone: "" });
    setSportPricings([]);
    setStep(1);
    setAddOpen(true);
  };

  const handleAddSportPricing = () => {
    const entry: SportPricingEntry = isCustomSport
      ? { ...newSportPricing, sportName: customSportName, sportIcon: customSportIcon }
      : { ...newSportPricing };
    setSportPricings((prev) => [...prev, entry]);
    setAddSportPricingOpen(false);
    setIsCustomSport(false);
    setNewSportPricing({
      sportName: "", sportIcon: "", coach_name: "", coach_phone: "", coach_ids: [],
      pricing: defaultPricingConfig(),
    });
  };

  const handleRemoveSportPricing = (idx: number) => {
    setSportPricings((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    if (sportPricings.length === 0) return;
    await createCommunity.mutateAsync({
      name: formData.name,
      short_code: formData.short_code,
      address: formData.address,
      contact_person: formData.contact_person,
      contact_phone: formData.contact_phone,
      sports: sportPricings.map((sp) => ({
        sportName: sp.sportName,
        sportIcon: sp.sportIcon,
        coach_name: sp.coach_name,
        coach_phone: sp.coach_phone,
        coach_ids: sp.coach_ids,
        pricing_type: sp.pricing.pricing_type,
        renewal_trigger: sp.pricing.pricing_type === "custom_monthly" ? "session_based" : sp.pricing.renewal_trigger,
        standard_1month: Number(sp.pricing.standard_1month) || 0,
        standard_3months: Number(sp.pricing.standard_3months) || 0,
        standard_6months: Number(sp.pricing.standard_6months) || 0,
        premium_1month: Number(sp.pricing.premium_1month) || 0,
        premium_3months: Number(sp.pricing.premium_3months) || 0,
        premium_6months: Number(sp.pricing.premium_6months) || 0,
        sessions_per_month: sp.pricing.pricing_type === "duration_based" && sp.pricing.renewal_trigger === "session_based"
          ? Number(sp.pricing.sessions_per_month) || null : null,
        custom_monthly_price: sp.pricing.pricing_type === "custom_monthly" ? Number(sp.pricing.custom_monthly_price) || null : null,
        custom_monthly_sessions: sp.pricing.pricing_type === "custom_monthly" ? Number(sp.pricing.custom_monthly_sessions) || null : null,
        packs: sp.pricing.pricing_type === "session_pack"
          ? sp.pricing.packs.filter((p) => p.pack_name && p.session_count).map((p) => ({
              pack_name: p.pack_name,
              session_count: Number(p.session_count) || 0,
              standard_price: Number(p.standard_price) || 0,
              premium_price: p.premium_price ? Number(p.premium_price) : null,
            }))
          : undefined,
      })),
    });
    setAddOpen(false);
  };

  const handleDelete = async () => {
    if (!deleteCommunityId) return;
    await deleteCommunityMut.mutateAsync(deleteCommunityId);
    setDeleteCommunityId(null);
  };

  const availableSports = globalSports.filter((gs) => !sportPricings.some((sp) => sp.sportName === gs.name));
  const deleteCommunityData = communities.find((c) => c.id === deleteCommunityId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Communities Management</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Communities Management</h1>
          <p className="text-muted-foreground text-sm">Manage all communities, sports, and students</p>
        </div>
        <Button onClick={openAddCommunity} className="gap-2"><Plus className="h-4 w-4" /> Add Community</Button>
      </div>

      {/* Global Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: <Building2 className="h-5 w-5 text-primary" />, value: globalStats.communities, label: "Communities" },
          { icon: <Trophy className="h-5 w-5 text-primary" />, value: globalStats.sports, label: "Sports" },
          { icon: <Users className="h-5 w-5 text-primary" />, value: globalStats.students, label: "Students" },
          { icon: <IndianRupee className="h-5 w-5 text-primary" />, value: formatCurrency(globalStats.revenue), label: "Total Revenue" },
        ].map((s, i) => (
          <Card key={i}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">{s.icon}</div>
              <div><p className="text-2xl font-bold">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search communities..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]"><Filter className="h-4 w-4 mr-2" /><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Community Cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-medium text-muted-foreground">No communities found</p>
          <p className="text-sm text-muted-foreground mt-1">Create your first community to get started</p>
          <Button onClick={openAddCommunity} className="mt-4 gap-2"><Plus className="h-4 w-4" /> Add Community</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((c) => {
            const cs = getCommStats(c);
            const health = cs.paidPct >= 90 ? "🟢" : cs.paidPct >= 70 ? "🟡" : "🔴";
            return (
              <Card key={c.id} onClick={() => navigate(`/communities/${c.id}`)} className="cursor-pointer hover:border-primary/50 transition-all duration-200 hover:shadow-[0_0_15px_hsl(110_100%_55%/0.1)] group">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-primary" />
                        <h3 className="font-bold text-lg group-hover:text-primary transition-colors">{c.name}</h3>
                        <span>{health}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">{c.short_code} • {c.address}</p>
                    </div>
                    <Badge variant={c.status === "active" ? "default" : "secondary"}>{c.status}</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { val: `👥 ${cs.studentCount}`, label: "Students" },
                      { val: `🏐 ${cs.sportCount}`, label: "Sports" },
                      { val: `💰 ${formatCurrency(cs.revenue)}`, label: "Revenue" },
                    ].map((s, i) => (
                      <div key={i} className="text-center p-2 rounded-lg bg-secondary/50">
                        <p className="font-semibold text-sm">{s.val}</p>
                        <p className="text-[10px] text-muted-foreground">{s.label}</p>
                      </div>
                    ))}
                  </div>
                  <Button variant="ghost" size="sm" className="w-full">View Details →</Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Community Modal - Step 1 */}
      <Dialog open={addOpen && step === 1} onOpenChange={(v) => { if (!v) setAddOpen(false); }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-auto">
          <DialogHeader><DialogTitle>Add New Community — Step 1/2</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Community Name *</Label><Input value={formData.name} onChange={(e) => handleNameChange(e.target.value)} placeholder="e.g. Waterford Apartments" /></div>
            <div><Label>Short Code * (Auto-generated, editable)</Label><Input value={formData.short_code} onChange={(e) => setFormData((p) => ({ ...p, short_code: e.target.value.toUpperCase().slice(0, 10) }))} placeholder="WTF" maxLength={10} /></div>
            <div><Label>Address *</Label><Input value={formData.address} onChange={(e) => setFormData((p) => ({ ...p, address: e.target.value }))} placeholder="HSR Layout, Bangalore" /></div>
            <div><Label>Contact Person</Label><Input value={formData.contact_person} onChange={(e) => setFormData((p) => ({ ...p, contact_person: e.target.value }))} placeholder="Mr. Sharma" /></div>
            <div><Label>Contact Phone</Label><Input value={formData.contact_phone} onChange={(e) => setFormData((p) => ({ ...p, contact_phone: e.target.value }))} placeholder="+91 9876543210" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={() => setStep(2)} disabled={!formData.name || !formData.short_code || !formData.address}>Next: Set Pricing →</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Community Modal - Step 2 */}
      <Dialog open={addOpen && step === 2} onOpenChange={(v) => { if (!v) setAddOpen(false); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-auto">
          <DialogHeader><DialogTitle>Set Pricing for {formData.name} ({formData.short_code})</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Add sports and set individual pricing</p>

          <Button variant="outline" onClick={() => { setAddSportPricingOpen(true); setIsCustomSport(false); }} className="gap-2"><Plus className="h-4 w-4" /> Add Sport Pricing</Button>

          <div className="space-y-3">
            {sportPricings.map((sp, idx) => (
              <div key={idx} className="p-4 rounded-lg border border-border bg-card">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold">{sp.sportIcon} {sp.sportName}</h4>
                  <Button variant="ghost" size="sm" onClick={() => handleRemoveSportPricing(idx)} className="text-destructive h-7">×</Button>
                </div>
                <p className="text-xs text-muted-foreground">Coach: {sp.coach_name || "—"}{sp.coach_phone ? ` • ${sp.coach_phone}` : ""}{sp.coach_ids.length > 0 ? ` (${sp.coach_ids.length} assigned)` : ""}</p>
                <div className="text-sm text-muted-foreground space-y-1 mt-1">
                  <p>Standard: 1M ₹{sp.standard_1month} | 3M ₹{sp.standard_3months} | 6M ₹{sp.standard_6months}</p>
                  <p>Premium: 1M ₹{sp.premium_1month} | 3M ₹{sp.premium_3months} | 6M ₹{sp.premium_6months}</p>
                </div>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setStep(1)}>← Back</Button>
            <Button onClick={handleSave} disabled={sportPricings.length === 0 || createCommunity.isPending}>
              {createCommunity.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...</> : "Save Community →"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Sport Pricing Sub-Modal */}
      <Dialog open={addSportPricingOpen} onOpenChange={setAddSportPricingOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-auto">
          <DialogHeader><DialogTitle>Add Sport Pricing</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Select Sport *</Label>
              <Select value={isCustomSport ? "__custom__" : newSportPricing.sportName} onValueChange={(v) => {
                if (v === "__custom__") {
                  setIsCustomSport(true);
                  setNewSportPricing((p) => ({ ...p, sportName: "", sportIcon: "" }));
                } else {
                  setIsCustomSport(false);
                  const gs = globalSports.find((g) => g.name === v);
                  if (gs) setNewSportPricing((p) => ({ ...p, sportName: gs.name, sportIcon: gs.icon || "🏃" }));
                }
              }}>
                <SelectTrigger><SelectValue placeholder="Select sport" /></SelectTrigger>
                <SelectContent>
                  {availableSports.map((gs) => (
                    <SelectItem key={gs.id} value={gs.name}>{gs.icon} {gs.name}</SelectItem>
                  ))}
                  <SelectItem value="__custom__">➕ Add Custom Sport</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isCustomSport && (
              <div className="space-y-3 p-3 rounded-lg border border-border bg-muted/30">
                <div><Label>Custom Sport Name</Label><Input value={customSportName} onChange={(e) => setCustomSportName(e.target.value)} placeholder="Zumba" /></div>
                <div><Label>Icon (emoji)</Label><Input value={customSportIcon} onChange={(e) => setCustomSportIcon(e.target.value)} placeholder="💃" /></div>
              </div>
            )}

            {/* Coach selector — smart dropdown filtered by sport */}
            <div className="space-y-2">
              <Label>Assign Coach(es)</Label>
              {!newSportPricing.sportName && !isCustomSport ? (
                <p className="text-xs text-muted-foreground">Select a sport first to load available coaches.</p>
              ) : isCustomSport ? (
                <p className="text-xs text-muted-foreground">Coaches can be assigned later from the Coaches page for custom sports.</p>
              ) : coachesLoading ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground p-2 rounded-md border border-border">
                  <Loader2 className="h-3 w-3 animate-spin" /> Loading coaches…
                </div>
              ) : coachesForSport.length === 0 ? (
                <div className="flex items-start gap-2 p-3 rounded-md border border-warning/40 bg-warning/10 text-xs">
                  <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-warning">No coaches available for {newSportPricing.sportName}</p>
                    <p className="text-muted-foreground mt-0.5">→ Add a coach first in the Coaches section</p>
                  </div>
                </div>
              ) : (
                <>
                  <Select
                    value=""
                    onValueChange={(coachId) => {
                      const coach = coachesForSport.find((c) => c.id === coachId);
                      if (!coach) return;
                      setNewSportPricing((p) => {
                        if (p.coach_ids.includes(coachId)) return p;
                        const newIds = [...p.coach_ids, coachId];
                        const selected = coachesForSport.filter((c) => newIds.includes(c.id));
                        return {
                          ...p,
                          coach_ids: newIds,
                          coach_name: selected.map((c) => c.name).join(", "),
                          coach_phone: selected.map((c) => c.phone || "").filter(Boolean).join(", "),
                        };
                      });
                    }}
                  >
                    <SelectTrigger><SelectValue placeholder="Select coach to add…" /></SelectTrigger>
                    <SelectContent>
                      {coachesForSport
                        .filter((c) => !newSportPricing.coach_ids.includes(c.id))
                        .map((c) => {
                          const initials = c.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
                          return (
                            <SelectItem key={c.id} value={c.id}>
                              <div className="flex items-center gap-2">
                                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-background border border-primary/40 text-primary text-[10px] font-bold">{initials}</span>
                                <span className="font-medium">{c.name}</span>
                                <span className="text-muted-foreground text-xs">({c.coach_id}) • {c.phone || "—"}</span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      {coachesForSport.filter((c) => !newSportPricing.coach_ids.includes(c.id)).length === 0 && (
                        <div className="px-3 py-2 text-xs text-muted-foreground">All coaches added</div>
                      )}
                    </SelectContent>
                  </Select>

                  {newSportPricing.coach_ids.length > 0 && (
                    <div className="flex flex-wrap gap-2 animate-in fade-in duration-200">
                      {newSportPricing.coach_ids.map((cid) => {
                        const c = coachesForSport.find((x) => x.id === cid);
                        if (!c) return null;
                        return (
                          <div key={cid} className="inline-flex items-center gap-2 px-2 py-1 rounded-full border border-primary/40 bg-primary/10 text-xs">
                            <span className="font-medium">{c.name}</span>
                            <span className="text-muted-foreground">({c.coach_id})</span>
                            <button
                              type="button"
                              onClick={() => setNewSportPricing((p) => {
                                const newIds = p.coach_ids.filter((x) => x !== cid);
                                const selected = coachesForSport.filter((x) => newIds.includes(x.id));
                                return {
                                  ...p,
                                  coach_ids: newIds,
                                  coach_name: selected.map((x) => x.name).join(", "),
                                  coach_phone: selected.map((x) => x.phone || "").filter(Boolean).join(", "),
                                };
                              })}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Auto-filled phone (read-only) */}
                  <div>
                    <Label className="text-xs">Coach Phone (auto-filled)</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                      <Input
                        readOnly
                        value={newSportPricing.coach_phone || ""}
                        placeholder="—"
                        className="pl-8 text-primary font-medium bg-muted/30"
                      />
                      {newSportPricing.coach_ids.some((cid) => coachesForSport.find((c) => c.id === cid)?.phone) && (
                        <MessageSquare className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-primary" />
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="border-t border-border pt-3">
              <p className="text-sm font-semibold mb-3">STANDARD BATCH PRICING</p>
              <div className="grid grid-cols-3 gap-2">
                <div><Label className="text-xs">1 Month</Label><Input type="number" value={newSportPricing.standard_1month} onChange={(e) => setNewSportPricing((p) => ({ ...p, standard_1month: e.target.value }))} /></div>
                <div><Label className="text-xs">3 Months</Label><Input type="number" value={newSportPricing.standard_3months} onChange={(e) => setNewSportPricing((p) => ({ ...p, standard_3months: e.target.value }))} /></div>
                <div><Label className="text-xs">6 Months</Label><Input type="number" value={newSportPricing.standard_6months} onChange={(e) => setNewSportPricing((p) => ({ ...p, standard_6months: e.target.value }))} /></div>
              </div>
            </div>

            <div className="border-t border-border pt-3">
              <p className="text-sm font-semibold mb-3">PREMIUM BATCH PRICING</p>
              <div className="grid grid-cols-3 gap-2">
                <div><Label className="text-xs">1 Month</Label><Input type="number" value={newSportPricing.premium_1month} onChange={(e) => setNewSportPricing((p) => ({ ...p, premium_1month: e.target.value }))} /></div>
                <div><Label className="text-xs">3 Months</Label><Input type="number" value={newSportPricing.premium_3months} onChange={(e) => setNewSportPricing((p) => ({ ...p, premium_3months: e.target.value }))} /></div>
                <div><Label className="text-xs">6 Months</Label><Input type="number" value={newSportPricing.premium_6months} onChange={(e) => setNewSportPricing((p) => ({ ...p, premium_6months: e.target.value }))} /></div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddSportPricingOpen(false)}>Cancel</Button>
            <Button onClick={handleAddSportPricing} disabled={!isCustomSport && !newSportPricing.sportName}>Add →</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteCommunityId} onOpenChange={(v) => { if (!v) setDeleteCommunityId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteCommunityData?.name}?</AlertDialogTitle>
            <AlertDialogDescription>This will remove all sports and students. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
