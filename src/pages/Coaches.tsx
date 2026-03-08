import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Plus, MoreVertical, Phone, Mail, MapPin, Trophy, Loader2, UserPlus, Edit2, Trash2, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useGlobalSports, useCommunities, useSports } from "@/hooks/useSupabaseData";
import { useToast } from "@/hooks/use-toast";

interface Coach {
  id: string;
  coach_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  sport_name: string;
  sport_shortcode: string;
  coach_number: number;
  is_active: boolean;
  created_at: string;
  assignments?: Array<{ id: string; community_id: string; sport_id: string }>;
}

interface Shortcode {
  id: string;
  sport_name: string;
  shortcode: string;
}

export default function Coaches() {
  const { toast } = useToast();
  const { data: globalSports = [] } = useGlobalSports();
  const { data: communities = [] } = useCommunities();
  const { data: allSports = [] } = useSports();

  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [shortcodes, setShortcodes] = useState<Shortcode[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [shortcodesOpen, setShortcodesOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "", phone: "", email: "", sport_name: "",
  });

  const [assignForm, setAssignForm] = useState({ community_id: "", sport_id: "" });

  useEffect(() => { loadCoaches(); loadShortcodes(); }, []);

  const loadCoaches = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("coaches")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) {
      // Load assignments for each coach
      const enriched = await Promise.all(
        data.map(async (coach) => {
          const { data: assignments } = await supabase
            .from("coach_assignments")
            .select("*")
            .eq("coach_id", coach.id);
          return { ...coach, assignments: assignments || [] };
        })
      );
      setCoaches(enriched as Coach[]);
    }
    setLoading(false);
  };

  const loadShortcodes = async () => {
    const { data } = await supabase.from("sport_shortcodes").select("*").order("sport_name");
    if (data) setShortcodes(data);
  };

  const generateCoachId = async (sportName: string): Promise<string> => {
    const sc = shortcodes.find((s) => s.sport_name === sportName);
    const shortcode = sc?.shortcode || sportName.slice(0, 3).toUpperCase();
    const { count } = await supabase
      .from("coaches")
      .select("*", { count: "exact", head: true })
      .eq("sport_name", sportName);
    const num = (count || 0) + 1;
    return `RJ${shortcode}${String(num).padStart(3, "0")}`;
  };

  const handleCreate = async () => {
    if (!form.name || !form.sport_name) return;
    setSaving(true);
    try {
      const coachId = await generateCoachId(form.sport_name);
      const sc = shortcodes.find((s) => s.sport_name === form.sport_name);
      const { count } = await supabase.from("coaches").select("*", { count: "exact", head: true }).eq("sport_name", form.sport_name);

      const { error } = await supabase.from("coaches").insert({
        coach_id: coachId,
        name: form.name,
        phone: form.phone || null,
        email: form.email || null,
        sport_name: form.sport_name,
        sport_shortcode: sc?.shortcode || form.sport_name.slice(0, 3).toUpperCase(),
        coach_number: (count || 0) + 1,
      });

      if (error) throw error;
      toast({ title: `Coach ${coachId} created!` });
      setAddOpen(false);
      setForm({ name: "", phone: "", email: "", sport_name: "" });
      loadCoaches();
    } catch (err: any) {
      toast({ title: "Failed to create coach", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (coach: Coach) => {
    if (!confirm(`Delete coach ${coach.name} (${coach.coach_id})?`)) return;
    await supabase.from("coaches").delete().eq("id", coach.id);
    toast({ title: "Coach deleted", variant: "destructive" });
    loadCoaches();
  };

  const handleToggleActive = async (coach: Coach) => {
    await supabase.from("coaches").update({ is_active: !coach.is_active }).eq("id", coach.id);
    toast({ title: coach.is_active ? "Coach deactivated" : "Coach activated" });
    loadCoaches();
  };

  const openAssign = (coach: Coach) => {
    setSelectedCoach(coach);
    setAssignForm({ community_id: "", sport_id: "" });
    setAssignOpen(true);
  };

  const handleAssign = async () => {
    if (!selectedCoach || !assignForm.community_id || !assignForm.sport_id) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("coach_assignments").insert({
        coach_id: selectedCoach.id,
        community_id: assignForm.community_id,
        sport_id: assignForm.sport_id,
      });
      if (error) throw error;
      toast({ title: "Coach assigned!" });
      setAssignOpen(false);
      loadCoaches();
    } catch (err: any) {
      toast({ title: "Failed to assign", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
    await supabase.from("coach_assignments").delete().eq("id", assignmentId);
    toast({ title: "Assignment removed" });
    loadCoaches();
  };

  const handleUpdateShortcode = async (id: string, newCode: string) => {
    await supabase.from("sport_shortcodes").update({ shortcode: newCode.toUpperCase() }).eq("id", id);
    loadShortcodes();
  };

  const assignSports = useMemo(() => {
    if (!assignForm.community_id) return [];
    return allSports.filter((s) => s.community_id === assignForm.community_id);
  }, [assignForm.community_id, allSports]);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Coaches Management</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-3xl font-bold">Coaches Management</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShortcodesOpen(true)} className="gap-1">
            <Edit2 className="h-4 w-4" /> Sport Shortcodes
          </Button>
          <Button onClick={() => setAddOpen(true)} className="gap-1">
            <Plus className="h-4 w-4" /> Add Coach
          </Button>
        </div>
      </div>

      {coaches.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium text-lg">No coaches added yet</p>
          <p className="text-sm mt-1">Add coaches and assign them to communities</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {coaches.map((coach) => (
            <Card key={coach.id} className={!coach.is_active ? "opacity-60" : ""}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-lg">{coach.name}</h3>
                    <code className="text-primary text-sm">{coach.coach_id}</code>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openAssign(coach)}>
                        <UserPlus className="h-4 w-4 mr-2" /> Assign to Community
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleActive(coach)}>
                        <Shield className="h-4 w-4 mr-2" /> {coach.is_active ? "Deactivate" : "Activate"}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleDelete(coach)} className="text-destructive">
                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Trophy className="h-3.5 w-3.5" /> {coach.sport_name}
                  </div>
                  {coach.phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-3.5 w-3.5" /> {coach.phone}
                    </div>
                  )}
                  {coach.email && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-3.5 w-3.5" /> {coach.email}
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-2">Assignments:</p>
                  {coach.assignments && coach.assignments.length > 0 ? (
                    <div className="space-y-1">
                      {coach.assignments.map((a) => {
                        const comm = communities.find((c) => c.id === a.community_id);
                        const sport = allSports.find((s) => s.id === a.sport_id);
                        return (
                          <div key={a.id} className="flex items-center justify-between text-xs">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              {comm?.name} — {sport?.icon} {sport?.name}
                            </span>
                            <button onClick={() => handleRemoveAssignment(a.id)} className="text-destructive hover:underline text-[10px]">Remove</button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">No assignments</p>
                  )}
                </div>

                <div className="mt-3">
                  <Badge variant={coach.is_active ? "default" : "secondary"}>
                    {coach.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Coach Modal */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Add New Coach</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Coach name" /></div>
            <div>
              <Label>Sport *</Label>
              <Select value={form.sport_name} onValueChange={(v) => setForm((f) => ({ ...f, sport_name: v }))}>
                <SelectTrigger><SelectValue placeholder="Select sport" /></SelectTrigger>
                <SelectContent>
                  {globalSports.map((s) => (
                    <SelectItem key={s.id} value={s.name}>{s.icon} {s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {form.sport_name && (
              <div className="bg-muted/50 p-3 rounded-lg text-sm">
                <p className="text-muted-foreground">Generated Coach ID:</p>
                <p className="font-bold text-primary text-lg">
                  RJ{shortcodes.find((s) => s.sport_name === form.sport_name)?.shortcode || form.sport_name.slice(0, 3).toUpperCase()}
                  {String(coaches.filter((c) => c.sport_name === form.sport_name).length + 1).padStart(3, "0")}
                </p>
              </div>
            )}
            <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+91 9876543210" /></div>
            <div><Label>Email</Label><Input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="coach@email.com" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving || !form.name || !form.sport_name}>
              {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Creating...</> : "Create Coach →"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Coach Modal */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Assign {selectedCoach?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Community</Label>
              <Select value={assignForm.community_id} onValueChange={(v) => setAssignForm((f) => ({ ...f, community_id: v, sport_id: "" }))}>
                <SelectTrigger><SelectValue placeholder="Select community" /></SelectTrigger>
                <SelectContent>
                  {communities.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Sport</Label>
              <Select value={assignForm.sport_id} onValueChange={(v) => setAssignForm((f) => ({ ...f, sport_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select sport" /></SelectTrigger>
                <SelectContent>
                  {assignSports.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.icon} {s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>Cancel</Button>
            <Button onClick={handleAssign} disabled={saving || !assignForm.community_id || !assignForm.sport_id}>
              {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Assigning...</> : "Assign →"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sport Shortcodes Modal */}
      <Dialog open={shortcodesOpen} onOpenChange={setShortcodesOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Sport Shortcodes</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">These codes are used to generate Coach IDs (e.g., RJBDM001)</p>
          <div className="space-y-2 max-h-[400px] overflow-auto">
            {shortcodes.map((sc) => (
              <div key={sc.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                <span className="text-sm flex-1">{sc.sport_name}</span>
                <Input
                  className="w-20 text-center font-mono text-sm"
                  value={sc.shortcode}
                  onChange={(e) => {
                    setShortcodes((prev) => prev.map((s) => s.id === sc.id ? { ...s, shortcode: e.target.value } : s));
                  }}
                  onBlur={(e) => handleUpdateShortcode(sc.id, e.target.value)}
                  maxLength={5}
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={() => setShortcodesOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
