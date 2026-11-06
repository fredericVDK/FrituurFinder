(function () {
  var cfg = window.__MAP__;
  var el = document.getElementById('map');
  if (!cfg || !el || !window.L) return;
  var map = L.map(el, { scrollWheelZoom: false }).setView(cfg.center, cfg.zoom);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);
  var pts = [];
  cfg.markers.forEach(function (m) {
    var mk = L.circleMarker([m.lat, m.lon], {
      radius: 8, color: '#7a3e00', weight: 2, fillColor: '#f5b700', fillOpacity: 0.95,
    }).addTo(map);
    var label = document.createElement('span');
    if (m.url) {
      var a = document.createElement('a');
      a.href = m.url;
      a.textContent = m.name;
      label.appendChild(a);
    } else {
      label.textContent = m.name;
    }
    mk.bindPopup(label);
    pts.push([m.lat, m.lon]);
  });
  if (pts.length > 1) map.fitBounds(pts, { padding: [30, 30], maxZoom: 15 });
})();
