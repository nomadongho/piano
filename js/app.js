import { SONGS } from './songs.js';
import { createPiano } from './piano.js';
import { initScrollingSheet, renderFreePlaySheet } from './sheet-music.js';
import { startListening, stopListening, isListening } from './pitch-detector.js';
import { playSong, stopSong } from './tone-player.js';

const LEVEL_COLORS = [
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
];

const app = document.getElementById('app');

// ── App state ──────────────────────────────────────────────────────────────────
let screen = 'menu';      // 'menu' | 'game' | 'freeplay'
let selectedSong = 'twinkle';

// Game-specific state
let currentIndex = 0;
let score = 0;
let feedback = null;      // 'correct' | 'wrong' | null
let completed = false;
let sparkle = false;
let feedbackTimer = null;

// References to live DOM elements updated in-place during game
let pianoInstance = null;
let sheetContainer = null;
let sheetInstance = null;
let feedbackEl = null;
let progressFill = null;
let scoreBadge = null;
let autoPlayBtn = null;

// Auto-play state
let isAutoPlaying = false;

// ── Navigation helpers ─────────────────────────────────────────────────────────
function goMenu() {
  stopListening();
  stopAutoPlay();
  screen = 'menu';
  render();
}

function goGame(songId) {
  stopAutoPlay();
  selectedSong = songId;
  screen = 'game';
  currentIndex = 0;
  score = 0;
  feedback = null;
  completed = false;
  sparkle = false;
  render();
}

function goFreePlay() {
  stopAutoPlay();
  screen = 'freeplay';
  render();
}

// ── Main render dispatcher ─────────────────────────────────────────────────────
function render() {
  app.innerHTML = '';
  pianoInstance = null;
  sheetContainer = null;
  sheetInstance = null;
  feedbackEl = null;
  progressFill = null;
  scoreBadge = null;
  autoPlayBtn = null;

  if (screen === 'menu') renderMenu();
  else if (screen === 'game') renderGame();
  else if (screen === 'freeplay') renderFreePlay();
}

// ── Menu screen ────────────────────────────────────────────────────────────────
function renderMenu() {
  const div = document.createElement('div');
  div.className = 'screen screen--menu';

  div.innerHTML = `
    <div class="menu-header">
      <div class="menu-emoji">🎹</div>
      <h1 class="menu-title">Leo's Piano Practice</h1>
      <p class="menu-subtitle">Choose a song to practice or play freely!</p>
    </div>
    <div class="song-grid" id="song-grid"></div>
    <div class="freeplay-btn-wrap">
      <button class="freeplay-btn" id="btn-freeplay">🎵 Free Play Mode</button>
    </div>
  `;
  app.appendChild(div);

  const grid = div.querySelector('#song-grid');
  SONGS.forEach((song, i) => {
    const btn = document.createElement('button');
    btn.className = 'song-card';
    btn.style.background = LEVEL_COLORS[i % LEVEL_COLORS.length];
    btn.innerHTML = `
      <div class="song-card__emoji">${song.emoji}</div>
      <div class="song-card__title">${song.title}</div>
      <div class="song-card__meta">Level ${song.level}</div>
      <div class="song-card__meta">${song.notes.length} notes</div>
    `;
    btn.addEventListener('click', () => goGame(song.id));
    grid.appendChild(btn);
  });

  div.querySelector('#btn-freeplay').addEventListener('click', goFreePlay);
}

// ── Game screen ────────────────────────────────────────────────────────────────
function renderGame() {
  const song = SONGS.find(s => s.id === selectedSong);
  if (!song) return;

  if (completed) {
    renderCelebration(song);
    return;
  }

  const expectedNote = currentIndex < song.notes.length
    ? song.notes[currentIndex].note
    : null;
  const progress = Math.round((currentIndex / song.notes.length) * 100);

  const div = document.createElement('div');
  div.className = 'screen';
  app.appendChild(div);

  // Header
  const header = document.createElement('div');
  header.className = 'game-header';
  header.innerHTML = `
    <button class="btn-back" id="btn-back">← Back</button>
    <span class="game-song-emoji">${song.emoji}</span>
    <h2 class="game-song-title">${song.title}</h2>
    <div class="score-badge" id="score-badge">⭐ ${score}</div>
  `;
  div.appendChild(header);
  scoreBadge = header.querySelector('#score-badge');

  // Progress bar
  const progressBar = document.createElement('div');
  progressBar.className = 'progress-bar';
  progressFill = document.createElement('div');
  progressFill.className = 'progress-bar__fill';
  progressFill.style.width = `${progress}%`;
  progressBar.appendChild(progressFill);
  div.appendChild(progressBar);

  // Sheet music
  const sheetWrap = document.createElement('div');
  sheetWrap.className = 'sheet-music-wrap';
  const sheetHeader = document.createElement('div');
  sheetHeader.className = 'sheet-music-header';
  const sheetTitle = document.createElement('h3');
  sheetTitle.className = 'sheet-music-title';
  sheetTitle.id = 'sheet-title';
  sheetTitle.textContent = `🎼 ${song.title}  –  Note ${currentIndex + 1} of ${song.notes.length}`;
  const playBtn = document.createElement('button');
  playBtn.className = 'btn-autoplay';
  playBtn.id = 'btn-autoplay';
  playBtn.textContent = '▶ Play Song';
  sheetHeader.appendChild(sheetTitle);
  sheetHeader.appendChild(playBtn);
  sheetContainer = document.createElement('div');
  sheetWrap.appendChild(sheetHeader);
  sheetWrap.appendChild(sheetContainer);
  div.appendChild(sheetWrap);

  autoPlayBtn = playBtn;
  playBtn.addEventListener('click', () => {
    if (isAutoPlaying) stopAutoPlay();
    else startAutoPlay(song);
  });

  // Feedback
  feedbackEl = document.createElement('div');
  feedbackEl.className = 'feedback';
  renderFeedbackContent(expectedNote);
  div.appendChild(feedbackEl);

  // Mic control
  div.appendChild(buildMicControl(song));

  // Piano
  const pianoContainer = document.createElement('div');
  div.appendChild(pianoContainer);

  pianoInstance = createPiano(pianoContainer, {
    expectedNote,
    onNotePlay: (note) => handleNotePlay(note, song),
  });

  // Back button
  header.querySelector('#btn-back').addEventListener('click', () => {
    stopListening();
    goMenu();
  });

  // Render sheet music after DOM is attached
  requestAnimationFrame(() => {
    sheetInstance = initScrollingSheet(sheetContainer, song.notes);
    sheetInstance.update(currentIndex);
  });
}

