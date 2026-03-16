import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Trophy, Target, Clock, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Watermark } from "@/components/Watermark";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface InterviewRecord {
  id: string;
  role: string;
  average_score: number;
  total_questions: number;
  feedbacks: any[];
  created_at: string;
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState<InterviewRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }
    if (user) fetchHistory();
  }, [user, authLoading]);

  const fetchHistory = async () => {
    const { data } = await supabase
      .from("interview_history")
      .select("*")
      .order("created_at", { ascending: false });
    setInterviews((data as InterviewRecord[]) || []);
    setLoading(false);
  };

  const overallAvg = interviews.length
    ? Math.round((interviews.reduce((a, i) => a + Number(i.average_score), 0) / interviews.length) * 10) / 10
    : 0;

  const bestScore = interviews.length
    ? Math.max(...interviews.map((i) => Number(i.average_score)))
    : 0;

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative">
      <Watermark />
      <Header />
      <div className="flex-1 px-4 py-8 relative z-10">
        <div className="mx-auto max-w-4xl space-y-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-display text-3xl font-bold">
              Welcome back{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name}` : ""}!
            </h1>
            <p className="text-muted-foreground mt-1">Track your interview performance</p>
          </motion.div>

          {/* Stats */}
          <motion.div variants={container} initial="hidden" animate="show" className="grid gap-4 sm:grid-cols-3">
            {[
              { icon: Trophy, label: "Interviews", value: interviews.length, color: "text-primary" },
              { icon: Target, label: "Avg Score", value: `${overallAvg}/10`, color: "text-primary" },
              { icon: TrendingUp, label: "Best Score", value: `${bestScore}/10`, color: "text-primary" },
            ].map((stat) => (
              <motion.div key={stat.label} variants={item} className="glass-card rounded-xl p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="font-display text-xl font-bold">{stat.value}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Start new */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <Button onClick={() => navigate("/setup")} className="gap-2 rounded-full px-6 font-semibold">
              Start New Interview <ArrowRight className="h-4 w-4" />
            </Button>
          </motion.div>

          {/* History */}
          <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
            <h2 className="font-display text-xl font-semibold">Past Interviews</h2>
            {interviews.length === 0 ? (
              <div className="glass-card rounded-xl p-8 text-center text-muted-foreground">
                No interviews yet. Start your first one!
              </div>
            ) : (
              interviews.map((interview) => (
                <motion.div key={interview.id} variants={item} className="glass-card rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-display font-bold text-primary">
                        {Number(interview.average_score).toFixed(1)}
                      </div>
                      <div>
                        <p className="font-display font-semibold text-sm">{interview.role}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(interview.created_at).toLocaleDateString()}
                          <span>•</span>
                          {interview.total_questions} questions
                        </div>
                      </div>
                    </div>
                    <div className="h-2 w-24 rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${Number(interview.average_score) * 10}%` }}
                      />
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
