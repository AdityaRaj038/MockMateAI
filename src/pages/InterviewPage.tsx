import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MicOff, ArrowLeft, Loader2, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VoiceIndicator } from "@/components/VoiceIndicator";
import { FeedbackCard } from "@/components/FeedbackCard";
import { Header } from "@/components/Header";
import { Watermark } from "@/components/Watermark";
import { useAuth } from "@/hooks/useAuth";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { generateQuestion, evaluateAnswer } from "@/lib/interviewApi";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Message = { role: "user" | "assistant"; content: string };
type Feedback = { score: number; strength: string; improvement: string; intention: string };

const SILENCE_TIMEOUT = 4000;
const NO_ANSWER_TIMEOUT = 10000;
const MAX_QUESTIONS = 8;

export default function InterviewPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = params.get("role") || "Frontend Developer";
  const difficulty = params.get("difficulty") || "medium";

  const [messages, setMessages] = useState<Message[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [questionCount, setQuestionCount] = useState(0);
  const [interviewDone, setInterviewDone] = useState(false);
  const resumeContext = useRef(sessionStorage.getItem("interview_resume") || "");

  const { isListening, transcript, startListening, stopListening, resetTranscript, isSupported } = useSpeechRecognition();
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const noAnswerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const submittingRef = useRef(false);
  const prevTranscriptRef = useRef("");
  const messagesRef = useRef<Message[]>([]);
  const questionCountRef = useRef(0);
  const currentQuestionRef = useRef("");
  const interviewDoneRef = useRef(false);
  const feedbacksRef = useRef<Feedback[]>([]);
  const abortedRef = useRef(false);

  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { questionCountRef.current = questionCount; }, [questionCount]);
  useEffect(() => { currentQuestionRef.current = currentQuestion; }, [currentQuestion]);
  useEffect(() => { interviewDoneRef.current = interviewDone; }, [interviewDone]);
  useEffect(() => { feedbacksRef.current = feedbacks; }, [feedbacks]);

  // Auto-scroll using bottom anchor
  useEffect(() => {
    const timer = setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, 100);
    return () => clearTimeout(timer);
  }, [messages, feedbacks, transcript, isLoading]);

  // Silence detection
  useEffect(() => {
    if (!isListening || !transcript.trim()) return;
    if (transcript !== prevTranscriptRef.current) {
      prevTranscriptRef.current = transcript;
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (noAnswerTimerRef.current) {
        clearTimeout(noAnswerTimerRef.current);
        noAnswerTimerRef.current = null;
      }
      silenceTimerRef.current = setTimeout(() => {
        if (!submittingRef.current) submitAnswer(transcript.trim());
      }, SILENCE_TIMEOUT);
    }
    return () => { if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current); };
  }, [transcript, isListening]);

  // Cleanup on unmount (back navigation)
  useEffect(() => {
    return () => {
      abortedRef.current = true;
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (noAnswerTimerRef.current) clearTimeout(noAnswerTimerRef.current);
    };
  }, []);

  const clearAllTimers = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (noAnswerTimerRef.current) clearTimeout(noAnswerTimerRef.current);
    silenceTimerRef.current = null;
    noAnswerTimerRef.current = null;
  }, []);

  const startNoAnswerTimer = useCallback(() => {
    if (noAnswerTimerRef.current) clearTimeout(noAnswerTimerRef.current);
    noAnswerTimerRef.current = setTimeout(() => {
      if (!submittingRef.current && !interviewDoneRef.current && !abortedRef.current) {
        submitAnswer("");
      }
    }, NO_ANSWER_TIMEOUT);
  }, []);

  const autoStartMic = useCallback(() => {
    if (isSupported && !interviewDoneRef.current && !abortedRef.current) {
      setTimeout(() => {
        startListening();
        startNoAnswerTimer();
      }, 400);
    }
  }, [isSupported, startListening, startNoAnswerTimer]);

  const { isSpeaking, speak, stop: stopSpeaking } = useSpeechSynthesis({ onEnd: autoStartMic });

  const hasStarted = useRef(false);
  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;
    askNextQuestion([]);
  }, []);

  const askNextQuestion = useCallback(async (history: Message[]) => {
    if (abortedRef.current) return;
    setIsLoading(true);
    try {
      const question = await generateQuestion(role, history, difficulty, resumeContext.current);
      if (abortedRef.current) return;
      setCurrentQuestion(question);
      currentQuestionRef.current = question;
      setMessages((prev) => {
        const updated = [...prev, { role: "assistant" as const, content: question }];
        messagesRef.current = updated;
        return updated;
      });
      setQuestionCount((c) => {
        const next = c + 1;
        questionCountRef.current = next;
        return next;
      });
      speak(question);
    } catch (e: any) {
      if (!abortedRef.current) toast.error(e.message || "Failed to generate question");
    } finally {
      setIsLoading(false);
    }
  }, [role, speak]);

  const saveInterview = useCallback(async (fbs: Feedback[]) => {
    if (!user) return;
    const avg = fbs.length
      ? Math.round((fbs.reduce((a, f) => a + f.score, 0) / fbs.length) * 10) / 10
      : 0;
    await supabase.from("interview_history").insert({
      user_id: user.id,
      role,
      average_score: avg,
      total_questions: fbs.length,
      feedbacks: fbs as any,
    });
  }, [user, role]);

  const finishInterview = useCallback((fbs: Feedback[]) => {
    setInterviewDone(true);
    interviewDoneRef.current = true;
    clearAllTimers();
    stopListening();
    stopSpeaking();
    saveInterview(fbs);
  }, [clearAllTimers, stopListening, stopSpeaking, saveInterview]);

  const handleEndInterview = useCallback(() => {
    if (interviewDoneRef.current) return;
    submittingRef.current = false;
    clearAllTimers();
    stopListening();
    stopSpeaking();
    resetTranscript();
    finishInterview(feedbacksRef.current);
  }, [clearAllTimers, stopListening, stopSpeaking, resetTranscript, finishInterview]);

  const submitAnswer = useCallback(async (answer: string) => {
    if (submittingRef.current || interviewDoneRef.current || abortedRef.current) return;
    submittingRef.current = true;

    clearAllTimers();
    stopListening();
    stopSpeaking();
    resetTranscript();
    prevTranscriptRef.current = "";

    const isBlank = !answer.trim();
    const displayAnswer = isBlank ? "(No answer received)" : answer;
    const currentMessages = messagesRef.current;
    const currentCount = questionCountRef.current;
    const newMessages: Message[] = [...currentMessages, { role: "user", content: displayAnswer }];
    setMessages(newMessages);
    messagesRef.current = newMessages;

    const isLastQuestion = currentCount >= MAX_QUESTIONS;

    if (isBlank) {
      const blankFeedback: Feedback = {
        score: 0,
        strength: "No response given",
        improvement: "Try to share your thoughts, even if you're unsure. Partial answers are better than silence.",
        intention: "Could not evaluate — no answer was provided.",
      };
      const newFeedbacks = [...feedbacksRef.current, blankFeedback];
      setFeedbacks(newFeedbacks);
      feedbacksRef.current = newFeedbacks;

      if (isLastQuestion) {
        submittingRef.current = false;
        finishInterview(newFeedbacks);
        return;
      }
      submittingRef.current = false;
      await askNextQuestion(newMessages);
      return;
    }

    setIsLoading(true);
    try {
      const fb = await evaluateAnswer(role, currentQuestionRef.current, answer);
      if (abortedRef.current) return;
      const newFeedbacks = [...feedbacksRef.current, fb];
      setFeedbacks(newFeedbacks);
      feedbacksRef.current = newFeedbacks;

      if (isLastQuestion) {
        setIsLoading(false);
        submittingRef.current = false;
        finishInterview(newFeedbacks);
        return;
      }

      submittingRef.current = false;
      await askNextQuestion(newMessages);
    } catch (e: any) {
      if (!abortedRef.current) toast.error(e.message || "Failed to evaluate");
      setIsLoading(false);
      submittingRef.current = false;
    }
  }, [stopListening, stopSpeaking, resetTranscript, role, askNextQuestion, finishInterview, clearAllTimers]);

  const averageScore = feedbacks.length
    ? Math.round((feedbacks.reduce((a, f) => a + f.score, 0) / feedbacks.length) * 10) / 10
    : 0;

  return (
    <div className="flex min-h-screen flex-col relative">
      <Watermark />
      <Header />
      <div className="flex items-center justify-between border-b border-border px-6 py-3">
        <Button variant="ghost" size="sm" onClick={() => navigate("/setup")} className="gap-1.5 text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <div className="text-center">
          <p className="font-display text-sm font-semibold">{role}</p>
          <p className="text-xs text-muted-foreground">
            Question {Math.min(questionCount, MAX_QUESTIONS)} / {MAX_QUESTIONS}
          </p>
        </div>
        {!interviewDone ? (
          <Button variant="destructive" size="sm" onClick={handleEndInterview} className="gap-1.5 rounded-full">
            <Square className="h-3.5 w-3.5" /> End
          </Button>
        ) : (
          <div className="w-16" />
        )}
      </div>

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

          {isListening && transcript && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end">
              <div className="max-w-[80%] rounded-2xl rounded-br-md bg-primary/20 border border-primary/30 px-4 py-3 text-sm text-foreground">
                <div className="flex items-center gap-2 mb-1">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                  </span>
                  <span className="text-xs text-muted-foreground font-medium">Listening...</span>
                </div>
                {transcript}
              </div>
            </motion.div>
          )}

          {feedbacks.length > 0 && !interviewDone && <FeedbackCard {...feedbacks[feedbacks.length - 1]} />}

          {isLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="glass-card flex items-center gap-2 rounded-2xl rounded-bl-md px-4 py-3 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Thinking...
              </div>
            </motion.div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

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
              {user && (
                <Button onClick={() => navigate("/dashboard")} className="rounded-full">
                  View Dashboard
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      )}

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
                  {transcript ? "Listening..." : "Start speaking..."}
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
