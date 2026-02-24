import { motion } from "framer-motion";
import { TrendingUp, AlertCircle } from "lucide-react";

interface FeedbackCardProps {
  score: number;
  strength: string;
  improvement: string;
}

export function FeedbackCard({ score, strength, improvement }: FeedbackCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-lg p-5 space-y-4"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 font-display text-xl font-bold text-primary">
          {score}
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Score</p>
          <div className="h-2 w-32 rounded-full bg-secondary overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${score * 10}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-start gap-2">
          <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-green-400" />
          <p className="text-sm text-foreground">{strength}</p>
        </div>
        <div className="flex items-start gap-2">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p className="text-sm text-foreground">{improvement}</p>
        </div>
      </div>
    </motion.div>
  );
}
