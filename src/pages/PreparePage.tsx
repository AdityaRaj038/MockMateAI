import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, FileText, Target, Upload, X, Loader2,
  ChevronDown, ChevronUp, Lightbulb, AlertTriangle,
  CheckCircle2, Star, Briefcase, Code, Database, Cloud,
  Smartphone, PaintBucket, Shield, BarChart3, Cog, Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Watermark } from "@/components/Watermark";
import { PageTransition } from "@/components/PageTransition";
import { FloatingParticles } from "@/components/FloatingParticles";
import { useAuth } from "@/hooks/useAuth";
import { extractTextFromFile } from "@/lib/resumeParser";
import {
  getPracticeQuestions, getResumeQuestions, getSkillGapAnalysis,
  PracticeQuestion, ResumeQuestion, SkillGapResult,
} from "@/lib/prepareApi";
import { toast } from "sonner";

const roles = [
  { id: "Frontend Developer", icon: Code },
  { id: "Backend Developer", icon: Database },
  { id: "Full Stack Developer", icon: Cog },
  { id: "Mobile Developer", icon: Smartphone },
  { id: "DevOps Engineer", icon: Cloud },
  { id: "UI/UX Designer", icon: PaintBucket },
  { id: "Data Analyst", icon: BarChart3 },
  { id: "Cybersecurity", icon: Shield },
  { id: "Product Manager", icon: Briefcase },
  { id: "HR Interview", icon: Users },
];

const tabs = [
  { id: "practice", label: "Practice Q&A", icon: BookOpen, needsResume: false },
  { id: "resume-qa", label: "Resume Questions", icon: FileText, needsResume: true },
  { id: "skill-gap", label: "Skill Gap Analysis", icon: Target, needsResume: true },
] as const;

type TabId = typeof tabs[number]["id"];

