import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Database, Save, Trash2, ExternalLink, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Watermark } from "@/components/Watermark";
import { PageTransition } from "@/components/PageTransition";
import {
  getCustomConfig,
  setCustomConfig,
  clearCustomConfig,
} from "@/integrations/supabase/customClient";
import { toast } from "sonner";

export default function BackendSettingsPage() {
  const navigate = useNavigate();
  const existing = getCustomConfig();
  const [url, setUrl] = useState(existing?.url || "");
  const [anonKey, setAnonKey] = useState(existing?.key || "");

  const handleSave = () => {
    const u = url.trim();
    const k = anonKey.trim();
    if (!/^https:\/\/.+\.supabase\.co\/?$/.test(u)) {
      toast.error("URL must look like https://YOUR-PROJECT.supabase.co");
      return;
    }
    if (k.length < 40) {
      toast.error("That doesn't look like a valid anon key");
      return;
    }
    setCustomConfig(u.replace(/\/$/, ""), k);
    toast.success("Connected to your Supabase project. Reloading...");
    setTimeout(() => window.location.reload(), 800);
  };

  const handleClear = () => {
    if (!confirm("Switch back to the managed backend? You'll be signed out.")) return;
    clearCustomConfig();
    toast.success("Reverted to managed backend. Reloading...");
    setTimeout(() => window.location.reload(), 800);
  };

  return (
    <PageTransition className="min-h-screen flex flex-col relative">
      <Watermark />
      <Header />
      <div className="flex-1 px-4 py-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-lg space-y-6"
        >
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Database className="h-6 w-6 text-primary" />
            </div>
            <h1 className="font-display text-3xl font-bold">Backend Settings</h1>
            <p className="text-muted-foreground mt-1">
              Connect your own Supabase project
            </p>
          </div>

          <div className="glass-card rounded-2xl p-5 border-yellow-500/30 bg-yellow-500/5">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm space-y-2">
                <p className="font-semibold">Before you connect</p>
                <p className="text-muted-foreground">
                  Your Supabase project needs the same schema: <code>profiles</code>,{" "}
                  <code>interview_history</code> tables and an <code>avatars</code> storage
                  bucket, plus matching RLS policies. Without them the app will error.
                </p>
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  Open Supabase Dashboard <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="url">Project URL</Label>
              <Input
                id="url"
                placeholder="https://abcdefgh.supabase.co"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Project Settings → Data API → Project URL
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="anon">Anon (public) key</Label>
              <Input
                id="anon"
                type="password"
                placeholder="eyJhbGciOi..."
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Project Settings → API Keys → <code>anon</code> public key. Never paste
                the service role key here.
              </p>
            </div>

            <Button
              onClick={handleSave}
              className="w-full gap-2 rounded-full font-semibold"
            >
              <Save className="h-4 w-4" />
              {existing ? "Update Connection" : "Connect"}
            </Button>
          </div>

          {existing && (
            <div className="glass-card rounded-2xl p-6 border-destructive/20">
              <h3 className="font-display font-semibold text-destructive mb-2">
                Revert to managed backend
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Disconnect from your Supabase project and use the built-in Lovable Cloud
                backend again.
              </p>
              <Button
                variant="destructive"
                onClick={handleClear}
                className="rounded-full gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Disconnect
              </Button>
            </div>
          )}

          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="w-full rounded-full"
          >
            Back
          </Button>
        </motion.div>
      </div>
      <Footer />
    </PageTransition>
  );
}
