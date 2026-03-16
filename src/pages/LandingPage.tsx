import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Mic, Brain, BarChart3, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Watermark } from "@/components/Watermark";

const features = [
  {
    icon: Mic,
    title: "Voice-Powered",
    description: "Speak naturally — the AI listens and responds in real time.",
  },
  {
    icon: Brain,
    title: "Adaptive Questions",
    description: "Each follow-up is shaped by your previous answers.",
  },
  {
    icon: BarChart3,
    title: "Instant Feedback",
    description: "Get scored with strengths and areas to improve after each answer.",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.15 } },
};
const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen overflow-hidden">
      <Watermark />
      <Header />

      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(38_92%_50%/0.12),transparent)]" />

      <div className="relative mx-auto flex min-h-[calc(100vh-64px)] max-w-5xl flex-col items-center justify-center px-6 py-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="space-y-6"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-1.5 text-sm text-muted-foreground bg-card/50 backdrop-blur"
          >
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            AI-Powered Voice Interviews
          </motion.div>

          <h1 className="font-display text-5xl font-bold leading-tight tracking-tight sm:text-7xl">
            Practice interviews
            <br />
            <span className="text-gradient">that feel real.</span>
          </h1>

          <p className="mx-auto max-w-xl text-lg text-muted-foreground">
            An AI interviewer that listens, adapts, and gives you honest feedback
            — so you walk into the real thing prepared.
          </p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-center gap-3"
          >
            <Button
              size="lg"
              onClick={() => navigate("/setup")}
              className="group gap-2 rounded-full px-8 text-base font-semibold"
            >
              Start Interview
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </motion.div>
        </motion.div>

        {/* Features */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="mt-24 grid w-full gap-6 sm:grid-cols-3"
        >
          {features.map((f, i) => (
            <motion.div
              key={i}
              variants={item}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="glass-card group rounded-xl p-6 text-left transition-all hover:border-primary/30"
            >
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mb-1 font-display text-lg font-semibold">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}
