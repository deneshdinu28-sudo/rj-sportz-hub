import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, Loader2 } from "lucide-react";

const MOCK_USER = {
  email: "admin@rjsportz.com",
  password: "Admin@2026",
  role: "admin",
  name: "Admin User",
};

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const user = localStorage.getItem("rjsportz_user");
    if (user) navigate("/dashboard", { replace: true });
  }, [navigate]);

  const isValidEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!isValidEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }
    if (!password) {
      setError("Password cannot be empty");
      return;
    }

    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 1200));

    if (email === MOCK_USER.email && password === MOCK_USER.password) {
      const userData = { email: MOCK_USER.email, role: MOCK_USER.role, name: MOCK_USER.name };
      localStorage.setItem("rjsportz_user", JSON.stringify(userData));
      if (rememberMe) localStorage.setItem("rjsportz_remember", "true");
      setSuccess("Login successful! Redirecting...");
      setTimeout(() => navigate("/dashboard"), 800);
    } else {
      setError("Invalid email or password");
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight">
            🏸 RJ <span className="text-primary neon-text">SPORTZ</span>
          </h1>
          <p className="text-muted-foreground text-sm tracking-widest uppercase">
            Where Champions Are Made
          </p>
        </div>

        {/* Form Card */}
        <form
          onSubmit={handleLogin}
          className="space-y-5 bg-card p-8 rounded-xl border border-border shadow-lg shadow-primary/5"
        >
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@rjsportz.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-secondary border-border focus-visible:ring-primary"
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                required
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

          {/* Remember Me */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="remember"
              checked={rememberMe}
              onCheckedChange={(v) => setRememberMe(v === true)}
            />
            <Label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">
              Stay logged in for 7 days
            </Label>
          </div>

          {/* Error / Success */}
          {error && (
            <p className="text-sm text-destructive text-center font-medium">{error}</p>
          )}
          {success && (
            <p className="text-sm text-primary neon-text text-center font-medium">{success}</p>
          )}

          {/* Submit */}
          <Button type="submit" className="w-full neon-glow font-bold tracking-wider" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" />
                Logging in...
              </>
            ) : (
              "LOGIN"
            )}
          </Button>

          {/* Forgot Password */}
          <p className="text-center">
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              Forgot Password?
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
