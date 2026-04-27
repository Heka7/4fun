/* ===== game.js - منطق اللعبة الرئيسي ===== */

/* ===== الحالة العامة ===== */
let offlineCount = 1;   // عدد اللاعبين البشريين
let totalPlayers = 4;   // مجموع اللاعبين
let aiDifficulty = 'medium';

/* ===== بناء حالة اللعبة الأولية ===== */
function buildInitialGameState(playerDefs) {
  return {
    players: playerDefs.map((pd, i) => ({
      name: pd.name,
      color: pd.color,
      isHuman: pd.isHuman,
      pieces: [-1, -1, -1, -1],  // -1 = في البيت
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
    aiDifficulty: aiDifficulty,
    turn: 0
  };
}

/* ===== إعداد الأوفلاين ===== */
let selectedCount = 1;
let selectedTotal = 3;

function selectCount(btn) {
  document.querySelectorAll('.count-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  selectedCount = parseInt(btn.dataset.count);
  updateCountHint();
}

function selectTotal(btn) {
  document.querySelectorAll('.total-btn, .total-btn.active2').forEach(b => {
    b.classList.remove('active');
    b.classList.remove('active2');
  });
  btn.classList.add('active');
  selectedTotal = parseInt(btn.dataset.total);
  // لا يمكن أن يكون عدد البشر أكبر من المجموع
  if (selectedCount > selectedTotal) {
    selectedCount = selectedTotal;
    document.querySelectorAll('.count-btn').forEach(b => {
      b.classList.toggle('active', parseInt(b.dataset.count) === selectedCount);
    });
  }
  updateCountHint();
}

function updateCountHint() {
  const bots = Math.max(0, selectedTotal - selectedCount);
  const hint = document.getElementById('count-hint');
  if (hint) hint.textContent = bots > 0 ? `+ ${bots} كمبيوتر` : 'لا كمبيوتر - كل اللاعبين بشريين';
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
  const humans = Math.min(selectedCount, total);
  const bots = total - humans;

  const botNames = ['روبوت 🤖','نينجا 🥷','دراغون 🐲','سايبر 🤖'];
  const playerDefs = [];

  for (let i = 0; i < humans; i++) {
    const n = i === 0 ? name : `لاعب ${i+1}`;
    playerDefs.push({ name: n, color: COLOR_ORDER[i], isHuman: true });
  }
  for (let i = 0; i < bots; i++) {
    playerDefs.push({ name: botNames[i], color: COLOR_ORDER[humans + i], isHuman: false });
  }

  window.G = buildInitialGameState(playerDefs);
  window.G.mode = 'offline';

  showScreen('screen-game');
  document.getElementById('chat-container').classList.add('hidden');
  initBoard();
  updateHUD();
  drawBoard();
  updateGameControls();

  // لو أول لاعب كمبيوتر
  if (!window.G.players[0].isHuman) {
    setTimeout(doAiTurn, 800);
  }
}

/* ===== شاشات ===== */
function showMenu() {
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

/* ===== النرد ===== */
function onDiceClick() {
  const G = window.G;
  if (!G || G.gameOver) return;
  if (G.diceRolled) return;

  // أونلاين: فقط لو دورك
  if (G.mode === 'online') {
    const myColor = G.myColor;
    const activeColor = COLOR_ORDER[G.currentPlayer];
    if (myColor !== activeColor) return;
  } else {
    // أوفلاين: فقط لو اللاعب الحالي بشري
    if (!G.players[G.currentPlayer].isHuman) return;
  }

  rollDice();
}

function rollDice() {
  const G = window.G;
  const dice = Math.floor(Math.random() * 6) + 1;
  G.dice = dice;
  G.diceRolled = true;

  // أنيميشن النرد
  const diceEl = document.getElementById('dice-display');
  diceEl.classList.add('rolling');
  setTimeout(() => diceEl.classList.remove('rolling'), 500);

  // رسم وجه النرد
  renderDiceFace(dice);
  playDiceSound();

  // حساب القطع القابلة للتحريك
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

  // لو كمبيوتر - يختار القطعة بعد تأخير
  if (G.mode === 'offline' && !G.players[G.currentPlayer].isHuman) {
    setTimeout(() => doAiMove(), 900);
  }

  if (G.mode === 'online') pushGameState();
}

/* ===== حساب القطع المتاحة ===== */
function calcMovable(G, playerIdx, dice) {
  const pl = G.players[playerIdx];
  const path = PATHS[pl.color];
  const movable = [];

  pl.pieces.forEach((pos, idx) => {
    if (pos >= 56) return; // وصلت أو في المنزل
    if (pos === -1 && dice !== 6) return;
    if (pos === -1 && dice === 6) { movable.push({ playerIdx, pieceIdx: idx }); return; }
    const newPos = pos + dice;
    if (newPos <= 56) movable.push({ playerIdx, pieceIdx: idx });
  });

  return movable;
}

/* ===== النقر على اللوحة ===== */
function handleBoardClick(row, col) {
  const G = window.G;
  if (!G || G.gameOver || !G.diceRolled) return;
  if (G.movablePieces.length === 0) return;

  const playerIdx = G.currentPlayer;
  const pl = G.players[playerIdx];

  // أونلاين: فقط دورك
  if (G.mode === 'online' && G.myColor !== COLOR_ORDER[playerIdx]) return;
  // أوفلاين: فقط بشري
  if (G.mode === 'offline' && !pl.isHuman) return;

  // هل نقر على قطعة؟
  for (const m of G.movablePieces) {
    if (m.playerIdx !== playerIdx) continue;
    const pos = pl.pieces[m.pieceIdx];
    let pRow, pCol;

    if (pos === -1) {
      [pRow, pCol] = HOME_POSITIONS[pl.color][m.pieceIdx];
    } else {
      [pRow, pCol] = PATHS[pl.color][pos];
    }

    if (pRow === row && pCol === col) {
      movePiece(playerIdx, m.pieceIdx);
      return;
    }
  }
}

/* ===== تحريك القطعة ===== */
function movePiece(playerIdx, pieceIdx) {
  const G = window.G;
  const pl = G.players[playerIdx];
  const dice = G.dice;
  const pos = pl.pieces[pieceIdx];
  const path = PATHS[pl.color];

  let gotBonus = false;

  if (pos === -1 && dice === 6) {
    // خروج من البيت
    pl.pieces[pieceIdx] = 0;
    addLog(`${pl.name} أخرج قطعة! 🎉`);
    playSound('exit');
    gotBonus = true;
  } else if (pos < 0) {
    // في البيت وما طلع 6 - تجاهل
    G.diceRolled = false;
    G.movablePieces = [];
    return;
  } else {
    const newPos = pos + dice;

    if (newPos > 56) {
      addLog('لا يمكن التحريك!');
      G.diceRolled = false;
      G.movablePieces = [];
      updateGameControls();
      return;
    }

    pl.pieces[pieceIdx] = newPos;

    if (newPos === 56) {
      // وصلت للمنزل - ضع 57 لتمييزها
      pl.pieces[pieceIdx] = 57;
      pl.finishedPieces++;
      addLog(`${pl.name} وصّل قطعة للبيت! 🏆`);
      playSound('finish');
      gotBonus = true;

      // فحص الفوز
      if (pl.finishedPieces === 4) {
        G.gameOver = true;
        G.winner = playerIdx;
        G.diceRolled = false;
        G.movablePieces = [];
        drawBoard();
        updateHUD();
        if (G.mode === 'online') pushGameState();
        showWin(playerIdx);
        return;
      }
    } else {
      // فحص القتل
      const cell = path[newPos];
      if (cell) {
        const [nr, nc] = cell;
        if (!isSafeCell(nr, nc)) {
          const killed = checkAndKill(G, playerIdx, nr, nc);
          if (killed > 0) {
            addLog(`${pl.name} قتل ${killed} قطعة! ⚔️`);
            playSound('kill');
            gotBonus = true;
          }
        }
      }
    }
  }

  G.diceRolled = false;
  G.movablePieces = [];

  drawBoard();
  updateHUD();
  renderDiceFace(0);

  if (G.gameOver) return;

  // دور إضافي لو طلع 6 أو قتل أو وصّل
  const getsBonus = (dice === 6) || gotBonus;
  if (getsBonus) {
    addLog(`${pl.name} له دور إضافي! 🔄`);
    G.extraTurn = true;
    updateGameControls();
    if (G.mode === 'online') pushGameState();
    if (G.mode === 'offline' && !pl.isHuman) {
      setTimeout(doAiTurn, 900);
    }
  } else {
    nextTurn(false);
  }
}

/* ===== قتل القطع ===== */
function checkAndKill(G, attackerIdx, row, col) {
  let killed = 0;
  G.players.forEach((pl, i) => {
    if (i === attackerIdx) return;
    pl.pieces.forEach((pos, idx) => {
      if (pos < 0 || pos >= 57) return;
      const path = PATHS[pl.color];
      const cell = path[pos];
      if (cell && cell[0] === row && cell[1] === col) {
        // تحقق أنها ليست في مسار المنزل الخاص بها (pos >= 51)
        if (pos < 51) {
          pl.pieces[idx] = -1;
          killed++;
          addLog(`${G.players[attackerIdx].name} ضرب ${pl.name}!`);
        }
      }
    });
  });
  return killed;
}

/* ===== الدور القادم ===== */
function nextTurn(isExtra) {
  const G = window.G;
  if (!isExtra) {
    // حذف اللاعبين المحذوفين (كل قطعهم في البيت ومرت عليهم أدوار)
    let next = (G.currentPlayer + 1) % G.players.length;
    let tries = 0;
    while (isEliminated(G, next) && tries < G.players.length) {
      next = (next + 1) % G.players.length;
      tries++;
    }
    G.currentPlayer = next;
    G.turn++;
  }
  G.extraTurn = false;
  G.diceRolled = false;
  G.movablePieces = [];
  G.dice = 0;

  drawBoard();
  updateHUD();
  updateGameControls();

  if (G.mode === 'online') {
    pushGameState();
    return;
  }

  // أوفلاين: لو الدور على كمبيوتر
  if (!G.players[G.currentPlayer].isHuman) {
    setTimeout(doAiTurn, 700);
  }
}

function isEliminated(G, idx) {
  const pl = G.players[idx];
  return pl.finishedPieces === 4;
}

/* ===== دور الكمبيوتر ===== */
function doAiTurn() {
  const G = window.G;
  if (!G || G.gameOver) return;
  if (G.players[G.currentPlayer].isHuman) return;

  // رمي النرد
  const dice = Math.floor(Math.random() * 6) + 1;
  G.dice = dice;
  G.diceRolled = true;
  renderDiceFace(dice);
  playDiceSound();

  G.movablePieces = calcMovable(G, G.currentPlayer, dice);
  drawBoard();
  updateGameControls();

  setTimeout(() => {
    if (G.movablePieces.length === 0) {
      addLog(`${G.players[G.currentPlayer].name} لا يوجد حركة`);
      nextTurn(false);
      return;
    }

    // اختيار القطعة
    const pieceIdx = aiChoosePiece(G, G.currentPlayer, dice);
    if (pieceIdx === -1) {
      nextTurn(false);
      return;
    }
    movePiece(G.currentPlayer, pieceIdx);
  }, 800);
}

function doAiMove() {
  const G = window.G;
  if (!G || G.gameOver) return;
  const pieceIdx = aiChoosePiece(G, G.currentPlayer, G.dice);
  if (pieceIdx === -1) { nextTurn(false); return; }
  movePiece(G.currentPlayer, pieceIdx);
}

/* ===== واجهة اللعبة ===== */
function updateHUD() {
  const G = window.G;
  if (!G) return;

  const hud = document.getElementById('players-hud');
  hud.innerHTML = G.players.map((pl, i) => {
    const isActive = i === G.currentPlayer && !G.gameOver;
    const c = COLORS[pl.color];
    const piecesHtml = pl.pieces.map((pos, idx) => {
      let cls = 'mini-piece';
      if (pos === 57 || pl.finishedPieces > idx) cls += ' done';
      else if (pos === -1) cls += ' home';
      return `<div class="${cls}" style="background:${c.bg}"></div>`;
    }).join('');

    return `<div class="player-card ${isActive ? 'active' : ''} ${isEliminated(G,i) ? 'eliminated' : ''}"
              style="color:${c.bg}; border-color:${isActive ? c.bg : 'transparent'}">
      <span class="player-name">${pl.name}</span>
      <div class="player-pieces-hud">${piecesHtml}</div>
      <span class="player-score">${pl.finishedPieces}/4 🏠</span>
    </div>`;
  }).join('');
}

function updateGameControls() {
  const G = window.G;
  if (!G) return;

  const pl = G.players[G.currentPlayer];
  const c = COLORS[pl.color];
  const turnEl = document.getElementById('turn-indicator');
  const diceEl = document.getElementById('dice-display');
  const msgEl = document.getElementById('dice-msg');

  turnEl.textContent = `دور ${pl.name}`;
  turnEl.style.color = c.bg;

  const isMyTurn = G.mode === 'offline'
    ? pl.isHuman
    : G.myColor === COLOR_ORDER[G.currentPlayer];

  if (!G.diceRolled && isMyTurn) {
    diceEl.className = 'dice-display can-roll';
    msgEl.textContent = 'اضغط النرد!';
  } else if (!G.diceRolled && !isMyTurn) {
    diceEl.className = 'dice-display cannot-roll';
    msgEl.textContent = G.mode === 'online' ? 'دور خصمك...' : 'الكمبيوتر يفكر...';
  } else {
    diceEl.className = 'dice-display cannot-roll';
    if (G.movablePieces.length > 0 && isMyTurn) {
      msgEl.textContent = 'اختار قطعة!';
      diceEl.className = 'dice-display';
    } else {
      msgEl.textContent = '';
    }
  }
}

function addLog(text) {
  const el = document.getElementById('game-log');
  if (el) {
    el.textContent = text;
    el.style.opacity = 1;
    clearTimeout(el._timer);
    el._timer = setTimeout(() => el.style.opacity = 0.5, 3000);
  }
}

/* ===== الفوز ===== */
function showWin(playerIdx) {
  const G = window.G;
  if (!G) return;
  // لو النافذة ظاهرة بالفعل لا تعيد فتحها
  const overlay = document.getElementById('win-overlay');
  if (!overlay.classList.contains('hidden')) return;
  const pl = G.players[playerIdx];
  if (!pl) return;
  const c = COLORS[pl.color];
  overlay.classList.remove('hidden');
  const myIdx = G.mode === 'offline' ? G.players.findIndex(p => p.isHuman) : G.players.findIndex(p => p.color === G.myColor);
  document.getElementById('win-emoji').textContent = playerIdx === myIdx ? '🏆' : '🎉';
  document.getElementById('win-title').textContent = `${pl.name} فاز! 🎊`;
  document.getElementById('win-title').style.color = c.bg;
  document.getElementById('win-subtitle').textContent = playerIdx === myIdx ? '🏆 أحسنت ووصلت الأول!' : 'حاول تاني!';
  playSound('win');
}

function checkWinCondition() {
  const G = window.G;
  if (G && G.gameOver && G.winner >= 0) {
    showWin(G.winner);
  }
}

function playAgain() {
  document.getElementById('win-overlay').classList.add('hidden');
  if (window.G && window.G.mode === 'offline') {
    const playerDefs = window.G.players.map(pl => ({
      name: pl.name,
      color: pl.color,
      isHuman: pl.isHuman
    }));
    window.G = buildInitialGameState(playerDefs);
    window.G.mode = 'offline';
    initBoard();
    drawBoard();
    updateHUD();
    updateGameControls();
    renderDiceFace(0);
    if (!window.G.players[0].isHuman) setTimeout(doAiTurn, 800);
  } else {
    showMenu();
  }
}

function goMenu() {
  document.getElementById('win-overlay').classList.add('hidden');
  showMenu();
}

/* ===== الصوت ===== */
let audioCtx = null;
function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function playTone(freq, duration, type = 'sine', vol = 0.3) {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch(e) {}
}

function playDiceSound() {
  playTone(300, 0.1, 'square', 0.2);
  setTimeout(() => playTone(450, 0.08, 'square', 0.15), 100);
}

function playSound(type) {
  if (type === 'exit')  { playTone(523, 0.15, 'sine', 0.3); setTimeout(() => playTone(659, 0.15), 150); }
  if (type === 'kill')  { playTone(220, 0.2, 'sawtooth', 0.3); }
  if (type === 'finish'){ [523,659,784,1047].forEach((f,i) => setTimeout(() => playTone(f, 0.2), i*120)); }
  if (type === 'win')   { [523,659,784,1047,1319].forEach((f,i) => setTimeout(() => playTone(f, 0.25), i*150)); }
}

/* ===== تهيئة عند التحميل ===== */
window.onload = () => {
  const saved = localStorage.getItem('heka_global_player_name');
  if (!saved) {
    // لا يوجد اسم - ارجع لصفحة index
    window.location.href = '../index.html';
    return;
  }
  // عرض الاسم
  const welcome = document.getElementById('welcome-name');
  if (welcome) { welcome.textContent = `أهلاً يا ${saved} 👋`; welcome.classList.remove('hidden'); }

  updateCountHint();
};
