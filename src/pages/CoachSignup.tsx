import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2, Check, UserPlus, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CoachData {
  id: string;
  coach_id: string;
  sport_name: string;
  name: string;
  phone: string | null;
}

export default function CoachSignup() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [coachIdInput, setCoachIdInput] = useState("");
  const [coachData, setCoachData] = useState<CoachData | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Step 2 form
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState("");

  // Pre-fill from URL
  useEffect(() => {
    const id = searchParams.get("id");
    if (id) {
      setCoachIdInput(id.toUpperCase());
    }
  }, [searchParams]);

  const verifyCoachId = async () => {
    const id = coachIdInput.trim().toUpperCase();
    if (!/^RJ[A-Z]{3}\d{3}$/.test(id)) {
      toast({ title: "Invalid Coach ID format", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data: coach } = await supabase
        .from("coaches")
        .select("*")
        .eq("coach_id", id)
        .maybeSingle();

      if (!coach) {
        toast({ title: "Coach ID not found", description: "Please contact admin.", variant: "destructive" });
        return;
      }

      if (coach.signup_completed) {
        toast({ title: "Already registered", description: "Please login instead.", variant: "destructive" });
        navigate("/login");
        return;
      }

      setCoachData(coach as CoachData);
      setPhone(coach.phone || "");
      toast({ title: `Coach ID verified! Welcome, ${coach.sport_name} coach.` });
      setStep(2);
    } catch {
      toast({ title: "Failed to verify", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!firstName || !lastName || !email || !phone || !password) {
      setFormError("All required fields must be filled");
      return;
    }
    if (password.length < 8) {
      setFormError("Password must be at least 8 characters");
      return;
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      setFormError("Password must contain uppercase, lowercase, and a number");
      return;
    }
    if (password !== confirmPassword) {
      setFormError("Passwords do not match");
      return;
    }
    if (!coachData) return;

    setLoading(true);
    try {
      // Create Supabase Auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            coach_id: coachData.coach_id,
            user_type: "coach",
          },
        },
      });

      if (authError) {
        if (authError.message.includes("already registered")) {
          setFormError("Email already registered. Use a different email.");
        } else {
          setFormError(authError.message);
        }
        return;
      }

      // Update the coach record
      const { error: updateError } = await supabase
        .from("coaches")
        .update({
          name: `${firstName} ${lastName}`,
          email,
          phone,
          signup_completed: true,
          signup_email: email,
          is_active: true,
          user_id: authData.user?.id || null,
        })
        .eq("id", coachData.id);

      if (updateError) throw updateError;

      // Update the profile that was auto-created by the trigger
      if (authData.user?.id) {
        await supabase
          .from("profiles")
          .update({
            user_type: "coach",
            first_name: firstName,
            last_name: lastName,
            phone,
            whatsapp: whatsapp || phone,
            coach_id: coachData.coach_id,
            sport_name: coachData.sport_name,
          })
          .eq("id", authData.user.id);
      }

      // Sign out after signup so they login fresh
      await supabase.auth.signOut();

      toast({ title: "Signup successful!", description: "You can now login with your Coach ID." });
      navigate("/login");
    } catch (err: any) {
      setFormError(err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-[460px] space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="text-4xl">🏸</div>
          <h1 className="text-2xl font-bold">Coach Registration</h1>
          <p className="text-muted-foreground text-sm">Complete your RJ Sportz account</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-3">
          <div className={`flex items-center gap-2 ${step >= 1 ? "text-primary" : "text-muted-foreground"}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step >= 1 ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
              {step > 1 ? <Check className="h-4 w-4" /> : "1"}
            </div>
            <span className="text-sm">Verify ID</span>
          </div>
          <div className="w-12 h-0.5 bg-muted overflow-hidden rounded-full">
            <div className="h-full bg-primary transition-all" style={{ width: step >= 2 ? "100%" : "0%" }} />
          </div>
          <div className={`flex items-center gap-2 ${step >= 2 ? "text-primary" : "text-muted-foreground"}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step >= 2 ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
              2
            </div>
            <span className="text-sm">Profile</span>
          </div>
        </div>

        {/* Step 1: Verify Coach ID */}
        {step === 1 && (
          <div className="bg-card p-6 rounded-xl border border-border space-y-4">
            <div className="bg-warning/10 border border-warning/30 p-3 rounded-lg text-sm">
              <p className="font-medium text-warning">⚠️ Important:</p>
              <p className="text-muted-foreground mt-1">
                Your Coach ID was created by the admin. If you don't have one, please contact admin first.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Coach ID (Provided by Admin)</Label>
              <Input
                value={coachIdInput}
                onChange={(e) => setCoachIdInput(e.target.value.toUpperCase())}
                placeholder="e.g., RJBDM005"
                className="bg-secondary font-mono tracking-wider text-lg text-center"
                maxLength={9}
              />
              <p className="text-xs text-muted-foreground">
                Format: RJ + Sport Code + Number (e.g., RJBDM005)
              </p>
            </div>

            <Button
              onClick={verifyCoachId}
              disabled={loading || !/^RJ[A-Z]{3}\d{3}$/.test(coachIdInput.trim().toUpperCase())}
              className="w-full neon-glow gap-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Verify Coach ID →
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:underline">Login here</Link>
            </p>
          </div>
        )}

        {/* Step 2: Complete Profile */}
        {step === 2 && coachData && (
          <form onSubmit={handleSignup} className="bg-card p-6 rounded-xl border border-border space-y-4">
            {/* Verified badge */}
            <div className="bg-success/10 border border-success/30 p-3 rounded-lg flex items-center gap-3">
              <Check className="h-5 w-5 text-success shrink-0" />
              <div>
                <p className="text-sm font-medium text-success">Coach ID Verified</p>
                <p className="text-xs text-muted-foreground">
                  <span className="font-mono text-primary">{coachData.coach_id}</span> • {coachData.sport_name}
                </p>
              </div>
            </div>

            {/* Name */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>First Name *</Label>
                <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Anuj" required />
              </div>
              <div className="space-y-1">
                <Label>Last Name *</Label>
                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Sharma" required />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1">
              <Label>Email *</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="anuj@example.com" required />
            </div>

            {/* Phone */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Mobile *</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="9876543210" required />
              </div>
              <div className="space-y-1">
                <Label>WhatsApp</Label>
                <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="Same as mobile" />
                <p className="text-[10px] text-muted-foreground">Leave blank if same</p>
              </div>
            </div>

            {/* Password */}
            <div className="space-y-3 pt-2 border-t border-border">
              <p className="text-sm font-medium">Create Your Password</p>
              <div className="space-y-1">
                <Label>Password *</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 8 chars, upper+lower+number"
                    required
                    minLength={8}
                    className="pr-10"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary" tabIndex={-1}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <Label>Confirm Password *</Label>
                <div className="relative">
                  <Input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-type password"
                    required
                    className="pr-10"
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary" tabIndex={-1}>
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Important note */}
            <div className="bg-muted/50 p-3 rounded-lg text-xs space-y-1">
              <p className="font-medium">📌 Important:</p>
              <ul className="text-muted-foreground space-y-0.5 list-disc list-inside">
                <li>Remember your password — it cannot be recovered</li>
                <li>Use your Coach ID (<span className="text-primary font-mono">{coachData.coach_id}</span>) to login</li>
                <li>Contact admin if you need to reset password</li>
              </ul>
            </div>

            {formError && (
              <p className="text-sm text-destructive text-center font-medium">{formError}</p>
            )}

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button type="submit" disabled={loading} className="flex-1 neon-glow gap-2">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                {loading ? "Creating..." : "Complete Signup"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
