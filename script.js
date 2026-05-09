/* ============================================================
   MY STUDIO — script.js  v2
   Modes (ENEM / Academia / Custom) + Palette picker + Sidebar
   ============================================================ */
'use strict';

/* ══ MODES ══════════════════════════════════════════════════ */
const MODES = {
  enem: {
    label: 'ENEM 2025',
    categories: [
      { key:'matematica', label:'Matemática' },
      { key:'linguagens', label:'Linguagens' },
      { key:'humanas',    label:'C. Humanas' },
      { key:'natureza',   label:'C. Natureza' },
      { key:'redacao',    label:'Redação' },
      { key:'disciplina', label:'Disciplina' },
      { key:'revisao',    label:'Revisão' },
      { key:'foco',       label:'Foco' },
    ],
  },
  academia: {
    label: 'Físico',
    categories: [
      { key:'forca',       label:'Força' },
      { key:'resistencia', label:'Resistência' },
      { key:'velocidade',  label:'Velocidade' },
      { key:'flexibilidade',label:'Flexibilidade' },
      { key:'equilibrio',  label:'Equilíbrio' },
      { key:'cardio',      label:'Cardio' },
      { key:'nutricao',    label:'Nutrição' },
    ],
  },
  custom: {
    label: 'Custom',
    categories: [], // populated from storage
  },
  vida: {
    label: 'Vida',
    categories: [
      { key:'mente',      label:'🧠 Mente' },
      { key:'corpo',      label:'💪 Corpo' },
      { key:'social',     label:'🗣️ Social' },
      { key:'disciplina', label:'🎯 Disciplina' },
      { key:'financas',   label:'💰 Finanças' },
    ],
  },
  academia: {
    label: 'Físico',
    categories: [
      { key:'forca',        label:'Força' },
      { key:'resistencia',  label:'Resistência' },
      { key:'velocidade',   label:'Velocidade' },
      { key:'flexibilidade',label:'Flexibilidade' },
      { key:'equilibrio',   label:'Equilíbrio' },
      { key:'cardio',       label:'Cardio' },
    ],
  },
  social: {
    label: 'Social',
    categories: [
      { key:'comunicacao',     label:'Comunicação' },
      { key:'conexoes',        label:'Conexões' },
      { key:'confianca',       label:'Confiança' },
      { key:'colaboracao',     label:'Colaboração' },
      { key:'empatia',         label:'Empatia' },
      { key:'relacionamentos', label:'Relacionamentos' },
    ],
  },
};

/* ══ PALETTES ═══════════════════════════════════════════════ */
const PALETTES = [
  { id:'mono',    name:'Mono',     line:'#ffffff', fill:'#ffffff' },
  { id:'neon',    name:'Neon',     line:'#00ffcc', fill:'#00ffcc' },
  { id:'flame',   name:'Chama',    line:'#ff6b35', fill:'#ff6b35' },
  { id:'sky',     name:'Céu',      line:'#38bdf8', fill:'#38bdf8' },
  { id:'violet',  name:'Violeta',  line:'#a78bfa', fill:'#a78bfa' },
  { id:'gold',    name:'Ouro',     line:'#fbbf24', fill:'#fbbf24' },
];
const FILL_ALPHA = 0.12; // fill opacity

/* ══ STORAGE KEYS ═══════════════════════════════════════════ */
const SK = {
  scores:       k => `ms_scores_${k}`,
  theme:        'ms_theme',
  mode:         'ms_mode',
  palette:      'ms_palette',
  customLine:   'ms_cp_line',
  customFill:   'ms_cp_fill',
  customCats:   'ms_custom_cats',
  sbExpanded:   'ms_sb_expanded',
  backup:       'ms_app_backup_v1',
};

/* ══ STATE ══════════════════════════════════════════════════ */
let currentMode    = localStorage.getItem(SK.mode)    || 'enem';
let currentPalette = localStorage.getItem(SK.palette) || 'mono';
let customLine     = localStorage.getItem(SK.customLine) || '#00ffcc';
let customFill     = localStorage.getItem(SK.customFill) || '#00ffcc';
let chart          = null;
let scores         = {};

