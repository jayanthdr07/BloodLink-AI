import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingUp, TrendingDown, Clock, RefreshCw, Zap, Package, MapPin } from "lucide-react";
import BloodGroupBadge from "@/components/shared/BloodGroupBadge";
import { predictShortage, BLOOD_GROUPS } from "@/components/shared/aiSimulation";
import { analyzeAreaShortage, getRiskLevel } from "@/components/shared/locationUtils";

export default function BloodBankAlerts({ bloodUnits, requests, bloodBanks = [], allBloodUnits = [], allRequests = [] }) {
  // Calculate current stock
  const currentStock = BLOOD_GROUPS.reduce((acc, group) => {
    acc[group] = bloodUnits.filter(u => u.blood_group === group && u.status === 'available').length;
    return acc;
  }, {});

  // Simulated average daily demand
  const avgDailyDemand = BLOOD_GROUPS.reduce((acc, group) => {
    acc[group] = Math.floor(Math.random() * 3) + 2;
    return acc;
  }, {});

  // Get predictions
  const predictions = predictShortage({ currentStock, avgDailyDemand, daysAhead: 7 });

  // Identify alerts
  const alerts = [];

  // Low stock alerts
  BLOOD_GROUPS.forEach(group => {
    const stock = currentStock[group];
    if (stock === 0) {
      alerts.push({
        type: 'critical',
        icon: AlertTriangle,
        title: `No ${group} Blood Available`,
        description: 'Immediate action required. Contact donors or request redistribution.',
        group,
        priority: 1
      });
    } else if (stock < 5) {
      alerts.push({
        type: 'warning',
        icon: TrendingDown,
        title: `Low ${group} Stock`,
        description: `Only ${stock} units remaining. Consider donor activation.`,
        group,
        priority: 2
      });
    }
  });

  // Expiring units alerts
  const expiringUnits = bloodUnits.filter(u => {
    if (u.status !== 'available') return false;
    const daysUntilExpiry = Math.ceil((new Date(u.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
  });

  if (expiringUnits.length > 0) {
    const byGroup = {};
    expiringUnits.forEach(u => {
      byGroup[u.blood_group] = (byGroup[u.blood_group] || 0) + 1;
    });
    
    Object.entries(byGroup).forEach(([group, count]) => {
      alerts.push({
        type: 'warning',
        icon: Clock,
        title: `${count} ${group} Units Expiring Soon`,
        description: 'Prioritize these units for upcoming requests to minimize wastage.',
        group,
        priority: 3
      });
    });
  }

  // Predicted shortage alerts
  predictions.forEach((day, i) => {
    if (i < 3) { // Only alert for next 3 days
      BLOOD_GROUPS.forEach(group => {
        const risk = day[group]?.shortageRisk || 0;
        if (risk > 70) {
          alerts.push({
            type: 'info',
            icon: TrendingUp,
            title: `Predicted ${group} Shortage in ${i + 1} days`,
            description: `${risk}% probability of shortage. Consider preemptive measures.`,
            group,
            priority: 4
          });
        }
      });
    }
  });

  // Demand spike alerts
  const recentCriticalRequests = requests.filter(r => 
    r.urgency === 'critical' && 
    new Date(r.created_date) > new Date(Date.now() - 24 * 60 * 60 * 1000)
  );

  if (recentCriticalRequests.length >= 3) {
    alerts.push({
      type: 'warning',
      icon: Zap,
      title: 'Demand Spike Detected',
      description: `${recentCriticalRequests.length} critical requests in the last 24 hours. Monitor inventory closely.`,
      priority: 2
    });
  }

  // Surplus detection
  BLOOD_GROUPS.forEach(group => {
    if (currentStock[group] > 20) {
      alerts.push({
        type: 'info',
        icon: Package,
        title: `${group} Surplus Detected`,
        description: `${currentStock[group]} units available. Consider redistribution to deficit banks.`,
        group,
        priority: 5
      });
    }
  });

  // Nearby area shortage analysis
  const nearbyAreas = analyzeAreaShortage(bloodBanks, allBloodUnits, allRequests)
    .filter(a => a.overallRisk >= 30)
    .slice(0, 5);

  // Sort by priority
  alerts.sort((a, b) => a.priority - b.priority);

  const alertStyles = {
    critical: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-orange-50 border-orange-200 text-orange-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  };

  const iconStyles = {
    critical: 'text-red-500',
    warning: 'text-orange-500',
    info: 'text-blue-500'
  };

  return (
    <div className="space-y-6">
      {/* AI Alerts Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-red-50 border border-red-200">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-red-600">{alerts.filter(a => a.type === 'critical').length}</p>
            <p className="text-sm text-red-700">Critical Alerts</p>
          </CardContent>
        </Card>
        <Card className="bg-orange-50 border border-orange-200">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-orange-600">{alerts.filter(a => a.type === 'warning').length}</p>
            <p className="text-sm text-orange-700">Warnings</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border border-blue-200">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-blue-600">{alerts.filter(a => a.type === 'info').length}</p>
            <p className="text-sm text-blue-700">Suggestions</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts List */}
      <Card className="bg-white border border-slate-100">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            AI-Generated Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="text-center py-8">
              <RefreshCw className="w-12 h-12 mx-auto mb-3 text-green-500" />
              <p className="text-slate-600">All systems normal. No alerts at this time.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert, i) => (
                <div key={i} className={`p-4 rounded-lg border ${alertStyles[alert.type]}`}>
                  <div className="flex items-start gap-3">
                    <alert.icon className={`w-5 h-5 mt-0.5 ${iconStyles[alert.type]}`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{alert.title}</h4>
                        {alert.group && <BloodGroupBadge group={alert.group} size="sm" />}
                      </div>
                      <p className="text-sm opacity-80 mt-1">{alert.description}</p>
                    </div>
                    <Badge className={
                      alert.type === 'critical' ? 'bg-red-500 text-white' :
                      alert.type === 'warning' ? 'bg-orange-500 text-white' :
                      'bg-blue-500 text-white'
                    }>
                      {alert.type}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Nearby Area Shortage Alerts */}
      {nearbyAreas.length > 0 && (
        <Card className="bg-white border border-slate-100">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="w-5 h-5 text-orange-500" />
              Nearby Area Demand Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {nearbyAreas.map(area => {
              const level = getRiskLevel(area.overallRisk);
              // Find highest risk blood group in this area
              const topGroup = [...area.groupAnalysis].sort((a, b) => b.riskScore - a.riskScore)[0];
              return (
                <div key={area.district} className={`p-3 rounded-lg border ${level.bg} ${level.border}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className={`text-sm font-semibold ${level.text}`}>
                        {level.emoji} High demand in {area.district}
                        {topGroup && <span> for {topGroup.group}</span>}
                      </p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {area.totalAvailable} units available vs {area.totalDemand} units needed
                      </p>
                      {topGroup && topGroup.riskScore >= 60 && (
                        <p className="text-xs text-slate-500 mt-1 italic">
                          💡 Suggested transfer: {Math.max(1, topGroup.demanded - topGroup.available)} units to {area.district}
                        </p>
                      )}
                    </div>
                    <Badge className={`${level.bg} ${level.text} border ${level.border} text-xs`}>{area.overallRisk}% risk</Badge>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Shortage Prediction */}
      <Card className="bg-white border border-slate-100">
        <CardHeader>
          <CardTitle className="text-lg">7-Day Shortage Risk Forecast</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left p-2 text-sm font-medium text-slate-500">Group</th>
                  {Array.from({ length: 7 }).map((_, i) => (
                    <th key={i} className="text-center p-2 text-sm font-medium text-slate-500">Day {i + 1}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {BLOOD_GROUPS.map(group => (
                  <tr key={group}>
                    <td className="p-2"><BloodGroupBadge group={group} size="sm" /></td>
                    {predictions.map((day, i) => {
                      const risk = day[group]?.shortageRisk || 0;
                      let bgColor = 'bg-green-100 text-green-700';
                      if (risk > 70) bgColor = 'bg-red-100 text-red-700';
                      else if (risk > 40) bgColor = 'bg-orange-100 text-orange-700';
                      else if (risk > 20) bgColor = 'bg-yellow-100 text-yellow-700';
                      
                      return (
                        <td key={i} className="p-1">
                          <div className={`text-center text-xs font-medium p-2 rounded ${bgColor}`}>
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
        </CardContent>
      </Card>
    </div>
  );
}