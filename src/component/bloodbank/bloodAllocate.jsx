import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Check, X, Zap, ArrowRight, Clock, AlertTriangle, Info } from "lucide-react";
import BloodGroupBadge from "@/components/shared/BloodGroupBadge";
import UrgencyBadge from "@/components/shared/UrgencyBadge";
import StatusBadge from "@/components/shared/StatusBadge";
import { allocateUnitsFIFO } from "@/components/shared/aiSimulation";
import moment from 'moment';

export default function BloodBankSmartAllocation({ bloodBank, requests, bloodUnits, onSuccess }) {
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [loading, setLoading] = useState(null);

  const pendingRequests = requests
    .filter(r => r.status === 'pending')
    .sort((a, b) => {
      const urgencyOrder = { critical: 0, urgent: 1, standard: 2, routine: 3 };
      return (urgencyOrder[a.urgency] || 2) - (urgencyOrder[b.urgency] || 2);
    });

  const getSuggestedUnits = (request) => {
    const available = bloodUnits.filter(u => u.blood_group === request.blood_group && u.status === 'available');
    return allocateUnitsFIFO(available, request.quantity);
  };

  const getAvailableCount = (bloodGroup) =>
    bloodUnits.filter(u => u.blood_group === bloodGroup && u.status === 'available').length;

  const handleApprove = async (request) => {
    setLoading(request.id);
    const suggested = getSuggestedUnits(request);
    for (const unit of suggested) {
      await base44.entities.BloodUnit.update(unit.id, { status: 'reserved' });
    }
    await base44.entities.BloodRequest.update(request.id, { status: 'approved' });
    await base44.entities.AuditLog.create({
      action_type: 'request_approved',
      entity_type: 'BloodRequest',
      entity_id: request.id,
      description: `Smart allocation approved: ${request.quantity} units of ${request.blood_group} (FIFO) for ${request.hospital_name || 'Patient'}`
    });
    setLoading(null);
    setSelectedRequest(null);
    onSuccess?.();
  };

  const handleReject = async (request) => {
    setLoading(request.id);
    await base44.entities.BloodRequest.update(request.id, { status: 'rejected', rejection_reason: 'Insufficient stock or allocation denied' });
    await base44.entities.AuditLog.create({
      action_type: 'request_rejected',
      entity_type: 'BloodRequest',
      entity_id: request.id,
      description: `Rejected request for ${request.quantity} units of ${request.blood_group}`
    });
    setLoading(null);
    onSuccess?.();
  };

  const FIFOPreview = ({ request }) => {
    const suggested = getSuggestedUnits(request);
    return (
      <div className="mt-4">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-yellow-500" />
          <p className="text-sm font-semibold text-slate-700">FIFO Auto-Suggested Units ({suggested.length} of {request.quantity} needed)</p>
        </div>
        {suggested.length === 0 ? (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            <AlertTriangle className="w-4 h-4 inline mr-2" />
            No matching units available for {request.blood_group}
          </div>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {suggested.map((unit, i) => {
              const daysLeft = Math.ceil((new Date(unit.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
              return (
                <div key={unit.id} className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded-lg text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">{i + 1}</span>
                    <span className="font-mono text-xs text-slate-600">{unit.id.slice(0, 10)}...</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={daysLeft <= 3 ? 'bg-red-100 text-red-700' : daysLeft <= 7 ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}>
                      <Clock className="w-3 h-3 mr-1" />{daysLeft}d left
                    </Badge>
                    <span className="text-xs text-slate-500">{unit.collection_date ? moment(unit.collection_date).format('MMM D') : 'N/A'}</span>
                  </div>
                </div>
              );
            })}
            {suggested.length < request.quantity && (
              <div className="p-2 bg-orange-50 border border-orange-200 rounded-lg text-xs text-orange-700">
                ⚠ Only {suggested.length} units available. Partial allocation possible.
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header info */}
      <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
        <Zap className="w-5 h-5 text-yellow-600 flex-shrink-0" />
        <div>
          <p className="font-semibold text-yellow-800 text-sm">Smart Allocation — FIFO Mode</p>
          <p className="text-xs text-yellow-700 mt-0.5">Units are auto-suggested using First-In-First-Out (earliest expiry first) to minimize wastage.</p>
        </div>
      </div>

      {/* Pending requests sorted by urgency */}
      <Card className="bg-white border border-slate-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-slate-800">
            Incoming Requests — Sorted by Urgency
            <Badge className="ml-2 bg-slate-100 text-slate-600">{pendingRequests.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {pendingRequests.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              <Check className="w-12 h-12 mx-auto mb-3 text-green-400" />
              <p>No pending requests</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request</TableHead>
                  <TableHead>Requester</TableHead>
                  <TableHead>Blood Group</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Urgency</TableHead>
                  <TableHead>Stock Available</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingRequests.map(req => {
                  const available = getAvailableCount(req.blood_group);
                  const canFulfill = available >= req.quantity;
                  return (
                    <TableRow key={req.id} className={req.urgency === 'critical' ? 'bg-red-50' : ''}>
                      <TableCell className="font-mono text-xs">{req.request_number || req.id.slice(0, 8)}</TableCell>
                      <TableCell className="text-sm">{req.hospital_name || req.requester_name || 'Patient'}</TableCell>
                      <TableCell><BloodGroupBadge group={req.blood_group} /></TableCell>
                      <TableCell className="font-medium">{req.quantity}</TableCell>
                      <TableCell><UrgencyBadge urgency={req.urgency} /></TableCell>
                      <TableCell>
                        <Badge className={canFulfill ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                          {available} units {canFulfill ? '✓' : '⚠'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">{moment(req.created_date).fromNow()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => setSelectedRequest(req)}>
                            <Info className="w-3 h-3 mr-1" /> Review
                          </Button>
                          <Button 
                            size="sm" 
                            className="bg-green-500 hover:bg-green-600"
                            disabled={loading === req.id || !canFulfill}
                            onClick={() => handleApprove(req)}
                          >
                            {loading === req.id ? '...' : <Check className="w-4 h-4" />}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-red-500 border-red-200 hover:bg-red-50"
                            disabled={loading === req.id}
                            onClick={() => handleReject(req)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog with FIFO Preview */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              Smart Allocation Review
            </DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500">Requester</p>
                  <p className="font-medium text-sm">{selectedRequest.hospital_name || selectedRequest.requester_name || 'Patient'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500">Urgency</p>
                  <UrgencyBadge urgency={selectedRequest.urgency} />
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500">Blood Group</p>
                  <BloodGroupBadge group={selectedRequest.blood_group} />
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500">Quantity</p>
                  <p className="font-medium">{selectedRequest.quantity} units</p>
                </div>
              </div>

              <FIFOPreview request={selectedRequest} />

              <div className="flex gap-3 pt-2">
                <Button 
                  className="flex-1 bg-green-500 hover:bg-green-600"
                  disabled={loading === selectedRequest.id}
                  onClick={() => handleApprove(selectedRequest)}
                >
                  {loading === selectedRequest.id ? 'Processing...' : <><Check className="w-4 h-4 mr-2" /> Approve & Allocate</>}
                </Button>
                <Button 
                  variant="outline"
                  className="flex-1 text-red-500 border-red-200"
                  disabled={loading === selectedRequest.id}
                  onClick={() => handleReject(selectedRequest)}
                >
                  <X className="w-4 h-4 mr-2" /> Reject
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}