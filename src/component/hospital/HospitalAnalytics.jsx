import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { TrendingUp, Droplet, DollarSign, Calendar } from "lucide-react";
import StatsCard from "@/components/shared/StatsCard";
import { BLOOD_GROUPS } from "@/components/shared/aiSimulation";
import moment from 'moment';

const COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function HospitalAnalytics({ requests, bloodUnits }) {
  // Monthly usage data
  const deliveredRequests = requests.filter(r => r.status === 'delivered');
  
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const month = moment().subtract(5 - i, 'months');
    const monthRequests = deliveredRequests.filter(r => 
      moment(r.actual_delivery || r.updated_date).isSame(month, 'month')
    );
    return {
      month: month.format('MMM'),
      units: monthRequests.reduce((sum, r) => sum + (r.quantity || 0), 0),
      cost: monthRequests.reduce((sum, r) => sum + (r.total_cost || 0), 0)
    };
  });

  // Blood group usage
  const groupUsage = BLOOD_GROUPS.map((group, i) => ({
    name: group,
    value: deliveredRequests.filter(r => r.blood_group === group).reduce((sum, r) => sum + (r.quantity || 0), 0),
    color: COLORS[i]
  })).filter(g => g.value > 0);

  // High demand patterns (by day of week)
  const dayOfWeekData = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => ({
    day,
    requests: deliveredRequests.filter(r => moment(r.created_date).day() === i).length
  }));

  // Stats
  const totalUnitsUsed = deliveredRequests.reduce((sum, r) => sum + (r.quantity || 0), 0);
  const totalCost = deliveredRequests.reduce((sum, r) => sum + (r.total_cost || 0), 0);
  const avgResponseTime = 28; // Simulated

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Units Used" value={totalUnitsUsed} icon={Droplet} color="red" subtitle="All time" />
        <StatsCard title="Total Expenditure" value={`₹${(totalCost / 1000).toFixed(1)}K`} icon={DollarSign} color="green" />
        <StatsCard title="Total Requests" value={requests.length} icon={Calendar} color="blue" />
        <StatsCard title="Avg Response Time" value={`${avgResponseTime} min`} icon={TrendingUp} color="purple" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Monthly Usage Trend */}
        <Card className="bg-white border border-slate-100">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Monthly Blood Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#64748b" }} />
                  <YAxis tick={{ fontSize: 12, fill: "#64748b" }} />
                  <Tooltip />
                  <Bar dataKey="units" fill="#ef4444" radius={[4, 4, 0, 0]} name="Units" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Blood Group Distribution */}
        <Card className="bg-white border border-slate-100">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Usage by Blood Group</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {groupUsage.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-500">
                  No usage data available
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={groupUsage}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {groupUsage.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* High Demand Patterns */}
        <Card className="bg-white border border-slate-100">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Demand by Day of Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dayOfWeekData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#64748b" }} />
                  <YAxis tick={{ fontSize: 12, fill: "#64748b" }} />
                  <Tooltip />
                  <Bar dataKey="requests" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Requests" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Cost Tracking */}
        <Card className="bg-white border border-slate-100">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Monthly Cost Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#64748b" }} />
                  <YAxis tick={{ fontSize: 12, fill: "#64748b" }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}K`} />
                  <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Cost']} />
                  <Line type="monotone" dataKey="cost" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}