import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Droplet, Building2, Hospital, Users, ArrowRight, Shield, Zap, Clock, Heart, Activity, AlertTriangle, MapPin } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) {
        const userData = await base44.auth.me();
        setUser(userData);
      }
      setLoading(false);
    };
    loadUser();
  }, []);

  const getDashboardUrl = () => {
    if (!user) return createPageUrl('RoleSetup');
    if (!user.district) return createPageUrl('RoleSetup');
    switch (user.role) {
      case 'admin': return createPageUrl('AdminDashboard');
      case 'hospital': return createPageUrl('HospitalDashboard');
      case 'blood_bank': return createPageUrl('BloodBankDashboard');
      default: return createPageUrl('PatientDashboard');
    }
  };

  const features = [
    { icon: Zap, title: "AI-Powered Matching", desc: "Intelligent blood bank selection based on compatibility, distance & urgency", color: "text-yellow-500" },
    { icon: Clock, title: "Golden Hour Tracking", desc: "Real-time delivery monitoring with survival probability estimation", color: "text-red-500" },
    { icon: Activity, title: "Predictive Analytics", desc: "7-day shortage forecasting with seasonal demand adjustment", color: "text-blue-500" },
    { icon: Shield, title: "Secure & Verified", desc: "Role-based access with full audit trail and compliance", color: "text-green-500" }
  ];

  const stats = [
    { label: "Blood Units Available", value: "2,500+", icon: Droplet },
    { label: "Blood Banks Connected", value: "45", icon: Building2 },
    { label: "Hospitals Served", value: "120", icon: Hospital },
    { label: "Lives Saved", value: "10,000+", icon: Heart }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-red-50 flex items-center justify-center">
        <div className="animate-pulse flex items-center gap-3">
          <Droplet className="w-8 h-8 text-red-500 animate-bounce" />
          <span className="text-xl font-medium text-slate-700">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-red-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500 rounded-xl">
                <Droplet className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">BloodLink AI</h1>
                <p className="text-xs text-slate-500">Smart Blood Supply Management</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <span className="text-sm text-slate-600">Welcome, <strong>{user.full_name || user.email}</strong></span>
                  <Link to={getDashboardUrl()}>
                    <Button className="bg-red-500 hover:bg-red-600 text-white">
                      Go to Dashboard <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </>
              ) : (
                <Button onClick={() => base44.auth.redirectToLogin(createPageUrl('RoleSetup'))} className="bg-red-500 hover:bg-red-600 text-white">
                  Sign In <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex items-center gap-2 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium mb-6">
                <Activity className="w-4 h-4" />
                AI-Powered Healthcare Logistics
              </span>
              <h1 className="text-4xl lg:text-6xl font-bold text-slate-900 leading-tight mb-6">
                Every Second Counts.
                <span className="text-red-500 block mt-2">We Make Them Count.</span>
              </h1>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                Revolutionary blood supply management with AI-driven matching, real-time tracking, and predictive analytics. Connecting blood banks, hospitals, and patients for faster, smarter blood delivery.
              </p>
              <div className="flex flex-wrap gap-4">
                {user ? (
                  <Link to={getDashboardUrl()}>
                    <Button size="lg" className="bg-red-500 hover:bg-red-600 text-white px-8">
                      Open Dashboard <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Button size="lg" onClick={() => base44.auth.redirectToLogin(createPageUrl('RoleSetup'))} className="bg-red-500 hover:bg-red-600 text-white px-8">
                          Get Started <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                    <Link to={createPageUrl('EmergencyRequest')}>
                      <Button size="lg" variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 px-8">
                        <AlertTriangle className="w-5 h-5 mr-2" />
                        Emergency Request
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-red-200 to-blue-200 rounded-3xl blur-3xl opacity-30"></div>
              <div className="relative bg-white rounded-3xl shadow-2xl p-8 border border-slate-100">
                <div className="grid grid-cols-2 gap-4">
                  {stats.map((stat, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                      className="bg-slate-50 rounded-2xl p-5 text-center"
                    >
                      <stat.icon className="w-8 h-8 text-red-500 mx-auto mb-3" />
                      <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                      <p className="text-xs text-slate-500 mt-1">{stat.label}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Powered by Intelligence</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">Our AI engine optimizes every step of the blood supply chain, from prediction to delivery.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full border-slate-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-6">
                    <feature.icon className={`w-10 h-10 ${feature.color} mb-4`} />
                    <h3 className="font-semibold text-slate-900 mb-2">{feature.title}</h3>
                    <p className="text-sm text-slate-500">{feature.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Role Cards */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Designed for Everyone</h2>
            <p className="text-slate-600 mb-3">Tailored dashboards for every stakeholder in the blood supply ecosystem.</p>
            {!user && (
              <p className="text-sm text-red-500 font-medium">
                👉 Click a role below to sign in and access its dashboard
              </p>
            )}
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Shield, title: "Admin", desc: "District-wide monitoring, compliance, and redistribution control", color: "bg-purple-500", page: 'AdminDashboard' },
              { icon: Hospital, title: "Hospital", desc: "Smart blood requests with AI matching and golden hour tracking", color: "bg-blue-500", page: 'HospitalDashboard' },
              { icon: Building2, title: "Blood Bank", desc: "Inventory management, donor registry, and smart allocation", color: "bg-red-500", page: 'BloodBankDashboard' },
              { icon: Users, title: "Patient", desc: "Quick search, booking, and real-time delivery tracking", color: "bg-green-500", page: 'PatientDashboard' }
            ].map((role, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <Link to={user ? createPageUrl(role.page) : createPageUrl('RoleSetup')}>
                  <Card className="h-full border-slate-100 overflow-hidden group hover:shadow-lg transition-all cursor-pointer hover:-translate-y-1">
                    <div className={`h-2 ${role.color}`}></div>
                    <CardContent className="p-6">
                      <div className={`w-12 h-12 ${role.color} rounded-xl flex items-center justify-center mb-4`}>
                        <role.icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="font-semibold text-slate-900 mb-2">{role.title}</h3>
                      <p className="text-sm text-slate-500 mb-3">{role.desc}</p>
                      <span className="text-xs font-medium text-red-500 flex items-center gap-1">
                        Open Dashboard <ArrowRight className="w-3 h-3" />
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-red-500 to-red-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Transform Blood Supply Management?</h2>
          <p className="text-red-100 mb-8 text-lg">Join the network of hospitals, blood banks, and healthcare providers using BloodLink AI.</p>
          {user ? (
            <Link to={getDashboardUrl()}>
              <Button size="lg" className="bg-white text-red-600 hover:bg-red-50 px-8">
                Go to Dashboard <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          ) : (
            <Button size="lg" onClick={() => base44.auth.redirectToLogin(createPageUrl('RoleSetup'))} className="bg-white text-red-600 hover:bg-red-50 px-8">
              Get Started Today <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500 rounded-xl">
                <Droplet className="w-5 h-5 text-white" />
              </div>
              <span className="text-white font-semibold">BloodLink AI</span>
            </div>
            <p className="text-slate-400 text-sm">© 2024 BloodLink AI. Saving lives through technology.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}