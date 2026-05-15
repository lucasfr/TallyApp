// ============================================================
//  TALLY APP — LOGIC  (app.js)
//  Reads config from config.js (TALLY_CONFIG).
// ============================================================

// ── State ────────────────────────────────────────────────────
let countries  = [];
let prevRanks  = {};
let currentTab = 'total';
let phase      = 'setup';

// ── Persistence ──────────────────────────────────────────────
const STORAGE_KEY = 'tally-app-2026';

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      countries, currentTab, phase,
    }));
  } catch (e) {
    console.warn('Could not save state:', e);
  }
}

function clearState() {
  try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
}

// ── Boot ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  restoreState();
});

function restoreState() {
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch (e) {}

  if (!saved || !saved.countries || !saved.countries.length) {
    buildJuryForm();
    return;
  }

  countries  = saved.countries;
  currentTab = saved.currentTab || 'total';
  phase      = saved.phase      || 'setup';

  if (phase === 'setup') {
    buildJuryForm();
    countries.forEach((c, i) => {
      const el = document.getElementById(`jury-${i}`);
      if (el && c.jury) el.value = c.jury;
    });
  } else {
    document.getElementById('setupPanel').style.display = 'none';
    document.getElementById('tallyPanel').style.display = 'block';

    if (phase === 'done') {
      document.getElementById('phaseBadge').textContent = '🏆 Final Results';
      document.getElementById('statusDot').className    = 'status-dot done';
      document.getElementById('statusText').textContent = 'Complete';
    } else {
      document.getElementById('phaseBadge').textContent = '📺 Televote Live';
    }

    ['total','jury','tv'].forEach(t => {
      document.getElementById(`tab-${t}`).classList.toggle('active', t === currentTab);
    });

    buildTVSelect();
    renderLeaderboard();
    updateStats();
  }
}

// ── Artist image HTML helper ──────────────────────────────────
function artistImgHtml(c, idx, size = 56) {
  const delay = `${((idx * 0.9) % 6).toFixed(1)}s`;
  if (c.image) {
    return `
      <div class="artist-img-wrap" style="width:${size}px;height:${size}px">
        <img src="${c.image}" alt="${c.country}" loading="lazy"
             onerror="this.parentElement.innerHTML=artistPlaceholderHtml('${c.flag}','${c.country}')">
        <div class="artist-img-glimmer" style="--glimmer-delay:${delay}"></div>
      </div>`;
  }
  return `
    <div class="artist-img-wrap" style="width:${size}px;height:${size}px">
      ${artistPlaceholderHtml(c.flag, c.country)}
    </div>`;
}

function artistPlaceholderHtml(flag, country) {
  return `<div class="artist-placeholder">
    <div class="ph-flag">${flag}</div>
    <div class="ph-label">${country.substring(0,3).toUpperCase()}</div>
  </div>`;
}

// ── Build jury entry form from config ────────────────────────
function buildJuryForm() {
  const list = document.getElementById('juryList');
  list.innerHTML = '';
  TALLY_CONFIG.COUNTRIES.forEach((c, i) => {
    const row = document.createElement('div');
    row.className = 'country-entry-row';
    row.innerHTML = `
      ${artistImgHtml(c, i, 52)}
      <div class="entry-info">
        <div class="entry-country">${c.flag} ${c.country}</div>
        <div class="entry-artist">${c.artist}</div>
      </div>
      <div class="score-input-group">
        <div class="score-label-inline">Jury</div>
        <input type="number" min="0" max="999" class="score-field"
               id="jury-${i}" placeholder="0" inputmode="numeric"
               oninput="saveJuryDraft()">
      </div>`;
    list.appendChild(row);
  });
}

function saveJuryDraft() {
  const draft = TALLY_CONFIG.COUNTRIES.map((c, i) => {
    const el = document.getElementById(`jury-${i}`);
    return { ...c, jury: parseInt(el?.value) || 0, tv: 0, tvDone: false };
  });
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      countries: draft, currentTab, phase: 'setup',
    }));
  } catch (e) {}
}

// ── Fill test data ────────────────────────────────────────────
function fillTestData() {
  const scores = TALLY_CONFIG.TEST_JURY_SCORES || {};
  TALLY_CONFIG.COUNTRIES.forEach((c, i) => {
    const el = document.getElementById(`jury-${i}`);
    if (el) el.value = scores[c.country] ?? 0;
  });
  saveJuryDraft();
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
  saveState();

  document.getElementById('setupPanel').style.display = 'none';
  document.getElementById('tallyPanel').style.display = 'block';
  document.getElementById('phaseBadge').textContent   = '📺 Televote Live';

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
    sel.innerHTML = '<option value="">All scores entered!</option>';
    updateNeedsToLead();
    if (phase !== 'done') endShow();
    return;
  }

  pending.forEach(c => {
    const opt = document.createElement('option');
    opt.value       = countries.indexOf(c);
    opt.textContent = `${c.flag} ${c.country}`;
    sel.appendChild(opt);
  });

  updateNeedsToLead();
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

  const done  = countries.filter(c => c.tvDone).length;
  const total = countries.length;
  document.getElementById('progressBar').style.width = Math.round(done / total * 100) + '%';

  saveState();
  buildTVSelect();
  renderLeaderboard();
  updateStats();
  showToast(`${countries[idx].flag} ${countries[idx].country}: +${pts} televote pts`, 'success');
}

