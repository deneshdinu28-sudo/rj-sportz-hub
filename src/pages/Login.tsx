import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2, LogIn } from "lucide-react";
import { toast } from "sonner";

const ADMIN_EMAIL = "admin@rjsportz.com";
const ADMIN_PASSWORD = "Admin@2026";

export default function Login() {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const normalizedId = userId.trim().toUpperCase();
  const isAdmin = normalizedId === "ADMIN";
  const isCoach = /^RJ[A-Z]{3}\d{3}$/.test(normalizedId);
  const isFormValid = (isAdmin || isCoach) && password.length >= 6;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!isFormValid) return;

    setIsLoading(true);
    try {
      if (isAdmin) {
        // Admin login with hardcoded password check
        if (password !== ADMIN_PASSWORD) {
          setError("Invalid admin password");
          setIsLoading(false);
          return;
        }

        // Try to sign in first
        const { error: signInError } = await signIn(ADMIN_EMAIL, ADMIN_PASSWORD);

        if (signInError) {
          // If user doesn't exist, auto-create admin account
          console.log("Admin sign-in failed, attempting auto-signup:", signInError);
          const { error: signUpError } = await signUp(ADMIN_EMAIL, ADMIN_PASSWORD, "Admin");
          
          if (signUpError) {
            console.error("Admin signup failed:", signUpError);
            setError("Failed to create admin account. " + signUpError);
            setIsLoading(false);
            return;
          }

          // Now sign in with the newly created account
          const { error: retryError } = await signIn(ADMIN_EMAIL, ADMIN_PASSWORD);
          if (retryError) {
            setError("Admin account created but login failed. Try again.");
            setIsLoading(false);
            return;
          }
        }

        toast.success("Welcome, Admin!");
        navigate("/dashboard", { replace: true });

      } else if (isCoach) {
        // Coach login - look up coach by coach_id
        const { data: coach } = await supabase
          .from("coaches")
          .select("*")
          .eq("coach_id", normalizedId)
          .maybeSingle();

        if (!coach) {
          setError("Coach ID not found. Contact admin.");
          setIsLoading(false);
          return;
        }

        if (!coach.signup_completed) {
          setError("Please complete signup first.");
          navigate(`/coach/signup?id=${normalizedId}`);
          setIsLoading(false);
          return;
        }

        if (!coach.is_active) {
          setError("Your account is inactive. Contact admin.");
          setIsLoading(false);
          return;
        }

        if (!coach.signup_email) {
          setError("Account setup incomplete. Contact admin.");
          setIsLoading(false);
          return;
        }

        const { error: signInError } = await signIn(coach.signup_email, password);
        if (signInError) {
          setError("Invalid password");
        } else {
          toast.success(`Welcome, ${coach.name}!`);
          navigate("/coach/dashboard", { replace: true });
        }
      }
    } catch (err: any) {
      setError("Login failed. Please try again.");
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-[400px] space-y-8">
        <div className="text-center space-y-2">
          <div className="text-5xl mb-2">🏸</div>
          <h1 className="text-4xl font-extrabold tracking-tight">
            RJ <span className="text-primary neon-text">SPORTZ</span>
          </h1>
          <p className="text-muted-foreground text-sm tracking-widest uppercase">
            Where Champions Are Made
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 bg-card p-8 rounded-xl border border-border shadow-lg shadow-primary/5"
        >
          <div className="space-y-2">
            <Label htmlFor="userId">User ID</Label>
            <Input
              id="userId"
              type="text"
              placeholder="ADMIN or RJBDM005"
              required
              value={userId}
              onChange={(e) => setUserId(e.target.value.toUpperCase())}
              className="bg-secondary border-border focus-visible:ring-primary font-mono tracking-wider"
              autoComplete="username"
            />
            <div className="text-xs text-muted-foreground space-y-0.5">
              <p>📌 Admin: <span className="text-primary font-mono">ADMIN</span> / <span className="text-primary font-mono">Admin@2026</span></p>
              <p>📌 Coach: Your Coach ID (e.g., <span className="text-primary font-mono">RJBDM005</span>)</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-secondary border-border focus-visible:ring-primary pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive text-center font-medium">{error}</p>
          )}

          <Button
            type="submit"
            className="w-full neon-glow font-bold tracking-wider gap-2"
            disabled={isLoading || !isFormValid}
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin h-4 w-4" />
                Logging in...
              </>
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                LOGIN →
              </>
            )}
          </Button>

          <div className="text-center space-y-2 pt-2">
            <p className="text-xs text-muted-foreground">
              New coach?{" "}
              <Link to="/coach/signup" className="text-primary hover:underline">
                Complete Signup →
              </Link>
            </p>
            <p className="text-[10px] text-muted-foreground">
              Forgot password? Contact admin at{" "}
              <a href="tel:9876543210" className="text-primary">9876543210</a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
