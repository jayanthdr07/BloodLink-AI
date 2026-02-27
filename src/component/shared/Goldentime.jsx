import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function GoldenHourTimer({ deadline, showCard = true }) {
  const [timeLeft, setTimeLeft] = useState(null);
  const [status, setStatus] = useState("safe");

  useEffect(() => {
    if (!deadline) return;

    const calculateTime = () => {
      const now = new Date();
      const deadlineDate = new Date(deadline);
      const diff = deadlineDate - now;
      
      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        setStatus("expired");
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds });
      
      if (hours === 0 && minutes < 15) setStatus("critical");
      else if (hours === 0 && minutes < 30) setStatus("warning");
      else setStatus("safe");
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  if (!timeLeft) return null;

  const statusColors = {
    safe: "bg-green-50 border-green-200 text-green-700",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-700",
    critical: "bg-red-50 border-red-200 text-red-700 animate-pulse",
    expired: "bg-slate-50 border-slate-200 text-slate-700"
  };

  const content = (
    <div className={cn("flex items-center gap-3", !showCard && statusColors[status], !showCard && "px-3 py-2 rounded-lg border")}>
      {status === "critical" ? (
        <AlertTriangle className="w-5 h-5" />
      ) : (
        <Clock className="w-5 h-5" />
      )}
      <div>
        <p className="text-xs font-medium uppercase tracking-wider opacity-70">Golden Hour</p>
        <p className="text-xl font-mono font-bold">
          {String(timeLeft.hours).padStart(2, '0')}:
          {String(timeLeft.minutes).padStart(2, '0')}:
          {String(timeLeft.seconds).padStart(2, '0')}
        </p>
      </div>
    </div>
  );

  if (!showCard) return content;

  return (
    <Card className={cn("p-4 border", statusColors[status])}>
      {content}
    </Card>
  );
}