import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, Heart, Activity, Truck } from "lucide-react";
import GoldenHourTimer from "@/components/shared/GoldenHourTimer";
import SurvivalProbability from "@/components/shared/SurvivalProbability";
import BloodGroupBadge from "@/components/shared/BloodGroupBadge";
import StatusBadge from "@/components/shared/StatusBadge";
import moment from 'moment';

export default function HospitalEmergency({ requests, hospital }) {
  const criticalRequests = requests.filter(r => 
    r.urgency === 'critical' && !['delivered', 'cancelled', 'rejected'].includes(r.status)
  );

  const urgentRequests = requests.filter(r =>
    r.urgency === 'urgent' && !['delivered', 'cancelled', 'rejected'].includes(r.status)
  );

  // Simulated hospital stats
  const icuLoad = hospital?.current_icu_load || Math.floor(Math.random() * 30) + 60;
  const capacityScore = hospital?.bed_capacity ? Math.round((1 - (icuLoad / 100)) * 100) : 75;

  return (
    <div className="space-y-6">
      {/* Emergency Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="bg-red-50 border border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-red-600">Critical Requests</p>
                <p className="text-2xl font-bold text-red-700">{criticalRequests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 border border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 rounded-xl">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-orange-600">Urgent Requests</p>
                <p className="text-2xl font-bold text-orange-700">{urgentRequests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Activity className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-blue-600">ICU Load</p>
                <p className="text-2xl font-bold text-blue-700">{icuLoad}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Critical Requests with Timers */}
      <Card className="bg-white border border-slate-100">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            Active Critical Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          {criticalRequests.length === 0 ? (
            <div className="text-center py-8">
              <Heart className="w-12 h-12 mx-auto mb-3 text-green-500" />
              <p className="text-slate-600">No critical requests at the moment</p>
            </div>
          ) : (
            <div className="space-y-4">
              {criticalRequests.map(req => (
                <div key={req.id} className="p-4 border border-red-200 rounded-lg bg-red-50">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <BloodGroupBadge group={req.blood_group} size="lg" />
                        <span className="font-semibold text-slate-800">{req.quantity} units</span>
                        <StatusBadge status={req.status} />
                      </div>
                      <p className="text-sm text-slate-600">
                        {req.patient_name && <span>Patient: {req.patient_name} • </span>}
                        {req.patient_condition}
                      </p>
                      <p className="text-sm text-slate-500">
                        From: {req.blood_bank_name} • Requested {moment(req.created_date).fromNow()}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      {req.golden_hour_deadline && (
                        <GoldenHourTimer deadline={req.golden_hour_deadline} showCard={false} />
                      )}
                      {req.survival_probability && (
                        <div className="text-center">
                          <Heart className={`w-6 h-6 mx-auto ${req.survival_probability > 70 ? 'text-green-500' : req.survival_probability > 40 ? 'text-yellow-500' : 'text-red-500'}`} />
                          <p className="text-lg font-bold">{req.survival_probability}%</p>
                          <p className="text-xs text-slate-500">Survival</p>
                        </div>
                      )}
                      {req.status === 'in_transit' && (
                        <div className="flex items-center gap-2 text-purple-600">
                          <Truck className="w-5 h-5" />
                          <span className="font-medium">In Transit</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Urgent Requests */}
      {urgentRequests.length > 0 && (
        <Card className="bg-white border border-slate-100">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-orange-600">
              <Clock className="w-5 h-5" />
              Urgent Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {urgentRequests.map(req => (
                <div key={req.id} className="p-3 border border-orange-200 rounded-lg bg-orange-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <BloodGroupBadge group={req.blood_group} />
                    <span className="font-medium">{req.quantity} units</span>
                    <StatusBadge status={req.status} />
                  </div>
                  <div className="text-sm text-slate-500">
                    {req.blood_bank_name} • {moment(req.created_date).fromNow()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hospital Capacity */}
      <Card className="bg-white border border-slate-100">
        <CardHeader>
          <CardTitle className="text-lg">Hospital Capacity Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 rounded-lg text-center">
              <p className="text-sm text-slate-500 mb-1">Capacity Score</p>
              <p className={`text-3xl font-bold ${capacityScore > 60 ? 'text-green-600' : capacityScore > 30 ? 'text-yellow-600' : 'text-red-600'}`}>
                {capacityScore}%
              </p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg text-center">
              <p className="text-sm text-slate-500 mb-1">ICU Occupancy</p>
              <p className={`text-3xl font-bold ${icuLoad < 70 ? 'text-green-600' : icuLoad < 85 ? 'text-yellow-600' : 'text-red-600'}`}>
                {icuLoad}%
              </p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg text-center">
              <p className="text-sm text-slate-500 mb-1">Available Beds</p>
              <p className="text-3xl font-bold text-blue-600">
                {hospital?.bed_capacity ? Math.round(hospital.bed_capacity * (1 - icuLoad/100)) : 25}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}