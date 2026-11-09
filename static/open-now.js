// Shows "Open now / Closed" badges, computed in Belgian time from the data-hours schedule
// (array of 7 days, Mon..Sun, each a list of [startMin, endMin]; endMin > 1440 = past midnight).
(function () {
  var lang = (document.documentElement.lang || 'nl').slice(0, 2);
  var L = {
    nl: { open: 'Nu open', closes: 'sluit om', closed: 'Nu gesloten', opens: 'opent om', today: '', days: ['maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag', 'zondag'] },
    fr: { open: 'Ouvert maintenant', closes: 'ferme à', closed: 'Fermé', opens: 'ouvre à', today: '', days: ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'] },
    en: { open: 'Open now', closes: 'closes at', closed: 'Closed now', opens: 'opens at', today: '', days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] },
  }[lang] || null;
  if (!L) return;

  function nowInBrussels() {
    var parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Brussels', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(new Date());
    var get = function (t) { return (parts.find(function (p) { return p.type === t; }) || {}).value; };
    var day = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(get('weekday'));
    return { day: day, min: parseInt(get('hour'), 10) * 60 + parseInt(get('minute'), 10) };
  }
  function hhmm(m) {
    m = ((m % 1440) + 1440) % 1440;
    return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
  }
  function status(week, now) {
    var today = week[now.day] || [];
    for (var i = 0; i < today.length; i++) {
      if (now.min >= today[i][0] && now.min < today[i][1]) return { open: true, at: today[i][1] };
    }
    var prev = week[(now.day + 6) % 7] || [];
    for (var j = 0; j < prev.length; j++) {
      if (prev[j][1] > 1440 && now.min < prev[j][1] - 1440) return { open: true, at: prev[j][1] };
    }
    for (var k = 0; k < 7; k++) {
      var d = (now.day + k) % 7;
      var slots = (week[d] || []).slice().sort(function (a, b) { return a[0] - b[0]; });
      for (var n = 0; n < slots.length; n++) {
        if (k > 0 || slots[n][0] > now.min) return { open: false, at: slots[n][0], dayOffset: k, day: d };
      }
    }
    return null;
  }
  function update() {
    var now = nowInBrussels();
    if (now.day < 0) return;
    document.querySelectorAll('.open-badge[data-hours]').forEach(function (el) {
      var week;
      try { week = JSON.parse(el.getAttribute('data-hours')); } catch (e) { return; }
      var st = status(week, now);
      if (!st) return;
      var text;
      var next = week[(now.day + 1) % 7] || [];
      if (st.open && st.at === 1440 && next.length && next[0][0] === 0) {
        text = L.open;
      } else if (st.open) {
        text = L.open + ' · ' + L.closes + ' ' + hhmm(st.at);
      } else if (st.dayOffset === 0) {
        text = L.closed + ' · ' + L.opens + ' ' + hhmm(st.at);
      } else {
        text = L.closed + ' · ' + L.opens + ' ' + hhmm(st.at) + ' (' + L.days[st.day] + ')';
      }
      el.textContent = text;
      el.className = 'open-badge ' + (st.open ? 'is-open' : 'is-closed');
      el.hidden = false;
    });
    var row = document.querySelector('.week tr[data-day="' + now.day + '"]');
    if (row) row.classList.add('today');
  }
  update();
  setInterval(update, 60000);
})();
