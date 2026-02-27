import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, X, Download, Truck, Check, Clock } from "lucide-react";
import BloodGroupBadge from "@/components/shared/BloodGroupBadge";
import UrgencyBadge from "@/components/shared/UrgencyBadge";
import StatusBadge from "@/components/shared/StatusBadge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import moment from 'moment';

export default function HospitalBookings({ requests }) {
  const [selectedRequest, setSelectedRequest] = useState(null);
  const queryClient = useQueryClient();

  const activeRequests = requests.filter(r => ['pending', 'approved', 'in_transit'].includes(r.status));
  const historyRequests = requests.filter(r => ['delivered', 'cancelled', 'rejected'].includes(r.status));

  const handleCancel = async (request) => {
    if (window.confirm('Are you sure you want to cancel this request?')) {
      await base44.entities.BloodRequest.update(request.id, { status: 'cancelled' });
      queryClient.invalidateQueries(['requests']);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'approved': return <Check className="w-4 h-4 text-blue-500" />;
      case 'in_transit': return <Truck className="w-4 h-4 text-purple-500" />;
      case 'delivered': return <Check className="w-4 h-4 text-green-500" />;
      default: return <X className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="bg-white border border-slate-200 p-1 mb-4">
          <TabsTrigger value="active">Active Requests ({activeRequests.length})</TabsTrigger>
          <TabsTrigger value="history">History ({historyRequests.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <Card className="bg-white border border-slate-100">
            <CardContent className="p-0">
              {activeRequests.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Clock className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p>No active requests</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Request ID</TableHead>
                      <TableHead>Blood Group</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Urgency</TableHead>
                      <TableHead>Blood Bank</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>ETA</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeRequests.map(req => (
                      <TableRow key={req.id}>
                        <TableCell className="font-mono text-sm">{req.request_number || req.id.slice(0,8)}</TableCell>
                        <TableCell><BloodGroupBadge group={req.blood_group} size="sm" /></TableCell>
                        <TableCell>{req.quantity}</TableCell>
                        <TableCell><UrgencyBadge urgency={req.urgency} /></TableCell>
                        <TableCell>{req.blood_bank_name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(req.status)}
                            <StatusBadge status={req.status} />
                          </div>
                        </TableCell>
                        <TableCell>
                          {req.estimated_delivery ? moment(req.estimated_delivery).fromNow() : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="ghost" onClick={() => setSelectedRequest(req)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            {req.status === 'pending' && (
                              <Button size="sm" variant="ghost" className="text-red-500" onClick={() => handleCancel(req)}>
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card className="bg-white border border-slate-100">
            <CardContent className="p-0">
              {historyRequests.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Clock className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p>No request history</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Request ID</TableHead>
                      <TableHead>Blood Group</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Blood Bank</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historyRequests.map(req => (
                      <TableRow key={req.id}>
                        <TableCell className="font-mono text-sm">{req.request_number || req.id.slice(0,8)}</TableCell>
                        <TableCell><BloodGroupBadge group={req.blood_group} size="sm" /></TableCell>
                        <TableCell>{req.quantity}</TableCell>
                        <TableCell>{req.blood_bank_name}</TableCell>
                        <TableCell><StatusBadge status={req.status} /></TableCell>
                        <TableCell className="text-sm text-slate-500">
                          {moment(req.actual_delivery || req.updated_date).format('MMM D, YYYY')}
                        </TableCell>
                        <TableCell>₹{(req.total_cost || 0).toLocaleString()}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="ghost" onClick={() => setSelectedRequest(req)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Request Details Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Request Details</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Request ID</p>
                  <p className="font-mono font-medium">{selectedRequest.request_number || selectedRequest.id.slice(0,12)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Status</p>
                  <StatusBadge status={selectedRequest.status} />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Blood Group</p>
                  <BloodGroupBadge group={selectedRequest.blood_group} />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Quantity</p>
                  <p className="font-medium">{selectedRequest.quantity} units</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Urgency</p>
                  <UrgencyBadge urgency={selectedRequest.urgency} />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Total Cost</p>
                  <p className="font-medium">₹{(selectedRequest.total_cost || 0).toLocaleString()}</p>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <p className="text-sm text-slate-500 mb-1">Blood Bank</p>
                <p className="font-medium">{selectedRequest.blood_bank_name}</p>
              </div>

              {selectedRequest.patient_name && (
                <div className="border-t pt-4">
                  <p className="text-sm text-slate-500 mb-1">Patient</p>
                  <p className="font-medium">{selectedRequest.patient_name}</p>
                  {selectedRequest.patient_condition && (
                    <p className="text-sm text-slate-600">{selectedRequest.patient_condition}</p>
                  )}
                </div>
              )}

              <div className="border-t pt-4 flex gap-2">
                {selectedRequest.status === 'delivered' && (
                  <Button variant="outline" className="w-full">
                    <Download className="w-4 h-4 mr-2" /> Download Receipt
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}