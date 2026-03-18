import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { action, role, messages, difficulty } = await req.json();
    const difficultyLabel = difficulty === "easy" ? "beginner-friendly, straightforward" : difficulty === "hard" ? "advanced, complex, and tricky" : "intermediate-level";
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let systemPrompt = "";

    if (action === "generate_question") {
      systemPrompt = `You are an expert interviewer conducting a ${role} interview at a ${difficultyLabel} difficulty level. You simulate a real human interviewer — professional, adaptive, and insightful.

Rules:
- Ask ONE question at a time
- You may ask 1-2 follow-up questions based on previous answers, but then MOVE ON to a completely different topic/area relevant to the ${role} role
- Cover a VARIETY of topics across the role's domain: fundamentals, system design, problem-solving, behavioral, tools/technologies, best practices, real-world scenarios
- Do NOT keep asking about the same topic repeatedly — diversify your questions
- Start with an introductory question, then progressively cover different areas
- Keep questions concise (1-3 sentences max)
- Be conversational but professional
- If this is the first message, greet the candidate briefly and ask your first question
- If the candidate did not answer (said nothing), move on to a NEW different topic — do not repeat or rephrase the unanswered question
- ONLY output the question text, nothing else`;
    } else if (action === "evaluate_answer") {
      systemPrompt = `You are an expert interview evaluator for a ${role} position. Evaluate the candidate's answer.

You MUST respond with ONLY a valid JSON object in this exact format, no other text:
{
  "score": <number 1-10>,
  "strength": "<one specific strength in 1 sentence>",
  "improvement": "<one specific improvement suggestion in 1 sentence>"
}`;
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
          ...messages,
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("interview error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
