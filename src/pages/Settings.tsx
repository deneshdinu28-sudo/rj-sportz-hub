import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { User, Database, CreditCard, Bell, Shield, Edit2, Save, Loader2, Check, MessageSquare, Eye, X, Upload, Trash2, Plug } from "lucide-react";
import IntegrationsTab from "@/components/IntegrationsTab";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useCommunities } from "@/hooks/useSupabaseData";
import { supabase } from "@/integrations/supabase/client";

interface WhatsAppTemplate {
  id: string;
  template_id: string;
  name: string;
  description: string;
  template: string;
  variables: string[];
}

const DEFAULT_TEMPLATES: Omit<WhatsAppTemplate, "id">[] = [
  {
    template_id: "welcome_parent_young_child",
    name: "Welcome — Parent (Young Child, age 3–8)",
    description: "Warm message sent to parent when a young child enrolls",
    template: `🌟 Welcome to RJ Sportz!\n\nDear {parent_name},\n\nLittle {student_name} has been successfully enrolled and we are so excited to have them!\n\n👦 Student: {student_name} ({student_id})\n🏸 Sport: {sport_name}\n🏘️ Community: {community_name}\n⏰ Batch: {batch_type} • {age_group}\n📅 Joining Date: {joining_date}\n\n💰 Monthly Fee: ₹{monthly_fee}\n📆 First Payment Due: {next_due_date}\n\nOur coaches are specially trained to work with young athletes. Please ensure {student_name} comes with:\n✅ Comfortable sportswear\n✅ Water bottle\n✅ Enthusiasm to learn!\n\nWe look forward to nurturing {student_name}'s sporting journey! 🌱\n\nRJ Sportz Team`,
    variables: ["parent_name", "student_name", "student_id", "sport_name", "community_name", "batch_type", "age_group", "joining_date", "monthly_fee", "next_due_date"],
  },
  {
    template_id: "welcome_parent_child",
    name: "Welcome — Parent (Child, age 9–14)",
    description: "Encouraging message sent to parent when a child enrolls",
    template: `🏆 Welcome to RJ Sportz!\n\nDear {parent_name},\n\n{student_name} has been successfully enrolled — exciting times ahead!\n\n👤 Student: {student_name} ({student_id})\n🏸 Sport: {sport_name}\n🏘️ Community: {community_name}\n⏰ Batch: {batch_type} • {age_group}\n📅 Joining Date: {joining_date}\n\n💰 Monthly Fee: ₹{monthly_fee}\n📆 First Payment Due: {next_due_date}\n\n{student_name} is in great hands with our experienced coaches. Regular attendance will help them progress faster!\n\nSee you on the court! 🏸\n\nRJ Sportz Team`,
    variables: ["parent_name", "student_name", "student_id", "sport_name", "community_name", "batch_type", "age_group", "joining_date", "monthly_fee", "next_due_date"],
  },
  {
    template_id: "welcome_parent_teen",
    name: "Welcome — Parent (Teen, age 15–17)",
    description: "Motivating message sent to parent when a teen enrolls",
    template: `🔥 Welcome to RJ Sportz!\n\nDear {parent_name},\n\nGreat news! {student_name} has joined the RJ Sportz family.\n\n👤 Student: {student_name} ({student_id})\n🏸 Sport: {sport_name}\n🏘️ Community: {community_name}\n⏰ Batch: {batch_type} • {age_group}\n📅 Joining Date: {joining_date}\n\n💰 Monthly Fee: ₹{monthly_fee}\n📆 First Payment Due: {next_due_date}\n\nAt this age consistency is key — encourage {student_name} to attend regularly and push their limits!\n\nLet's build champions together! 💪\n\nRJ Sportz Team`,
    variables: ["parent_name", "student_name", "student_id", "sport_name", "community_name", "batch_type", "age_group", "joining_date", "monthly_fee", "next_due_date"],
  },
  {
    template_id: "welcome_parent_adult",
    name: "Welcome — Parent/Guardian (Adult, 18+)",
    description: "Professional message sent to parent/guardian for adult students",
    template: `🏆 Welcome to RJ Sportz!\n\nDear {parent_name},\n\n{student_name} has been successfully enrolled. We're glad to have them!\n\n👤 Student: {student_name} ({student_id})\n🏸 Sport: {sport_name}\n🏘️ Community: {community_name}\n⏰ Batch: {batch_type} • {age_group}\n📅 Joining Date: {joining_date}\n\n💰 Monthly Fee: ₹{monthly_fee}\n📆 First Payment Due: {next_due_date}\n\nOur coaches will work closely to help achieve their sporting goals.\n\nWelcome aboard! 🎯\n\nRJ Sportz Team`,
    variables: ["parent_name", "student_name", "student_id", "sport_name", "community_name", "batch_type", "age_group", "joining_date", "monthly_fee", "next_due_date"],
  },
  {
    template_id: "welcome_student_teen",
    name: "Welcome — Student Direct (Teen, age 15–17)",
    description: "Hype message sent directly to teen students who provided WhatsApp",
    template: `🔥 Hey {student_name}! Welcome to RJ Sportz!\n\nYou're officially enrolled and we can't wait to see you in action!\n\n🆔 Your Student ID: {student_id}\n🏸 Sport: {sport_name}\n⏰ Batch: {batch_type} • {age_group}\n📅 First Class: {joining_date}\n\nTrain hard, stay consistent, and let's build something great. See you on the court! 💪\n\n— RJ Sportz Team`,
    variables: ["student_name", "student_id", "sport_name", "batch_type", "age_group", "joining_date"],
  },
  {
    template_id: "welcome_student_adult",
    name: "Welcome — Student Direct (Adult, 18+)",
    description: "Professional message sent directly to adult students who provided WhatsApp",
    template: `🏆 Welcome to RJ Sportz, {student_name}!\n\nYour enrollment is confirmed. Here are your details:\n\n🆔 Student ID: {student_id}\n🏸 Sport: {sport_name}\n🏘️ Community: {community_name}\n⏰ Batch: {batch_type} • {age_group}\n📅 Start Date: {joining_date}\n\n💰 Fee: ₹{monthly_fee}/month\n📆 First Payment Due: {next_due_date}\n\nUse your Student ID {student_id} for all communications with us.\n\nLet's get started! 🎯\n\n— RJ Sportz Team`,
    variables: ["student_name", "student_id", "sport_name", "community_name", "batch_type", "age_group", "joining_date", "monthly_fee", "next_due_date"],
  },
  {
    template_id: "payment_reminder",
    name: "Payment Reminder (Before Due)",
    description: "Sent 2 days before payment due date",
    template: `🔔 Payment Reminder - RJ Sportz\n\nDear {parent_name},\n\nFriendly reminder: Payment due soon!\n\nStudent: {student_name} ({student_id})\nSport: {sport_name}\nAmount Due: ₹{amount_due}\nDue Date: {due_date}\n\nPayment Options:\n💰 1 Month: ₹{price_1m}\n💰 3 Months: ₹{price_3m}\n💰 6 Months: ₹{price_6m}\n\nPay to:\n📱 UPI: {upi_id}\n📱 Phone: {upi_number}\n\nAfter payment, send:\n1. Screenshot\n2. Student ID: {student_id}\n3. Plan chosen (1M/3M/6M)\n\nThank you!\nRJ Sportz Team`,
    variables: ["parent_name", "student_name", "student_id", "sport_name", "amount_due", "due_date", "price_1m", "price_3m", "price_6m", "upi_id", "upi_number"],
  },
  {
    template_id: "overdue_alert",
    name: "Overdue Payment Alert",
    description: "Sent when payment is >5 days overdue",
    template: `⚠️ Urgent: Payment Overdue - RJ Sportz\n\nDear {parent_name},\n\nPayment for {student_name} is overdue.\n\nStudent ID: {student_id}\nSport: {sport_name}\nAmount Due: ₹{amount_due}\nOverdue By: {days_overdue} days\n\nPlease clear the payment at the earliest.\n\nPay to:\n📱 UPI: {upi_id}\n📱 Phone: {upi_number}\n\nRJ Sportz Team`,
    variables: ["parent_name", "student_name", "student_id", "sport_name", "amount_due", "days_overdue", "upi_id", "upi_number"],
  },
  {
    template_id: "payment_confirmation",
    name: "Payment Confirmation",
    description: "Sent after payment is verified",
    template: `✅ Payment Received - RJ Sportz\n\nDear {parent_name},\n\nPayment successfully received!\n\nStudent: {student_name} ({student_id})\nAmount: ₹{amount_paid}\nReceipt No: {receipt_number}\nPlan: {plan_chosen}\n\nValid Period:\nFrom: {period_start}\nTo: {period_end}\n\nNext Due Date: {next_due_date}\n\nThank you!\nRJ Sportz Team`,
    variables: ["parent_name", "student_name", "student_id", "amount_paid", "receipt_number", "plan_chosen", "period_start", "period_end", "next_due_date"],
  },
  {
    template_id: "due_date_extended",
    name: "Due Date Extended",
    description: "Sent when admin extends payment due date",
    template: `🔔 Due Date Extended - RJ Sportz\n\nDear {parent_name},\n\nYour child's payment due date has been extended.\n\nStudent: {student_name} ({student_id})\nSport: {sport_name}\n\nPrevious Due Date: {old_due_date}\nNew Due Date: {new_due_date}\n\nReason:\n{custom_message}\n\nThank you!\nRJ Sportz Team`,
    variables: ["parent_name", "student_name", "student_id", "sport_name", "old_due_date", "new_due_date", "custom_message"],
  },
  {
    template_id: "coach_assignment",
    name: "Coach Assignment Notification",
    description: "Sent when coach is assigned to new community/sport",
    template: `🎉 New Assignment - RJ Sportz\n\nDear {coach_name},\n\nYou have been assigned to a new batch!\n\n📍 Community: {community_name}\n🏐 Sport: {sport_name}\n⏰ Batch: {batch_details}\n\nLogin to your coach portal to view students and mark attendance.\n\nCoach ID: {coach_id}\n\nRJ Sportz Team`,
    variables: ["coach_name", "community_name", "sport_name", "batch_details", "coach_id"],
  },
  {
    template_id: "coach_signup",
    name: "Coach Profile Created",
    description: "Sent when admin creates coach profile",
    template: `🏸 Welcome to RJ Sportz - Coach Portal\n\nDear Coach,\n\nYour coach profile has been created!\n\nCoach ID: {coach_id}\nSport: {sport_name}\n\nNext Steps:\n1. Visit the coach signup page\n2. Enter your Coach ID: {coach_id}\n3. Complete your registration\n\nWelcome to the team!\nRJ Sportz`,
    variables: ["coach_id", "sport_name"],
  },
];

