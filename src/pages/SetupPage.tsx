import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Briefcase, Code, Users, ArrowRight, Database, Cloud,
  Smartphone, PaintBucket, Shield, BarChart3, Cog,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Watermark } from "@/components/Watermark";
import { useAuth } from "@/hooks/useAuth";

const roles = [
  { id: "Frontend Developer", icon: Code, desc: "React, JavaScript, CSS, and web fundamentals" },
  { id: "Backend Developer", icon: Database, desc: "APIs, databases, system design, and architecture" },
  { id: "Full Stack Developer", icon: Cog, desc: "End-to-end development across the entire stack" },
  { id: "Mobile Developer", icon: Smartphone, desc: "iOS, Android, React Native, and mobile UX" },
  { id: "DevOps Engineer", icon: Cloud, desc: "CI/CD, cloud infrastructure, and deployment" },
  { id: "UI/UX Designer", icon: PaintBucket, desc: "Design thinking, prototyping, and user research" },
  { id: "Data Analyst", icon: BarChart3, desc: "SQL, data visualization, and analytical thinking" },
  { id: "Cybersecurity", icon: Shield, desc: "Security principles, threat analysis, and best practices" },
  { id: "Product Manager", icon: Briefcase, desc: "Strategy, roadmaps, and stakeholder management" },
  { id: "HR Interview", icon: Users, desc: "Behavioral, situational, and culture-fit questions" },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0 },
};

const difficulties = [
  { id: "easy", label: "Easy", desc: "Beginner-friendly questions", color: "text-green-500" },
  { id: "medium", label: "Medium", desc: "Intermediate-level challenges", color: "text-yellow-500" },
  { id: "hard", label: "Hard", desc: "Advanced & tricky questions", color: "text-red-500" },
];

export default function SetupPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState("medium");
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const handleStart = () => {
    if (selected) navigate(`/interview?role=${encodeURIComponent(selected)}`);
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <Watermark />
      <Header />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(38_92%_50%/0.08),transparent)]" />

      <div className="relative mx-auto flex min-h-[calc(100vh-64px)] max-w-2xl flex-col items-center justify-center px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full space-y-8 text-center"
        >
          <div>
            <h1 className="font-display text-3xl font-bold sm:text-4xl">Choose your interview</h1>
            <p className="mt-2 text-muted-foreground">Select the role you want to practice for</p>
          </div>

          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1"
          >
            {roles.map((role) => (
              <motion.button
                key={role.id}
                variants={item}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelected(role.id)}
                className={`glass-card flex w-full items-center gap-3 rounded-xl p-4 text-left transition-all ${
                  selected === role.id
                    ? "border-primary/50 glow-border"
                    : "hover:border-primary/20"
                }`}
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                    selected === role.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground"
                  } transition-colors`}
                >
                  <role.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-display font-semibold text-sm">{role.id}</p>
                  <p className="text-xs text-muted-foreground truncate">{role.desc}</p>
                </div>
              </motion.button>
            ))}
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
            <Button
              size="lg"
              disabled={!selected}
              onClick={handleStart}
              className="group gap-2 rounded-full px-8 font-semibold"
            >
              Begin Interview
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </motion.div>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}
