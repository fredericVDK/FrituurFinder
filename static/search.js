(function () {
  var form = document.querySelector('[data-search]');
  var towns = window.__TOWNS__ || {};
  if (!form) return;
  function norm(s) {
    return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  }
  var keys = Object.keys(towns);
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var q = norm(form.q.value);
    if (!q) return;
    var hit =
      keys.find(function (k) { return norm(k) === q; }) ||
      keys.find(function (k) { return norm(k).indexOf(q) === 0; }) ||
      keys.find(function (k) { return norm(k).indexOf(q) !== -1; });
    if (hit) {
      location.href = towns[hit];
    } else {
      form.q.setCustomValidity('?');
      form.q.reportValidity();
      setTimeout(function () { form.q.setCustomValidity(''); }, 1500);
    }
  });
})();
