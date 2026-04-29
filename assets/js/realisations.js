(function () {
  'use strict';

  const typeLabels = {
    site:   'Site web',
    etude:  'Étude de cas',
    astuce: 'Astuce',
    outil:  'Outil'
  };

  let activeFilter = 'all';
  let items = [];

  function renderGrid() {
    const grid  = document.getElementById('rl-grid');
    const count = document.getElementById('rl-count');
    if (!grid) return;

    const visible = activeFilter === 'all'
      ? items
      : items.filter(i => i.type === activeFilter);

    count.textContent = visible.length + ' résultat' + (visible.length > 1 ? 's' : '');

    if (visible.length === 0) {
      grid.innerHTML = '<div class="rl-empty">Aucun résultat pour ce filtre.</div>';
      return;
    }

    grid.innerHTML = visible.map(function (item) {
      const thumb = item.image
        ? '<img src="' + item.image + '" alt="' + item.title + '">'
        : '<span class="rl-card-thumb-emoji">' + item.emoji + '</span>';

      const tags = (item.tags || [])
        .map(function (t) { return '<span class="rl-card-meta-tag">' + t + '</span>'; })
        .join('');

      return [
        '<a class="rl-card" href="' + (item.url || '#') + '">',
        '  <div class="rl-card-thumb">' + thumb + '</div>',
        '  <div class="rl-card-body">',
        '    <div class="rl-card-tags">',
        '      <span class="rl-badge rl-badge--' + item.type + '">' + typeLabels[item.type] + '</span>',
        '    </div>',
        '    <h2 class="rl-card-title">' + item.title + '</h2>',
        '    <p class="rl-card-desc">' + item.desc + '</p>',
        '    <div class="rl-card-footer">',
        '      <div class="rl-card-meta-tags">' + tags + '</div>',
        '      <span class="rl-card-link">Lire <span class="rl-card-arrow">→</span></span>',
        '    </div>',
        '  </div>',
        '</a>'
      ].join('');
    }).join('');
  }

  function initFilters() {
    const row = document.getElementById('rl-filter-row');
    if (!row) return;

    row.addEventListener('click', function (e) {
      const btn = e.target.closest('.rl-pill');
      if (!btn) return;
      row.querySelectorAll('.rl-pill').forEach(function (p) { p.classList.remove('active'); });
      btn.classList.add('active');
      activeFilter = btn.dataset.filter;
      renderGrid();
    });
  }

  function markActiveNavLink() {
    const links = document.querySelectorAll('.nav-links a');
    links.forEach(function (a) {
      if (a.href && a.href.includes('/realisations')) {
        a.classList.add('rl-nav-active');
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (typeof RL_ITEMS !== 'undefined') {
      items = RL_ITEMS;
    }
    markActiveNavLink();
    initFilters();
    renderGrid();
  });
}());
