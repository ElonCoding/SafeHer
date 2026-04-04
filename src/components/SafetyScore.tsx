import { Shield } from "lucide-react";

interface SafetyScoreProps {
  score: number; // 0-100
}

const SafetyScore = ({ score }: SafetyScoreProps) => {
  const color = score >= 70 ? "text-safe" : score >= 40 ? "text-warning" : "text-danger";
  const bgColor = score >= 70 ? "bg-safe/5" : score >= 40 ? "bg-warning/5" : "bg-danger/5";
  const label = score >= 70 ? "Safe Area" : score >= 40 ? "Moderate Risk" : "High Risk";

  return (
    <div className={`flex items-center gap-4 p-4 rounded-3xl ${bgColor} border border-white/5 shadow-inner`}>
      <div className="relative">
        <Shield className={`w-10 h-10 ${color} drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]`} />
        {/* Decorative circle */}
        <div className={`absolute -inset-1 rounded-full border border-dashed animate-spin-slow opacity-20 ${color}`} />
      </div>
      <div>
        <div className="flex items-baseline gap-1.5">
          <span className={`text-3xl font-black tracking-tighter ${color}`}>{score}</span>
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Score</span>
        </div>
        <p className={`text-[11px] font-black uppercase tracking-widest ${color} opacity-80`}>{label}</p>
      </div>
    </div>
  );
};

export default SafetyScore;
