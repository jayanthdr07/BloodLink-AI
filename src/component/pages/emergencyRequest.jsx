import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Zap, Phone, MapPin, Clock, Heart, ArrowRight, Droplet, Check } from "lucide-react";
import BloodGroupBadge from "@/components/shared/BloodGroupBadge";
import GoldenHourTimer from "@/components/shared/GoldenHourTimer";
import SurvivalProbability from "@/components/shared/SurvivalProbability";
import { findOptimalBloodBank, calculateETA, generateRequestNumber, calculateSurvivalProbability, BLOOD_GROUPS } from "@/components/shared/aiSimulation";

export default function EmergencyRequest() {
  const [user, setUser] = useState(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    blood_group: '',
    quantity: 1,
    patient_name: '',
    contact_phone: '',
    address: ''
  });
  const [selectedBank, setSelectedBank] = useState(null);
  const [submittedRequest, setSubmittedRequest] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) {
        const userData = await base44.auth.me();
        setUser(userData);
      }
    };
    loadUser();
  }, []);

  const { data: bloodBanks = [] } = useQuery({
    queryKey: ['bloodBanks'],
    queryFn: () => base44.entities.BloodBank.list()
  });

  const { data: bloodUnits = [] } = useQuery({
    queryKey: ['bloodUnits'],
    queryFn: () => base44.entities.BloodUnit.list()
  });

  // Calculate stock per blood bank
  const banksWithStock = bloodBanks.map(bank => {
    const stock = BLOOD_GROUPS.reduce((acc, group) => {
      acc[group] = bloodUnits.filter(u => u.blood_bank_id === bank.id && u.blood_group === group && u.status === 'available').length;
      return acc;
    }, {});
    return { ...bank, stock };
  });

  const handleFindBloodBank = () => {
    if (!formData.blood_group) return;

    const matches = findOptimalBloodBank({
      bloodBanks: banksWithStock,
      requestedGroup: formData.blood_group,
      quantity: formData.quantity,
      hospitalLocation: null,
      urgency: 'critical'
    });

    if (matches.length > 0) {
      setSelectedBank(matches[0]);
      setStep(2);
    } else {
      alert('No blood banks found with available stock for this blood group');
    }
  };

  const handleSubmit = async () => {
    if (!selectedBank || !user) {
      if (!user) {
        base44.auth.redirectToLogin(window.location.href);
        return;
      }
      return;
    }

    setLoading(true);

    const eta = calculateETA(selectedBank.distance || 10, 'critical');
    const goldenHourDeadline = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    
    const survivalProb = calculateSurvivalProbability({
      delayMinutes: eta,
      bloodAvailable: true,
      icuLoad: 70,
      urgency: 'critical'
    });

    const request = await base44.entities.BloodRequest.create({
      request_number: generateRequestNumber(),
      requester_type: 'patient',
      requester_name: formData.patient_name || user?.full_name || 'Patient',
      blood_group: formData.blood_group,
      quantity: formData.quantity,
      urgency: 'critical',
      status: 'pending',
      blood_bank_id: selectedBank.id,
      blood_bank_name: selectedBank.name,
      district: selectedBank.district,
      delivery_address: formData.address,
      estimated_delivery: new Date(Date.now() + eta * 60 * 1000).toISOString(),
      golden_hour_deadline: goldenHourDeadline,
      total_cost: formData.quantity * 1500,
      survival_probability: survivalProb
    });

    await base44.entities.AuditLog.create({
      action_type: 'request_created',
      entity_type: 'BloodRequest',
      description: `EMERGENCY: Critical blood request for ${formData.quantity} units of ${formData.blood_group}`
    });

    setSubmittedRequest({ ...request, eta, goldenHourDeadline, survivalProb });
    setLoading(false);
    setStep(3);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100">
      {/* Emergency Header */}
      <div className="bg-red-600 text-white py-4 px-6">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Emergency Blood Request</h1>
              <p className="text-red-100 text-sm">Fast-track critical blood delivery</p>
            </div>
          </div>
          <Link to={createPageUrl('Home')}>
            <Button variant="ghost" className="text-white hover:bg-white/20">
              <Droplet className="w-4 h-4 mr-2" /> BloodLink AI
            </Button>
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-6 space-y-6">
        {/* Step 1: Blood Group Selection */}
        {step === 1 && (
          <Card className="bg-white border-2 border-red-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-5 h-5" />
                Critical Blood Request
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <p className="text-sm text-red-700">
                  <strong>Golden Hour Protocol:</strong> Emergency requests are prioritized for immediate dispatch. 
                  Our AI will find the nearest blood bank with available stock.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Blood Group Required *</Label>
                  <Select value={formData.blood_group} onValueChange={(v) => setFormData({...formData, blood_group: v})}>
                    <SelectTrigger className="h-12">
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
                  <Label>Quantity (units)</Label>
                  <Input 
                    type="number" 
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 1})}
                    className="h-12"
                  />
                </div>
              </div>

              <div>
                <Label>Patient Name</Label>
                <Input 
                  value={formData.patient_name}
                  onChange={(e) => setFormData({...formData, patient_name: e.target.value})}
                  placeholder="Enter patient name"
                  className="h-12"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Contact Phone</Label>
                  <Input 
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({...formData, contact_phone: e.target.value})}
                    placeholder="+91 XXXXXXXXXX"
                    className="h-12"
                  />
                </div>
                <div>
                  <Label>Delivery Address</Label>
                  <Input 
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    placeholder="Hospital/Home address"
                    className="h-12"
                  />
                </div>
              </div>

              <Button 
                onClick={handleFindBloodBank}
                disabled={!formData.blood_group}
                className="w-full h-14 text-lg bg-red-600 hover:bg-red-700"
              >
                <Zap className="w-5 h-5 mr-2" />
                Find Nearest Blood Bank
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Confirm */}
        {step === 2 && selectedBank && (
          <Card className="bg-white border-2 border-red-200">
            <CardHeader>
              <CardTitle className="text-lg">Confirm Emergency Request</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="font-medium text-slate-800 mb-2">Matched Blood Bank</h4>
                  <p className="font-semibold text-green-700">{selectedBank.name}</p>
                  <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3" /> {selectedBank.district}
                  </p>
                  <p className="text-sm text-green-600 mt-2">
                    {selectedBank.stock[formData.blood_group]} units of {formData.blood_group} available
                  </p>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-slate-800 mb-2">Estimated Delivery</h4>
                  <div className="flex items-center gap-2 text-blue-700">
                    <Clock className="w-5 h-5" />
                    <span className="text-xl font-bold">{calculateETA(selectedBank.distance || 10, 'critical')} minutes</span>
                  </div>
                  <p className="text-sm text-slate-500 mt-2">Priority ambulance dispatch</p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span className="text-slate-600">Blood Group</span>
                  <BloodGroupBadge group={formData.blood_group} />
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-slate-600">Quantity</span>
                  <span className="font-medium">{formData.quantity} units</span>
                </div>
                <div className="flex justify-between font-semibold text-lg border-t pt-2">
                  <span>Total Cost</span>
                  <span>₹{(formData.quantity * 1500).toLocaleString()}</span>
                </div>
              </div>

              <div className="flex gap-4">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  Back
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  disabled={loading}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  {loading ? 'Submitting...' : 'Confirm Emergency Request'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Success */}
        {step === 3 && submittedRequest && (
          <div className="space-y-6">
            <Card className="bg-white border-2 border-green-200">
              <CardContent className="py-8 text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Emergency Request Submitted!</h3>
                <p className="text-slate-500">Request #{submittedRequest.request_number || 'Processing'}</p>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-4">
              <GoldenHourTimer deadline={submittedRequest.goldenHourDeadline} />
              <SurvivalProbability probability={submittedRequest.survivalProb} />
            </div>

            <Card className="bg-white border border-slate-100">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Blood Bank</p>
                    <p className="font-medium">{selectedBank?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-500">ETA</p>
                    <p className="font-medium text-blue-600">{submittedRequest.eta} min</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Link to={createPageUrl('Home')} className="flex-1">
                <Button variant="outline" className="w-full">
                  Go to Home
                </Button>
              </Link>
              {user && (
                <Link to={createPageUrl('PatientDashboard')} className="flex-1">
                  <Button className="w-full bg-red-500 hover:bg-red-600">
                    Track Request <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}