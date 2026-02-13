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
      --bg: transparent;
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
      max-width: 420px;
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
      background: #ffffff;
      padding: 30px;
    }
    
    .pharmacy-list h2 {
      font-size: 28px;
      font-weight: bold;
      margin-bottom: 25px;
      color: var(--text);
    }
    
    .pharmacy-item {
      padding: 18px 0;
      border-top: 1px dashed #cfcfcf;
      cursor: pointer;
    }
    
    .pharmacy-item:first-child {
      border-top: none;
    }
    
    .pharmacy-title {
      font-size: 20px;
      font-weight: bold;
      margin-bottom: 6px;
    }
    
    .pharmacy-description {
      color: #444;
      line-height: 1.5;
      margin-bottom: 10px;
    }
    
    .pharmacy-meta {
      font-size: 14px;
      display: flex;
      gap: 10px;
      align-items: center;
    }
    
    .pharmacy-status {
      color: #1c8b4a;
      font-weight: 500;
    }
    
    .pharmacy-status.closed {
      color: #d44;
    }
    
    .pharmacy-distance {
      color: #d44;
      font-weight: 500;
    }
    
    .pharmacy-divider {
      color: #999;
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
    
    /* Lilly Direct medicine carousel styles */
    .lilly-carousel {
      width: 100%;
      position: relative;
      margin-bottom: 16px;
    }
    
    .lilly-carousel-header {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 15px;
      color: var(--text);
    }
    
    .lilly-slides {
      overflow: hidden;
    }
    
    .lilly-slides-track {
      display: flex;
      gap: 12px;
      transition: transform 0.4s ease;
    }
    
    .lilly-card {
      flex: 0 0 calc(100% - 60px);
      background: #cfd6dc;
      padding: 20px;
      border-radius: 20px;
      box-sizing: border-box;
    }
    
    .lilly-card img {
      width: 100%;
      height: 200px;
      object-fit: contain;
      border-radius: 10px;
      background: #e2e8ed;
    }
    
    .lilly-card-title {
      font-weight: bold;
      font-size: 22px;
      margin-top: 15px;
    }
    
    .lilly-card-btn {
      margin-top: 15px;
      background: #d63a2f;
      color: white;
      border: none;
      padding: 12px 20px;
      border-radius: 30px;
      cursor: pointer;
      font-size: 14px;
      text-decoration: none;
      display: inline-block;
    }
    
    .lilly-card-btn:hover {
      background: #b5302a;
    }
    
    .lilly-nav {
      display: flex;
      justify-content: center;
      align-items: center;
      margin-top: 12px;
      gap: 10px;
    }
    
    .lilly-arrow {
      cursor: pointer;
      font-size: 20px;
      user-select: none;
    }
    
    .lilly-dots {
      display: flex;
      gap: 6px;
    }
    
    .lilly-dot {
      width: 8px;
      height: 8px;
      background: #ccc;
      border-radius: 50%;
      cursor: pointer;
    }
    
    .lilly-dot.active {
      background: #333;
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
      <div id="error-container"></div>
      
      <div id="lilly-direct-container"></div>
      
      <div class="map-container">
        <div id="map"></div>
      </div>
      

      <div class="pharmacy-list">
        <h2>Pharmacies near you</h2>
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
        const statusText = isOpen ? 'Open' : 'Closed';
        const statusClass = isOpen ? 'pharmacy-status' : 'pharmacy-status closed';
        
        return '<div class="pharmacy-item" onclick="focusPharmacy(' + index + ')">' +
          '<div class="pharmacy-title">' + pharmacy.name + '</div>' +
          '<div class="pharmacy-description">' + pharmacy.address + '</div>' +
          '<div class="pharmacy-meta">' +
            '<span class="' + statusClass + '">' + statusText + '</span>' +
            '<span class="pharmacy-divider">\u2022</span>' +
            '<span>Closes 9:00 PM</span>' +
            '<span class="pharmacy-divider">|</span>' +
            '<span class="pharmacy-distance">' + distance + ' miles away</span>' +
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
      
      const items = data.items;
      const cardsHtml = items.map(function(med) {
        return '<div class="lilly-card">' +
          '<img src="' + med.image + '" alt="' + med.name + '" crossorigin="anonymous" referrerpolicy="no-referrer" />' +
          '<div class="lilly-card-title">' + med.name + '</div>' +
          '<a href="' + med.buyLink + '" target="_blank" class="lilly-card-btn">' + med.buyLinkText + ' \u2192</a>' +
        '</div>';
      }).join('');
      
      const navHtml = items.length > 1
        ? '<div class="lilly-nav">' +
            '<div class="lilly-arrow" id="lillyPrev">\u2039</div>' +
            '<div class="lilly-dots" id="lillyDots"></div>' +
            '<div class="lilly-arrow" id="lillyNext">\u203A</div>' +
          '</div>'
        : '';
      
      container.innerHTML =
        '<div class="lilly-carousel">' +
          '<div class="lilly-carousel-header">Buy medicines online from Lilly Direct</div>' +
          '<div class="lilly-slides">' +
            '<div class="lilly-slides-track" id="lillyTrack">' + cardsHtml + '</div>' +
          '</div>' +
          navHtml +
        '</div>';
      
      // Carousel logic
      var track = document.getElementById('lillyTrack');
      var slides = track ? track.querySelectorAll('.lilly-card') : [];
      var dotsContainer = document.getElementById('lillyDots');
      var idx = 0;
      
      if (dotsContainer && slides.length > 1) {
        for (var i = 0; i < slides.length; i++) {
          (function(ii) {
            var dot = document.createElement('div');
            dot.classList.add('lilly-dot');
            if (ii === 0) dot.classList.add('active');
            dot.addEventListener('click', function() { idx = ii; updateLillyCarousel(); });
            dotsContainer.appendChild(dot);
          })(i);
        }
      }
      
      var GAP = 12;
      var slidesContainer = container.querySelector('.lilly-slides');
      
      function updateLillyCarousel() {
        if (!slides.length) return;
        var cardW = slides[0].getBoundingClientRect().width + GAP;
        var maxScroll = track.scrollWidth - slidesContainer.offsetWidth;
        var offset = idx * cardW;
        if (offset > maxScroll) offset = maxScroll;
        track.style.transform = 'translateX(-' + offset + 'px)';
        var allDots = container.querySelectorAll('.lilly-dot');
        for (var d = 0; d < allDots.length; d++) {
          allDots[d].classList.toggle('active', d === idx);
        }
      }
      
      var prevBtn = document.getElementById('lillyPrev');
      var nextBtn = document.getElementById('lillyNext');
      if (nextBtn) nextBtn.addEventListener('click', function() {
        idx = idx < slides.length - 1 ? idx + 1 : 0;
        updateLillyCarousel();
      });
      if (prevBtn) prevBtn.addEventListener('click', function() {
        idx = idx > 0 ? idx - 1 : slides.length - 1;
        updateLillyCarousel();
      });
      
      // Touch/swipe support
      var touchStartX = 0;
      var SWIPE_THRESHOLD = 50;
      if (track) {
        track.addEventListener('touchstart', function(e) {
          touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });
        track.addEventListener('touchend', function(e) {
          var diff = touchStartX - e.changedTouches[0].screenX;
          if (Math.abs(diff) > SWIPE_THRESHOLD) {
            if (diff > 0) { idx = idx < slides.length - 1 ? idx + 1 : 0; }
            else { idx = idx > 0 ? idx - 1 : slides.length - 1; }
            updateLillyCarousel();
          }
        });
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
