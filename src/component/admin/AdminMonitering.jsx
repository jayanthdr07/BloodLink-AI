import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Building2, Hospital, MapPin, Phone, CheckCircle, XCircle } from "lucide-react";
import BloodGroupBadge from "@/components/shared/BloodGroupBadge";
import UrgencyBadge from "@/components/shared/UrgencyBadge";
import StatusBadge from "@/components/shared/StatusBadge";
import BloodStockChart from "@/components/charts/BloodStockChart";
import AreaShortagePanel from "@/components/shared/AreaShortagePanel";
import moment from 'moment';

export default function AdminMonitoring({ bloodUnits, bloodBanks, hospitals, requests, stockByGroup }) {
  const recentRequests = [...requests]
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
    .slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Area Shortage Heatmap */}
      <AreaShortagePanel bloodBanks={bloodBanks} bloodUnits={bloodUnits} requests={requests} />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Blood Stock Overview */}
        <div className="lg:col-span-2">
          <BloodStockChart data={stockByGroup} title="District-Wide Blood Stock" />
        </div>

        {/* Quick Stats */}
        <Card className="bg-white border border-slate-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-slate-800">Stock Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(stockByGroup).map(([group, count]) => (
              <div key={group} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                <BloodGroupBadge group={group} />
                <span className="font-semibold text-slate-700">{count} units</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent Requests */}
      <Card className="bg-white border border-slate-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-slate-800">Recent Blood Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Request ID</TableHead>
                <TableHead>Requester</TableHead>
                <TableHead>Blood Group</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Urgency</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentRequests.map(req => (
                <TableRow key={req.id}>
                  <TableCell className="font-mono text-sm">{req.request_number || req.id.slice(0,8)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {req.requester_type === 'hospital' ? <Hospital className="w-4 h-4 text-blue-500" /> : <Building2 className="w-4 h-4 text-green-500" />}
                      <span>{req.requester_name || req.hospital_name || 'Patient'}</span>
                    </div>
                  </TableCell>
                  <TableCell><BloodGroupBadge group={req.blood_group} size="sm" /></TableCell>
                  <TableCell>{req.quantity}</TableCell>
                  <TableCell><UrgencyBadge urgency={req.urgency} /></TableCell>
                  <TableCell><StatusBadge status={req.status} /></TableCell>
                  <TableCell className="text-slate-500 text-sm">{moment(req.created_date).fromNow()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Blood Banks & Hospitals Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Blood Banks */}
        <Card className="bg-white border border-slate-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-red-500" />
              Blood Banks ({bloodBanks.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {bloodBanks.map(bank => (
                <div key={bank.id} className="p-3 bg-slate-50 rounded-lg flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-800">{bank.name}</p>
                    <p className="text-sm text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {bank.district}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {bank.is_verified ? (
                      <Badge className="bg-green-100 text-green-700 border-green-200">
                        <CheckCircle className="w-3 h-3 mr-1" /> Verified
                      </Badge>
                    ) : (
                      <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">
                        <XCircle className="w-3 h-3 mr-1" /> Pending
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Hospitals */}
        <Card className="bg-white border border-slate-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <Hospital className="w-5 h-5 text-blue-500" />
              Hospitals ({hospitals.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {hospitals.map(hospital => (
                <div key={hospital.id} className="p-3 bg-slate-50 rounded-lg flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-800">{hospital.name}</p>
                    <p className="text-sm text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {hospital.district}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {hospital.is_verified ? (
                      <Badge className="bg-green-100 text-green-700 border-green-200">
                        <CheckCircle className="w-3 h-3 mr-1" /> Verified
                      </Badge>
                    ) : (
                      <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">
                        <XCircle className="w-3 h-3 mr-1" /> Pending
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}