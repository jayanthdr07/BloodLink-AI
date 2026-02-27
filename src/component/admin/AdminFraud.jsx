import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ShieldAlert, TrendingUp, Users, CheckCircle, XCircle } from "lucide-react";
import { BLOOD_GROUPS } from "@/components/shared/aiSimulation";
import BloodGroupBadge from "@/components/shared/BloodGroupBadge";
import moment from 'moment';

export default function AdminFraudAlerts({ bloodBanks, hospitals, requests, bloodUnits }) {
  // Fraud detection heuristics
  const fraudAlerts = useMemo(() => {
    const alerts = [];

    // 1. Detect unusually high request volumes from single requester
    const requesterCounts = {};
    requests.forEach(r => {
      const key = r.hospital_name || r.requester_name || r.created_by;
      if (key) requesterCounts[key] = (requesterCounts[key] || 0) + r.quantity;
    });

    Object.entries(requesterCounts).forEach(([requester, total]) => {
      if (total > 100) {
        alerts.push({
          type: 'high',
          icon: AlertTriangle,
          title: 'Unusually High Volume',
          description: `${requester} has requested ${total} units total — above normal threshold.`,
          category: 'Volume Anomaly'
        });
      }
    });

    // 2. Detect unverified banks with activity
    bloodBanks.filter(b => !b.is_verified).forEach(bank => {
      const activity = bloodUnits.filter(u => u.blood_bank_id === bank.id).length;
      if (activity > 0) {
        alerts.push({
          type: 'critical',
          icon: ShieldAlert,
          title: 'Unverified Bank Activity',
          description: `${bank.name} is unverified but has ${activity} blood units recorded.`,
          category: 'Compliance Breach'
        });
      }
    });

    // 3. Detect price overrides (units priced differently from standard ₹1500)
    const priceMismatch = bloodUnits.filter(u => u.price && u.price !== 1500).length;
    if (priceMismatch > 0) {
      alerts.push({
        type: 'high',
        icon: TrendingUp,
        title: 'Non-Standard Pricing Detected',
        description: `${priceMismatch} units have non-standard pricing (not ₹1500).`,
        category: 'Pricing Violation'
      });
    }

    // 4. Detect rapid repeated requests (same blood group in short time)
    const recentRequests = requests.filter(r => new Date(r.created_date) > new Date(Date.now() - 60 * 60 * 1000));
    const groupCounts = {};
    recentRequests.forEach(r => { groupCounts[r.blood_group] = (groupCounts[r.blood_group] || 0) + 1; });
    Object.entries(groupCounts).forEach(([group, count]) => {
      if (count >= 5) {
        alerts.push({
          type: 'medium',
          icon: AlertTriangle,
          title: `Rapid Demand Spike — ${group}`,
          description: `${count} requests for ${group} blood in the last hour — possible hoarding.`,
          category: 'Demand Spike'
        });
      }
    });

    if (alerts.length === 0) {
      alerts.push({
        type: 'info',
        icon: CheckCircle,
        title: 'No Fraud Patterns Detected',
        description: 'System operating normally. All activity within expected parameters.',
        category: 'All Clear'
      });
    }

    return alerts;
  }, [bloodBanks, hospitals, requests, bloodUnits]);

  // Donor activation metrics
  const totalActiveDonors = Math.floor(Math.random() * 500) + 200;
  const newDonors30d = Math.floor(Math.random() * 80) + 20;
  const donorsNeeded = BLOOD_GROUPS.map(g => ({
    group: g,
    available: (requests.filter(r => r.blood_group === g).length || 0) + Math.floor(Math.random() * 30),
    needed: Math.floor(Math.random() * 60) + 10
  }));

  const typeColors = {
    critical: { bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-500 text-white', icon: 'text-red-500' },
    high: { bg: 'bg-orange-50', border: 'border-orange-200', badge: 'bg-orange-500 text-white', icon: 'text-orange-500' },
    medium: { bg: 'bg-yellow-50', border: 'border-yellow-200', badge: 'bg-yellow-500 text-white', icon: 'text-yellow-600' },
    info: { bg: 'bg-green-50', border: 'border-green-200', badge: 'bg-green-500 text-white', icon: 'text-green-500' },
  };

  return (
    <div className="space-y-6">
      {/* Fraud Detection Alerts */}
      <Card className="bg-white border border-slate-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-500" />
            Fraud Detection Alerts
            <Badge className="ml-auto bg-red-100 text-red-700">{fraudAlerts.filter(a => a.type !== 'info').length} alerts</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {fraudAlerts.map((alert, i) => {
            const style = typeColors[alert.type];
            return (
              <div key={i} className={`p-4 rounded-xl border ${style.bg} ${style.border} flex items-start gap-3`}>
                <alert.icon className={`w-5 h-5 mt-0.5 ${style.icon} flex-shrink-0`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-800 text-sm">{alert.title}</span>
                    <Badge className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600">{alert.category}</Badge>
                  </div>
                  <p className="text-sm text-slate-600 mt-1">{alert.description}</p>
                </div>
                <Badge className={`text-xs flex-shrink-0 ${style.badge}`}>{alert.type.toUpperCase()}</Badge>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Donor Activation Metrics */}
      <Card className="bg-white border border-slate-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            Donor Activation Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-blue-50 rounded-xl text-center border border-blue-100">
              <p className="text-3xl font-bold text-blue-600">{totalActiveDonors}</p>
              <p className="text-xs text-blue-700 mt-1">Active Donors</p>
            </div>
            <div className="p-4 bg-green-50 rounded-xl text-center border border-green-100">
              <p className="text-3xl font-bold text-green-600">+{newDonors30d}</p>
              <p className="text-xs text-green-700 mt-1">New (30 days)</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-xl text-center border border-purple-100">
              <p className="text-3xl font-bold text-purple-600">{Math.round((newDonors30d / totalActiveDonors) * 100)}%</p>
              <p className="text-xs text-purple-700 mt-1">Growth Rate</p>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-600">Donors Needed by Blood Group</p>
            {donorsNeeded.map(d => (
              <div key={d.group} className="flex items-center gap-3">
                <BloodGroupBadge group={d.group} size="sm" />
                <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-3 rounded-full bg-gradient-to-r from-red-400 to-red-600 transition-all" 
                    style={{ width: `${Math.min(100, (d.available / Math.max(1, d.needed)) * 100)}%` }}
                  />
                </div>
                <span className="text-xs text-slate-500 w-20 text-right">{d.available}/{d.needed} donors</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}