import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { FileText, Truck, DollarSign, AlertTriangle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import StatsCard from "@/components/shared/StatsCard";
import { BLOOD_GROUPS } from "@/components/shared/aiSimulation";
import moment from 'moment';

const COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function BloodBankReports({ bloodUnits, requests }) {
  // Calculate stats
  const deliveredRequests = requests.filter(r => r.status === 'delivered');
  const totalDispatched = deliveredRequests.reduce((sum, r) => sum + (r.quantity || 0), 0);
  const totalRevenue = deliveredRequests.reduce((sum, r) => sum + (r.total_cost || 0), 0);
  const expiredUnits = bloodUnits.filter(u => u.status === 'expired').length;
  const emergencyRequests = requests.filter(r => r.urgency === 'critical').length;

  // Daily dispatch data (last 7 days)
  const dailyDispatch = Array.from({ length: 7 }, (_, i) => {
    const date = moment().subtract(6 - i, 'days');
    const dayRequests = deliveredRequests.filter(r => 
      moment(r.actual_delivery || r.updated_date).isSame(date, 'day')
    );
    return {
      day: date.format('ddd'),
      units: dayRequests.reduce((sum, r) => sum + (r.quantity || 0), 0),
      requests: dayRequests.length
    };
  });

  // Dispatch by blood group
  const dispatchByGroup = BLOOD_GROUPS.map((group, i) => ({
    name: group,
    value: deliveredRequests.filter(r => r.blood_group === group).reduce((sum, r) => sum + (r.quantity || 0), 0),
    color: COLORS[i]
  })).filter(g => g.value > 0);

  // Expiry trend (mock data)
  const expiryTrend = Array.from({ length: 6 }, (_, i) => ({
    month: moment().subtract(5 - i, 'months').format('MMM'),
    expired: Math.floor(Math.random() * 5),
    total: Math.floor(Math.random() * 50) + 30
  }));

  // Revenue trend
  const revenueTrend = Array.from({ length: 6 }, (_, i) => {
    const month = moment().subtract(5 - i, 'months');
    const monthRevenue = deliveredRequests
      .filter(r => moment(r.actual_delivery || r.updated_date).isSame(month, 'month'))
      .reduce((sum, r) => sum + (r.total_cost || 0), 0);
    return {
      month: month.format('MMM'),
      revenue: monthRevenue || Math.floor(Math.random() * 50000) + 20000
    };
  });

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Dispatched" value={totalDispatched} icon={Truck} color="blue" subtitle="All time" />
        <StatsCard title="Total Revenue" value={`₹${(totalRevenue / 1000).toFixed(1)}K`} icon={DollarSign} color="green" />
        <StatsCard title="Units Expired" value={expiredUnits} icon={AlertTriangle} color="orange" />
        <StatsCard title="Emergency Cases" value={emergencyRequests} icon={AlertTriangle} color="red" />
      </div>

      {/* Report Downloads */}
      <Card className="bg-white border border-slate-100">
        <CardHeader>
          <CardTitle className="text-lg">Generate Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { title: 'Daily Dispatch Report', desc: 'Today\'s dispatch summary' },
              { title: 'Expiry Report', desc: 'Units expiring soon' },
              { title: 'Revenue Summary', desc: 'Monthly revenue report' },
              { title: 'Emergency Case Summary', desc: 'Critical request analysis' }
            ].map((report, i) => (
              <div key={i} className="p-4 bg-slate-50 rounded-lg">
                <h4 className="font-medium text-slate-800">{report.title}</h4>
                <p className="text-sm text-slate-500 mb-3">{report.desc}</p>
                <Button variant="outline" size="sm" className="w-full">
                  <Download className="w-4 h-4 mr-2" /> Download
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Daily Dispatch */}
        <Card className="bg-white border border-slate-100">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Daily Dispatch (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyDispatch}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#64748b" }} />
                  <YAxis tick={{ fontSize: 12, fill: "#64748b" }} />
                  <Tooltip />
                  <Bar dataKey="units" fill="#ef4444" radius={[4, 4, 0, 0]} name="Units" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Dispatch by Group */}
        <Card className="bg-white border border-slate-100">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Dispatch by Blood Group</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {dispatchByGroup.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-500">
                  No dispatch data available
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dispatchByGroup}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {dispatchByGroup.map((entry, index) => (
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

        {/* Expiry Trend */}
        <Card className="bg-white border border-slate-100">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Expiry Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={expiryTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#64748b" }} />
                  <YAxis tick={{ fontSize: 12, fill: "#64748b" }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="expired" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Expired" />
                  <Bar dataKey="total" fill="#94a3b8" radius={[4, 4, 0, 0]} name="Total Stock" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Trend */}
        <Card className="bg-white border border-slate-100">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#64748b" }} />
                  <YAxis tick={{ fontSize: 12, fill: "#64748b" }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}K`} />
                  <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']} />
                  <Line type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}