import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MicOff, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VoiceIndicator } from "@/components/VoiceIndicator";
import { FeedbackCard } from "@/components/FeedbackCard";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { generateQuestion, evaluateAnswer } from "@/lib/interviewApi";
import { toast } from "sonner";

type Message = { role: "user" | "assistant"; content: string };
type Feedback = { score: number; strength: string; improvement: string };

const SILENCE_TIMEOUT = 4000;
const NO_ANSWER_TIMEOUT = 10000;

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
  const scrollRef = useRef<HTMLDivElement>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const noAnswerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const submittingRef = useRef(false);
  const prevTranscriptRef = useRef("");

  const MAX_QUESTIONS = 5;

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, feedbacks, transcript]);

  // Silence detection: auto-submit after 4s of no new speech
  useEffect(() => {
    if (!isListening || !transcript.trim()) return;

    // Only reset timer if transcript actually changed
    if (transcript !== prevTranscriptRef.current) {
      prevTranscriptRef.current = transcript;
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      // Cancel no-answer timer since user started speaking
      if (noAnswerTimerRef.current) {
        clearTimeout(noAnswerTimerRef.current);
        noAnswerTimerRef.current = null;
      }

      silenceTimerRef.current = setTimeout(() => {
        if (!submittingRef.current) {
          submitAnswer(transcript.trim());
        }
      }, SILENCE_TIMEOUT);
    }

    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, [transcript, isListening]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (noAnswerTimerRef.current) clearTimeout(noAnswerTimerRef.current);
    };
  }, []);

  const startNoAnswerTimer = useCallback(() => {
    if (noAnswerTimerRef.current) clearTimeout(noAnswerTimerRef.current);

    noAnswerTimerRef.current = setTimeout(() => {
      if (!submittingRef.current) {
        submitAnswer("");
      }
    }, NO_ANSWER_TIMEOUT);
  }, []);

  // Auto-start mic when AI finishes speaking
  const autoStartMic = useCallback(() => {
    if (isSupported) {
      setTimeout(() => {
        startListening();
        startNoAnswerTimer();
      }, 400);
    }
  }, [isSupported, startListening, startNoAnswerTimer]);

  const { isSpeaking, speak, stop: stopSpeaking } = useSpeechSynthesis({ onEnd: autoStartMic });

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

  const submitAnswer = useCallback(async (answer: string) => {
    if (submittingRef.current) return;
    submittingRef.current = true;

    // Clear all timers
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (noAnswerTimerRef.current) clearTimeout(noAnswerTimerRef.current);

    stopListening();
    stopSpeaking();
    resetTranscript();
    prevTranscriptRef.current = "";

    const isBlank = !answer.trim();
    const displayAnswer = isBlank ? "(No answer received)" : answer;
    const newMessages: Message[] = [...messages, { role: "user", content: displayAnswer }];
    setMessages(newMessages);

    if (isBlank) {
      const blankFeedback: Feedback = { score: 0, strength: "No response given", improvement: "Try to share your thoughts, even if you're unsure. Partial answers are better than silence." };
      setFeedbacks((prev) => [...prev, blankFeedback]);

      if (questionCount >= MAX_QUESTIONS) {
        setInterviewDone(true);
        submittingRef.current = false;
        return;
      }
      submittingRef.current = false;
      await askNextQuestion(newMessages);
      return;
    }

    setIsLoading(true);
    try {
      const fb = await evaluateAnswer(role, currentQuestion, answer);
      setFeedbacks((prev) => [...prev, fb]);

      if (questionCount >= MAX_QUESTIONS) {
        setInterviewDone(true);
        setIsLoading(false);
        submittingRef.current = false;
        return;
      }

      submittingRef.current = false;
      await askNextQuestion(newMessages);
    } catch (e: any) {
      toast.error(e.message || "Failed to evaluate");
      setIsLoading(false);
      submittingRef.current = false;
    }
  }, [stopListening, stopSpeaking, resetTranscript, messages, role, currentQuestion, questionCount, askNextQuestion]);

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
                      ? msg.content === "(No answer received)"
                        ? "bg-destructive/20 text-muted-foreground rounded-br-md italic"
                        : "bg-primary text-primary-foreground rounded-br-md"
                      : "glass-card rounded-bl-md"
                  }`}
                >
                  {msg.content}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Live transcript while user is speaking */}
          {isListening && transcript && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-end"
            >
              <div className="max-w-[80%] rounded-2xl rounded-br-md bg-primary/20 border border-primary/30 px-4 py-3 text-sm text-foreground">
                <div className="flex items-center gap-2 mb-1">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                  </span>
                  <span className="text-xs text-muted-foreground font-medium">Listening... (auto-submits after pause)</span>
                </div>
                {transcript}
              </div>
            </motion.div>
          )}

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

      {/* Voice status bar */}
      {!interviewDone && (
        <div className="border-t border-border p-4">
          <div className="mx-auto flex max-w-2xl items-center justify-center gap-4">
            <VoiceIndicator type={isSpeaking ? "speaking" : isListening ? "listening" : "idle"} />

            {!isSupported ? (
              <p className="text-sm text-destructive">Voice not supported in this browser</p>
            ) : isSpeaking ? (
              <p className="text-sm text-muted-foreground font-medium">AI is speaking...</p>
            ) : isListening ? (
              <div className="flex items-center gap-3">
                <p className="text-sm text-muted-foreground">
                  {transcript ? "Listening... will auto-submit after you pause" : "Start speaking..."}
                </p>
                <Button variant="ghost" size="icon" onClick={stopListening} className="rounded-full h-8 w-8">
                  <MicOff className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : isLoading ? (
              <p className="text-sm text-muted-foreground">Processing...</p>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
