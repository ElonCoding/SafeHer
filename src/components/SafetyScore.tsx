import { Shield } from "lucide-react";

interface SafetyScoreProps {
  score: number; // 0-100
}

const SafetyScore = ({ score }: SafetyScoreProps) => {
  const color = score >= 70 ? "text-safe" : score >= 40 ? "text-warning" : "text-danger";
  const bgColor = score >= 70 ? "bg-safe/10" : score >= 40 ? "bg-warning/10" : "bg-danger/10";
  const label = score >= 70 ? "Safe Area" : score >= 40 ? "Moderate Risk" : "High Risk";

  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl ${bgColor}`}>
      <Shield className={`w-8 h-8 ${color}`} />
      <div>
        <div className="flex items-center gap-2">
          <span className={`text-2xl font-black ${color}`}>{score}</span>
          <span className="text-xs text-muted-foreground">/100</span>
        </div>
        <p className={`text-xs font-semibold ${color}`}>{label}</p>
      </div>
    </div>
  );
};

export default SafetyScore;
