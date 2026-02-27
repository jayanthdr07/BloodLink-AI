import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Droplet, Plus, Activity, Clock, BarChart3, MapPin } from "lucide-react";
import StatsCard from "@/components/shared/StatsCard";
import HospitalRequestForm from "@/components/hospital/HospitalRequestForm";
import HospitalAvailability from "@/components/hospital/HospitalAvailability";
import HospitalEmergency from "@/components/hospital/HospitalEmergency";
import HospitalBookings from "@/components/hospital/HospitalBookings";
import HospitalAnalytics from "@/components/hospital/HospitalAnalytics";
import { BLOOD_GROUPS } from "@/components/shared/aiSimulation";
import RequireAuth from "@/components/shared/RequireAuth";

export default function HospitalDashboard() {
  const [user, setUser] = useState(null);
  const [hospital, setHospital] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      const userData = await base44.auth.me();
      setUser(userData);
    };
    loadUser();
  }, []);

  const { data: hospitals = [] } = useQuery({
    queryKey: ['hospitals'],
    queryFn: () => base44.entities.Hospital.list()
  });

  useEffect(() => {
    if (user && hospitals.length > 0) {
      // Match by manager_email first, then fallback to first hospital in user's district
      const byEmail = hospitals.find(h => h.manager_email === user.email);
      const byDistrict = hospitals.find(h => h.district === user.district);
      setHospital(byEmail || byDistrict || hospitals[0]);
    }
  }, [user, hospitals]);

  const { data: bloodBanks = [] } = useQuery({
    queryKey: ['bloodBanks'],
    queryFn: () => base44.entities.BloodBank.list()
  });

  const { data: bloodUnits = [] } = useQuery({
    queryKey: ['bloodUnits'],
    queryFn: () => base44.entities.BloodUnit.list()
  });

  const { data: allRequests = [] } = useQuery({
    queryKey: ['requests'],
    queryFn: () => base44.entities.BloodRequest.list(),
    refetchInterval: 10000
  });

  const myRequests = allRequests.filter(r =>
    r.hospital_id === hospital?.id ||
    r.hospital_name === hospital?.name ||
    r.created_by === user?.email
  );

  // Calculate stats
  const pendingRequests = myRequests.filter(r => r.status === 'pending' || r.status === 'approved' || r.status === 'in_transit').length;
  const deliveredThisMonth = myRequests.filter(r => {
    if (r.status !== 'delivered') return false;
    const delivered = new Date(r.actual_delivery || r.updated_date);
    const now = new Date();
    return delivered.getMonth() === now.getMonth() && delivered.getFullYear() === now.getFullYear();
  }).length;
  const criticalActive = myRequests.filter(r => r.urgency === 'critical' && !['delivered', 'cancelled', 'rejected'].includes(r.status)).length;

  // Calculate available units across all banks
  const totalAvailable = bloodUnits.filter(u => u.status === 'available').length;

  return (
    <RequireAuth allowedRoles={['hospital', 'admin']}>
    <div className="min-h-screen bg-slate-50 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Hospital Dashboard</h1>
            <p className="text-slate-500">{hospital?.name || 'Blood request management'}</p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="Active Requests" value={pendingRequests} icon={Activity} color="blue" />
          <StatsCard title="Delivered This Month" value={deliveredThisMonth} icon={Droplet} color="green" />
          <StatsCard title="Critical Pending" value={criticalActive} icon={Clock} color="red" />
          <StatsCard title="Available Units" value={totalAvailable} icon={MapPin} color="purple" subtitle="District-wide" />
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="request" className="w-full">
          <TabsList className="bg-white border border-slate-200 p-1 mb-6">
            <TabsTrigger value="request" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              <Plus className="w-4 h-4 mr-2" /> New Request
            </TabsTrigger>
            <TabsTrigger value="availability" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              <MapPin className="w-4 h-4 mr-2" /> Live Availability
            </TabsTrigger>
            <TabsTrigger value="emergency" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              <Clock className="w-4 h-4 mr-2" /> Emergency
            </TabsTrigger>
            <TabsTrigger value="bookings" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              <Activity className="w-4 h-4 mr-2" /> Bookings
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              <BarChart3 className="w-4 h-4 mr-2" /> Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="request">
            <HospitalRequestForm 
              hospital={hospital} 
              bloodBanks={bloodBanks} 
              bloodUnits={bloodUnits}
              onSuccess={() => queryClient.invalidateQueries(['requests'])}
            />
          </TabsContent>

          <TabsContent value="availability">
            <HospitalAvailability bloodBanks={bloodBanks} bloodUnits={bloodUnits} hospital={hospital} />
          </TabsContent>

          <TabsContent value="emergency">
            <HospitalEmergency requests={myRequests} hospital={hospital} />
          </TabsContent>

          <TabsContent value="bookings">
            <HospitalBookings requests={myRequests} />
          </TabsContent>

          <TabsContent value="analytics">
            <HospitalAnalytics requests={myRequests} bloodUnits={bloodUnits} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
    </RequireAuth>
  );
}