restoreBackupState();

/* ══ BOOT ═══════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  loadCustomCategories();
  loadScores();
  initTheme();
  initSidebar();
  initModes();
  initPalettes();
  initCustomColor();
  buildSliders();
  buildChart();
  updateStats();
  updateTopbar();
  setDate();
  persistAppBackup();
});

function persistAppBackup() {
  const allScores = {};

  Object.keys(MODES).forEach(modeKey => {
    const categories = MODES[modeKey]?.categories || [];
    allScores[modeKey] = {};

    categories.forEach(category => {
      const storageKey = SK.scores(`${modeKey}_${category.key}`);
      const raw = localStorage.getItem(storageKey);
      allScores[modeKey][category.key] = raw !== null ? parseFloat(raw) : 5;
    });
  });

  const payload = {
    mode: currentMode,
    palette: currentPalette,
    customLine,
    customFill,
    theme: localStorage.getItem(SK.theme) || 'dark',
    sidebarExpanded: localStorage.getItem(SK.sbExpanded) || '0',
    customCategories: MODES.custom.categories,
    scores: allScores,
    updatedAt: Date.now(),
  };

  localStorage.setItem(SK.backup, JSON.stringify(payload));
}

function restoreBackupState() {
  try {
    const raw = localStorage.getItem(SK.backup);
    if (!raw) return;

    const backup = JSON.parse(raw);
    if (!backup || typeof backup !== 'object') return;

    if (backup.mode && !localStorage.getItem(SK.mode)) {
      localStorage.setItem(SK.mode, backup.mode);
    }
    if (backup.palette && !localStorage.getItem(SK.palette)) {
      localStorage.setItem(SK.palette, backup.palette);
    }
    if (backup.customLine && !localStorage.getItem(SK.customLine)) {
      localStorage.setItem(SK.customLine, backup.customLine);
    }
    if (backup.customFill && !localStorage.getItem(SK.customFill)) {
      localStorage.setItem(SK.customFill, backup.customFill);
    }
    if (backup.theme && !localStorage.getItem(SK.theme)) {
      localStorage.setItem(SK.theme, backup.theme);
    }
    if (backup.sidebarExpanded && !localStorage.getItem(SK.sbExpanded)) {
      localStorage.setItem(SK.sbExpanded, backup.sidebarExpanded);
    }
    if (Array.isArray(backup.customCategories) && !localStorage.getItem(SK.customCats)) {
      localStorage.setItem(SK.customCats, JSON.stringify(backup.customCategories));
    }
    if (backup.scores && typeof backup.scores === 'object') {
      Object.entries(backup.scores).forEach(([modeKey, modeScores]) => {
        if (!modeScores || typeof modeScores !== 'object') return;

        Object.entries(modeScores).forEach(([categoryKey, value]) => {
          const storageKey = SK.scores(`${modeKey}_${categoryKey}`);
          if (localStorage.getItem(storageKey) === null) {
            localStorage.setItem(storageKey, String(value));
          }
        });
      });
    }
  } catch (_) {}
}

/* ══ DATE ═══════════════════════════════════════════════════ */
function setDate() {
  const el = document.getElementById('topbar-date');
  if (!el) return;
  const d = new Date();
  el.textContent = d.toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit',month:'short'});
}

/* ══ THEME ══════════════════════════════════════════════════ */
function initTheme() {
  const saved = localStorage.getItem(SK.theme) || 'dark';
  applyTheme(saved);

  document.querySelectorAll('[data-theme-val]').forEach(btn => {
    btn.addEventListener('click', () => {
      const v = btn.dataset.themeVal;
      applyTheme(v);
      localStorage.setItem(SK.theme, v);
      persistAppBackup();
    });
  });

  window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
    if ((localStorage.getItem(SK.theme)||'dark') === 'auto') applyTheme('auto');
  });
}

