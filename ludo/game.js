/* ===== game.js - منطق اللعبة الرئيسي ===== */

/* ===== الحالة العامة ===== */
let isMuted = false;
let turnTimer = 30;
let timerInterval = null;

/* ===== بناء حالة اللعبة الأولية ===== */
function buildInitialGameState(playerDefs) {
  return {
    players: playerDefs.map((pd, i) => ({
      name: pd.name,
      color: pd.color,
      isHuman: pd.isHuman,
      pieces: [-1, -1, -1, -1],
      finishedPieces: 0,
      eliminated: false
    })),
    currentPlayer: 0,
    dice: 0,
    diceRolled: false,
    movablePieces: [],
    extraTurn: false,
    gameOver: false,
    winner: -1,
    mode: 'offline',
    turn: 0
  };
}

/* ===== إعداد الأوفلاين ===== */
let selectedTotal = 4;
let aiDifficulty = 'medium';

function selectTotal(btn) {
  document.querySelectorAll('.total-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  selectedTotal = parseInt(btn.dataset.total);
}

function selectDiff(btn) {
  document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  aiDifficulty = btn.dataset.diff;
}

function startOffline() {
  const name = getPlayerName();
  if (!name) return;

  const total = selectedTotal;
  const humans = 1; 
  const bots = total - humans;

  const botNames = ['روبوت 🤖','نينجا 🥷','دراغون 🐲','سايبر 🤖'];
  const playerDefs = [];

  playerDefs.push({ name: name, color: COLOR_ORDER[0], isHuman: true });
  for (let i = 0; i < bots; i++) {
    playerDefs.push({ name: botNames[i], color: COLOR_ORDER[i+1], isHuman: false });
  }

  window.G = buildInitialGameState(playerDefs);
  window.G.mode = 'offline';

  showScreen('screen-game');
  document.getElementById('chat-container').classList.add('hidden');
  initBoard();
  updateHUD();
  drawBoard();
  updateGameControls();
  startTimer();

  if (!window.G.players[0].isHuman) setTimeout(doAiTurn, 800);
}

/* ===== شاشات ===== */
function showMenu() {
  stopTimer();
  showScreen('screen-menu');
  if (onlineListener) { onlineListener.off(); onlineListener = null; }
  onlineRoom = null;
  window.G = null;
}

function showOfflineSetup() {
  if (!checkName()) return;
  showScreen('screen-offline');
}

function showOnlineSetup() {
  if (!checkName()) return;
  showScreen('screen-online');
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.remove('active');
    s.classList.add('hidden');
  });
  const el = document.getElementById(id);
  el.classList.remove('hidden');
  el.classList.add('active');
}

function getPlayerName() {
  return localStorage.getItem('heka_global_player_name') || null;
}

function checkName() {
  const n = getPlayerName();
  if (!n) { window.location.href = '../index.html'; return false; }
  return true;
}

/* ===== التايمر وصوت الكتم ===== */
function toggleMute() {
  isMuted = !isMuted;
  document.getElementById('mute-btn').textContent = isMuted ? '🔇' : '🔊';
}

function startTimer() {
  stopTimer();
  turnTimer = 30;
  updateTimerUI();
  document.getElementById('turn-timer').classList.remove('hidden');
  
  timerInterval = setInterval(() => {
    turnTimer--;
    updateTimerUI();
    if (turnTimer <= 0) {
      stopTimer();
      handleTimerExpiration();
    }
  }, 1000);
}

function stopTimer() {
  if (timerInterval) clearInterval(timerInterval);
  document.getElementById('turn-timer').classList.add('hidden');
}

function updateTimerUI() {
  const el = document.getElementById('turn-timer');
  el.textContent = turnTimer;
  el.classList.toggle('warning', turnTimer <= 5);
}

function handleTimerExpiration() {
  const G = window.G;
  if (!G || G.gameOver) return;
  
  // إذا انتهى الوقت والبوت يلعب مكانك
  const pl = G.players[G.currentPlayer];
  addLog(`انتهى وقت ${pl.name}! البوت سيلعب.`);
  
  // تحويل مؤقت لبوت للعب الدور الحالي
  const wasHuman = pl.isHuman;
  pl.isHuman = false; 
  doAiTurn();
  // إعادة الخاصية بعد الحركة (سيتم ذلك في doAiTurn)
  pl._shouldReturnHuman = wasHuman;
}

/* ===== النرد ===== */
function onDiceClick() {
  const G = window.G;
  if (!G || G.gameOver || G.diceRolled) return;

  const pl = G.players[G.currentPlayer];
  if (G.mode === 'online') {
    if (G.myColor !== COLOR_ORDER[G.currentPlayer]) return;
  } else {
    if (!pl.isHuman) return;
  }

  rollDice();
}

