import { supabase } from "@/integrations/supabase/client";

type Message = { role: "user" | "assistant"; content: string };

async function invokeWithRetry(body: Record<string, unknown>, retries = 2): Promise<any> {
  for (let i = 0; i <= retries; i++) {
    try {
      const { data, error } = await supabase.functions.invoke("interview", { body });
      if (error) throw new Error(error.message || "Edge function error");
      if (data?.error) throw new Error(data.error);
      return data;
    } catch (e: any) {
      if (i === retries) throw e;
      // Wait before retry (cold start recovery)
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
}

export async function generateQuestion(role: string, messages: Message[]): Promise<string> {
  const data = await invokeWithRetry({ action: "generate_question", role, messages });
  return data.content;
}

export async function evaluateAnswer(role: string, question: string, answer: string): Promise<{
  score: number;
  strength: string;
  improvement: string;
}> {
  const data = await invokeWithRetry({
    action: "evaluate_answer",
    role,
    messages: [
      { role: "user", content: `Question: ${question}\n\nCandidate's Answer: ${answer}` },
    ],
  });
  try {
    const cleaned = data.content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return { score: 5, strength: "Answer provided", improvement: "Could elaborate more" };
  }
}
