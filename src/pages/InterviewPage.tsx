import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Send, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VoiceIndicator } from "@/components/VoiceIndicator";
import { FeedbackCard } from "@/components/FeedbackCard";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { generateQuestion, evaluateAnswer } from "@/lib/interviewApi";
import { toast } from "sonner";

type Message = { role: "user" | "assistant"; content: string };
type Feedback = { score: number; strength: string; improvement: string };

export default function InterviewPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const role = params.get("role") || "Frontend Developer";

  const [messages, setMessages] = useState<Message[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [questionCount, setQuestionCount] = useState(0);
  const [interviewDone, setInterviewDone] = useState(false);

  const { isListening, transcript, startListening, stopListening, resetTranscript, isSupported } = useSpeechRecognition();
  const { isSpeaking, speak, stop: stopSpeaking } = useSpeechSynthesis();
  const scrollRef = useRef<HTMLDivElement>(null);

  const MAX_QUESTIONS = 5;

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, feedbacks]);

  // First question on mount
  const hasStarted = useRef(false);
  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;
    askNextQuestion([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const askNextQuestion = useCallback(async (history: Message[]) => {
    setIsLoading(true);
    try {
      const question = await generateQuestion(role, history);
      setCurrentQuestion(question);
      setMessages((prev) => [...prev, { role: "assistant", content: question }]);
      setQuestionCount((c) => c + 1);
      speak(question);
    } catch (e: any) {
      toast.error(e.message || "Failed to generate question");
    } finally {
      setIsLoading(false);
    }
  }, [role, speak]);

  const handleSubmitAnswer = useCallback(async () => {
    if (!transcript.trim()) return;
    stopListening();
    stopSpeaking();

    const answer = transcript.trim();
    resetTranscript();
    const newMessages: Message[] = [...messages, { role: "user", content: answer }];
    setMessages(newMessages);

    // Evaluate
    setIsLoading(true);
    try {
      const fb = await evaluateAnswer(role, currentQuestion, answer);
      setFeedbacks((prev) => [...prev, fb]);

      if (questionCount >= MAX_QUESTIONS) {
        setInterviewDone(true);
        setIsLoading(false);
        return;
      }

      // Next question
      await askNextQuestion(newMessages);
    } catch (e: any) {
      toast.error(e.message || "Failed to evaluate");
      setIsLoading(false);
    }
  }, [transcript, stopListening, stopSpeaking, resetTranscript, messages, role, currentQuestion, questionCount, askNextQuestion]);

  const averageScore = feedbacks.length
    ? Math.round((feedbacks.reduce((a, f) => a + f.score, 0) / feedbacks.length) * 10) / 10
    : 0;

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/setup")} className="gap-1.5 text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <div className="text-center">
          <p className="font-display text-sm font-semibold">{role}</p>
          <p className="text-xs text-muted-foreground">
            Question {Math.min(questionCount, MAX_QUESTIONS)} / {MAX_QUESTIONS}
          </p>
        </div>
        <div className="w-16" />
      </header>

      {/* Chat area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-2xl space-y-4">
          <AnimatePresence mode="popLayout">
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "glass-card rounded-bl-md"
                  }`}
                >
                  {msg.content}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Latest feedback */}
          {feedbacks.length > 0 && !interviewDone && (
            <FeedbackCard {...feedbacks[feedbacks.length - 1]} />
          )}

          {isLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="glass-card flex items-center gap-2 rounded-2xl rounded-bl-md px-4 py-3 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Thinking...
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Interview complete */}
      {interviewDone && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="border-t border-border p-6">
          <div className="mx-auto max-w-2xl space-y-4">
            <div className="text-center">
              <h2 className="font-display text-2xl font-bold">Interview Complete!</h2>
              <p className="text-muted-foreground">
                Average Score: <span className="text-gradient font-bold text-xl">{averageScore}/10</span>
              </p>
            </div>
            <div className="space-y-3">
              {feedbacks.map((fb, i) => (
                <div key={i} className="glass-card rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Question {i + 1}</p>
                  <FeedbackCard {...fb} />
                </div>
              ))}
            </div>
            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={() => navigate("/setup")} className="rounded-full">
                New Interview
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Voice controls */}
      {!interviewDone && (
        <div className="border-t border-border p-4">
          <div className="mx-auto flex max-w-2xl items-center justify-center gap-4">
            <VoiceIndicator type={isSpeaking ? "speaking" : isListening ? "listening" : "idle"} />

            {isListening && transcript && (
              <div className="flex-1 rounded-xl bg-secondary/50 px-4 py-2 text-sm text-foreground max-w-md truncate">
                {transcript}
              </div>
            )}

            {!isSupported ? (
              <p className="text-sm text-destructive">Voice not supported in this browser</p>
            ) : isListening ? (
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={stopListening} className="rounded-full">
                  <MicOff className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  onClick={handleSubmitAnswer}
                  disabled={!transcript.trim()}
                  className="rounded-full"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button
                size="lg"
                onClick={startListening}
                disabled={isLoading || isSpeaking}
                className="gap-2 rounded-full px-6 font-semibold"
              >
                <Mic className="h-4 w-4" />
                {isSpeaking ? "AI Speaking..." : "Answer"}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
