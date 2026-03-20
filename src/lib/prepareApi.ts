import { supabase } from "@/integrations/supabase/client";

export interface PracticeQuestion {
  question: string;
  answer: string;
  keyPoints: string[];
}

export interface ResumeQuestion {
  question: string;
  answer: string;
  basedOn: string;
}

export interface SkillGapResult {
  matchScore: number;
  strongSkills: string[];
  missingSkills: {
    skill: string;
    importance: "critical" | "important" | "nice-to-have";
    recommendation: string;
  }[];
  resumeTips: string[];
  summary: string;
}

async function invokeWithRetry(body: Record<string, unknown>, retries = 2): Promise<any> {
  for (let i = 0; i <= retries; i++) {
    try {
      const { data, error } = await supabase.functions.invoke("prepare", { body });
      if (error) throw new Error(error.message || "Edge function error");
      if (data?.error) throw new Error(data.error);
      return data;
    } catch (e: any) {
      if (i === retries) throw e;
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
}

export async function getPracticeQuestions(role: string): Promise<PracticeQuestion[]> {
  const data = await invokeWithRetry({ action: "practice_questions", role });
  return data.result;
}

export async function getResumeQuestions(resumeText: string): Promise<ResumeQuestion[]> {
  const data = await invokeWithRetry({ action: "resume_questions", resumeText });
  return data.result;
}

export async function getSkillGapAnalysis(role: string, resumeText: string): Promise<SkillGapResult> {
  const data = await invokeWithRetry({ action: "skill_gap", role, resumeText });
  return data.result;
}