function QuestionCard({ q, index }: { q: { question: string; answer: string }; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="glass-card rounded-xl overflow-hidden"
    >
      <button onClick={() => setOpen(!open)} className="w-full p-4 text-left flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-sm mt-0.5">
            {index + 1}
          </span>
          <p className="font-medium text-sm">{q.question}</p>
        </div>
        {open ? <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground mt-1" /> : <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground mt-1" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
              <div className="bg-primary/5 rounded-lg p-3">
                <p className="text-sm text-foreground/90 leading-relaxed">{q.answer}</p>
              </div>
              {"keyPoints" in q && (q as PracticeQuestion).keyPoints?.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                    <Lightbulb className="h-3 w-3" /> Key Points
                  </p>
                  <ul className="space-y-1">
                    {(q as PracticeQuestion).keyPoints.map((kp, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                        <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0 mt-0.5" />
                        {kp}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {"basedOn" in q && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <FileText className="h-3 w-3" /> Based on: {(q as ResumeQuestion).basedOn}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function SkillGapView({ data }: { data: SkillGapResult }) {
  const importanceColor = {
    critical: "text-red-500 bg-red-500/10",
    important: "text-yellow-500 bg-yellow-500/10",
    "nice-to-have": "text-blue-500 bg-blue-500/10",
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Score */}
      <div className="glass-card rounded-xl p-6 text-center">
        <div className="relative inline-flex items-center justify-center">
          <svg className="w-24 h-24 -rotate-90">
            <circle cx="48" cy="48" r="40" strokeWidth="6" fill="none" className="stroke-muted" />
            <circle cx="48" cy="48" r="40" strokeWidth="6" fill="none" className="stroke-primary" strokeDasharray={`${data.matchScore * 2.51} 251`} strokeLinecap="round" />
          </svg>
          <span className="absolute font-display text-2xl font-bold">{data.matchScore}%</span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">Resume Match Score</p>
        <p className="mt-2 text-sm leading-relaxed max-w-md mx-auto">{data.summary}</p>
      </div>

      {/* Strong Skills */}
      <div className="glass-card rounded-xl p-5 space-y-3">
        <h3 className="font-display font-semibold flex items-center gap-2 text-sm">
          <CheckCircle2 className="h-4 w-4 text-green-500" /> Strong Skills
        </h3>
        <div className="flex flex-wrap gap-2">
          {data.strongSkills.map((s, i) => (
            <span key={i} className="px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-xs font-medium">{s}</span>
          ))}
        </div>
      </div>

      {/* Missing Skills */}
      <div className="glass-card rounded-xl p-5 space-y-3">
        <h3 className="font-display font-semibold flex items-center gap-2 text-sm">
          <AlertTriangle className="h-4 w-4 text-yellow-500" /> Missing Skills
        </h3>
        <div className="space-y-3">
          {data.missingSkills.map((ms, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
              <span className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${importanceColor[ms.importance]}`}>
                {ms.importance}
              </span>
              <div className="min-w-0">
                <p className="font-medium text-sm">{ms.skill}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{ms.recommendation}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Resume Tips */}
      <div className="glass-card rounded-xl p-5 space-y-3">
        <h3 className="font-display font-semibold flex items-center gap-2 text-sm">
          <Star className="h-4 w-4 text-primary" /> Resume Improvement Tips
        </h3>
        <ul className="space-y-2">
          {data.resumeTips.map((tip, i) => (
            <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
              <Lightbulb className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}

export default function PreparePage() {
  const [activeTab, setActiveTab] = useState<TabId>("practice");
  const [selectedRole, setSelectedRole] = useState<string>("Frontend Developer");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [practiceData, setPracticeData] = useState<PracticeQuestion[] | null>(null);
  const [resumeQData, setResumeQData] = useState<ResumeQuestion[] | null>(null);
  const [skillGapData, setSkillGapData] = useState<SkillGapResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

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
        toast.error("Could not extract text from this file.");
        setResumeFile(null);
        setResumeText("");
      } else {
        setResumeText(text.slice(0, 5000));
        toast.success("Resume parsed successfully!");
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
    setResumeQData(null);
    setSkillGapData(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      if (activeTab === "practice") {
        const result = await getPracticeQuestions(selectedRole);
        setPracticeData(result);
      } else if (activeTab === "resume-qa") {
        if (!resumeText) { toast.error("Please upload a resume first"); setLoading(false); return; }
        const result = await getResumeQuestions(resumeText);
        setResumeQData(result);
      } else if (activeTab === "skill-gap") {
        if (!resumeText) { toast.error("Please upload a resume first"); setLoading(false); return; }
        const result = await getSkillGapAnalysis(selectedRole, resumeText);
        setSkillGapData(result);
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const currentData = activeTab === "practice" ? practiceData : activeTab === "resume-qa" ? resumeQData : skillGapData;
  const needsResume = tabs.find(t => t.id === activeTab)?.needsResume;

  return (
    <PageTransition className="relative min-h-screen overflow-hidden">
      <Watermark />
      <Header />
      <FloatingParticles count={5} />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(38_92%_50%/0.08),transparent)]" />

      <div className="relative mx-auto max-w-3xl px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="text-center">
            <h1 className="font-display text-3xl font-bold sm:text-4xl">Interview Prep Hub</h1>
            <p className="mt-2 text-muted-foreground">Practice questions, resume analysis, and skill gap insights</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 justify-center flex-wrap">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`glass-card rounded-xl px-4 py-2.5 flex items-center gap-2 text-sm font-medium transition-all ${
                  activeTab === tab.id ? "border-primary/50 glow-border" : "hover:border-primary/20"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Role Selector (for practice & skill-gap) */}
          {(activeTab === "practice" || activeTab === "skill-gap") && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-center">Select Role</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {roles.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => setSelectedRole(role.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                      selectedRole === role.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <role.icon className="h-3 w-3" />
                    {role.id}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Resume Upload (for resume tabs) */}
          {needsResume && (
            <div className="space-y-2">
              <input ref={fileInputRef} type="file" accept=".pdf,.docx,.txt" onChange={handleFileUpload} className="hidden" />
              {resumeFile ? (
                <div className="glass-card rounded-xl p-4 flex items-center justify-between gap-3">
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
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="glass-card w-full rounded-xl p-6 border-dashed border-2 border-border hover:border-primary/40 transition-colors flex flex-col items-center gap-2"
                >
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Upload your resume or <span className="text-primary font-medium">browse</span>
                  </p>
                  <p className="text-xs text-muted-foreground">PDF, DOCX, or TXT (max 10MB)</p>
                </button>
              )}
            </div>
          )}

          {/* Generate Button */}
          <div className="text-center">
            <Button
              size="lg"
              onClick={handleGenerate}
              disabled={loading || (needsResume && !resumeText)}
              className="rounded-full px-8 font-semibold gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  {activeTab === "practice" ? "Generate Practice Questions" : activeTab === "resume-qa" ? "Analyze Resume" : "Analyze Skill Gaps"}
                </>
              )}
            </Button>
          </div>

          {/* Results */}
          {activeTab === "skill-gap" && skillGapData && <SkillGapView data={skillGapData} />}
          {(activeTab === "practice" && practiceData) && (
            <div className="space-y-3">
              {practiceData.map((q, i) => <QuestionCard key={i} q={q} index={i} />)}
            </div>
          )}
          {(activeTab === "resume-qa" && resumeQData) && (
            <div className="space-y-3">
              {resumeQData.map((q, i) => <QuestionCard key={i} q={q} index={i} />)}
            </div>
          )}
        </motion.div>
      </div>
      <Footer />
    </PageTransition>
  );
}
