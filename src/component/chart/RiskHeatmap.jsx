import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { BLOOD_GROUPS } from '../shared/aiSimulation';

export default function RiskHeatmap({ data, title = "Blood Group Risk Heatmap" }) {
  const getRiskColor = (risk) => {
    if (risk >= 80) return "bg-red-500 text-white";
    if (risk >= 60) return "bg-orange-400 text-white";
    if (risk >= 40) return "bg-yellow-400 text-yellow-900";
    if (risk >= 20) return "bg-green-300 text-green-900";
    return "bg-green-500 text-white";
  };

  const days = data?.length || 7;

  return (
    <Card className="bg-white border border-slate-100">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-slate-800">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-xs font-medium text-slate-500 text-left p-2">Group</th>
                {Array.from({ length: days }).map((_, i) => (
                  <th key={i} className="text-xs font-medium text-slate-500 text-center p-2">Day {i + 1}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {BLOOD_GROUPS.map(group => (
                <tr key={group}>
                  <td className="text-sm font-bold text-slate-700 p-2">{group}</td>
                  {Array.from({ length: days }).map((_, i) => {
                    const risk = data?.[i]?.[group]?.shortageRisk || Math.floor(Math.random() * 100);
                    return (
                      <td key={i} className="p-1">
                        <div className={cn("text-xs font-medium text-center p-2 rounded", getRiskColor(risk))}>
                          {risk}%
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-center gap-4 mt-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-green-500"></div>
            <span>Low</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-yellow-400"></div>
            <span>Medium</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-orange-400"></div>
            <span>High</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-red-500"></div>
            <span>Critical</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}