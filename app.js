// ============================================================
//  TALLY APP — LOGIC  (app.js)
//  Reads config from config.js (TALLY_CONFIG).
// ============================================================

// ── State ────────────────────────────────────────────────────
let countries  = [];   // working copy built from TALLY_CONFIG.COUNTRIES
let prevRanks  = {};   // rank snapshot before last update (for change badges)
let currentTab = 'total'; // 'total' | 'jury' | 'tv'
let phase      = 'setup'; // 'setup' | 'jury' | 'tally' | 'done'

// ── Boot ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  buildJuryForm();
});

// ── Build jury entry form from config ────────────────────────
function buildJuryForm() {
  const list = document.getElementById('juryList');
  list.innerHTML = '';
  TALLY_CONFIG.COUNTRIES.forEach((c, i) => {
    const row = document.createElement('div');
    row.className = 'country-entry-row';
    row.innerHTML = `
      <div class="entry-flag">${c.flag}</div>
      <div class="entry-info">
        <div class="entry-country">${c.country}</div>
        <div class="entry-artist">${c.artist}</div>
      </div>
      <div class="score-input-group">
        <div class="score-label-inline">Jury</div>
        <input type="number" min="0" max="999" class="score-field"
               id="jury-${i}" placeholder="0" inputmode="numeric">
      </div>`;
    list.appendChild(row);
  });
}

// ── Fill test data ────────────────────────────────────────────
function fillTestData() {
  const scores = TALLY_CONFIG.TEST_JURY_SCORES || {};
  TALLY_CONFIG.COUNTRIES.forEach((c, i) => {
    const el = document.getElementById(`jury-${i}`);
    if (el) el.value = scores[c.country] ?? 0;
  });
  showToast('Test jury scores filled in ✅', 'success');
}

// ── Lock jury scores & enter tally phase ─────────────────────
function lockJuryScores() {
  countries = TALLY_CONFIG.COUNTRIES.map((c, i) => ({
    ...c,
    jury:   parseInt(document.getElementById(`jury-${i}`).value) || 0,
    tv:     0,
    tvDone: false,
  }));

  phase = 'tally';
  document.getElementById('setupPanel').style.display = 'none';
  document.getElementById('tallyPanel').style.display = 'block';
  document.getElementById('phaseBadge').textContent = '📺 Televote Live';
  document.getElementById('tvCountTotal').textContent = countries.length;

  buildTVSelect();
  renderLeaderboard();
  updateStats();
  showToast('Jury scores locked! Televote begins 🎉', 'success');
}

// ── Build the country dropdown for TV input ───────────────────
function buildTVSelect() {
  const sel = document.getElementById('tvCountrySelect');
  sel.innerHTML = '';
  const pending = countries.filter(c => !c.tvDone);
  if (pending.length === 0) {
    sel.innerHTML = '<option value="">All televotes entered!</option>';
    endShow();
    return;
  }
  pending.forEach(c => {
    const idx = countries.indexOf(c);
    const opt = document.createElement('option');
    opt.value  = idx;
    opt.textContent = `${c.flag} ${c.country}`;
    sel.appendChild(opt);
  });
}

// ── Add a televote result ─────────────────────────────────────
function addTVPoints() {
  const sel = document.getElementById('tvCountrySelect');
  const idx = parseInt(sel.value);
  const pts = parseInt(document.getElementById('tvPtsInput').value);

  if (isNaN(idx) || idx < 0) { showToast('Select a country', 'warn'); return; }
  if (isNaN(pts) || pts < 0) { showToast('Enter valid points', 'warn'); return; }

  prevRanks = getRankMap();
  countries[idx].tv     = pts;
  countries[idx].tvDone = true;

  document.getElementById('tvPtsInput').value = '';

  const done = countries.filter(c => c.tvDone).length;
  document.getElementById('tvCountDone').textContent = done;
  document.getElementById('progressBar').style.width =
    Math.round(done / countries.length * 100) + '%';

  buildTVSelect();
  renderLeaderboard();
  updateStats();
  showToast(`${countries[idx].flag} ${countries[idx].country}: +${pts} televote pts`, 'success');
}

// ── Tab switch ────────────────────────────────────────────────
function switchTab(tab) {
  currentTab = tab;
  ['total','jury','tv'].forEach(t => {
    document.getElementById(`tab-${t}`).classList.toggle('active', t === tab);
  });
  renderLeaderboard();
}

