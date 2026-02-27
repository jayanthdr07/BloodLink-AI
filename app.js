// Database Simulation: Unified Resource Pool
let bloodBanks = [
    { id: 1, name: "Manipal multispecialist", stock: 12, usage: 8, dist: 1.2 },
    { id: 2, name: "apollo", stock: 450, usage: 10, dist: 5.4 },
    { id: 3, name: "Max Emergency Hub", stock: 5, usage: 12, dist: 0.9 },
    { id: 4, name: "City Red Cross", stock: 120, usage: 15, dist: 2.7 }
];

function renderUI(filter = 'all') {
    const grid = document.getElementById('marketplaceGrid');
    if (!grid) return;
    grid.innerHTML = '';

    bloodBanks.forEach(bank => {
        // FORMULA: Days Remaining = Stock / Daily Usage
        const daysRemaining = (bank.stock / bank.usage).toFixed(1);
        const status = daysRemaining < 3 ? 'CRITICAL' : daysRemaining < 7 ? 'WARNING' : 'SAFE';
        const color = status === 'CRITICAL' ? '#d32f2f' : status === 'WARNING' ? '#ff9f00' : '#388e3c';

        // Filter Logic
        if (filter === 'critical' && status !== 'CRITICAL') return;
        if (filter === 'surplus' && bank.stock < 100) return;

        grid.innerHTML += `
            <div class="bank-card ${status === 'CRITICAL' ? 'critical-card' : ''}">
                <div style="display:flex; justify-content:space-between; font-size:12px">
                    <span style="color:${color}; font-weight:bold">${status}</span>
                    <span style="color:#666">📍 ${bank.dist}km away</span>
                </div>
                <h3 style="margin:15px 0 5px 0">${bank.name}</h3>
                <div style="height:6px; background:#eee; border-radius:3px; margin:15px 0; overflow:hidden">
                    <div style="height:100%; width:${Math.min((daysRemaining/10)*100, 100)}%; background:${color}"></div>
                </div>
                <p style="font-size:13px">Prediction: <strong>${daysRemaining} Days Cover</strong></p>
                <p style="font-size:13px">Current: <strong>${bank.stock} Units</strong></p>
                <button class="order-btn" onclick="executeOrder(${bank.id})">REQUEST DELIVERY</button>
            </div>
        `;
    });
}

// Logic: After every delivery update the remaining blood data
function executeOrder(id) {
    const bank = bloodBanks.find(b => b.id === id);
    if (bank && bank.stock > 0) {
        bank.stock--; 
        showSuccess(bank);
        renderUI();
    } else {
        alert("Emergency: Stock Out! Coordinating with nearest Surplus Bank.");
    }
}

function showSuccess(bank) {
    const overlay = document.getElementById('successOverlay');
    document.getElementById('eta').innerText = `ETA: ${Math.round(bank.dist * 6 + 10)} Mins`;
    document.getElementById('orderId').innerText = `ID: BK-${Math.floor(1000 + Math.random() * 9000)}`;
    overlay.style.display = 'flex';
}

function closeSuccess() { document.getElementById('successOverlay').style.display = 'none'; 

}

// Step 3: Transition to Live Tracking
function showTracking(bank) {
    document.getElementById('successOverlay').style.display = 'none';
    const trackOverlay = document.getElementById('trackingOverlay');
    
    // Update Tracking Data
    document.getElementById('routeText').innerText = `${bank.name} → Destination`;
    
    // Mock Map Integration: For a hackathon, you can use an iframe 
    // from a real directions route to show the map.
    const mapBox = document.getElementById('mapContainer');
    mapBox.innerHTML = `<iframe width="100%" height="100%" frameborder="0" style="border:0" 
        src="https://www.google.com/maps/embed/v1/directions?key=YOUR_API_KEY&origin=Victoria+Hospital+Bangalore&destination=St+Johns+Medical+College+Bangalore" allowfullscreen>
        </iframe>`;

    trackOverlay.style.display = 'flex';
}

function closeTracking() {
    document.getElementById('trackingOverlay').style.display = 'none';
}

// Update your Success Modal to include a "Track" button
function showSuccess(bank) {
    const overlay = document.getElementById('successOverlay');
    document.getElementById('eta').innerText = `ETA: ${Math.round(bank.dist * 6 + 10)} Mins`;
    document.getElementById('orderId').innerText = `ID: BK-${Math.floor(1000 + Math.random() * 9000)}`;
    
    // Add a button to open tracking
    const card = overlay.querySelector('.success-card');
    if (!document.getElementById('trackTrigger')) {
        const btn = document.createElement('button');
        btn.id = 'trackTrigger';
        btn.className = 'confirm-btn';
        btn.style.marginTop = '10px';
        btn.innerText = "TRACK LIVE DELIVERY";
        btn.onclick = () => showTracking(bank);
        card.insertBefore(btn, card.lastElementChild);
    }
    
    overlay.style.display = 'flex';
}


// Page Load: Sync with Login UI
window.onload = () => {
    const user = localStorage.getItem('hospitalAuth');
    const authBox = document.getElementById('authSection');
    if (user && authBox) {
        authBox.innerHTML = `<div style="color:white; text-align:right">
            <span style="font-weight:bold">🏥 ${user}</span><br>
            <button onclick="localStorage.clear(); location.reload();" style="color:white; background:none; border:none; text-decoration:underline; font-size:10px; cursor:pointer">Logout</button>
        </div>`;
    }
    renderUI();
};
let selectedBankId = null;

// Step 1: When user clicks "Request Now"
function executeOrder(id) {
    selectedBankId = id;
    const bank = bloodBanks.find(b => b.id === id);
    
    // Pre-fill hospital name if logged in
    const savedHosp = localStorage.getItem('hospitalAuth');
    if (savedHosp) document.getElementById('reqHospital').value = savedHosp;
    
    document.getElementById('requestFormModal').style.display = 'flex';
}

// Step 2: Handle Form Submission
document.getElementById('bloodRequestForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const bank = bloodBanks.find(b => b.id === selectedBankId);
    
    if (bank && bank.stock > 0) {
        // "After every delivery update the remaining blood data"
        bank.stock--; 
        
        // Hide form and show success
        closeForm();
        showSuccess(bank);
        renderUI();
        
        // Log details to console (Simulating a database save)
        console.log("Order Logged:", {
            hospital: document.getElementById('reqHospital').value,
            bloodGroup: document.getElementById('reqGroup').value,
            doctor: document.getElementById('reqDoctor').value,
            address: document.getElementById('reqAddress').value
        });
    }
});

function closeForm() {
    document.getElementById('requestFormModal').style.display = 'none';
}

// Success Modal Logic (Remains the same)
function showSuccess(bank) {
    const overlay = document.getElementById('successOverlay');
    document.getElementById('eta').innerText = `ETA: ${Math.round(bank.dist * 6 + 10)} Mins`;
    document.getElementById('orderId').innerText = `ID: BK-${Math.floor(1000 + Math.random() * 9000)}`;
    overlay.style.display = 'flex';
}