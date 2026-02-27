import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Phone, Star, AlertTriangle, CheckCircle } from "lucide-react";
import BloodGroupBadge from "@/components/shared/BloodGroupBadge";
import { getRiskLevel, calculateSmartETA } from "@/components/shared/locationUtils";
import { BLOOD_GROUPS } from "@/components/shared/aiSimulation";

export default function NearbyBanksList({ banks, selectedBloodGroup, urgency = 'routine', onSelect }) {
  if (!banks || banks.length === 0) {
    return (
      <div className="text-center py-10 text-slate-500">
        <MapPin className="w-10 h-10 mx-auto mb-2 text-slate-300" />
        <p className="font-medium">No blood banks found</p>
        <p className="text-sm mt-1">Try selecting a different district or blood group</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {banks.map((bank, i) => {
        const stock = bank.stock || {};
        const groupUnits = selectedBloodGroup ? (stock[selectedBloodGroup] || 0) : Object.values(stock).reduce((a, b) => a + b, 0);
        const eta = bank.distance !== null ? calculateSmartETA(bank.distance, urgency) : null;
        const isGoldenHourRisk = urgency === 'critical' && eta !== null && eta > 60;
        const isNearest = i === 0;
        const shortage = groupUnits === 0 ? 100 : groupUnits < 3 ? 70 : 0;
        const riskLevel = getRiskLevel(shortage);

        return (
          <Card
            key={bank.id}
            className={`border transition-all cursor-pointer hover:shadow-md ${
              isNearest ? 'border-green-300 bg-green-50' :
              groupUnits === 0 ? 'border-red-200 bg-red-50 opacity-70' :
              'border-slate-200 bg-white hover:border-blue-200'
            }`}
            onClick={() => onSelect && groupUnits > 0 && onSelect(bank)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {isNearest && <Badge className="bg-green-500 text-white text-xs">📍 Nearest</Badge>}
                    {isGoldenHourRisk && (
                      <Badge className="bg-red-600 text-white text-xs animate-pulse">🚨 High Risk ETA</Badge>
                    )}
                    <h4 className="font-semibold text-slate-800">{bank.name}</h4>
                  </div>
                  <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3" />
                    {bank.area || bank.district}
                    {bank.distance !== null && (
                      <span className="font-medium text-blue-600 ml-1">• {bank.distance} km</span>
                    )}
                  </p>
                  {bank.contact_phone && (
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3" /> {bank.contact_phone}
                    </p>
                  )}

                  {/* Blood group stock summary */}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {selectedBloodGroup ? (
                      <div className="flex items-center gap-2">
                        <BloodGroupBadge group={selectedBloodGroup} size="sm" />
                        <span className={`text-sm font-semibold ${groupUnits > 0 ? 'text-green-700' : 'text-red-600'}`}>
                          {groupUnits} units
                        </span>
                      </div>
                    ) : (
                      BLOOD_GROUPS.filter(g => (stock[g] || 0) > 0).slice(0, 6).map(g => (
                        <div key={g} className="flex items-center gap-1 bg-slate-100 rounded px-1.5 py-0.5">
                          <BloodGroupBadge group={g} size="sm" />
                          <span className="text-xs font-medium text-slate-700">{stock[g]}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="text-right flex-shrink-0 space-y-1">
                  {eta !== null && (
                    <div className={`flex items-center gap-1 justify-end ${isGoldenHourRisk ? 'text-red-600' : 'text-slate-600'}`}>
                      <Clock className="w-3 h-3" />
                      <span className="text-sm font-medium">{eta} min</span>
                    </div>
                  )}
                  {bank.rating && (
                    <div className="flex items-center gap-1 justify-end">
                      <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                      <span className="text-xs text-slate-600">{bank.rating}</span>
                    </div>
                  )}
                  {groupUnits > 0 ? (
                    <Badge className="bg-green-100 text-green-700 border border-green-200 text-xs">
                      <CheckCircle className="w-3 h-3 mr-1" /> Available
                    </Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-700 border border-red-200 text-xs">
                      <AlertTriangle className="w-3 h-3 mr-1" /> No Stock
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}