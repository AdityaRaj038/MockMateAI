import { supabase } from "@/integrations/supabase/client";

type Message = { role: "user" | "assistant"; content: string };

export async function generateQuestion(role: string, messages: Message[]): Promise<string> {
  const { data, error } = await supabase.functions.invoke("interview", {
    body: { action: "generate_question", role, messages },
  });
  if (error) throw new Error(error.message || "Failed to generate question");
  return data.content;
}

export async function evaluateAnswer(role: string, question: string, answer: string): Promise<{
  score: number;
  strength: string;
  improvement: string;
}> {
  const { data, error } = await supabase.functions.invoke("interview", {
    body: {
      action: "evaluate_answer",
      role,
      messages: [
        { role: "user", content: `Question: ${question}\n\nCandidate's Answer: ${answer}` },
      ],
    },
  });
  if (error) throw new Error(error.message || "Failed to evaluate answer");
  try {
    const cleaned = data.content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return { score: 5, strength: "Answer provided", improvement: "Could elaborate more" };
  }
}
