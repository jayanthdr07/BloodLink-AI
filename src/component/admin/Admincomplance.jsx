import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, CheckCircle, XCircle, AlertTriangle, FileText, Clock, Building2, Hospital } from "lucide-react";
import moment from 'moment';

export default function AdminCompliance({ bloodBanks, hospitals }) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(null);

  const { data: auditLogs = [] } = useQuery({
    queryKey: ['auditLogs'],
    queryFn: () => base44.entities.AuditLog.list('-created_date', 50)
  });

  const pendingBanks = bloodBanks.filter(b => !b.is_verified);
  const pendingHospitals = hospitals.filter(h => !h.is_verified);

  const handleVerify = async (type, entity) => {
    setLoading(entity.id);
    if (type === 'bloodBank') {
      await base44.entities.BloodBank.update(entity.id, { is_verified: true });
      await base44.entities.AuditLog.create({
        action_type: 'user_verified',
        entity_type: 'BloodBank',
        entity_id: entity.id,
        description: `Verified blood bank: ${entity.name}`
      });
    } else {
      await base44.entities.Hospital.update(entity.id, { is_verified: true });
      await base44.entities.AuditLog.create({
        action_type: 'user_verified',
        entity_type: 'Hospital',
        entity_id: entity.id,
        description: `Verified hospital: ${entity.name}`
      });
    }
    queryClient.invalidateQueries(['bloodBanks']);
    queryClient.invalidateQueries(['hospitals']);
    queryClient.invalidateQueries(['auditLogs']);
    setLoading(null);
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'request_created': return <FileText className="w-4 h-4 text-blue-500" />;
      case 'request_approved': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'request_rejected': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'user_verified': return <Shield className="w-4 h-4 text-purple-500" />;
      case 'alert_triggered': return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      default: return <Clock className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="verification" className="w-full">
        <TabsList className="bg-white border border-slate-200 p-1 mb-4">
          <TabsTrigger value="verification">Pending Verification</TabsTrigger>
          <TabsTrigger value="auditLog">Audit Logs</TabsTrigger>
          <TabsTrigger value="pricing">Pricing Controls</TabsTrigger>
        </TabsList>

        <TabsContent value="verification">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Pending Blood Banks */}
            <Card className="bg-white border border-slate-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-red-500" />
                  Pending Blood Banks ({pendingBanks.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pendingBanks.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                    <p>All blood banks verified</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingBanks.map(bank => (
                      <div key={bank.id} className="p-4 bg-slate-50 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium text-slate-800">{bank.name}</h4>
                            <p className="text-sm text-slate-500">{bank.district}</p>
                            <p className="text-xs text-slate-400 mt-1">License: {bank.license_number || 'Not provided'}</p>
                          </div>
                          <Button 
                            size="sm" 
                            onClick={() => handleVerify('bloodBank', bank)}
                            disabled={loading === bank.id}
                            className="bg-green-500 hover:bg-green-600"
                          >
                            {loading === bank.id ? 'Verifying...' : 'Verify'}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pending Hospitals */}
            <Card className="bg-white border border-slate-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                  <Hospital className="w-5 h-5 text-blue-500" />
                  Pending Hospitals ({pendingHospitals.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pendingHospitals.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                    <p>All hospitals verified</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingHospitals.map(hospital => (
                      <div key={hospital.id} className="p-4 bg-slate-50 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium text-slate-800">{hospital.name}</h4>
                            <p className="text-sm text-slate-500">{hospital.district}</p>
                            <p className="text-xs text-slate-400 mt-1">Type: {hospital.hospital_type || 'Not specified'}</p>
                          </div>
                          <Button 
                            size="sm" 
                            onClick={() => handleVerify('hospital', hospital)}
                            disabled={loading === hospital.id}
                            className="bg-green-500 hover:bg-green-600"
                          >
                            {loading === hospital.id ? 'Verifying...' : 'Verify'}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="auditLog">
          <Card className="bg-white border border-slate-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-slate-800">System Audit Log</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map(log => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getActionIcon(log.action_type)}
                          <span className="capitalize text-sm">{log.action_type?.replace(/_/g, ' ')}</span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-md truncate">{log.description}</TableCell>
                      <TableCell className="text-sm text-slate-500">{log.user_email || log.created_by || 'System'}</TableCell>
                      <TableCell className="text-sm text-slate-500">{moment(log.created_date).fromNow()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pricing">
          <Card className="bg-white border border-slate-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-slate-800">Standardized Pricing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(group => (
                  <div key={group} className="p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className="bg-red-100 text-red-700">{group}</Badge>
                      <span className="text-lg font-bold text-slate-800">₹1,500</span>
                    </div>
                    <p className="text-xs text-slate-500">Per unit (450ml)</p>
                  </div>
                ))}
              </div>
              <p className="text-sm text-slate-500 mt-4 text-center">
                * Prices are standardized across all blood banks for fair pricing
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}