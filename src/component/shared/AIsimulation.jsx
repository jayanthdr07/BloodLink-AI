// AI Simulation Logic for Blood Supply Management

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export const COMPATIBILITY = {
  "O-": ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
  "O+": ["A+", "B+", "AB+", "O+"],
  "A-": ["A+", "A-", "AB+", "AB-"],
  "A+": ["A+", "AB+"],
  "B-": ["B+", "B-", "AB+", "AB-"],
  "B+": ["B+", "AB+"],
  "AB-": ["AB+", "AB-"],
  "AB+": ["AB+"]
};

// Calculate survival probability based on multiple factors
export function calculateSurvivalProbability({ delayMinutes, bloodAvailable, icuLoad, urgency }) {
  let baseProbability = 95;
  
  // Delay impact
  if (delayMinutes > 60) baseProbability -= 30;
  else if (delayMinutes > 45) baseProbability -= 20;
  else if (delayMinutes > 30) baseProbability -= 10;
  else if (delayMinutes > 15) baseProbability -= 5;
  
  // Blood availability impact
  if (!bloodAvailable) baseProbability -= 25;
  
  // ICU load impact (0-100%)
  if (icuLoad > 90) baseProbability -= 15;
  else if (icuLoad > 75) baseProbability -= 10;
  else if (icuLoad > 50) baseProbability -= 5;
  
  // Urgency modifier
  if (urgency === "critical") baseProbability -= 10;
  else if (urgency === "urgent") baseProbability -= 5;
  
  return Math.max(10, Math.min(99, Math.round(baseProbability + Math.random() * 5)));
}

// Predict shortage for next N days
export function predictShortage({ currentStock, avgDailyDemand, daysAhead = 7 }) {
  const predictions = [];
  let stock = { ...currentStock };
  
  for (let day = 1; day <= daysAhead; day++) {
    const dayPrediction = {};
    
    BLOOD_GROUPS.forEach(group => {
      const demand = avgDailyDemand[group] || 0;
      const variation = 0.8 + Math.random() * 0.4; // 80-120% variation
      const predictedDemand = Math.round(demand * variation);
      
      stock[group] = Math.max(0, (stock[group] || 0) - predictedDemand);
      
      const shortageRisk = stock[group] < predictedDemand * 2 
        ? Math.min(100, Math.round((1 - stock[group] / (predictedDemand * 2)) * 100))
        : 0;
      
      dayPrediction[group] = {
        predictedDemand,
        remainingStock: stock[group],
        shortageRisk
      };
    });
    
    predictions.push({ day, ...dayPrediction });
  }
  
  return predictions;
}

// Calculate district readiness score
export function calculateReadinessScore({ totalUnits, criticalRequests, avgResponseTime, expiringUnits, activeBloodBanks }) {
  let score = 100;
  
  // Stock level (max 30 points)
  if (totalUnits < 100) score -= 30;
  else if (totalUnits < 500) score -= 20;
  else if (totalUnits < 1000) score -= 10;
  
  // Critical requests pending (max 25 points)
  score -= Math.min(25, criticalRequests * 5);
  
  // Response time (max 20 points)
  if (avgResponseTime > 60) score -= 20;
  else if (avgResponseTime > 45) score -= 15;
  else if (avgResponseTime > 30) score -= 10;
  else if (avgResponseTime > 15) score -= 5;
  
  // Expiring units (max 15 points)
  const expiryRatio = expiringUnits / Math.max(1, totalUnits);
  score -= Math.min(15, Math.round(expiryRatio * 100));
  
  // Active blood banks (max 10 points)
  if (activeBloodBanks < 3) score -= 10;
  else if (activeBloodBanks < 5) score -= 5;
  
  return Math.max(0, Math.min(100, score));
}

