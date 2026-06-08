(function () {
  'use strict';

  /* ── Filtres outils développés ── */
  var pills    = document.querySelectorAll('.ot-pill:not(.ot-pill--rec)');
  var sections = document.querySelectorAll('.ot-section');
  var countEl  = document.getElementById('ot-count');

  function countActive() {
    var n = 0;
    sections.forEach(function (s) {
      if (s.style.display !== 'none') {
        n += s.querySelectorAll('.ot-card:not(.ot-card--inactive)').length;
      }
    });
    return n;
  }

  function updateCount() {
    if (!countEl) return;
    var n = countActive();
    countEl.textContent = n + ' outil' + (n > 1 ? 's' : '');
  }

  function filterSections(cat) {
    sections.forEach(function (s) {
      s.style.display = (cat === 'all' || s.dataset.cat === cat) ? '' : 'none';
    });
    updateCount();
  }

  pills.forEach(function (pill) {
    pill.addEventListener('click', function () {
      pills.forEach(function (p) { p.classList.remove('active'); });
      pill.classList.add('active');
      filterSections(pill.dataset.filter);
    });
  });

  /* ── Filtres recommandés ── */
  var recPills = document.querySelectorAll('.ot-pill--rec');
  var recCards = document.querySelectorAll('.ot-rec-card[data-tags]');

  recPills.forEach(function (pill) {
    pill.addEventListener('click', function () {
      recPills.forEach(function (p) { p.classList.remove('active'); });
      pill.classList.add('active');
      var filter = pill.dataset.filter;
      recCards.forEach(function (card) {
        var tags = card.dataset.tags.split(',');
        if (filter === 'Tous' || tags.indexOf(filter) !== -1) {
          card.classList.remove('dimmed');
        } else {
          card.classList.add('dimmed');
        }
      });
    });
  });

  updateCount();
}());