const SAMPLE_DATA: Record<string, string> = {
  parent_name: "Priya Sharma",
  student_name: "Arjun",
  student_id: "WTF101",
  sport_name: "Badminton",
  community_name: "Waterford Apartments",
  batch_type: "Standard",
  age_group: "Kids",
  monthly_fee: "3,000",
  amount_due: "3,000",
  due_date: "25 Mar 2026",
  next_due_date: "25 Mar 2026",
  old_due_date: "15 Mar 2026",
  new_due_date: "25 Mar 2026",
  price_1m: "3,000",
  price_3m: "8,500",
  price_6m: "16,000",
  days_overdue: "7",
  amount_paid: "3,000",
  receipt_number: "REC-2026-001",
  plan_chosen: "1 Month",
  period_start: "15 Mar 2026",
  period_end: "14 Apr 2026",
  coach_name: "Anuj Kumar",
  coach_id: "RJBDM005",
  batch_details: "6:00 AM - 7:00 AM (Standard, Kids)",
  custom_message: "Student on vacation for 10 days",
  upi_id: "rjsportz@paytm",
  upi_number: "9876543210",
};

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

  // Notifications
  const [notifications, setNotifications] = useState({
    paymentReminders: true, overdueAlerts: true, coachAssignment: true, welcomeMessages: false,
  });

  // WhatsApp Templates
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [editTemplateValue, setEditTemplateValue] = useState("");
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<WhatsAppTemplate | null>(null);

  // Payment Settings
  const [paymentSettings, setPaymentSettings] = useState({ upi_id: "", upi_number: "", qr_code_url: "" });
  const [savingPayment, setSavingPayment] = useState(false);
  const [uploadingQR, setUploadingQR] = useState(false);
  const qrInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadProfile();
    loadShortcodes();
    loadTemplates();
    loadPaymentSettings();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
    if (data) {
      setProfileData({ first_name: data.first_name || "", last_name: data.last_name || "", phone: data.phone || "", whatsapp: data.whatsapp || "" });
    }
  };

  const loadShortcodes = async () => {
    const { data } = await supabase.from("sport_shortcodes").select("*").order("sport_name");
    setShortcodes(data || []);
  };

  const loadTemplates = async () => {
    const { data } = await supabase.from("whatsapp_templates").select("*").order("name");
    if (data && data.length > 0) {
      setTemplates(data as WhatsAppTemplate[]);
    } else {
      // Seed defaults
      const inserts = DEFAULT_TEMPLATES.map((t) => supabase.from("whatsapp_templates").insert(t).select());
      const results = await Promise.all(inserts);
      const seeded = results.flatMap((r) => (r.data || []) as WhatsAppTemplate[]);
      setTemplates(seeded.length > 0 ? seeded : (DEFAULT_TEMPLATES.map((t, i) => ({ ...t, id: `local-${i}` })) as WhatsAppTemplate[]));
    }
  };

  const loadPaymentSettings = async () => {
    const { data } = await supabase.from("payment_settings").select("*").limit(1).maybeSingle();
    if (data) {
      setPaymentSettings({ upi_id: data.upi_id || "", upi_number: data.upi_number || "", qr_code_url: data.qr_code_url || "" });
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    try {
      await supabase.from("profiles").update({ first_name: profileData.first_name, last_name: profileData.last_name, phone: profileData.phone, whatsapp: profileData.whatsapp }).eq("id", user.id);
      toast({ title: "Profile updated!" });
    } catch { toast({ title: "Failed to update profile", variant: "destructive" }); }
    finally { setSavingProfile(false); }
  };

  const handleSaveShortcode = async (id: string) => {
    setSavingShortcode(true);
    try {
      await supabase.from("sport_shortcodes").update({ shortcode: editShortcodeValue.toUpperCase() }).eq("id", id);
      toast({ title: "Shortcode updated!" });
      setEditingShortcodeId(null);
      loadShortcodes();
    } catch { toast({ title: "Failed to update", variant: "destructive" }); }
    finally { setSavingShortcode(false); }
  };

  const handleSaveTemplate = async (tpl: WhatsAppTemplate) => {
    setSavingTemplate(true);
    try {
      await supabase.from("whatsapp_templates").update({ template: editTemplateValue }).eq("id", tpl.id);
      toast({ title: "Template updated!" });
      setEditingTemplateId(null);
      setTemplates((prev) => prev.map((t) => (t.id === tpl.id ? { ...t, template: editTemplateValue } : t)));
    } catch { toast({ title: "Failed to update template", variant: "destructive" }); }
    finally { setSavingTemplate(false); }
  };

  const handleSavePaymentSettings = async () => {
    setSavingPayment(true);
    try {
      const { data: existing } = await supabase.from("payment_settings").select("id").limit(1).maybeSingle();
      if (existing) {
        await supabase.from("payment_settings").update({ upi_id: paymentSettings.upi_id, upi_number: paymentSettings.upi_number, qr_code_url: paymentSettings.qr_code_url }).eq("id", existing.id);
      } else {
        await supabase.from("payment_settings").insert({ upi_id: paymentSettings.upi_id, upi_number: paymentSettings.upi_number, qr_code_url: paymentSettings.qr_code_url });
      }
      toast({ title: "Payment settings saved!" });
    } catch { toast({ title: "Failed to save", variant: "destructive" }); }
    finally { setSavingPayment(false); }
  };

  const handleQRUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast({ title: "Please upload an image file", variant: "destructive" }); return; }
    if (file.size > 2 * 1024 * 1024) { toast({ title: "File must be under 2MB", variant: "destructive" }); return; }
    setUploadingQR(true);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `qr-code-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("payment-qr-codes").upload(fileName, file, { cacheControl: "3600", upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("payment-qr-codes").getPublicUrl(fileName);
      setPaymentSettings((p) => ({ ...p, qr_code_url: urlData.publicUrl }));
      toast({ title: "QR Code uploaded!" });
    } catch { toast({ title: "Failed to upload QR code", variant: "destructive" }); }
    finally { setUploadingQR(false); }
  };

  const replaceVars = (text: string) => {
    return text.replace(/\{(\w+)\}/g, (_, key) => SAMPLE_DATA[key] || `{${key}}`);
  };

  if (isLoading) {
    return (<div className="space-y-6"><h1 className="text-3xl font-bold">Settings</h1><Skeleton className="h-64 rounded-xl" /></div>);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your account and system preferences</p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="profile" className="gap-1.5"><User className="h-3.5 w-3.5" /> Profile</TabsTrigger>
          <TabsTrigger value="whatsapp" className="gap-1.5"><MessageSquare className="h-3.5 w-3.5" /> WhatsApp</TabsTrigger>
          <TabsTrigger value="payment-settings" className="gap-1.5"><CreditCard className="h-3.5 w-3.5" /> Payment</TabsTrigger>
          <TabsTrigger value="shortcodes" className="gap-1.5"><Database className="h-3.5 w-3.5" /> Shortcodes</TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1.5"><Bell className="h-3.5 w-3.5" /> Notifications</TabsTrigger>
          <TabsTrigger value="system" className="gap-1.5"><Shield className="h-3.5 w-3.5" /> System</TabsTrigger>
          <TabsTrigger value="integrations" className="gap-1.5"><Plug className="h-3.5 w-3.5" /> Integrations</TabsTrigger>
        </TabsList>

        {/* PROFILE TAB */}
        <TabsContent value="profile" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Admin Profile</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><Label>First Name</Label><Input value={profileData.first_name} onChange={(e) => setProfileData((p) => ({ ...p, first_name: e.target.value }))} /></div>
                <div><Label>Last Name</Label><Input value={profileData.last_name} onChange={(e) => setProfileData((p) => ({ ...p, last_name: e.target.value }))} /></div>
              </div>
              <div><Label>Email</Label><Input value={user?.email ?? ""} disabled /><p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><Label>Phone</Label><Input value={profileData.phone} onChange={(e) => setProfileData((p) => ({ ...p, phone: e.target.value }))} placeholder="9876543210" /></div>
                <div><Label>WhatsApp</Label><Input value={profileData.whatsapp} onChange={(e) => setProfileData((p) => ({ ...p, whatsapp: e.target.value }))} placeholder="9876543210" /></div>
              </div>
              <Button onClick={handleSaveProfile} disabled={savingProfile} className="gap-2">
                {savingProfile ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : <><Save className="h-4 w-4" /> Save Profile</>}
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Change Password</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-muted-foreground">⚠️ Admin password is system-controlled. Contact technical support to change.</p></CardContent>
          </Card>
        </TabsContent>

        {/* WHATSAPP TEMPLATES TAB */}
        <TabsContent value="whatsapp" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">WhatsApp Message Templates</CardTitle>
              <p className="text-sm text-muted-foreground">Customize messages sent to parents and coaches. Use {"{variable}"} for dynamic content.</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {templates.map((tpl) => (
                <div key={tpl.id} className="border border-border rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between p-3 bg-muted/30">
                    <div>
                      <p className="font-semibold text-sm">{tpl.name}</p>
                      <p className="text-xs text-muted-foreground">{tpl.description}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" className="h-8 gap-1" onClick={() => setPreviewTemplate(tpl)}>
                        <Eye className="h-3 w-3" /> Preview
                      </Button>
                      {editingTemplateId === tpl.id ? (
                        <>
                          <Button size="sm" variant="ghost" className="h-8" onClick={() => setEditingTemplateId(null)}>Cancel</Button>
                          <Button size="sm" className="h-8 gap-1" onClick={() => handleSaveTemplate(tpl)} disabled={savingTemplate}>
                            <Save className="h-3 w-3" /> Save
                          </Button>
                        </>
                      ) : (
                        <Button size="sm" variant="ghost" className="h-8 gap-1" onClick={() => { setEditingTemplateId(tpl.id); setEditTemplateValue(tpl.template); }}>
                          <Edit2 className="h-3 w-3" /> Edit
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="p-3">
                    {editingTemplateId === tpl.id ? (
                      <div className="space-y-3">
                        <Textarea value={editTemplateValue} onChange={(e) => setEditTemplateValue(e.target.value)} className="min-h-[200px] font-mono text-xs" />
                        <div className="flex flex-wrap gap-1">
                          <span className="text-xs text-muted-foreground mr-1">Variables:</span>
                          {tpl.variables.map((v) => (
                            <Badge key={v} variant="secondary" className="font-mono text-xs cursor-pointer hover:bg-primary hover:text-primary-foreground"
                              onClick={() => setEditTemplateValue((prev) => prev + `{${v}}`)}>
                              {`{${v}}`}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <pre className="whitespace-pre-wrap text-xs text-muted-foreground font-mono bg-muted/20 p-3 rounded-md max-h-32 overflow-auto">{tpl.template}</pre>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* PAYMENT SETTINGS TAB */}
        <TabsContent value="payment-settings" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">UPI Payment Settings</CardTitle>
              <p className="text-sm text-muted-foreground">These details are used in WhatsApp payment messages to parents</p>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                <p className="text-sm text-yellow-700 dark:text-yellow-400">⚠️ These details appear in all payment-related WhatsApp messages. Keep them accurate.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>UPI ID</Label>
                  <Input value={paymentSettings.upi_id} onChange={(e) => setPaymentSettings((p) => ({ ...p, upi_id: e.target.value }))} placeholder="yourname@paytm" />
                  <p className="text-xs text-muted-foreground mt-1">e.g., yourname@paytm, yourname@phonepe</p>
                </div>
                <div>
                  <Label>UPI Phone Number</Label>
                  <Input value={paymentSettings.upi_number} onChange={(e) => setPaymentSettings((p) => ({ ...p, upi_number: e.target.value.replace(/\D/g, "").slice(0, 10) }))} placeholder="9876543210" maxLength={10} />
                  <p className="text-xs text-muted-foreground mt-1">10-digit mobile number for PhonePe/GPay</p>
                </div>
              </div>

              <div>
                <Label>Payment QR Code</Label>
                <div className="mt-2 flex items-start gap-4">
                  <div className="flex-1">
                    <input ref={qrInputRef} type="file" accept="image/*" onChange={handleQRUpload} className="hidden" />
                    <Button variant="outline" className="gap-2 w-full" onClick={() => qrInputRef.current?.click()} disabled={uploadingQR}>
                      {uploadingQR ? <><Loader2 className="h-4 w-4 animate-spin" /> Uploading...</> : <><Upload className="h-4 w-4" /> Upload QR Code</>}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 2MB</p>
                  </div>
                  {paymentSettings.qr_code_url && (
                    <div className="relative">
                      <img src={paymentSettings.qr_code_url} alt="Payment QR Code" className="w-24 h-24 rounded-lg border border-border object-contain bg-white" />
                      <Button size="icon" variant="destructive" className="absolute -top-2 -right-2 h-6 w-6"
                        onClick={() => setPaymentSettings((p) => ({ ...p, qr_code_url: "" }))}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {(paymentSettings.upi_id || paymentSettings.upi_number) && (
                <div className="p-3 rounded-lg bg-muted/50 border border-border">
                  <p className="text-xs font-semibold mb-1">Preview in WhatsApp messages:</p>
                  <p className="text-sm font-mono">Pay to:</p>
                  {paymentSettings.upi_id && <p className="text-sm font-mono">📱 UPI: {paymentSettings.upi_id}</p>}
                  {paymentSettings.upi_number && <p className="text-sm font-mono">📱 Phone: {paymentSettings.upi_number}</p>}
                  {paymentSettings.qr_code_url && <p className="text-sm font-mono">📷 QR Code: [Attached]</p>}
                </div>
              )}

              <Button onClick={handleSavePaymentSettings} disabled={savingPayment} className="gap-2">
                {savingPayment ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : <><Save className="h-4 w-4" /> Save Payment Settings</>}
              </Button>
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
                          <Input className="w-24 h-8 text-sm uppercase" value={editShortcodeValue} onChange={(e) => setEditShortcodeValue(e.target.value.toUpperCase().slice(0, 5))} maxLength={5} />
                          <Button size="sm" variant="default" className="h-8 gap-1" onClick={() => handleSaveShortcode(sc.id)} disabled={savingShortcode}><Check className="h-3 w-3" /> Save</Button>
                          <Button size="sm" variant="ghost" className="h-8" onClick={() => setEditingShortcodeId(null)}>Cancel</Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="font-mono">{sc.shortcode}</Badge>
                          <Button size="sm" variant="ghost" className="h-8 gap-1" onClick={() => { setEditingShortcodeId(sc.id); setEditShortcodeValue(sc.shortcode); }}><Edit2 className="h-3 w-3" /> Edit</Button>
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
              {([
                { key: "paymentReminders" as const, title: "Payment Reminders", desc: "Send WhatsApp reminders before payment due date" },
                { key: "overdueAlerts" as const, title: "Overdue Alerts", desc: "Notify parents when payment becomes overdue" },
                { key: "coachAssignment" as const, title: "Coach Assignment Notifications", desc: "Notify coaches when assigned to new community/sport" },
                { key: "welcomeMessages" as const, title: "Welcome Messages", desc: "Send welcome WhatsApp to new students" },
              ]).map(({ key, title, desc }) => (
                <div key={key} className="flex items-center justify-between">
                  <div><p className="font-medium text-sm">{title}</p><p className="text-xs text-muted-foreground">{desc}</p></div>
                  <Switch checked={notifications[key]} onCheckedChange={(v) => setNotifications((p) => ({ ...p, [key]: v }))} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SYSTEM TAB */}
        <TabsContent value="system" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">System Information</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "Version", value: <Badge variant="secondary">2.0.0</Badge> },
                { label: "Database", value: <Badge variant="default" className="gap-1"><Check className="h-3 w-3" /> Connected</Badge> },
                { label: "Authentication", value: <Badge variant="default" className="gap-1"><Check className="h-3 w-3" /> Active</Badge> },
                { label: "Communities", value: <Badge variant="secondary">{communities.length}</Badge> },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm">{label}</span>{value}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* WhatsApp Template Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Preview: {previewTemplate?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <MessageSquare className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="font-medium text-sm">WhatsApp Message Preview</p>
                <p className="text-xs text-muted-foreground">With sample data</p>
              </div>
            </div>
            <pre className="whitespace-pre-wrap text-sm font-mono bg-green-500/5 border border-green-500/20 p-4 rounded-lg max-h-[400px] overflow-auto">
              {previewTemplate ? replaceVars(previewTemplate.template) : ""}
            </pre>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