function resolveTheme(v) {
  return v === 'auto'
    ? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
    : v;
}

function applyTheme(v) {
  const resolved = resolveTheme(v);
  document.documentElement.setAttribute('data-theme', resolved);
  ['dark','light','auto'].forEach(t => {
    const el = document.getElementById(`tc-${t}`);
    if (el) el.classList.toggle('visible', t === v);
  });
  if (chart) rebuildChartTheme();
}

/* ══ SIDEBAR ════════════════════════════════════════════════ */
function initSidebar() {
  const sidebar   = document.getElementById('sidebar');
  const colBtn    = document.getElementById('sb-collapse-btn');
  const mobBtn    = document.getElementById('mobile-menu-btn');
  const overlay   = document.getElementById('mob-overlay');

  // Restore desktop expanded state
  const wasExpanded = localStorage.getItem(SK.sbExpanded) === '1';
  if (wasExpanded) expand(true);

  colBtn?.addEventListener('click', () => {
    const isExp = sidebar.classList.contains('expanded');
    expand(!isExp);
    localStorage.setItem(SK.sbExpanded, !isExp ? '1' : '0');
    persistAppBackup();
  });

  // Rail buttons
  document.querySelectorAll('.sb-rail-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const p = btn.dataset.panel;
      const alreadyActive = btn.classList.contains('active');
      activatePanel(p);
      if (!sidebar.classList.contains('expanded')) {
        expand(true);
        localStorage.setItem(SK.sbExpanded, '1');
        persistAppBackup();
      } else if (alreadyActive) {
        expand(false);
        localStorage.setItem(SK.sbExpanded, '0');
        persistAppBackup();
      }
    });
  });

  // Mobile bottom nav
  document.querySelectorAll('.mob-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const p = btn.dataset.mobPanel;
      document.querySelectorAll('.mob-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      openMobileDrawer(p);
    });
  });

  overlay?.addEventListener('click', closeMobileDrawer);

  function expand(yes) {
    sidebar.classList.toggle('expanded', yes);
    document.body.classList.toggle('sb-expanded', yes);
  }

  function activatePanel(p) {
    document.querySelectorAll('.sb-rail-btn').forEach(b =>
      b.classList.toggle('active', b.dataset.panel === p));
    document.querySelectorAll('.sb-panel').forEach(panel =>
      panel.classList.toggle('hidden', !panel.id.endsWith(p)));
    const found = document.getElementById(`panel-${p}`);
    if (found) found.classList.remove('hidden');
  }
}

/* ══ MOBILE DRAWER ══════════════════════════════════════════ */
function openMobileDrawer(panelId) {
  const overlay = document.getElementById('mob-overlay');
  const drawer  = document.getElementById('mob-drawer');
  const body    = document.getElementById('mob-drawer-body');
  const source  = document.getElementById(`panel-${panelId}`);

  if (!source || !body) return;

  body.innerHTML = '';
  // Clone panel content into drawer
  const clone = source.cloneNode(true);
  clone.classList.remove('hidden');
  clone.id = `drawer-${panelId}`;
  body.appendChild(clone);

  // Re-wire events inside clone (mode cards, palettes, theme)
  wireDrawerPanel(clone, panelId);

  overlay.classList.remove('hidden');
  requestAnimationFrame(() => {
    overlay.classList.add('visible');
    drawer.classList.remove('hidden');
    requestAnimationFrame(() => drawer.classList.add('open'));
  });
}

function closeMobileDrawer() {
  const overlay = document.getElementById('mob-overlay');
  const drawer  = document.getElementById('mob-drawer');
  drawer.classList.remove('open');
  overlay.classList.remove('visible');
  setTimeout(() => {
    drawer.classList.add('hidden');
    overlay.classList.add('hidden');
  }, 300);
}

