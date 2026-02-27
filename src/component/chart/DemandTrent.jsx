import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function DemandTrendChart({ data, title = "7-Day Demand Forecast" }) {
  return (
    <Card className="bg-white border border-slate-100">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-slate-800">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#64748b" }} tickFormatter={(v) => `Day ${v}`} />
              <YAxis tick={{ fontSize: 12, fill: "#64748b" }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "white", 
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)"
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="demand" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} name="Predicted Demand" />
              <Line type="monotone" dataKey="stock" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} name="Projected Stock" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}