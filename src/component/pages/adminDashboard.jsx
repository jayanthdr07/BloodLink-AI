import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Droplet, Building2, Hospital, Activity, AlertTriangle, Clock, TrendingUp, Users, FileText, RefreshCw, Shield, Gauge } from "lucide-react";
import StatsCard from "@/components/shared/StatsCard";
import BloodStockChart from "@/components/charts/BloodStockChart";
import { calculateReadinessScore, predictShortage, BLOOD_GROUPS } from "@/components/shared/aiSimulation";
import RequireAuth from "@/components/shared/RequireAuth";
import AdminMonitoring from "@/components/admin/AdminMonitoring";
import AdminRedistribution from "@/components/admin/AdminRedistribution";
import AdminCompliance from "@/components/admin/AdminCompliance";
import AdminPerformance from "@/components/admin/AdminPerformance";
import AdminAIAnalytics from "@/components/admin/AdminAIAnalytics";
import AdminFraudAlerts from "@/components/admin/AdminFraudAlerts";
import AreaShortagePanel from "@/components/shared/AreaShortagePanel";
import { MapPin } from "lucide-react";

export default function AdminDashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: bloodUnits = [] } = useQuery({
    queryKey: ['bloodUnits'],
    queryFn: () => base44.entities.BloodUnit.list(),
    refetchInterval: 15000
  });

  const { data: bloodBanks = [] } = useQuery({
    queryKey: ['bloodBanks'],
    queryFn: () => base44.entities.BloodBank.list(),
    refetchInterval: 30000
  });

  const { data: hospitals = [] } = useQuery({
    queryKey: ['hospitals'],
    queryFn: () => base44.entities.Hospital.list(),
    refetchInterval: 30000
  });

  const { data: requests = [] } = useQuery({
    queryKey: ['requests'],
    queryFn: () => base44.entities.BloodRequest.list(),
    refetchInterval: 10000
  });

  // Calculate stats
  const totalUnits = bloodUnits.filter(u => u.status === 'available').length;
  const criticalRequests = requests.filter(r => r.urgency === 'critical' && r.status === 'pending').length;
  const pendingRequests = requests.filter(r => r.status === 'pending').length;
  
  const expiringUnits = bloodUnits.filter(u => {
    if (u.status !== 'available') return false;
    const expiry = new Date(u.expiry_date);
    const daysUntilExpiry = Math.ceil((expiry - new Date()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
  }).length;

  const readinessScore = calculateReadinessScore({
    totalUnits,
    criticalRequests,
    avgResponseTime: 25,
    expiringUnits,
    activeBloodBanks: bloodBanks.filter(b => b.is_verified).length
  });

  // Calculate stock by group
  const stockByGroup = BLOOD_GROUPS.reduce((acc, group) => {
    acc[group] = bloodUnits.filter(u => u.blood_group === group && u.status === 'available').length;
    return acc;
  }, {});

  // Generate prediction data
  const avgDailyDemand = BLOOD_GROUPS.reduce((acc, group) => {
    acc[group] = Math.floor(Math.random() * 10) + 5;
    return acc;
  }, {});

  const predictions = predictShortage({ currentStock: stockByGroup, avgDailyDemand });
  
  const trendData = predictions.map(p => ({
    day: p.day,
    demand: BLOOD_GROUPS.reduce((sum, g) => sum + (p[g]?.predictedDemand || 0), 0),
    stock: BLOOD_GROUPS.reduce((sum, g) => sum + (p[g]?.remainingStock || 0), 0)
  }));

  return (
    <RequireAuth allowedRoles={['admin']}>
    <div className="min-h-screen bg-slate-50 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">District Admin Dashboard</h1>
            <p className="text-slate-500">System-wide monitoring and control</p>
          </div>
          <div className="flex items-center gap-3">
            <div className={`px-4 py-2 rounded-xl border ${readinessScore >= 70 ? 'bg-green-50 border-green-200' : readinessScore >= 40 ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center gap-2">
                <Gauge className={`w-5 h-5 ${readinessScore >= 70 ? 'text-green-600' : readinessScore >= 40 ? 'text-yellow-600' : 'text-red-600'}`} />
                <div>
                  <p className="text-xs text-slate-500">Readiness Score</p>
                  <p className="text-lg font-bold">{readinessScore}%</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          <StatsCard title="Total Blood Units" value={totalUnits.toLocaleString()} icon={Droplet} color="red" />
          <StatsCard title="Blood Banks" value={bloodBanks.length} icon={Building2} color="blue" subtitle={`${bloodBanks.filter(b => b.is_verified).length} verified`} />
          <StatsCard title="Hospitals" value={hospitals.length} icon={Hospital} color="green" subtitle={`${hospitals.filter(h => h.is_verified).length} verified`} />
          <StatsCard title="Active Bookings" value={pendingRequests} icon={Activity} color="purple" />
          <StatsCard title="Critical Requests" value={criticalRequests} icon={AlertTriangle} color="orange" />
          <StatsCard title="Expiring Soon" value={expiringUnits} icon={Clock} color="slate" subtitle="Next 7 days" />
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="monitoring" className="w-full">
          <TabsList className="bg-white border border-slate-200 p-1 mb-6">
            <TabsTrigger value="monitoring" className="data-[state=active]:bg-red-500 data-[state=active]:text-white">
              <Activity className="w-4 h-4 mr-2" /> Monitoring
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-red-500 data-[state=active]:text-white">
              <TrendingUp className="w-4 h-4 mr-2" /> AI Analytics
            </TabsTrigger>
            <TabsTrigger value="redistribution" className="data-[state=active]:bg-red-500 data-[state=active]:text-white">
              <RefreshCw className="w-4 h-4 mr-2" /> Redistribution
            </TabsTrigger>
            <TabsTrigger value="compliance" className="data-[state=active]:bg-red-500 data-[state=active]:text-white">
              <Shield className="w-4 h-4 mr-2" /> Compliance
            </TabsTrigger>
            <TabsTrigger value="performance" className="data-[state=active]:bg-red-500 data-[state=active]:text-white">
              <Gauge className="w-4 h-4 mr-2" /> Performance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="monitoring">
            <AdminMonitoring 
              bloodUnits={bloodUnits}
              bloodBanks={bloodBanks}
              hospitals={hospitals}
              requests={requests}
              stockByGroup={stockByGroup}
            />
          </TabsContent>

          <TabsContent value="analytics">
            <AdminAIAnalytics bloodUnits={bloodUnits} bloodBanks={bloodBanks} requests={requests} />
          </TabsContent>

          <TabsContent value="redistribution">
            <AdminRedistribution bloodBanks={bloodBanks} bloodUnits={bloodUnits} />
          </TabsContent>

          <TabsContent value="compliance">
            <div className="space-y-6">
              <AdminCompliance bloodBanks={bloodBanks} hospitals={hospitals} />
              <AdminFraudAlerts bloodBanks={bloodBanks} hospitals={hospitals} requests={requests} bloodUnits={bloodUnits} />
            </div>
          </TabsContent>

          <TabsContent value="performance">
            <AdminPerformance requests={requests} bloodUnits={bloodUnits} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
    </RequireAuth>
  );
}