function wireDrawerPanel(clone, panelId) {
  if (panelId === 'modes') {
    clone.querySelectorAll('.mode-card').forEach(card => {
      card.addEventListener('click', () => {
        switchMode(card.dataset.mode);
        closeMobileDrawer();
      });
      card.classList.toggle('active', card.dataset.mode === currentMode);
    });
    const editor = clone.querySelector('#custom-editor');
    if (editor) {
      editor.classList.toggle('hidden', currentMode !== 'custom');
      wireCustomEditor(clone);
    }
  }
  if (panelId === 'colors') {
    clone.querySelectorAll('.palette-item').forEach(item => {
      item.addEventListener('click', () => {
        selectPalette(item.dataset.pid);
        updatePaletteUI();
        closeMobileDrawer();
      });
      item.classList.toggle('active', item.dataset.pid === currentPalette);
    });
    const lineEl = clone.querySelector('#cp-line');
    const fillEl = clone.querySelector('#cp-fill');
    if (lineEl) { lineEl.value = customLine; lineEl.addEventListener('input', e => { customLine = e.target.value; applyCustomColor(); }); }
    if (fillEl) { fillEl.value = customFill; fillEl.addEventListener('input', e => { customFill = e.target.value; applyCustomColor(); }); }
  }
  if (panelId === 'theme') {
    clone.querySelectorAll('[data-theme-val]').forEach(btn => {
      btn.addEventListener('click', () => {
        const v = btn.dataset.themeVal;
        applyTheme(v);
        localStorage.setItem(SK.theme, v);
        persistAppBackup();
        closeMobileDrawer();
      });
    });
  }
}

/* ══ MODES ══════════════════════════════════════════════════ */
function initModes() {
  document.querySelectorAll('.mode-card').forEach(card => {
    card.addEventListener('click', () => switchMode(card.dataset.mode));
  });
  highlightMode(currentMode);

  // Custom categories editor
  wireCustomEditor(document);
}

function switchMode(mode) {
  currentMode = mode;
  localStorage.setItem(SK.mode, mode);
  loadScores();
  highlightMode(mode);
  buildSliders();
  rebuildChart();
  updateStats();
  updateTopbar();

  const editor = document.getElementById('custom-editor');
  if (editor) editor.classList.toggle('hidden', mode !== 'custom');
  persistAppBackup();
  showToast(`Modo: ${MODES[mode]?.label || mode}`);
}

function highlightMode(mode) {
  document.querySelectorAll('.mode-card').forEach(card => {
    card.classList.toggle('active', card.dataset.mode === mode);
  });
  const badge = document.getElementById('mode-badge');
  if (badge) badge.textContent = MODES[mode]?.label || mode;
}

function updateTopbar() {
  const el = document.getElementById('topbar-mode');
  if (el) el.textContent = MODES[currentMode]?.label || currentMode;
}

function getCategories() {
  return MODES[currentMode]?.categories || [];
}

/* ══ CUSTOM CATEGORIES ══════════════════════════════════════ */
function loadCustomCategories() {
  try {
    const raw = localStorage.getItem(SK.customCats);
    if (raw) {
      MODES.custom.categories = JSON.parse(raw);
    }
  } catch(_) {}
  if (!MODES.custom.categories.length) {
    MODES.custom.categories = [
      {key:'cat1',label:'Categoria 1'},
      {key:'cat2',label:'Categoria 2'},
    ];
  }
}

function saveCustomCategories() {
  localStorage.setItem(SK.customCats, JSON.stringify(MODES.custom.categories));
  persistAppBackup();
}

function renderCustomTags(container) {
  const el = container?.querySelector('#custom-tags') || document.getElementById('custom-tags');
  if (!el) return;
  el.innerHTML = '';
  MODES.custom.categories.forEach(cat => {
    const tag = document.createElement('div');
    tag.className = 'ctag';
    tag.innerHTML = `<span>${cat.label}</span><span class="ctag-del" data-key="${cat.key}">×</span>`;
    el.appendChild(tag);
  });
  el.querySelectorAll('.ctag-del').forEach(d => {
    d.addEventListener('click', () => {
      MODES.custom.categories = MODES.custom.categories.filter(c => c.key !== d.dataset.key);
      saveCustomCategories();
      renderCustomTags(container);
      if (currentMode === 'custom') { buildSliders(); rebuildChart(); updateStats(); }
    });
  });
}