function renderFeedbackContent(expectedNote) {
  if (!feedbackEl) return;
  feedbackEl.className = 'feedback';
  feedbackEl.innerHTML = '';

  if (feedback === 'correct') {
    feedbackEl.classList.add('feedback--correct');
    feedbackEl.textContent = `✅ ${sparkle ? '🌟' : '⭐'} Great!`;
  } else if (feedback === 'wrong') {
    feedbackEl.classList.add('feedback--wrong');
    feedbackEl.textContent = '❌ Try again!';
  } else if (expectedNote) {
    const inner = document.createElement('div');
    inner.className = 'expected-note';
    inner.textContent = 'Play: ';
    const noteSpan = document.createElement('span');
    noteSpan.textContent = expectedNote.replace('#', '♯');
    inner.appendChild(noteSpan);
    feedbackEl.appendChild(inner);
  }
}

function handleNotePlay(note, song) {
  if (completed || currentIndex >= song.notes.length) return;
  if (feedbackTimer) clearTimeout(feedbackTimer);

  const expectedNote = song.notes[currentIndex].note;
  const isCorrect = note === expectedNote;

  if (isCorrect) {
    score += 1;
    feedback = 'correct';
    sparkle = true;
    if (scoreBadge) scoreBadge.textContent = `⭐ ${score}`;
    renderFeedbackContent(expectedNote);

    setTimeout(() => { sparkle = false; }, 600);

    feedbackTimer = setTimeout(() => {
      feedback = null;
      if (isAutoPlaying) {
        // Auto-play mode: just clear feedback; the song timer advances the note
        renderFeedbackContent(song.notes[currentIndex]?.note);
      } else {
        // Manual mode: advance to next note
        const next = currentIndex + 1;
        if (next >= song.notes.length) {
          completed = true;
          render();
        } else {
          currentIndex = next;
          updateGameDisplay(song);
        }
      }
    }, 400);
  } else {
    feedback = 'wrong';
    const expected = song.notes[currentIndex].note;
    renderFeedbackContent(expected);
    feedbackTimer = setTimeout(() => {
      feedback = null;
      renderFeedbackContent(expected);
    }, 600);
  }
}

function updateGameDisplay(song) {
  if (feedbackTimer) { clearTimeout(feedbackTimer); feedbackTimer = null; }

  const expectedNote = currentIndex < song.notes.length
    ? song.notes[currentIndex].note
    : null;
  const progress = Math.round((currentIndex / song.notes.length) * 100);

  // Update progress bar
  if (progressFill) progressFill.style.width = `${progress}%`;

  // Update sheet music title
  const titleEl = document.getElementById('sheet-title');
  if (titleEl) titleEl.textContent = `🎼 ${song.title}  –  Note ${currentIndex + 1} of ${song.notes.length}`;

  // Update sheet music
  if (sheetInstance) sheetInstance.update(currentIndex);

  // Update feedback
  feedback = null;
  renderFeedbackContent(expectedNote);

  // Update piano highlighting
  if (pianoInstance) pianoInstance.update(expectedNote);
}

// ── Auto-play helpers ──────────────────────────────────────────────────────────
function startAutoPlay(song) {
  isAutoPlaying = true;
  if (autoPlayBtn) {
    autoPlayBtn.textContent = '⏹ Stop';
    autoPlayBtn.classList.add('btn-autoplay--playing');
  }

  playSong(
    song.notes,
    song.tempo,
    (i) => {
      if (!isAutoPlaying) return;
      currentIndex = i;
      updateGameDisplay(song);
    },
    () => {
      isAutoPlaying = false;
      completed = true;
      render();
    },
  );
}

