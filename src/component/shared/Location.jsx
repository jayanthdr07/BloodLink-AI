import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Loader2, Navigation } from "lucide-react";

const DISTRICTS = [
  "Yelahanka", "Hebbal", "Whitefield", "Indiranagar", "Malleshwaram",
  "Koramangala", "Jayanagar", "Rajajinagar", "BTM Layout", "Electronic City",
  "HSR Layout", "Marathahalli", "Bellandur", "Sarjapur", "Banashankari"
];

export default function LocationDetector({ onLocationDetected, currentLocation }) {
  const [detecting, setDetecting] = useState(false);
  const [error, setError] = useState(null);

  const detect = async () => {
    setDetecting(true);
    setError(null);
    try {
      const pos = await new Promise((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 })
      );
      onLocationDetected({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        district: null,
        method: 'gps'
      });
    } catch (e) {
      setError('Could not detect location. Please select district manually.');
    }
    setDetecting(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <Navigation className="w-4 h-4 text-blue-600 flex-shrink-0" />
      <span className="text-sm text-blue-700 font-medium">Your Location:</span>
      
      {currentLocation?.lat ? (
        <span className="text-sm text-blue-800 font-semibold">
          📍 GPS: {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
        </span>
      ) : currentLocation?.district ? (
        <span className="text-sm text-blue-800 font-semibold">📍 {currentLocation.district}</span>
      ) : (
        <span className="text-sm text-slate-500 italic">Not set</span>
      )}

      <Button
        size="sm"
        variant="outline"
        onClick={detect}
        disabled={detecting}
        className="border-blue-300 text-blue-700 hover:bg-blue-100 h-8"
      >
        {detecting ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <MapPin className="w-3 h-3 mr-1" />}
        {detecting ? 'Detecting...' : 'Auto-detect GPS'}
      </Button>

      <Select
        value={currentLocation?.district || ''}
        onValueChange={(v) => onLocationDetected({ district: v, lat: null, lng: null, method: 'manual' })}
      >
        <SelectTrigger className="w-44 h-8 text-sm border-blue-300">
          <SelectValue placeholder="Select district" />
        </SelectTrigger>
        <SelectContent>
          {DISTRICTS.map(d => (
            <SelectItem key={d} value={d}>{d}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}