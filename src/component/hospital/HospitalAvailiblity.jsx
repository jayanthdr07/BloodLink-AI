import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Star, Search, Filter, Navigation } from "lucide-react";
import BloodGroupBadge from "@/components/shared/BloodGroupBadge";
import { BLOOD_GROUPS } from "@/components/shared/aiSimulation";
import { haversineDistance, calculateSmartETA } from "@/components/shared/locationUtils";

export default function HospitalAvailability({ bloodBanks, bloodUnits, hospital }) {
  const [filterGroup, setFilterGroup] = useState('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('distance');

  // Calculate stock per blood bank with Haversine distance
  const banksWithStock = bloodBanks.map(bank => {
    const stock = BLOOD_GROUPS.reduce((acc, group) => {
      acc[group] = bloodUnits.filter(u => u.blood_bank_id === bank.id && u.blood_group === group && u.status === 'available').length;
      return acc;
    }, {});
    const totalStock = Object.values(stock).reduce((a, b) => a + b, 0);
    const distance = (hospital?.latitude && bank.latitude)
      ? haversineDistance(hospital.latitude, hospital.longitude, bank.latitude, bank.longitude)
      : null;
    return { ...bank, stock, totalStock, distance };
  });

  // Filter and sort
  let filtered = banksWithStock.filter(bank => {
    if (filterGroup !== 'all' && bank.stock[filterGroup] === 0) return false;
    if (search && !bank.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  filtered.sort((a, b) => {
    if (sortBy === 'distance') {
      if (a.distance === null) return 1;
      if (b.distance === null) return -1;
      return a.distance - b.distance;
    }
    if (sortBy === 'stock') return b.totalStock - a.totalStock;
    if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
    return 0;
  });

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="bg-white border border-slate-100">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  placeholder="Search blood banks..." 
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
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="distance">Nearest First</SelectItem>
                <SelectItem value="stock">Most Stock</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Blood Banks Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(bank => (
          <Card key={bank.id} className="bg-white border border-slate-100 hover:shadow-lg transition-all">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{bank.name}</CardTitle>
                  <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3" /> {bank.district}
                  </p>
                </div>
                {bank.is_verified && (
                  <Badge className="bg-green-100 text-green-700 text-xs">Verified</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
                {bank.distance !== null ? (
                  <span className="text-blue-600 font-medium">📍 {bank.distance} km</span>
                ) : (
                  <span className="flex items-center gap-1"><Navigation className="w-3 h-3" /> Distance unknown</span>
                )}
                {bank.rating && (
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                    {bank.rating}
                  </span>
                )}
                {bank.contact_phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {bank.contact_phone}
                  </span>
                )}
              </div>

              {/* Stock Grid */}
              <div className="grid grid-cols-4 gap-2">
                {BLOOD_GROUPS.map(group => (
                  <div 
                    key={group} 
                    className={`text-center p-2 rounded-lg ${bank.stock[group] > 0 ? 'bg-green-50' : 'bg-slate-50'}`}
                  >
                    <BloodGroupBadge group={group} size="sm" />
                    <p className={`text-sm font-medium mt-1 ${bank.stock[group] > 0 ? 'text-green-700' : 'text-slate-400'}`}>
                      {bank.stock[group]}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Total Available</span>
                  <span className="font-semibold text-slate-800">{bank.totalStock} units</span>
                </div>
                {bank.distance !== null && (
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm text-slate-500">Est. Delivery</span>
                    <span className="text-sm font-medium text-blue-600">{calculateSmartETA(bank.distance, 'routine')} min</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <Filter className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500">No blood banks match your filters</p>
        </div>
      )}
    </div>
  );
}