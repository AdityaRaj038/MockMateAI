import { motion } from "framer-motion";
import { Mic, Volume2 } from "lucide-react";

interface VoiceIndicatorProps {
  type: "listening" | "speaking" | "idle";
}

export function VoiceIndicator({ type }: VoiceIndicatorProps) {
  if (type === "idle") return null;

  const isListening = type === "listening";
  const Icon = isListening ? Mic : Volume2;

  return (
    <div className="relative flex items-center justify-center">
      <motion.div
        className="absolute rounded-full bg-primary/20"
        style={{ width: 64, height: 64 }}
        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
      <motion.div
        className="absolute rounded-full bg-primary/10"
        style={{ width: 80, height: 80 }}
        animate={{ scale: [1, 1.8, 1], opacity: [0.3, 0, 0.3] }}
        transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
      />
      <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-primary">
        <Icon className="h-5 w-5 text-primary-foreground" />
      </div>
    </div>
  );
}