function wireCustomEditor(scope) {
  renderCustomTags(scope === document ? null : scope);
  const addBtn = scope === document
    ? document.getElementById('custom-add-btn')
    : scope.querySelector('#custom-add-btn');
  const input = scope === document
    ? document.getElementById('custom-input')
    : scope.querySelector('#custom-input');

  if (!addBtn || !input) return;

  const doAdd = () => {
    const val = input.value.trim();
    if (!val) return;
    if (MODES.custom.categories.length >= 8) { showToast('Máximo 8 categorias'); return; }
    const key = 'c_' + Date.now();
    MODES.custom.categories.push({ key, label: val });
    saveCustomCategories();
    input.value = '';
    renderCustomTags(scope === document ? null : scope);
    if (currentMode === 'custom') { loadScores(); buildSliders(); rebuildChart(); updateStats(); }
  };
  addBtn.addEventListener('click', doAdd);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') doAdd(); });
}

/* ══ SCORES ════════════════════════════════════════════════ */
function loadScores() {
  scores = {};
  getCategories().forEach(c => {
    const raw = localStorage.getItem(SK.scores(currentMode + '_' + c.key));
    scores[c.key] = raw !== null ? parseFloat(raw) : 5;
  });
}

function saveScore(key, val) {
  localStorage.setItem(SK.scores(currentMode + '_' + key), val);
  persistAppBackup();
}

function resetScores() {
  getCategories().forEach(c => {
    scores[c.key] = 5;
    saveScore(c.key, 5);
  });
  syncSliders();
  updateChart();
  updateStats();
  showToast('Progresso resetado');
}

/* ══ SLIDERS ═══════════════════════════════════════════════ */
function buildSliders() {
  const container = document.getElementById('sliders-container');
  if (!container) return;
  container.innerHTML = '';
  const cats = getCategories();

  cats.forEach(cat => {
    const v = scores[cat.key] ?? 5;
    const item = document.createElement('div');
    item.className = 'slider-item';
    item.innerHTML = `
      <div class="slider-top">
        <span class="slider-label">${cat.label}</span>
        <input type="number" class="slider-num" id="num-${cat.key}" value="${v}" min="0" max="10" step="0.5" inputmode="decimal"/>
      </div>
      <input type="range" class="slider-range" id="rng-${cat.key}" value="${v}" min="0" max="10" step="0.5" style="--pct:${v*10}%"/>
    `;
    container.appendChild(item);

    const rng = item.querySelector(`#rng-${cat.key}`);
    const num = item.querySelector(`#num-${cat.key}`);

    rng.addEventListener('input', () => {
      let v = clamp(parseFloat(rng.value), 0, 10);
      scores[cat.key] = v;
      num.value = v;
      rng.style.setProperty('--pct', `${v*10}%`);
      updateChart(); updateStats(); saveScore(cat.key, v);
    });
    num.addEventListener('input', () => {
      let v = parseFloat(num.value);
      if (isNaN(v)) return;
      v = clamp(v, 0, 10);
      scores[cat.key] = v;
      rng.value = v;
      rng.style.setProperty('--pct', `${v*10}%`);
      updateChart(); updateStats(); saveScore(cat.key, v);
    });
    num.addEventListener('blur', () => {
      let v = parseFloat(num.value);
      if (isNaN(v)) v = 0;
      v = clamp(v, 0, 10);
      scores[cat.key] = v; num.value = v; rng.value = v;
      rng.style.setProperty('--pct', `${v*10}%`);
      saveScore(cat.key, v);
    });
  });

  document.getElementById('btn-reset')?.addEventListener('click', resetScores);
}

