import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { action, role, resumeText } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let systemPrompt = "";
    let userPrompt = "";

    if (action === "practice_questions") {
      systemPrompt = `You are an expert interview coach. Generate 10 frequently asked interview questions for a ${role} position along with detailed, well-structured model answers.`;
      userPrompt = `Generate 10 frequently asked interview questions for a ${role} role. For each question provide:
1. The question
2. A comprehensive model answer (3-5 sentences)
3. Key points to remember

You MUST respond with ONLY a valid JSON array in this format, no other text:
[
  {
    "question": "...",
    "answer": "...",
    "keyPoints": ["point1", "point2", "point3"]
  }
]`;
    } else if (action === "resume_questions") {
      if (!resumeText) throw new Error("Resume text is required");
      systemPrompt = `You are an expert interview coach who analyzes resumes and predicts likely interview questions. Be specific and reference actual content from the resume.`;
      userPrompt = `Analyze this resume and generate 10 likely interview questions that an interviewer would ask based on the candidate's specific experience, projects, and skills. For each question, provide a detailed model answer.

Resume:
---
${resumeText}
---

You MUST respond with ONLY a valid JSON array in this format, no other text:
[
  {
    "question": "...",
    "answer": "...",
    "basedOn": "brief note on which resume element triggered this question"
  }
]`;
    } else if (action === "skill_gap") {
      if (!resumeText || !role) throw new Error("Resume text and role are required");
      systemPrompt = `You are a career advisor and technical recruiter who analyzes resumes against job role requirements. Be specific, actionable, and constructive.`;
      userPrompt = `Analyze this resume against the requirements for a ${role} position. Identify missing skills, gaps, and provide actionable recommendations.

Resume:
---
${resumeText}
---

You MUST respond with ONLY a valid JSON object in this format, no other text:
{
  "matchScore": <number 1-100>,
  "strongSkills": ["skill1", "skill2", "..."],
  "missingSkills": [
    {
      "skill": "skill name",
      "importance": "critical" | "important" | "nice-to-have",
      "recommendation": "how to learn/add this skill"
    }
  ],
  "resumeTips": ["tip1", "tip2", "..."],
  "summary": "2-3 sentence overall assessment"
}`;
    } else {
      throw new Error("Invalid action");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Parse JSON from AI response
    const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = content;
    }

    return new Response(JSON.stringify({ result: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("prepare error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