function rollDice() {
  const G = window.G;
  const dice = Math.floor(Math.random() * 6) + 1;
  G.dice = dice;
  G.diceRolled = true;

  const diceEl = document.getElementById('dice-display');
  diceEl.classList.add('rolling');
  setTimeout(() => diceEl.classList.remove('rolling'), 500);

  renderDiceFace(dice);
  playDiceSound();

  G.movablePieces = calcMovable(G, G.currentPlayer, dice);
  updateGameControls();
  drawBoard();

  if (G.movablePieces.length === 0) {
    setTimeout(() => {
      addLog(`${G.players[G.currentPlayer].name} لا يوجد حركة`);
      nextTurn(false);
    }, 800);
    return;
  }

  if (G.mode === 'offline' && !G.players[G.currentPlayer].isHuman) {
    setTimeout(() => doAiMove(), 900);
  }

  if (G.mode === 'online') pushGameState();
}

function calcMovable(G, playerIdx, dice) {
  const pl = G.players[playerIdx];
  const movable = [];
  pl.pieces.forEach((pos, idx) => {
    if (pos >= 56) return;
    if (pos === -1 && dice !== 6) return;
    if (pos === -1 && dice === 6) { movable.push({ playerIdx, pieceIdx: idx }); return; }
    const newPos = pos + dice;
    if (newPos <= 56) movable.push({ playerIdx, pieceIdx: idx });
  });
  return movable;
}

function handleBoardClick(row, col) {
  const G = window.G;
  if (!G || G.gameOver || !G.diceRolled) return;
  const pl = G.players[G.currentPlayer];
  if (G.mode === 'online' && G.myColor !== COLOR_ORDER[G.currentPlayer]) return;
  if (G.mode === 'offline' && !pl.isHuman) return;

  for (const m of G.movablePieces) {
    const pos = pl.pieces[m.pieceIdx];
    if (pos === -1) {
      // مربعات البيت: HOME_POSITIONS بإحداثيات مركز الـ 2x2 (int)
      // كليك float row/col → تحقق إذا في نطاق 1 خلية
      const [hr, hc] = HOME_POSITIONS[pl.color][m.pieceIdx];
      if (Math.abs(row - hr) <= 1.0 && Math.abs(col - hc) <= 1.0) {
        movePiece(G.currentPlayer, m.pieceIdx); return;
      }
    } else {
      // خلايا المسار: تقريب بالأرضية
      const cell = PATHS[pl.color][pos];
      if (!cell) continue;
      if (Math.floor(row) === cell[0] && Math.floor(col) === cell[1]) {
        movePiece(G.currentPlayer, m.pieceIdx); return;
      }
    }
  }
}


function movePiece(playerIdx, pieceIdx) {
  const G = window.G;
  const pl = G.players[playerIdx];
  const dice = G.dice;
  const pos = pl.pieces[pieceIdx];
  let gotBonus = false;

  if (pos === -1 && dice === 6) {
    pl.pieces[pieceIdx] = 0;
    playSound('exit');
    gotBonus = true;
  } else if (pos >= 0) {
    const newPos = pos + dice;
    if (newPos > 56) { G.diceRolled = false; G.movablePieces = []; updateGameControls(); return; }
    pl.pieces[pieceIdx] = newPos;
    if (newPos === 56) {
      pl.finishedPieces++;
      playSound('finish');
      gotBonus = true;
      if (pl.finishedPieces === 4) {
        G.gameOver = true; G.winner = playerIdx; stopTimer(); showWin(playerIdx); return;
      }
    } else {
      const cell = PATHS[pl.color][newPos];
      if (cell && !isSafeCell(cell[0], cell[1])) {
        if (checkAndKill(G, playerIdx, cell[0], cell[1]) > 0) { playSound('kill'); gotBonus = true; }
      }
    }
  }

  G.diceRolled = false;
  G.movablePieces = [];
  drawBoard(); updateHUD(); renderDiceFace(0);
  if (G.gameOver) return;

  if (dice === 6 || gotBonus) {
    G.extraTurn = true; updateGameControls(); startTimer();
    if (G.mode === 'online') pushGameState();
    if (!pl.isHuman) setTimeout(doAiTurn, 900);
  } else {
    nextTurn(false);
  }
}

function isSafeCell(r, c) {
  return STAR_POSITIONS.some(p => p[0]===r && p[1]===c);
}

function checkAndKill(G, attackerIdx, r, c) {
  let killed = 0;
  G.players.forEach((pl, i) => {
    if (i === attackerIdx) return;
    pl.pieces.forEach((pos, idx) => {
      if (pos < 0 || pos >= 56) return;
      const cell = PATHS[pl.color][pos];
      if (cell && cell[0]===r && cell[1]===c && pos < 51) {
        pl.pieces[idx] = -1; killed++;
      }
    });
  });
  return killed;
}

function nextTurn(isExtra) {
  const G = window.G;
  if (!isExtra) {
    let next = (G.currentPlayer + 1) % G.players.length;
    while (G.players[next].finishedPieces === 4) next = (next + 1) % G.players.length;
    G.currentPlayer = next;
    G.turn++;
  }
  G.extraTurn = false; G.diceRolled = false; G.movablePieces = []; G.dice = 0;
  drawBoard(); updateHUD(); updateGameControls();
  startTimer();
  if (G.mode === 'online') pushGameState();
  if (!G.players[G.currentPlayer].isHuman) setTimeout(doAiTurn, 700);
}