function syncSliders() {
  getCategories().forEach(cat => {
    const v = scores[cat.key] ?? 5;
    const rng = document.getElementById(`rng-${cat.key}`);
    const num = document.getElementById(`num-${cat.key}`);
    if (rng) { rng.value = v; rng.style.setProperty('--pct', `${v*10}%`); }
    if (num) num.value = v;
  });
}

/* ══ PALETTES ═══════════════════════════════════════════════ */
function initPalettes() {
  const grid = document.getElementById('palette-grid');
  if (!grid) return;

  PALETTES.forEach(p => {
    const item = document.createElement('div');
    item.className = 'palette-item' + (p.id === currentPalette ? ' active' : '');
    item.dataset.pid = p.id;
    item.innerHTML = `
      <div class="palette-preview">
        <div class="palette-swatch" style="background:${p.line}"></div>
        <div class="palette-swatch fill-sw" style="background:${p.fill}"></div>
      </div>
      <span class="palette-name">${p.name}</span>
    `;
    item.addEventListener('click', () => { selectPalette(p.id); updatePaletteUI(); });
    grid.appendChild(item);
  });

  applyPalette();
}

function selectPalette(id) {
  currentPalette = id;
  localStorage.setItem(SK.palette, id);
  applyPalette();
  persistAppBackup();
}

function applyPalette() {
  let line, fill;
  if (currentPalette === 'custom') {
    line = customLine; fill = customFill;
  } else {
    const p = PALETTES.find(x => x.id === currentPalette) || PALETTES[0];
    line = p.line; fill = p.fill;
  }
  document.documentElement.style.setProperty('--radar-line', line);
  if (chart) {
    const hex2rgba = (hex, a) => {
      const r = parseInt(hex.slice(1,3),16);
      const g = parseInt(hex.slice(3,5),16);
      const b = parseInt(hex.slice(5,7),16);
      return `rgba(${r},${g},${b},${a})`;
    };
    chart.data.datasets[0].borderColor          = line;
    chart.data.datasets[0].pointBackgroundColor  = line;
    chart.data.datasets[0].pointBorderColor      = line;
    chart.data.datasets[0].backgroundColor       = hex2rgba(fill, FILL_ALPHA);
    chart.update('none');
  }
}

function updatePaletteUI() {
  document.querySelectorAll('.palette-item').forEach(item => {
    item.classList.toggle('active', item.dataset.pid === currentPalette);
  });
}

/* ══ CUSTOM COLOR ═══════════════════════════════════════════ */
function initCustomColor() {
  const lineEl = document.getElementById('cp-line');
  const fillEl = document.getElementById('cp-fill');
  if (lineEl) { lineEl.value = customLine; lineEl.addEventListener('input', e => { customLine = e.target.value; localStorage.setItem(SK.customLine, customLine); applyCustomColor(); persistAppBackup(); }); }
  if (fillEl) { fillEl.value = customFill; fillEl.addEventListener('input', e => { customFill = e.target.value; localStorage.setItem(SK.customFill, customFill); applyCustomColor(); persistAppBackup(); }); }
}

function applyCustomColor() {
  currentPalette = 'custom';
  localStorage.setItem(SK.palette, 'custom');
  applyPalette();
  updatePaletteUI();
  persistAppBackup();
}

/* ══ CHART ══════════════════════════════════════════════════ */
function getRadarColors() {
  let line, fill;
  if (currentPalette === 'custom') {
    line = customLine; fill = customFill;
  } else {
    const p = PALETTES.find(x => x.id === currentPalette) || PALETTES[0];
    line = p.line; fill = p.fill;
  }
  const hex2rgba = (hex, a) => {
    hex = hex.replace('#','');
    if (hex.length === 3) hex = hex.split('').map(c=>c+c).join('');
    const r = parseInt(hex.slice(0,2),16);
    const g = parseInt(hex.slice(2,4),16);
    const b = parseInt(hex.slice(4,6),16);
    return `rgba(${r},${g},${b},${a})`;
  };
  const resolved = resolveTheme(localStorage.getItem(SK.theme)||'dark');
  const isDark = resolved === 'dark';
  return {
    line, fill: hex2rgba(fill, FILL_ALPHA),
    grid: isDark ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.07)',
    tick: isDark ? 'rgba(255,255,255,.3)'  : 'rgba(0,0,0,.3)',
    labels: isDark ? 'rgba(255,255,255,.75)' : 'rgba(0,0,0,.75)',
  };
}

