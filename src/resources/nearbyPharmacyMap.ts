import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export function registerNearbyPharmacyMapResource(server: McpServer): void {
// Nearby Pharmacy Map Resource
server.registerResource(
  'nearby-pharmacy-map',
  'ui://widget/nearby-pharmacy-map-v1.html',
  {
    _meta: {
      'openai/widgetDomain': 'https://nearby-pharmacy.onrender.com',
      'openai/widgetCSP': {
        connect_domains: [
          'https://nominatim.openstreetmap.org'
        ],
        resource_domains: [
          'https://unpkg.com',
          'https://tile.openstreetmap.org',
          'https://upload.wikimedia.org',
          'https://delivery-p137454-e1438138.adobeaemcloud.com'
        ]
      }
    }
  },
  async () => ({
    contents: [
      {
        uri: 'ui://widget/nearby-pharmacy-map-v1.html',
        mimeType: 'text/html+skybridge',
        text: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Nearby Pharmacies</title>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    :root {
      --bg: #f5f7fb;
      --card: #ffffff;
      --brand: #e81f26;
      --text: #1f2937;
      --muted: #6b7280;
      --shadow: 0 8px 24px rgba(0,0,0,.08);
      --radius: 16px;
    }
    
    * { box-sizing: border-box; margin: 0; padding: 0; }
    
    body {
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
      padding: 16px;
    }
    
    .container {
      max-width: 800px;
      margin: 0 auto;
    }
    
    .header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }
    
    .header img {
      height: 32px;
      width: auto;
    }
    
    .header h1 {
      font-size: 20px;
      font-weight: 600;
      color: var(--text);
    }
    
    .map-container {
      background: var(--card);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      overflow: hidden;
      margin-bottom: 16px;
    }
    
    #map {
      height: 400px;
      width: 100%;
    }
    
    .pharmacy-list {
      background: var(--card);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      padding: 16px;
    }
    
    .pharmacy-list h2 {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 12px;
      color: var(--text);
    }
    
    .pharmacy-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px;
      border-radius: 8px;
      transition: background 0.2s;
      cursor: pointer;
    }
    
    .pharmacy-item:hover {
      background: #f3f4f6;
    }
    
    .pharmacy-icon {
      width: 40px;
      height: 40px;
      background: var(--brand);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    
    .pharmacy-icon svg {
      width: 20px;
      height: 20px;
      fill: white;
    }
    
    .pharmacy-info {
      flex: 1;
    }
    
    .pharmacy-name {
      font-weight: 600;
      font-size: 14px;
      margin-bottom: 4px;
    }
    
    .pharmacy-address {
      font-size: 13px;
      color: var(--muted);
      margin-bottom: 4px;
    }
    
    .pharmacy-distance {
      font-size: 12px;
      color: var(--brand);
      font-weight: 500;
    }
    
    .pharmacy-hours {
      font-size: 12px;
      color: var(--muted);
    }
    
    .open-badge {
      display: inline-block;
      padding: 2px 8px;
      background: #10b981;
      color: white;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 500;
      margin-left: 8px;
    }
    
    .closed-badge {
      display: inline-block;
      padding: 2px 8px;
      background: #ef4444;
      color: white;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 500;
      margin-left: 8px;
    }
    
    #skeleton {
      text-align: center;
      padding: 60px 20px;
      color: var(--muted);
    }
    
    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #e5e7eb;
      border-top-color: var(--brand);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 16px;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    .error-message {
      background: #fef2f2;
      color: #dc2626;
      padding: 12px 16px;
      border-radius: 8px;
      text-align: center;
      margin-bottom: 16px;
    }
    
    .leaflet-popup-content {
      margin: 12px;
    }
    
    .popup-name {
      font-weight: 600;
      font-size: 14px;
      margin-bottom: 4px;
    }
    
    .popup-address {
      font-size: 13px;
      color: #6b7280;
      margin-bottom: 8px;
    }
    
    .popup-directions {
      display: inline-block;
      padding: 6px 12px;
      background: #e81f26;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
    }
    
    .popup-directions:hover {
      background: #c81e1e;
    }
    
    @media (max-width: 640px) {
      #map { height: 300px; }
      .header h1 { font-size: 18px; }
    }
    
    /* Lilly Direct medicine banner styles */
    .lilly-direct-section {
      background: var(--card);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      padding: 16px;
      margin-bottom: 16px;
    }
    
    .lilly-direct-section h2 {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 12px;
      color: var(--text);
    }
    
    .medicine-single {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 12px;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      background: #fafafa;
    }
    
    .medicine-single img {
      width: 80px;
      height: 80px;
      object-fit: contain;
      border-radius: 8px;
    }
    
    .medicine-single-info {
      flex: 1;
    }
    
    .medicine-single-name {
      font-weight: 600;
      font-size: 16px;
      margin-bottom: 4px;
    }
    
    .medicine-single-label {
      font-size: 13px;
      color: var(--muted);
      margin-bottom: 8px;
    }
    
    .medicine-buy-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 18px;
      background: var(--brand);
      color: white;
      text-decoration: none;
      border-radius: 9999px;
      font-size: 14px;
      font-weight: 500;
      transition: background 0.2s;
    }
    
    .medicine-buy-btn:hover {
      background: #c41922;
    }
    
    .medicine-carousel {
      display: flex;
      gap: 12px;
      overflow-x: auto;
      padding-bottom: 8px;
      scroll-snap-type: x mandatory;
      -webkit-overflow-scrolling: touch;
    }
    
    .medicine-carousel::-webkit-scrollbar {
      height: 4px;
    }
    
    .medicine-carousel::-webkit-scrollbar-thumb {
      background: #d1d5db;
      border-radius: 2px;
    }
    
    .medicine-card {
      flex: 0 0 160px;
      scroll-snap-align: start;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 12px;
      background: #fafafa;
      text-align: center;
      transition: border-color 0.2s;
    }
    
    .medicine-card:hover {
      border-color: var(--brand);
    }
    
    .medicine-card img {
      width: 60px;
      height: 60px;
      object-fit: contain;
      margin-bottom: 8px;
    }
    
    .medicine-card-name {
      font-weight: 600;
      font-size: 13px;
      margin-bottom: 6px;
    }
    
    .medicine-card-btn {
      display: inline-block;
      padding: 5px 12px;
      background: var(--brand);
      color: white;
      text-decoration: none;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 500;
    }
    
    .medicine-card-btn:hover {
      background: #c41922;
    }
  </style>
</head>
<body>
  <div id="skeleton">
    <div class="spinner"></div>
    <p>Finding nearby pharmacies...</p>
  </div>
  
  <div id="root" hidden>
    <div class="container">
      <div class="header">
        <img src="https://upload.wikimedia.org/wikipedia/commons/1/1e/Lilly-Logo.svg" alt="Lilly" />
        <h1>Nearby Pharmacies</h1>
      </div>
      
      <div id="error-container"></div>
      
      <div id="lilly-direct-container"></div>
      
      <div class="map-container">
        <div id="map"></div>
      </div>
      

      <div style="background: #ffffff; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); padding: 0; overflow: hidden; text-align: center; margin-bottom: 16px;">
        <div style="background: linear-gradient(135deg, #e81f26 0%, #c41922 100%); height: 4px;"></div>
        <div style="padding: 24px;">
          <div style="background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 8px 12px; font-size: 13px; color: #0369a1; margin-bottom: 16px; display: inline-block; font-weight: 500;">🚚 Free Home Delivery</div>
          <div style="width: 120px; height: 80px; margin: 0 auto 12px; background: #f5f5f5; border-radius: 16px; padding: 8px; display: flex; align-items: center; justify-content: center;">
            <img src="https://delivery-p137454-e1438138.adobeaemcloud.com/adobe/assets/urn:aaid:aem:4cb54322-1b06-40ce-9d7f-3417d1fb259c" alt="Zepbound" style="width: 100%; height: 100%; object-fit: contain;" />
          </div>
          <div style="font-size: 20px; font-weight: 700; color: #1a1a1a; margin-bottom: 4px;">Zepbound®</div>
          <div style="font-size: 13px; color: #6b7280; margin-bottom: 12px;">tirzepatide</div>
          <div style="font-size: 14px; color: #4b5563; margin-bottom: 12px; line-height: 1.5;">Order directly from Lilly with home delivery</div>
          <div style="color: #10b981; font-size: 14px; font-weight: 500; margin-bottom: 16px;">✓ Direct from Manufacturer</div>
          <a href="https://www.lilly.com/lillydirect/medicines/zepbound" target="_blank" style="display: inline-block; background: #e81f26; color: white; padding: 10px 24px; border-radius: 30px; text-decoration: none; font-size: 13px; font-weight: 600; transition: all 0.2s;" onmouseover="this.style.background='#c41922'" onmouseout="this.style.background='#e81f26'">Shop Zepbound</a>
        </div>
      </div>
      <div class="pharmacy-list">
        <h2>📍 Pharmacies Near You</h2>
        <div id="pharmacy-items"></div>
      </div>
    </div>
  </div>

  <script>
    const skeleton = document.getElementById('skeleton');
    const root = document.getElementById('root');
    const errorContainer = document.getElementById('error-container');
    const pharmacyItems = document.getElementById('pharmacy-items');
    
    let map = null;
    let markers = [];
    let userMarker = null;
    
    // Pharmacy icon for markers
    const pharmacyIcon = L.divIcon({
      html: '<div style="background:#e81f26;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)"><svg width="16" height="16" fill="white" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 11h-4v4h-4v-4H6v-4h4V6h4v4h4v4z"/></svg></div>',
      className: 'pharmacy-marker',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    });
    
    // User location icon
    const userIcon = L.divIcon({
      html: '<div style="background:#3b82f6;width:24px;height:24px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>',
      className: 'user-marker',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });
    
    function calculateDistance(lat1, lon1, lat2, lon2) {
      const R = 3959; // Earth's radius in miles
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return (R * c).toFixed(1);
    }
    
    function isPharmacyOpen() {
      const hour = new Date().getHours();
      return hour >= 8 && hour < 21;
    }
    
    function showError(message) {
      errorContainer.innerHTML = '<div class="error-message">' + message + '</div>';
    }
    
    function initMap(userLat, userLng, pharmacies) {
      // Initialize map centered on user
      map = L.map('map').setView([userLat, userLng], 13);
      
      // Add OpenStreetMap tiles
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);
      
      // Add user marker
      userMarker = L.marker([userLat, userLng], { icon: userIcon })
        .addTo(map)
        .bindPopup('<strong>📍 Your Location</strong>');
      
      // Add pharmacy markers
      const bounds = L.latLngBounds([[userLat, userLng]]);
      
      pharmacies.forEach((pharmacy, index) => {
        const marker = L.marker([pharmacy.lat, pharmacy.lng], { icon: pharmacyIcon })
          .addTo(map)
          .bindPopup(
            '<div class="popup-name">' + pharmacy.name + '</div>' +
            '<div class="popup-address">' + pharmacy.address + '</div>' +
            '<a class="popup-directions" href="https://www.google.com/maps/dir/?api=1&destination=' + 
            encodeURIComponent(pharmacy.address) + '" target="_blank">Get Directions</a>'
          );
        
        markers.push(marker);
        bounds.extend([pharmacy.lat, pharmacy.lng]);
      });
      
      // Fit map to show all markers
      if (pharmacies.length > 0) {
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
    
    function renderPharmacyList(pharmacies, userLat, userLng) {
      pharmacyItems.innerHTML = pharmacies.map((pharmacy, index) => {
        const distance = calculateDistance(userLat, userLng, pharmacy.lat, pharmacy.lng);
        const isOpen = isPharmacyOpen();
        const statusBadge = isOpen 
          ? '<span class="open-badge">Open</span>'
          : '<span class="closed-badge">Closed</span>';
        
        return '<div class="pharmacy-item" onclick="focusPharmacy(' + index + ')">' +
          '<div class="pharmacy-icon">' +
            '<svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 11h-4v4h-4v-4H6v-4h4V6h4v4h4v4z"/></svg>' +
          '</div>' +
          '<div class="pharmacy-info">' +
            '<div class="pharmacy-name">' + pharmacy.name + statusBadge + '</div>' +
            '<div class="pharmacy-address">' + pharmacy.address + '</div>' +
            '<div class="pharmacy-distance">📍 ' + distance + ' miles away</div>' +
            '<div class="pharmacy-hours">Hours: 8:00 AM - 9:00 PM</div>' +
          '</div>' +
        '</div>';
      }).join('');
    }
    
    window.focusPharmacy = function(index) {
      if (markers[index]) {
        map.setView(markers[index].getLatLng(), 16);
        markers[index].openPopup();
      }
    };
    
    function renderIfReady() {
      const out = window.openai?.toolOutput || {};
      const pharmacies = out.pharmacies || [];
      const userLocation = out.userLocation || null;
      const error = out.error || null;
      const lillyDirect = out.lillyDirect || null;
      
      if (error) {
        skeleton.hidden = true;
        root.hidden = false;
        showError(error);
        // Still render Lilly Direct even on error
        if (lillyDirect) renderLillyDirect(lillyDirect);
        return;
      }
      
      if (!pharmacies.length || !userLocation) return;
      
      skeleton.hidden = true;
      root.hidden = false;
      
      // Render Lilly Direct medicine section above the map
      if (lillyDirect) renderLillyDirect(lillyDirect);
      
      initMap(userLocation.lat, userLocation.lng, pharmacies);
      renderPharmacyList(pharmacies, userLocation.lat, userLocation.lng);
      
      // Sync state with ChatGPT
      if (window.oai?.widget?.setState) {
        window.oai.widget.setState({
          pharmacyCount: pharmacies.length,
          userLocation: userLocation
        });
      }
    }
    
    function renderLillyDirect(data) {
      const container = document.getElementById('lilly-direct-container');
      if (!container || !data || !data.items || !data.items.length) return;
      
      if (data.type === 'single') {
        const med = data.items[0];
        container.innerHTML = '<div class="lilly-direct-section">' +
          '<h2>\uD83D\uDED2 Buy ' + med.name + ' Online from Lilly Direct</h2>' +
          '<div class="medicine-single">' +
            '<img src="' + med.image + '" alt="' + med.name + '" crossorigin="anonymous" referrerpolicy="no-referrer" />' +
            '<div class="medicine-single-info">' +
              '<div class="medicine-single-name">' + med.name + '</div>' +
              '<div class="medicine-single-label">FDA-approved \u2022 Free delivery</div>' +
              '<a href="' + med.buyLink + '" target="_blank" class="medicine-buy-btn">' +
                med.buyLinkText + ' \u2192' +
              '</a>' +
            '</div>' +
          '</div>' +
        '</div>';
      } else {
        container.innerHTML = '<div class="lilly-direct-section">' +
          '<h2>\uD83D\uDED2 Buy Medicines Online from Lilly Direct</h2>' +
          '<div class="medicine-carousel">' +
            data.items.map(function(med) {
              return '<div class="medicine-card">' +
                '<img src="' + med.image + '" alt="' + med.name + '" crossorigin="anonymous" referrerpolicy="no-referrer" />' +
                '<div class="medicine-card-name">' + med.name + '</div>' +
                '<a href="' + med.buyLink + '" target="_blank" class="medicine-card-btn">' + med.buyLinkText + '</a>' +
              '</div>';
            }).join('') +
          '</div>' +
        '</div>';
      }
    }
    
    renderIfReady();
    window.addEventListener('openai:set_globals', renderIfReady);
    window.addEventListener('openai:tool_response', renderIfReady);
  </script>
</body>
</html>`,
        _meta: {
          'openai/widgetDomain': 'https://nearby-pharmacy.onrender.com',
          'openai/widgetCSP': {
            connect_domains: [
              'https://nominatim.openstreetmap.org'
            ],
            resource_domains: [
              'https://unpkg.com',
              'https://tile.openstreetmap.org',
              'https://upload.wikimedia.org',
              'https://delivery-p137454-e1438138.adobeaemcloud.com'
            ]
          }
        }
      },
    ]
  })
);
}