// Suggest optimal redistribution
export function suggestRedistribution(bloodBanks, threshold = 0.3) {
  const suggestions = [];
  
  BLOOD_GROUPS.forEach(group => {
    const surplusBanks = bloodBanks.filter(b => (b.stock?.[group] || 0) > (b.avgDemand?.[group] || 5) * 2);
    const deficitBanks = bloodBanks.filter(b => (b.stock?.[group] || 0) < (b.avgDemand?.[group] || 5) * 0.5);
    
    surplusBanks.forEach(source => {
      deficitBanks.forEach(dest => {
        const surplus = (source.stock?.[group] || 0) - (source.avgDemand?.[group] || 5);
        const deficit = (dest.avgDemand?.[group] || 5) - (dest.stock?.[group] || 0);
        const transferAmount = Math.min(surplus, deficit);
        
        if (transferAmount > 0) {
          suggestions.push({
            fromBank: source,
            toBank: dest,
            bloodGroup: group,
            quantity: transferAmount,
            priority: (dest.stock?.[group] || 0) === 0 ? "critical" : deficit > (source.avgDemand?.[group] || 5) ? "high" : "medium"
          });
        }
      });
    });
  });
  
  return suggestions.sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

// Find optimal blood bank for a request
export function findOptimalBloodBank({ bloodBanks, requestedGroup, quantity, hospitalLocation, urgency }) {
  const compatible = [];
  
  // Find banks with compatible blood
  bloodBanks.forEach(bank => {
    const directStock = bank.stock?.[requestedGroup] || 0;
    let totalCompatible = directStock;
    
    // Check compatible groups for emergencies
    if (urgency === "critical") {
      Object.entries(COMPATIBILITY).forEach(([donorGroup, recipients]) => {
        if (recipients.includes(requestedGroup) && donorGroup !== requestedGroup) {
          totalCompatible += bank.stock?.[donorGroup] || 0;
        }
      });
    }
    
    if (totalCompatible >= quantity) {
      const distance = hospitalLocation 
        ? calculateDistance(hospitalLocation, { lat: bank.latitude, lng: bank.longitude })
        : Math.random() * 20;
      
      compatible.push({
        ...bank,
        availableUnits: totalCompatible,
        directUnits: directStock,
        distance,
        score: calculateBankScore({ ...bank, availableUnits: totalCompatible }, distance, urgency)
      });
    }
  });
  
  return compatible.sort((a, b) => b.score - a.score);
}

function calculateBankScore(bank, distance, urgency) {
  let score = 100;
  
  // Distance (closer is better, max 40 points)
  score -= Math.min(40, distance * 2);
  
  // Rating (max 20 points)
  score += (bank.rating || 3) * 4;
  
  // Stock level (max 20 points)
  score += Math.min(20, bank.availableUnits || 0);
  
  // Urgency bonus for verified banks
  if (urgency === "critical" && bank.is_verified) score += 10;
  
  return Math.max(0, score);
}

function calculateDistance(point1, point2) {
  if (!point1?.lat || !point2?.lat) return 10;
  const R = 6371;
  const dLat = (point2.lat - point1.lat) * Math.PI / 180;
  const dLon = (point2.lng - point1.lng) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Calculate ETA based on distance and urgency
export function calculateETA(distance, urgency) {
  const baseSpeed = urgency === "critical" ? 60 : urgency === "urgent" ? 40 : 30; // km/h
  const minutes = Math.round((distance / baseSpeed) * 60);
  return Math.max(10, minutes);
}

// Generate seasonal demand factor
export function getSeasonalFactor(date = new Date()) {
  const month = date.getMonth();
  // Higher demand in monsoon and winter
  if (month >= 6 && month <= 8) return 1.3; // Monsoon
  if (month >= 11 || month <= 1) return 1.2; // Winter
  return 1.0;
}

// FIFO allocation logic
export function allocateUnitsFIFO(availableUnits, quantity) {
  return availableUnits
    .filter(u => u.status === "available")
    .sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date))
    .slice(0, quantity);
}

// Generate request number
export function generateRequestNumber() {
  const prefix = "BR";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}