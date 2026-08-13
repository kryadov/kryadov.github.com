(function () {
  'use strict';

  function applyFilter(state, rows, emptyEl) {
    var visible = 0;
    for (var i = 0; i < rows.length; i += 1) {
      var row = rows[i];
      var trackOk = !state.track || row.getAttribute('data-track') === state.track;
      var langOk = !state.lang || row.getAttribute('data-lang') === state.lang;
      var show = trackOk && langOk;
      row.hidden = !show;
      if (show) visible += 1;
    }
    if (emptyEl) emptyEl.hidden = visible !== 0;
    return visible;
  }

  if (typeof window !== 'undefined') {
    window.__applyFilter = applyFilter;
  }

  if (typeof document === 'undefined') return;

  document.addEventListener('DOMContentLoaded', function () {
    var bar = document.querySelector('[data-filter]');
    if (!bar) return;
    bar.hidden = false;

    var rows = document.querySelectorAll('.row');
    var emptyEl = document.querySelector('[data-filter-empty]');
    var state = { track: '', lang: '' };

    bar.addEventListener('click', function (event) {
      var button = event.target.closest('.filter__chip');
      if (!button) return;

      var kind = button.hasAttribute('data-filter-track') ? 'track' : 'lang';
      var attr = kind === 'track' ? 'data-filter-track' : 'data-filter-lang';
      state[kind] = button.getAttribute(attr);

      var siblings = bar.querySelectorAll('[' + attr + ']');
      for (var i = 0; i < siblings.length; i += 1) {
        siblings[i].classList.toggle('is-on', siblings[i] === button);
      }

      applyFilter(state, rows, emptyEl);

      var groups = document.querySelectorAll('[data-track-group]');
      for (var g = 0; g < groups.length; g += 1) {
        var group = groups[g];
        var shown = group.querySelectorAll('.row:not([hidden])').length;
        group.hidden = shown === 0;
      }
    });
  });
})();