// ── "Needs X to lead" hint ────────────────────────────────────
function updateNeedsToLead() {
  const hint = document.getElementById('needsToLeadHint');
  if (!hint) return;

  const sel = document.getElementById('tvCountrySelect');
  const val = sel.value;

  if (val === '' || isNaN(parseInt(val)) || !countries.length) {
    hint.style.display = 'none';
    return;
  }

  const idx      = parseInt(val);
  const selected = countries[idx];
  const leader   = [...countries].sort((a, b) => (b.jury + b.tv) - (a.jury + a.tv))[0];

  if (!selected || !leader) { hint.style.display = 'none'; return; }

  const selectedTotal = selected.jury + selected.tv;
  const leaderTotal   = leader.jury + leader.tv;
  const remaining     = countries.filter(c => !c.tvDone).length;

  if (selected.country === leader.country) {
    hint.style.display = 'flex';
    hint.innerHTML = `<span class="needs-lead-icon">👑</span>
      <span><strong>${selected.flag} ${selected.country}</strong> is currently leading with <strong>${selectedTotal} pts</strong></span>`;
    hint.className = 'needs-lead-hint leading';
    return;
  }

  const gap    = leaderTotal - selectedTotal + 1;
  // Can they still win? Only if they haven't scored yet (tvDone = false)
  const canWin = !selected.tvDone;

  hint.style.display = 'flex';
  hint.className = `needs-lead-hint ${canWin ? 'can-win' : 'cannot-win'}`;

  if (canWin) {
    hint.innerHTML = `<span class="needs-lead-icon">⚡</span>
      <span><strong>${selected.flag} ${selected.country}</strong> needs <strong>${gap} more pts</strong> in their televote to lead
      — <strong>${remaining}</strong> result${remaining !== 1 ? 's' : ''} still to come</span>`;
  } else {
    hint.innerHTML = `<span class="needs-lead-icon">💔</span>
      <span><strong>${selected.flag} ${selected.country}</strong> needed <strong>${gap} more pts</strong> to lead
      but their televote is already in</span>`;
  }
}

// ── Tab switch ────────────────────────────────────────────────
function switchTab(tab) {
  currentTab = tab;
  ['total','jury','tv'].forEach(t => {
    document.getElementById(`tab-${t}`).classList.toggle('active', t === tab);
  });
  saveState();
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
  const sorted   = [...countries].sort((a, b) => getScore(b) - getScore(a));
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
        ${artistImgHtml(c, i, 56)}
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
  const sorted  = [...countries].sort((a, b) => (b.jury + b.tv) - (a.jury + a.tv));
  const scored  = countries.filter(c => c.tvDone).length;
  const pending = countries.length - scored;

  if (sorted.length) {
    document.getElementById('statLeader').textContent    = sorted[0].flag;
    document.getElementById('statLeaderPts').textContent = sorted[0].jury + sorted[0].tv;
  }
  document.getElementById('statScored').textContent  = scored;
  document.getElementById('statRemain').textContent  = pending;
}

// ── Show is over ──────────────────────────────────────────────
function endShow() {
  phase = 'done';
  saveState();
  document.getElementById('phaseBadge').textContent = '🏆 Final Results';
  document.getElementById('statusDot').className    = 'status-dot done';
  document.getElementById('statusText').textContent = 'Complete';
  const hint = document.getElementById('needsToLeadHint');
  if (hint) hint.style.display = 'none';
  showToast('All scores in — final results! 🎉', 'success');
}

// ── Reset ─────────────────────────────────────────────────────
function resetApp() {
  if (!confirm('Reset everything and start over?')) return;

  clearState();
  countries  = [];
  prevRanks  = {};
  currentTab = 'total';
  phase      = 'setup';

  document.getElementById('setupPanel').style.display = 'block';
  document.getElementById('tallyPanel').style.display = 'none';
  document.getElementById('phaseBadge').textContent   = 'Setup';
  document.getElementById('progressBar').style.width  = '0%';
  document.getElementById('statusDot').className      = 'status-dot live';
  document.getElementById('statusText').textContent   = 'Live';

  const hint = document.getElementById('needsToLeadHint');
  if (hint) hint.style.display = 'none';

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
