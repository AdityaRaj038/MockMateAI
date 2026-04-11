import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase, Code, Users, ArrowRight, Database, Cloud,
  Smartphone, PaintBucket, Shield, BarChart3, Cog,
  Upload, FileText, X, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Watermark } from "@/components/Watermark";
import { PageTransition } from "@/components/PageTransition";
import { FloatingParticles } from "@/components/FloatingParticles";
import { useAuth } from "@/hooks/useAuth";
import { extractTextFromFile } from "@/lib/resumeParser";
import { toast } from "sonner";

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
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [parsing, setParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "docx", "txt"].includes(ext || "")) {
      toast.error("Please upload a PDF, DOCX, or TXT file");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be under 10MB");
      return;
    }

    setResumeFile(file);
    setParsing(true);
    try {
      const text = await extractTextFromFile(file);
      if (!text.trim()) {
        toast.error("Could not extract text from this file. Try a different format.");
        setResumeFile(null);
        setResumeText("");
      } else {
        setResumeText(text.slice(0, 5000));
        toast.success("Resume parsed successfully!");
        // Auto-detect role from resume content
        if (!selected) {
          const lower = text.toLowerCase();
          const matched = roles.find((r) => {
            const keywords: Record<string, string[]> = {
              "Frontend Developer": ["react", "angular", "vue", "css", "html", "javascript", "typescript", "frontend", "front-end", "tailwind"],
              "Backend Developer": ["node", "express", "django", "flask", "spring", "api", "rest", "graphql", "backend", "back-end", "server"],
              "Full Stack Developer": ["full stack", "fullstack", "full-stack", "mern", "mean"],
              "Mobile Developer": ["react native", "flutter", "swift", "kotlin", "ios", "android", "mobile"],
              "DevOps Engineer": ["docker", "kubernetes", "ci/cd", "aws", "azure", "gcp", "devops", "terraform", "jenkins"],
              "UI/UX Designer": ["figma", "sketch", "ux", "ui design", "wireframe", "prototype", "user experience"],
              "Data Analyst": ["sql", "tableau", "power bi", "excel", "data analysis", "analytics", "pandas", "statistics"],
              "Cybersecurity": ["security", "penetration", "firewall", "vulnerability", "soc", "cybersecurity", "ethical hacking"],
              "Product Manager": ["product manager", "roadmap", "stakeholder", "agile", "scrum", "product management"],
              "HR Interview": ["hr", "human resources", "recruitment", "talent"],
            };
            return keywords[r.id]?.some((kw) => lower.includes(kw));
          });
          if (matched) {
            setSelected(matched.id);
            toast.info(`Auto-detected role: ${matched.id}`);
          }
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to parse resume");
      setResumeFile(null);
      setResumeText("");
    } finally {
      setParsing(false);
    }
  };

  const removeResume = () => {
    setResumeFile(null);
    setResumeText("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleStart = () => {
    if (!selected) return;
    // Store resume in sessionStorage so InterviewPage can access it
    if (resumeText) {
      sessionStorage.setItem("interview_resume", resumeText);
    } else {
      sessionStorage.removeItem("interview_resume");
    }
    navigate(`/interview?role=${encodeURIComponent(selected)}&difficulty=${difficulty}`);
  };

  return (
    <PageTransition className="relative min-h-screen overflow-hidden">
      <Watermark />
      <Header />
      <FloatingParticles count={5} />
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

          {/* Resume Upload */}
          <div className="space-y-3">
            <h2 className="font-display text-lg font-semibold flex items-center justify-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Upload Resume <span className="text-xs text-muted-foreground font-normal">(optional)</span>
            </h2>
            <p className="text-xs text-muted-foreground">AI will generate targeted questions based on your resume</p>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />

            <AnimatePresence mode="wait">
              {resumeFile ? (
                <motion.div
                  key="uploaded"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="glass-card rounded-xl p-4 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0 text-left">
                      <p className="font-medium text-sm truncate">{resumeFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {parsing ? "Parsing..." : `${resumeText.length} characters extracted`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {parsing && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                    <Button variant="ghost" size="icon" onClick={removeResume} className="h-8 w-8 rounded-full">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <motion.button
                  key="upload"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => fileInputRef.current?.click()}
                  className="glass-card w-full rounded-xl p-6 border-dashed border-2 border-border hover:border-primary/40 transition-colors flex flex-col items-center gap-2"
                >
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Drop your resume here or <span className="text-primary font-medium">browse</span>
                  </p>
                  <p className="text-xs text-muted-foreground">PDF, DOCX, or TXT (max 10MB)</p>
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* Roles */}
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[40vh] overflow-y-auto pr-1"
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

          {/* Difficulty */}
          <div className="space-y-3">
            <h2 className="font-display text-lg font-semibold">Difficulty Level</h2>
            <div className="flex gap-3 justify-center">
              {difficulties.map((d) => (
                <motion.button
                  key={d.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setDifficulty(d.id)}
                  className={`glass-card rounded-xl px-5 py-3 text-center transition-all ${
                    difficulty === d.id
                      ? "border-primary/50 glow-border"
                      : "hover:border-primary/20"
                  }`}
                >
                  <p className={`font-display font-bold text-sm ${d.color}`}>{d.label}</p>
                  <p className="text-xs text-muted-foreground">{d.desc}</p>
                </motion.button>
              ))}
            </div>
          </div>

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
    </PageTransition>
  );
}