// ── Score for current tab ─────────────────────────────────────
function getScore(c) {
  if (currentTab === 'jury') return c.jury;
  if (currentTab === 'tv')   return c.tv;
  return c.jury + c.tv;
}

// ── Rank snapshot ─────────────────────────────────────────────
function getRankMap() {
  return Object.fromEntries(
    [...countries]
      .sort((a, b) => (b.jury + b.tv) - (a.jury + a.tv))
      .map((c, i) => [c.country, i + 1])
  );
}

// ── Render leaderboard ────────────────────────────────────────
function renderLeaderboard() {
  const sorted  = [...countries].sort((a, b) => getScore(b) - getScore(a));
  const maxScore = Math.max(getScore(sorted[0]) || 1, 1);
  const wrap     = document.getElementById('leaderboard');

  if (!sorted.length) {
    wrap.innerHTML = `<div class="empty-state"><div class="empty-icon">📋</div>No countries yet</div>`;
    return;
  }

  wrap.innerHTML = sorted.map((c, i) => {
    const rank      = i + 1;
    const rankClass = rank <= 3 ? `rank-${rank}` : '';
    const score     = getScore(c);
    const barW      = Math.round(score / maxScore * 100);
    const prev      = prevRanks[c.country];
    const dimStyle  = (currentTab === 'tv' && !c.tvDone) ? 'style="color:var(--text-dim)"' : '';

    let badge = '';
    if (prev) {
      const diff = prev - rank;
      if      (diff > 0) badge = `<div class="change-badge up show">▲${diff}</div>`;
      else if (diff < 0) badge = `<div class="change-badge down show">▼${Math.abs(diff)}</div>`;
      else               badge = `<div class="change-badge same show">—</div>`;
    }

    const breakdown =
      currentTab === 'total' ? `J:${c.jury} · T:${c.tv}` :
      currentTab === 'jury'  ? 'Jury score' : 'Televote';

    return `
      <div class="lb-row ${rankClass}" style="animation-delay:${i * 0.03}s">
        <div class="lb-rank">${rank}</div>
        <div class="lb-flag">${c.flag}</div>
        <div class="lb-info">
          <div class="lb-country">${c.country}</div>
          <div class="lb-artist">${c.artist}</div>
          <div class="lb-bar-wrap"><div class="lb-bar" style="width:${barW}%"></div></div>
        </div>
        ${badge}
        <div class="lb-scores">
          <div class="lb-total ${rank === 1 ? 'leader' : ''}" ${dimStyle}>${score}</div>
          <div class="lb-breakdown">${breakdown}</div>
        </div>
      </div>`;
  }).join('');
}

// ── Update stat cards ─────────────────────────────────────────
function updateStats() {
  const sorted = [...countries].sort((a, b) => (b.jury + b.tv) - (a.jury + a.tv));
  if (sorted.length) {
    document.getElementById('statLeader').textContent   = sorted[0].flag;
    document.getElementById('statLeaderPts').textContent = sorted[0].jury + sorted[0].tv;
  }
  document.getElementById('statRemain').textContent = countries.filter(c => !c.tvDone).length;
}

// ── Show is over ──────────────────────────────────────────────
function endShow() {
  phase = 'done';
  document.getElementById('phaseBadge').textContent  = '🏆 Final Results';
  document.getElementById('statusDot').className     = 'status-dot done';
  document.getElementById('statusText').textContent  = 'Complete';
  showToast('All televotes in — final results! 🎉', 'success');
}

// ── Reset ─────────────────────────────────────────────────────
function resetApp() {
  if (!confirm('Reset everything and start over?')) return;
  countries  = [];
  prevRanks  = {};
  currentTab = 'total';
  phase      = 'setup';

  document.getElementById('setupPanel').style.display = 'block';
  document.getElementById('tallyPanel').style.display = 'none';
  document.getElementById('phaseBadge').textContent   = 'Setup';
  document.getElementById('tvCountDone').textContent  = '0';
  document.getElementById('progressBar').style.width  = '0%';
  document.getElementById('statusDot').className      = 'status-dot live';
  document.getElementById('statusText').textContent   = 'Live';

  buildJuryForm();
}

// ── Toast helper ──────────────────────────────────────────────
function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className   = 'toast show' + (type ? ` ${type}` : '');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 2800);
}
