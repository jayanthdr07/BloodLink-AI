import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Star, Phone, Mail, Bell, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import BloodGroupBadge from "@/components/shared/BloodGroupBadge";
import { BLOOD_GROUPS } from "@/components/shared/aiSimulation";
import moment from 'moment';

export default function BloodBankDonors({ bloodBank, donors, onSuccess }) {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterGroup, setFilterGroup] = useState('all');
  const [newDonor, setNewDonor] = useState({
    name: '',
    email: '',
    phone: '',
    blood_group: '',
    address: ''
  });

  // Filter donors
  const filteredDonors = donors.filter(d => {
    if (filterGroup !== 'all' && d.blood_group !== filterGroup) return false;
    if (search && !d.name?.toLowerCase().includes(search.toLowerCase()) && !d.email?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Check eligibility (56 days since last donation)
  const isEligible = (donor) => {
    if (!donor.last_donation_date) return true;
    const daysSinceDonation = Math.floor((new Date() - new Date(donor.last_donation_date)) / (1000 * 60 * 60 * 24));
    return daysSinceDonation >= 56;
  };

  const eligibleDonors = filteredDonors.filter(isEligible);

  const handleAddDonor = async () => {
    if (!newDonor.name || !newDonor.blood_group) return;
    setLoading(true);

    await base44.entities.Donor.create({
      ...newDonor,
      district: bloodBank?.district,
      is_verified: false,
      is_eligible: true,
      reliability_score: 100,
      total_donations: 0,
      preferred_blood_bank_id: bloodBank?.id
    });

    setLoading(false);
    setAddDialogOpen(false);
    setNewDonor({ name: '', email: '', phone: '', blood_group: '', address: '' });
    onSuccess?.();
  };

  const handleVerify = async (donor) => {
    await base44.entities.Donor.update(donor.id, { is_verified: true });
    onSuccess?.();
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white border border-slate-100">
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Total Donors</p>
            <p className="text-2xl font-bold text-slate-800">{donors.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-white border border-slate-100">
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Verified Donors</p>
            <p className="text-2xl font-bold text-green-600">{donors.filter(d => d.is_verified).length}</p>
          </CardContent>
        </Card>
        <Card className="bg-white border border-slate-100">
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Eligible Now</p>
            <p className="text-2xl font-bold text-blue-600">{eligibleDonors.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-white border border-slate-100">
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Avg Reliability</p>
            <p className="text-2xl font-bold text-purple-600">
              {donors.length > 0 ? Math.round(donors.reduce((sum, d) => sum + (d.reliability_score || 100), 0) / donors.length) : 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Add */}
      <Card className="bg-white border border-slate-100">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  placeholder="Search donors..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterGroup} onValueChange={setFilterGroup}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Blood Group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Groups</SelectItem>
                {BLOOD_GROUPS.map(g => (
                  <SelectItem key={g} value={g}>{g}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-red-500 hover:bg-red-600">
                  <Plus className="w-4 h-4 mr-2" /> Add Donor
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Register New Donor</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div>
                    <Label>Full Name *</Label>
                    <Input 
                      value={newDonor.name}
                      onChange={(e) => setNewDonor({...newDonor, name: e.target.value})}
                      placeholder="Enter full name"
                    />
                  </div>
                  <div>
                    <Label>Blood Group *</Label>
                    <Select value={newDonor.blood_group} onValueChange={(v) => setNewDonor({...newDonor, blood_group: v})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select blood group" />
                      </SelectTrigger>
                      <SelectContent>
                        {BLOOD_GROUPS.map(g => (
                          <SelectItem key={g} value={g}>{g}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input 
                      type="email"
                      value={newDonor.email}
                      onChange={(e) => setNewDonor({...newDonor, email: e.target.value})}
                      placeholder="donor@email.com"
                    />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input 
                      value={newDonor.phone}
                      onChange={(e) => setNewDonor({...newDonor, phone: e.target.value})}
                      placeholder="+91 XXXXXXXXXX"
                    />
                  </div>
                  <div>
                    <Label>Address</Label>
                    <Input 
                      value={newDonor.address}
                      onChange={(e) => setNewDonor({...newDonor, address: e.target.value})}
                      placeholder="Enter address"
                    />
                  </div>
                  <Button 
                    onClick={handleAddDonor}
                    disabled={loading || !newDonor.name || !newDonor.blood_group}
                    className="w-full bg-red-500 hover:bg-red-600"
                  >
                    {loading ? 'Adding...' : 'Register Donor'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Donor Activation Alert */}
      {eligibleDonors.length > 0 && (
        <Card className="bg-blue-50 border border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-blue-700 flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Donor Activation Opportunity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-blue-700 mb-3">{eligibleDonors.length} donors are eligible for donation now</p>
            <div className="flex flex-wrap gap-2">
              {BLOOD_GROUPS.map(group => {
                const count = eligibleDonors.filter(d => d.blood_group === group).length;
                if (count === 0) return null;
                return (
                  <Badge key={group} className="bg-blue-100 text-blue-700">
                    {group}: {count} eligible
                  </Badge>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Donors Table */}
      <Card className="bg-white border border-slate-100">
        <CardHeader>
          <CardTitle className="text-lg">Donor Registry</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredDonors.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Search className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>No donors found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Blood Group</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Last Donation</TableHead>
                  <TableHead>Reliability</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDonors.map(donor => (
                  <TableRow key={donor.id}>
                    <TableCell className="font-medium">{donor.name}</TableCell>
                    <TableCell><BloodGroupBadge group={donor.blood_group} /></TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {donor.phone && (
                          <div className="flex items-center gap-1 text-sm text-slate-500">
                            <Phone className="w-3 h-3" /> {donor.phone}
                          </div>
                        )}
                        {donor.email && (
                          <div className="flex items-center gap-1 text-sm text-slate-500">
                            <Mail className="w-3 h-3" /> {donor.email}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {donor.last_donation_date ? moment(donor.last_donation_date).fromNow() : 'Never'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="font-medium">{donor.reliability_score || 100}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {donor.is_verified ? (
                          <Badge className="bg-green-100 text-green-700 text-xs w-fit">Verified</Badge>
                        ) : (
                          <Badge className="bg-yellow-100 text-yellow-700 text-xs w-fit">Pending</Badge>
                        )}
                        {isEligible(donor) ? (
                          <Badge className="bg-blue-100 text-blue-700 text-xs w-fit">Eligible</Badge>
                        ) : (
                          <Badge className="bg-slate-100 text-slate-700 text-xs w-fit">Cooldown</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {!donor.is_verified && (
                        <Button size="sm" variant="outline" onClick={() => handleVerify(donor)}>
                          <Check className="w-4 h-4 mr-1" /> Verify
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}