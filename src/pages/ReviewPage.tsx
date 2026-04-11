import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Trophy, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Watermark } from "@/components/Watermark";
import { PageTransition } from "@/components/PageTransition";
import { FloatingParticles } from "@/components/FloatingParticles";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface Feedback {
  score: number;
  strength: string;
  improvement: string;
}

interface InterviewRecord {
  id: string;
  role: string;
  average_score: number;
  total_questions: number;
  feedbacks: Feedback[];
  created_at: string;
}

export default function ReviewPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [interview, setInterview] = useState<InterviewRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }
    if (user && id) fetchInterview();
  }, [user, authLoading, id]);

  const fetchInterview = async () => {
    const { data } = await supabase
      .from("interview_history")
      .select("*")
      .eq("id", id!)
      .single();
    setInterview(data as unknown as InterviewRecord | null);
    setLoading(false);
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

  if (!interview) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">Interview not found.</p>
            <Button onClick={() => navigate("/dashboard")} variant="outline" className="rounded-full">
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const feedbacks: Feedback[] = Array.isArray(interview.feedbacks) ? interview.feedbacks : [];

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-500";
    if (score >= 5) return "text-primary";
    return "text-destructive";
  };

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <PageTransition className="min-h-screen flex flex-col relative">
      <Watermark />
      <Header />
      <FloatingParticles count={4} />
      <div className="flex-1 px-4 py-8 relative z-10">
        <div className="mx-auto max-w-3xl space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/dashboard")}
              className="gap-1.5 text-muted-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Dashboard
            </Button>

            <div className="glass-card rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h1 className="font-display text-2xl font-bold">{interview.role}</h1>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <Clock className="h-3.5 w-3.5" />
                    {new Date(interview.created_at).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <div className={`font-display text-3xl font-bold ${getScoreColor(Number(interview.average_score))}`}>
                      {Number(interview.average_score).toFixed(1)}
                    </div>
                    <p className="text-xs text-muted-foreground">Avg Score</p>
                  </div>
                  <div className="text-center">
                    <div className="font-display text-3xl font-bold">{interview.total_questions}</div>
                    <p className="text-xs text-muted-foreground">Questions</p>
                  </div>
                </div>
              </div>

              {/* Score bar */}
              <div className="space-y-1">
                <div className="h-3 w-full rounded-full bg-secondary overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Number(interview.average_score) * 10}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-full rounded-full bg-primary"
                  />
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
            <h2 className="font-display text-xl font-semibold">Question-by-Question Breakdown</h2>
            {feedbacks.length === 0 ? (
              <div className="glass-card rounded-xl p-8 text-center text-muted-foreground">
                No detailed feedback available for this interview.
              </div>
            ) : (
              feedbacks.map((fb, i) => (
                <motion.div key={i} variants={item} className="glass-card rounded-xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="font-display font-semibold text-sm text-muted-foreground">
                      Question {i + 1}
                    </p>
                    <div className={`font-display text-lg font-bold ${getScoreColor(fb.score)}`}>
                      {fb.score}/10
                    </div>
                  </div>

                  <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${fb.score * 10}%` }}
                      transition={{ duration: 0.6, delay: i * 0.1 }}
                      className="h-full rounded-full bg-primary"
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="flex gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-green-500">Strength</p>
                        <p className="text-sm text-foreground">{fb.strength}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <AlertCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-primary">Improve</p>
                        <p className="text-sm text-foreground">{fb.improvement}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>

          <div className="flex justify-center gap-3 pb-4">
            <Button variant="outline" onClick={() => navigate("/setup")} className="rounded-full">
              New Interview
            </Button>
            <Button onClick={() => navigate("/dashboard")} className="rounded-full">
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
      <Footer />
    </PageTransition>
  );
}
