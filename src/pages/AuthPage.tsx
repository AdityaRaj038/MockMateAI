import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PageTransition } from "@/components/PageTransition";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);

    try {
      if (isLogin) {
        const { error } =
          await supabase.auth.signInWithPassword({
            email,
            password,
          });

        if (error) throw error;

        toast.success("Welcome back!");

        navigate("/setup");
      } else {
        const { error } =
          await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: fullName,
              },
            },
          });

        if (error) throw error;

        toast.success(
          "Account created successfully!"
        );

        navigate("/setup");
      }
    } catch (err: any) {
      toast.error(
        err.message || "Authentication failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition className="min-h-screen bg-background flex flex-col">
      <Header />

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{
            opacity: 0,
            y: 20,
            scale: 0.96,
          }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
          }}
          transition={{
            duration: 0.45,
          }}
          className="w-full max-w-md"
        >
          <div className="glass-card rounded-2xl p-8 space-y-6 border border-border/60">
            {/* Heading */}
            <div className="text-center space-y-2">
              <h1 className="font-display text-3xl font-bold tracking-tight">
                {isLogin
                  ? "Welcome Back"
                  : "Create Account"}
              </h1>

              <p className="text-sm text-muted-foreground">
                {isLogin
                  ? "Sign in to continue your interview preparation journey."
                  : "Start practicing interviews with AI-powered feedback."}
              </p>
            </div>

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Full Name
                  </Label>

                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      value={fullName}
                      onChange={(e) =>
                        setFullName(
                          e.target.value
                        )
                      }
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email Address
                </Label>

                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) =>
                      setEmail(e.target.value)
                    }
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">
                  Password
                </Label>

                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) =>
                      setPassword(
                        e.target.value
                      )
                    }
                    className="pl-10"
                    minLength={6}
                    required
                  />
                </div>
              </div>

              {/* Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full rounded-full font-semibold gap-2"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    {isLogin
                      ? "Sign In"
                      : "Create Account"}

                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            {/* Toggle */}
            <div className="text-center">
              <button
                type="button"
                onClick={() =>
                  setIsLogin(!isLogin)
                }
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {isLogin
                  ? "Don't have an account? Sign up"
                  : "Already have an account? Sign in"}
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      <Footer />
    </PageTransition>
  );
}