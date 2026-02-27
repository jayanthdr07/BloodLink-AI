import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingUp, MapPin, CheckCircle } from "lucide-react";
import BloodGroupBadge from "@/components/shared/BloodGroupBadge";
import { analyzeAreaShortage, getRiskLevel } from "@/components/shared/locationUtils";
import { BLOOD_GROUPS } from "@/components/shared/aiSimulation";

export default function AreaShortagePanel({ bloodBanks, bloodUnits, requests, compact = false, selectedBloodGroup = null }) {
  const areas = analyzeAreaShortage(bloodBanks, bloodUnits, requests);

  if (areas.length === 0) {
    return (
      <Card className="bg-white border border-slate-100">
        <CardContent className="py-8 text-center text-slate-500">
          <MapPin className="w-8 h-8 mx-auto mb-2 text-slate-300" />
          <p>No district data available yet</p>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    // Compact version for patient / blood bank dashboards
    const topRisk = areas.filter(a => a.overallRisk > 0).slice(0, 4);
    return (
      <div className="space-y-2">
        {topRisk.map(area => {
          const level = area.riskLevel;
          // If blood group filter active, show group-specific risk
          let groupRisk = null;
          if (selectedBloodGroup) {
            const ga = area.groupAnalysis.find(g => g.group === selectedBloodGroup);
            if (ga) groupRisk = getRiskLevel(ga.riskScore);
          }
          const displayLevel = groupRisk || level;

          return (
            <div key={area.district} className={`flex items-center justify-between px-3 py-2 rounded-lg border ${displayLevel.bg} ${displayLevel.border}`}>
              <div className="flex items-center gap-2">
                <span className="text-base">{displayLevel.emoji}</span>
                <span className={`text-sm font-medium ${displayLevel.text}`}>{area.district}</span>
                {selectedBloodGroup && groupRisk && (
                  <BloodGroupBadge group={selectedBloodGroup} size="sm" />
                )}
              </div>
              <div className="text-right">
                <span className={`text-xs font-semibold ${displayLevel.text}`}>{displayLevel.label}</span>
                <p className="text-xs text-slate-500">{area.totalAvailable} avail. / {area.totalDemand} needed</p>
              </div>
            </div>
          );
        })}
        {topRisk.length === 0 && (
          <div className="flex items-center gap-2 text-green-700 text-sm bg-green-50 border border-green-200 p-3 rounded-lg">
            <CheckCircle className="w-4 h-4" />
            All districts stable
          </div>
        )}
      </div>
    );
  }

  // Full heatmap for admin
  return (
    <div className="space-y-6">
      {/* Summary row */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-red-50 border border-red-200">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{areas.filter(a => a.overallRisk >= 60).length}</p>
            <p className="text-sm text-red-700">🔴 Critical Zones</p>
          </CardContent>
        </Card>
        <Card className="bg-orange-50 border border-orange-200">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-orange-600">{areas.filter(a => a.overallRisk >= 30 && a.overallRisk < 60).length}</p>
            <p className="text-sm text-orange-700">🟠 Moderate Risk</p>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border border-green-200">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{areas.filter(a => a.overallRisk < 30).length}</p>
            <p className="text-sm text-green-700">🟢 Stable Zones</p>
          </CardContent>
        </Card>
      </div>

      {/* District heatmap table */}
      <Card className="bg-white border border-slate-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            District Shortage Heatmap
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-2 px-3 font-medium text-slate-600">District</th>
                <th className="text-center py-2 px-2 font-medium text-slate-600">Banks</th>
                <th className="text-center py-2 px-2 font-medium text-slate-600">Available</th>
                <th className="text-center py-2 px-2 font-medium text-slate-600">Demand</th>
                <th className="text-center py-2 px-2 font-medium text-slate-600">Risk</th>
                {BLOOD_GROUPS.map(g => (
                  <th key={g} className="text-center py-2 px-1 font-medium text-slate-500 text-xs">{g}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {areas.map(area => {
                const level = area.riskLevel;
                return (
                  <tr key={area.district} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        <span>{level.emoji}</span>
                        <span className="font-medium text-slate-800">{area.district}</span>
                      </div>
                    </td>
                    <td className="text-center py-2 px-2 text-slate-600">{area.banks}</td>
                    <td className="text-center py-2 px-2 text-green-700 font-medium">{area.totalAvailable}</td>
                    <td className="text-center py-2 px-2 text-orange-700 font-medium">{area.totalDemand}</td>
                    <td className="text-center py-2 px-2">
                      <Badge className={`${level.bg} ${level.text} border ${level.border} text-xs`}>
                        {area.overallRisk}%
                      </Badge>
                    </td>
                    {area.groupAnalysis.map(ga => {
                      const gl = getRiskLevel(ga.riskScore);
                      return (
                        <td key={ga.group} className="text-center py-1 px-1">
                          <div className={`text-xs font-medium p-1 rounded ${gl.bg} ${gl.text}`}>
                            {ga.available}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* High risk alerts */}
      <Card className="bg-white border border-slate-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-slate-800">High-Risk Area Alerts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {areas.flatMap(area =>
            area.groupAnalysis
              .filter(ga => ga.riskScore >= 60)
              .map(ga => ({
                district: area.district,
                group: ga.group,
                available: ga.available,
                riskScore: ga.riskScore
              }))
          ).slice(0, 8).map((alert, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <div>
                  <p className="text-sm font-medium text-red-800">🔴 {alert.district} – <BloodGroupBadge group={alert.group} size="sm" /> shortage</p>
                  <p className="text-xs text-red-600">{alert.available} units available • {alert.riskScore}% risk</p>
                </div>
              </div>
              <Badge className="bg-red-500 text-white">Critical</Badge>
            </div>
          ))}
          {areas.filter(a => a.overallRisk >= 60).length === 0 && (
            <div className="flex items-center gap-2 text-green-700 text-sm">
              <CheckCircle className="w-4 h-4" />
              No critical shortage areas detected
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}