function doAiTurn() {
  const G = window.G;
  if (!G || G.gameOver || G.players[G.currentPlayer].isHuman) return;

  const dice = Math.floor(Math.random() * 6) + 1;
  G.dice = dice; G.diceRolled = true;
  renderDiceFace(dice); playDiceSound();
  G.movablePieces = calcMovable(G, G.currentPlayer, dice);
  drawBoard(); updateGameControls();

  setTimeout(() => {
    if (G.movablePieces.length === 0) { nextTurn(false); return; }
    const pIdx = aiChoosePiece(G, G.currentPlayer, dice);
    const pl = G.players[G.currentPlayer];
    if (pl._shouldReturnHuman) { pl.isHuman = true; delete pl._shouldReturnHuman; }
    if (pIdx === -1) nextTurn(false);
    else movePiece(G.currentPlayer, pIdx);
  }, 800);
}

function doAiMove() {
  const G = window.G;
  const pIdx = aiChoosePiece(G, G.currentPlayer, G.dice);
  if (pIdx === -1) nextTurn(false);
  else movePiece(G.currentPlayer, pIdx);
}

function updateHUD() {
  const G = window.G; if (!G) return;
  const hud = document.getElementById('players-hud');
  hud.innerHTML = G.players.map((pl, i) => {
    const active = i === G.currentPlayer && !G.gameOver;
    const c = COLORS[pl.color];
    const piecesHtml = pl.pieces.map((pos, idx) => {
      let cls = 'mini-piece' + (pos >= 56 ? ' done' : (pos === -1 ? ' home' : ''));
      return `<div class="${cls}" style="background:${c.bg}"></div>`;
    }).join('');
    return `<div class="player-card ${active?'active':''}" style="color:${c.bg}; border-color:${active?c.bg:'transparent'}">
      <span class="player-name">${pl.name}${!pl.isHuman?' (بوت)':''}</span>
      <div class="player-pieces-hud">${piecesHtml}</div>
      <span class="player-score">${pl.finishedPieces}/4 🏠</span>
    </div>`;
  }).join('');
}

function updateGameControls() {
  const G = window.G; if (!G) return;
  const pl = G.players[G.currentPlayer];
  const turnEl = document.getElementById('turn-indicator');
  turnEl.textContent = `دور ${pl.name}`;
  turnEl.style.color = COLORS[pl.color].bg;

  const isMyTurn = G.mode === 'offline' ? pl.isHuman : G.myColor === COLOR_ORDER[G.currentPlayer];
  const diceEl = document.getElementById('dice-display');
  const msgEl = document.getElementById('dice-msg');

  if (!G.diceRolled && isMyTurn) { diceEl.className = 'dice-display can-roll'; msgEl.textContent = 'اضغط النرد!'; }
  else {
    diceEl.className = 'dice-display cannot-roll';
    msgEl.textContent = isMyTurn ? (G.movablePieces.length > 0 ? 'اختار قطعة!' : '') : (G.mode==='online'?'دور خصمك...':'الكمبيوتر...');
  }
}

function addLog(text) {
  const el = document.getElementById('game-log');
  if (el) { el.textContent = text; el.style.opacity = 1; setTimeout(() => el.style.opacity = 0.5, 3000); }
}

function showWin(playerIdx) {
  const overlay = document.getElementById('win-overlay');
  overlay.classList.remove('hidden');
  const pl = window.G.players[playerIdx];
  document.getElementById('win-title').textContent = `${pl.name} فاز! 🎊`;
  document.getElementById('win-title').style.color = COLORS[pl.color].bg;
  playSound('win');
}

function checkWinCondition() { if (window.G && window.G.gameOver) showWin(window.G.winner); }

function playAgain() { location.reload(); }
function goMenu() { location.reload(); }

/* ===== الصوت ===== */
let audioCtx = null;
function playTone(freq, duration, type = 'sine', vol = 0.3) {
  if (isMuted) return;
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type; osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + duration);
  } catch(e) {}
}
function playDiceSound() { playTone(300, 0.1, 'square', 0.2); }
function playSound(type) {
  if (type === 'exit')  { playTone(523, 0.15); setTimeout(() => playTone(659, 0.15), 150); }
  if (type === 'kill')  { playTone(220, 0.2, 'sawtooth'); }
  if (type === 'finish'){ [523,659,784,1047].forEach((f,i) => setTimeout(() => playTone(f, 0.2), i*120)); }
  if (type === 'win')   { [523,659,784,1047,1319].forEach((f,i) => setTimeout(() => playTone(f, 0.25), i*150)); }
}

window.onload = () => {
  const saved = localStorage.getItem('heka_global_player_name');
  if (!saved) { window.location.href = '../index.html'; return; }
  const welcome = document.getElementById('welcome-name');
  if (welcome) { welcome.textContent = `أهلاً يا ${saved} 👋`; welcome.classList.remove('hidden'); }
};