function buildChart() {
  const ctx = document.getElementById('radarChart')?.getContext('2d');
  if (!ctx) return;
  const cats = getCategories();
  const c = getRadarColors();

  chart = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: cats.map(x => x.label),
      datasets: [{
        data: cats.map(x => scores[x.key] ?? 5),
        backgroundColor: c.fill,
        borderColor: c.line,
        borderWidth: 2.5,
        pointBackgroundColor: c.line,
        pointBorderColor: c.line,
        pointRadius: 4,
        pointHoverRadius: 6,
      }],
    },
    options: {
      animation: { duration: 350, easing: 'easeInOutQuart' },
      responsive: true,
      maintainAspectRatio: true,
      scales: {
        r: {
          min: 0, max: 10,
          ticks: {
            stepSize: 2,
            color: c.tick,
            backdropColor: 'transparent',
            font: { family:"'DM Mono',monospace", size: 9 },
          },
          grid:       { color: c.grid },
          angleLines: { color: c.grid },
          pointLabels: {
            color: c.labels,
            font: { family:"'Syne',sans-serif", size: 11, weight:'700' },
          },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(0,0,0,.88)',
          titleColor: '#fff', bodyColor: '#bbb',
          borderColor: 'rgba(255,255,255,.08)', borderWidth: 1,
          cornerRadius: 10, padding: 10,
          titleFont: { family:"'DM Mono',monospace", size:11 },
          bodyFont:  { family:"'DM Mono',monospace", size:12 },
          callbacks: { label: ctx => ` Nota: ${ctx.raw}` },
        },
      },
    },
  });
}

function updateChart() {
  if (!chart) return;
  const cats = getCategories();
  chart.data.datasets[0].data = cats.map(c => scores[c.key] ?? 0);
  chart.update('active');
}

function rebuildChart() {
  if (!chart) { chart = null; buildChart(); return; }
  const cats = getCategories();
  chart.data.labels = cats.map(c => c.label);
  chart.data.datasets[0].data = cats.map(c => scores[c.key] ?? 5);
  chart.update('active');
}

function rebuildChartTheme() {
  if (!chart) return;
  const c = getRadarColors();
  const r = chart.options.scales.r;
  r.ticks.color       = c.tick;
  r.grid.color        = c.grid;
  r.angleLines.color  = c.grid;
  r.pointLabels.color = c.labels;
  applyPalette(); // also updates dataset colors
  chart.update('none');
}

/* ══ STATS ══════════════════════════════════════════════════ */
function updateStats() {
  const cats = getCategories();
  if (!cats.length) return;
  const vals = cats.map(c => ({ label: c.label, v: scores[c.key] ?? 0 }));
  const avg = vals.reduce((a,b) => a + b.v, 0) / vals.length;
  const max = vals.reduce((a,b) => a.v >= b.v ? a : b);
  const min = vals.reduce((a,b) => a.v <= b.v ? a : b);
  const avgEl = document.getElementById('avg-value');
  const maxEl = document.getElementById('strongest');
  const minEl = document.getElementById('weakest');
  if (avgEl) avgEl.textContent = avg.toFixed(1);
  if (maxEl) maxEl.textContent = max.label;
  if (minEl) minEl.textContent = min.label;
}

/* ══ TOAST ══════════════════════════════════════════════════ */
let _toastT;
function showToast(msg) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(_toastT);
  _toastT = setTimeout(() => el.classList.remove('show'), 2200);
}

/* ══ UTIL ═══════════════════════════════════════════════════ */
function clamp(v, mn, mx) { return Math.min(mx, Math.max(mn, v)); }