function stopAutoPlay() {
  isAutoPlaying = false;
  stopSong();
  if (autoPlayBtn) {
    autoPlayBtn.textContent = '▶ Play Song';
    autoPlayBtn.classList.remove('btn-autoplay--playing');
  }
}

// ── Mic control ────────────────────────────────────────────────────────────────
function buildMicControl(song) {
  const wrap = document.createElement('div');
  wrap.className = 'mic-control';
  wrap.id = 'mic-control';

  const btn = document.createElement('button');
  btn.className = 'btn-mic btn-mic--off';
  btn.id = 'btn-mic';
  btn.textContent = '🎤 Use Mic';
  wrap.appendChild(btn);

  const statusEl = document.createElement('div');
  statusEl.id = 'mic-status';
  wrap.appendChild(statusEl);

  btn.addEventListener('click', async () => {
    if (isListening()) {
      stopListening();
      btn.className = 'btn-mic btn-mic--off';
      btn.textContent = '🎤 Use Mic';
      wrap.classList.remove('mic-control--active');
      statusEl.innerHTML = '';
    } else {
      const result = await startListening((note) => handleNotePlay(note, song));
      if (result.success) {
        btn.className = 'btn-mic btn-mic--on';
        btn.textContent = '🛑 Stop Mic';
        wrap.classList.add('mic-control--active');
        statusEl.innerHTML = `
          <div class="mic-listening">
            <div class="mic-dot"></div>
            <span class="mic-label">Listening...</span>
          </div>
        `;
      } else {
        statusEl.innerHTML = `<span class="mic-error">⚠️ ${result.error}</span>`;
      }
    }
  });

  return wrap;
}

// ── Free Play screen ───────────────────────────────────────────────────────────
function renderFreePlay() {
  const div = document.createElement('div');
  div.className = 'screen';

  const header = document.createElement('div');
  header.className = 'freeplay-header';
  header.innerHTML = `
    <button class="btn-back" id="btn-back-freeplay">← Back</button>
    <h2>🎵 Free Play</h2>
  `;
  div.appendChild(header);

  const subtitle = document.createElement('p');
  subtitle.className = 'freeplay-subtitle';
  subtitle.textContent = 'Play whatever you like! No rules here 🎶';
  div.appendChild(subtitle);

  // Sheet music display for free play
  const sheetWrap = document.createElement('div');
  sheetWrap.className = 'sheet-music-wrap';
  const sheetTitle = document.createElement('h3');
  sheetTitle.className = 'sheet-music-title';
  sheetTitle.textContent = '🎼 Your notes';
  const fpSheetContainer = document.createElement('div');
  sheetWrap.appendChild(sheetTitle);
  sheetWrap.appendChild(fpSheetContainer);
  div.appendChild(sheetWrap);

  const pianoContainer = document.createElement('div');
  div.appendChild(pianoContainer);
  app.appendChild(div);

  const fpNotes = [];
  renderFreePlaySheet(fpSheetContainer, fpNotes);

  createPiano(pianoContainer, {
    onNotePlay: (note) => {
      fpNotes.push({ note, duration: 'q' });
      renderFreePlaySheet(fpSheetContainer, fpNotes);
    },
  });

  header.querySelector('#btn-back-freeplay').addEventListener('click', goMenu);
}

// ── Celebration screen ─────────────────────────────────────────────────────────
function renderCelebration(song) {
  const pct = Math.round((score / song.notes.length) * 100);
  const grade =
    pct >= 90 ? '🏆 Amazing!'
    : pct >= 70 ? '⭐ Great job!'
    : pct >= 50 ? '😊 Good try!'
    : '💪 Keep practicing!';

  const overlay = document.createElement('div');
  overlay.className = 'celebration';

  // Falling emojis
  const celebEmojis = ['⭐', '🎉', '🌟', '✨', '🎊', '🎈', '🏆', '💫'];
  for (let i = 0; i < 20; i++) {
    const el = document.createElement('div');
    el.className = 'falling-emoji';
    el.style.left = `${Math.random() * 100}%`;
    el.style.animationDelay = `${Math.random() * 2}s`;
    el.textContent = celebEmojis[Math.floor(Math.random() * celebEmojis.length)];
    overlay.appendChild(el);
  }

  const card = document.createElement('div');
  card.className = 'celebration-card';
  card.innerHTML = `
    <div style="font-size:80px">🎉</div>
    <h1>Song Complete!</h1>
    <div class="celebration-grade">${grade}</div>
    <div class="celebration-score">Score: ${score} / ${song.notes.length} notes correct</div>
    <div class="celebration-btns">
      <button class="btn-restart" id="btn-restart">🔄 Play Again</button>
      <button class="btn-menu" id="btn-menu">🏠 Main Menu</button>
    </div>
  `;
  overlay.appendChild(card);
  app.appendChild(overlay);

  card.querySelector('#btn-restart').addEventListener('click', () => goGame(selectedSong));
  card.querySelector('#btn-menu').addEventListener('click', goMenu);
}

// ── Boot ───────────────────────────────────────────────────────────────────────
render();
