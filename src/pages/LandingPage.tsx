import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Mic,
  Brain,
  BarChart3,
  ArrowRight,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FloatingParticles } from "@/components/FloatingParticles";
import { PageTransition } from "@/components/PageTransition";
import { Watermark } from "@/components/Watermark";
import { useAuth } from "@/hooks/useAuth";

const features = [
  {
    icon: Mic,
    title: "Real-Time Voice Interviews",
    description:
      "Practice naturally with AI-driven voice conversations that simulate real interview environments.",
  },
  {
    icon: Brain,
    title: "Context-Aware Questions",
    description:
      "Questions adapt dynamically based on your responses, skills, and interview performance.",
  },
  {
    icon: BarChart3,
    title: "Performance Analytics",
    description:
      "Receive detailed feedback, scoring insights, and improvement suggestions after every session.",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 30 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
};

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleStart = () => {
    if (user) {
      navigate("/setup");
    } else {
      navigate("/auth");
    }
  };

  return (
    <PageTransition className="relative min-h-screen overflow-hidden bg-background">
      <Header />

      {/* Background Particles */}
      <FloatingParticles count={8} />

      {/* Watermark */}
      <div className="pointer-events-none absolute left-1/2 top-[58%] z-0 -translate-x-1/2 -translate-y-1/2">
        <Watermark />
      </div>

      {/* Ambient Glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(38_92%_50%/0.10),transparent)]" />

      {/* Main Hero */}
      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-64px)] max-w-6xl flex-col items-center justify-center px-6 py-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="space-y-8"
        >
          {/* Top Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-4 py-1.5 text-sm text-muted-foreground backdrop-blur"
          >
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            AI-Powered Voice Interviews
          </motion.div>

          {/* Main Heading */}
          <h1 className="font-display text-5xl font-bold leading-tight tracking-tight sm:text-7xl">
            Practice Real
            <br />
            <span className="text-gradient">
              Interviews with AI
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            MockMate AI helps students and professionals prepare for
            technical and HR interviews through realistic AI-driven
            conversations, adaptive questioning, and detailed
            performance feedback.
          </p>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-center"
          >
            <Button
              size="lg"
              onClick={handleStart}
              className="group rounded-full px-8 py-6 text-base font-semibold shadow-lg"
            >
              Start Interview

              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </motion.div>
        </motion.div>

        {/* Features Section */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="mt-24 grid w-full gap-6 sm:grid-cols-3"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={item}
              whileHover={{
                y: -5,
                transition: { duration: 0.2 },
              }}
              className="glass-card rounded-2xl p-6 text-left transition-all hover:border-primary/30"
            >
              {/* Icon */}
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <feature.icon className="h-5 w-5" />
              </div>

              {/* Title */}
              <h3 className="mb-2 font-display text-lg font-semibold">
                {feature.title}
              </h3>

              {/* Description */}
              <p className="text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <Footer />
    </PageTransition>
  );
}