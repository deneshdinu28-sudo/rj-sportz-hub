import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { User, Database, CreditCard, Bell, Shield, Edit2, Save, Loader2, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useCommunities, useSportPricing } from "@/hooks/useSupabaseData";
import { supabase } from "@/integrations/supabase/client";

export default function Settings() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: communities = [], isLoading } = useCommunities();

  // Profile
  const [profileData, setProfileData] = useState({ first_name: "", last_name: "", phone: "", whatsapp: "" });
  const [savingProfile, setSavingProfile] = useState(false);

  // Sport Shortcodes
  const [shortcodes, setShortcodes] = useState<Array<{ id: string; sport_name: string; shortcode: string }>>([]);
  const [editingShortcodeId, setEditingShortcodeId] = useState<string | null>(null);
  const [editShortcodeValue, setEditShortcodeValue] = useState("");
  const [savingShortcode, setSavingShortcode] = useState(false);

  // Notification settings (local state, can be persisted later)
  const [notifications, setNotifications] = useState({
    paymentReminders: true,
    overdueAlerts: true,
    coachAssignment: true,
    welcomeMessages: false,
  });

  // System
  const [systemInfo, setSystemInfo] = useState({ dbConnected: true, authActive: true });

  useEffect(() => {
    loadProfile();
    loadShortcodes();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
    if (data) {
      setProfileData({
        first_name: data.first_name || "",
        last_name: data.last_name || "",
        phone: data.phone || "",
        whatsapp: data.whatsapp || "",
      });
    }
  };

  const loadShortcodes = async () => {
    const { data } = await supabase.from("sport_shortcodes").select("*").order("sport_name");
    setShortcodes(data || []);
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    try {
      await supabase.from("profiles").update({
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        phone: profileData.phone,
        whatsapp: profileData.whatsapp,
      }).eq("id", user.id);
      toast({ title: "Profile updated!" });
    } catch {
      toast({ title: "Failed to update profile", variant: "destructive" });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveShortcode = async (id: string) => {
    setSavingShortcode(true);
    try {
      await supabase.from("sport_shortcodes").update({ shortcode: editShortcodeValue.toUpperCase() }).eq("id", id);
      toast({ title: "Shortcode updated!" });
      setEditingShortcodeId(null);
      loadShortcodes();
    } catch {
      toast({ title: "Failed to update", variant: "destructive" });
    } finally {
      setSavingShortcode(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Settings</h1>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your account and system preferences</p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="flex-wrap">
          <TabsTrigger value="profile" className="gap-1.5"><User className="h-3.5 w-3.5" /> Profile</TabsTrigger>
          <TabsTrigger value="shortcodes" className="gap-1.5"><Database className="h-3.5 w-3.5" /> Sport Shortcodes</TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1.5"><Bell className="h-3.5 w-3.5" /> Notifications</TabsTrigger>
          <TabsTrigger value="system" className="gap-1.5"><Shield className="h-3.5 w-3.5" /> System</TabsTrigger>
        </TabsList>

        {/* PROFILE TAB */}
        <TabsContent value="profile" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Admin Profile</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>First Name</Label>
                  <Input value={profileData.first_name} onChange={(e) => setProfileData((p) => ({ ...p, first_name: e.target.value }))} />
                </div>
                <div>
                  <Label>Last Name</Label>
                  <Input value={profileData.last_name} onChange={(e) => setProfileData((p) => ({ ...p, last_name: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label>Email</Label>
                <Input value={user?.email ?? ""} disabled />
                <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Phone</Label>
                  <Input value={profileData.phone} onChange={(e) => setProfileData((p) => ({ ...p, phone: e.target.value }))} placeholder="9876543210" />
                </div>
                <div>
                  <Label>WhatsApp</Label>
                  <Input value={profileData.whatsapp} onChange={(e) => setProfileData((p) => ({ ...p, whatsapp: e.target.value }))} placeholder="9876543210" />
                </div>
              </div>
              <Button onClick={handleSaveProfile} disabled={savingProfile} className="gap-2">
                {savingProfile ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : <><Save className="h-4 w-4" /> Save Profile</>}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Change Password</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">⚠️ Admin password is system-controlled. Contact technical support to change.</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SPORT SHORTCODES TAB */}
        <TabsContent value="shortcodes" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sport Shortcodes</CardTitle>
              <p className="text-sm text-muted-foreground">Shortcodes used for Coach ID generation (e.g., RJBDM005)</p>
            </CardHeader>
            <CardContent>
              {shortcodes.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No sport shortcodes configured yet</p>
              ) : (
                <div className="space-y-3">
                  {shortcodes.map((sc) => (
                    <div key={sc.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                      <div>
                        <p className="font-semibold">{sc.sport_name}</p>
                        <p className="text-xs text-muted-foreground">Used in Coach IDs like RJ{sc.shortcode}001</p>
                      </div>
                      {editingShortcodeId === sc.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            className="w-24 h-8 text-sm uppercase"
                            value={editShortcodeValue}
                            onChange={(e) => setEditShortcodeValue(e.target.value.toUpperCase().slice(0, 5))}
                            maxLength={5}
                          />
                          <Button size="sm" variant="default" className="h-8 gap-1" onClick={() => handleSaveShortcode(sc.id)} disabled={savingShortcode}>
                            <Check className="h-3 w-3" /> Save
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8" onClick={() => setEditingShortcodeId(null)}>Cancel</Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="font-mono">{sc.shortcode}</Badge>
                          <Button size="sm" variant="ghost" className="h-8 gap-1" onClick={() => { setEditingShortcodeId(sc.id); setEditShortcodeValue(sc.shortcode); }}>
                            <Edit2 className="h-3 w-3" /> Edit
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* NOTIFICATIONS TAB */}
        <TabsContent value="notifications" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notification Settings</CardTitle>
              <p className="text-sm text-muted-foreground">Configure WhatsApp and system notifications</p>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Payment Reminders</p>
                  <p className="text-xs text-muted-foreground">Send WhatsApp reminders before payment due date</p>
                </div>
                <Switch checked={notifications.paymentReminders} onCheckedChange={(v) => setNotifications((p) => ({ ...p, paymentReminders: v }))} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Overdue Alerts</p>
                  <p className="text-xs text-muted-foreground">Notify parents when payment becomes overdue</p>
                </div>
                <Switch checked={notifications.overdueAlerts} onCheckedChange={(v) => setNotifications((p) => ({ ...p, overdueAlerts: v }))} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Coach Assignment Notifications</p>
                  <p className="text-xs text-muted-foreground">Notify coaches when assigned to new community/sport</p>
                </div>
                <Switch checked={notifications.coachAssignment} onCheckedChange={(v) => setNotifications((p) => ({ ...p, coachAssignment: v }))} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Welcome Messages</p>
                  <p className="text-xs text-muted-foreground">Send welcome WhatsApp to new students</p>
                </div>
                <Switch checked={notifications.welcomeMessages} onCheckedChange={(v) => setNotifications((p) => ({ ...p, welcomeMessages: v }))} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SYSTEM TAB */}
        <TabsContent value="system" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">System Information</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm">Version</span>
                <Badge variant="secondary">2.0.0</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm">Database</span>
                <Badge variant="default" className="gap-1"><Check className="h-3 w-3" /> Connected</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm">Authentication</span>
                <Badge variant="default" className="gap-1"><Check className="h-3 w-3" /> Active</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm">Communities</span>
                <Badge variant="secondary">{communities.length}</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
