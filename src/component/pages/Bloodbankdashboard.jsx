import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Droplet, Package, Bell, Users, FileText, Zap, Truck } from "lucide-react";
import StatsCard from "@/components/shared/StatsCard";
import BloodBankInventory from "@/components/bloodbank/BloodBankInventory";
import BloodBankRequests from "@/components/bloodbank/BloodBankRequests";
import BloodBankAlerts from "@/components/bloodbank/BloodBankAlerts";
import BloodBankDonors from "@/components/bloodbank/BloodBankDonors";
import BloodBankReports from "@/components/bloodbank/BloodBankReports";
import BloodBankSmartAllocation from "@/components/bloodbank/BloodBankSmartAllocation";
import BloodBankDelivery from "@/components/bloodbank/BloodBankDelivery";
import { BLOOD_GROUPS } from "@/components/shared/aiSimulation";
import RequireAuth from "@/components/shared/RequireAuth";

export default function BloodBankDashboard() {
  const [user, setUser] = useState(null);
  const [bloodBank, setBloodBank] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      const userData = await base44.auth.me();
      setUser(userData);
    };
    loadUser();
  }, []);

  const { data: bloodBanks = [] } = useQuery({
    queryKey: ['bloodBanks'],
    queryFn: () => base44.entities.BloodBank.list()
  });

  useEffect(() => {
    if (user && bloodBanks.length > 0) {
      const byEmail = bloodBanks.find(b => b.manager_email === user.email);
      const byDistrict = bloodBanks.find(b => b.district === user.district);
      setBloodBank(byEmail || byDistrict || bloodBanks[0]);
    }
  }, [user, bloodBanks]);

  const { data: allBloodUnits = [] } = useQuery({
    queryKey: ['bloodUnits'],
    queryFn: () => base44.entities.BloodUnit.list(),
    refetchInterval: 15000
  });

  const { data: allRequests = [] } = useQuery({
    queryKey: ['requests'],
    queryFn: () => base44.entities.BloodRequest.list(),
    refetchInterval: 10000
  });

  const { data: donors = [] } = useQuery({
    queryKey: ['donors'],
    queryFn: () => base44.entities.Donor.list()
  });

  // Filter for this blood bank (by id or name)
  const bloodUnits = allBloodUnits.filter(u => u.blood_bank_id === bloodBank?.id || u.blood_bank_name === bloodBank?.name);
  const requests = allRequests.filter(r => r.blood_bank_id === bloodBank?.id || r.blood_bank_name === bloodBank?.name);

  // Calculate stats
  const availableUnits = bloodUnits.filter(u => u.status === 'available').length;
  const pendingRequests = requests.filter(r => r.status === 'pending').length;
  const criticalRequests = requests.filter(r => r.urgency === 'critical' && r.status === 'pending').length;
  
  const expiringUnits = bloodUnits.filter(u => {
    if (u.status !== 'available') return false;
    const expiry = new Date(u.expiry_date);
    const daysUntilExpiry = Math.ceil((expiry - new Date()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
  }).length;

  const lowStockGroups = BLOOD_GROUPS.filter(group => {
    const count = bloodUnits.filter(u => u.blood_group === group && u.status === 'available').length;
    return count < 5;
  }).length;

  return (
    <RequireAuth allowedRoles={['blood_bank', 'admin']}>
    <div className="min-h-screen bg-slate-50 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Blood Bank Dashboard</h1>
            <p className="text-slate-500">{bloodBank?.name || 'Inventory and request management'}</p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatsCard title="Available Units" value={availableUnits} icon={Droplet} color="red" />
          <StatsCard title="Pending Requests" value={pendingRequests} icon={Package} color="blue" />
          <StatsCard title="Critical Requests" value={criticalRequests} icon={Bell} color="orange" />
          <StatsCard title="Expiring Soon" value={expiringUnits} icon={Bell} color="purple" subtitle="Next 7 days" />
          <StatsCard title="Low Stock Groups" value={lowStockGroups} icon={Bell} color="slate" />
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="inventory" className="w-full">
          <TabsList className="bg-white border border-slate-200 p-1 mb-6 flex-wrap h-auto gap-1">
            <TabsTrigger value="inventory" className="data-[state=active]:bg-red-500 data-[state=active]:text-white">
              <Package className="w-4 h-4 mr-2" /> Inventory
            </TabsTrigger>
            <TabsTrigger value="allocation" className="data-[state=active]:bg-red-500 data-[state=active]:text-white">
              <Zap className="w-4 h-4 mr-2" /> Smart Allocation
            </TabsTrigger>
            <TabsTrigger value="requests" className="data-[state=active]:bg-red-500 data-[state=active]:text-white">
              <Droplet className="w-4 h-4 mr-2" /> Requests
            </TabsTrigger>
            <TabsTrigger value="delivery" className="data-[state=active]:bg-red-500 data-[state=active]:text-white">
              <Truck className="w-4 h-4 mr-2" /> Delivery
            </TabsTrigger>
            <TabsTrigger value="alerts" className="data-[state=active]:bg-red-500 data-[state=active]:text-white">
              <Bell className="w-4 h-4 mr-2" /> AI Alerts
            </TabsTrigger>
            <TabsTrigger value="donors" className="data-[state=active]:bg-red-500 data-[state=active]:text-white">
              <Users className="w-4 h-4 mr-2" /> Donors
            </TabsTrigger>
            <TabsTrigger value="reports" className="data-[state=active]:bg-red-500 data-[state=active]:text-white">
              <FileText className="w-4 h-4 mr-2" /> Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inventory">
            <BloodBankInventory 
              bloodBank={bloodBank} 
              bloodUnits={bloodUnits}
              onSuccess={() => queryClient.invalidateQueries(['bloodUnits'])}
            />
          </TabsContent>

          <TabsContent value="allocation">
            <BloodBankSmartAllocation
              bloodBank={bloodBank}
              requests={requests}
              bloodUnits={bloodUnits}
              onSuccess={() => {
                queryClient.invalidateQueries(['requests']);
                queryClient.invalidateQueries(['bloodUnits']);
              }}
            />
          </TabsContent>

          <TabsContent value="requests">
            <BloodBankRequests 
              bloodBank={bloodBank}
              requests={requests}
              bloodUnits={bloodUnits}
              onSuccess={() => {
                queryClient.invalidateQueries(['requests']);
                queryClient.invalidateQueries(['bloodUnits']);
              }}
            />
          </TabsContent>

          <TabsContent value="delivery">
            <BloodBankDelivery
              requests={requests}
              bloodUnits={bloodUnits}
              onSuccess={() => {
                queryClient.invalidateQueries(['requests']);
                queryClient.invalidateQueries(['bloodUnits']);
              }}
            />
          </TabsContent>

          <TabsContent value="alerts">
            <BloodBankAlerts
              bloodUnits={bloodUnits}
              requests={requests}
              bloodBanks={bloodBanks}
              allBloodUnits={allBloodUnits}
              allRequests={allRequests}
            />
          </TabsContent>

          <TabsContent value="donors">
            <BloodBankDonors 
              bloodBank={bloodBank}
              donors={donors}
              onSuccess={() => queryClient.invalidateQueries(['donors'])}
            />
          </TabsContent>

          <TabsContent value="reports">
            <BloodBankReports bloodUnits={bloodUnits} requests={requests} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
    </RequireAuth>
  );
}