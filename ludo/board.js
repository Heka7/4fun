/* ===== board.js - رسم لوحة اللودو على Canvas ===== */

const COLORS = {
  red:    { bg:'#ef4444', light:'#fca5a5', dark:'#991b1b', text:'#fff', safe:'#fecaca' },
  blue:   { bg:'#3b82f6', light:'#93c5fd', dark:'#1d4ed8', text:'#fff', safe:'#bfdbfe' },
  green:  { bg:'#22c55e', light:'#86efac', dark:'#15803d', text:'#fff', safe:'#bbf7d0' },
  yellow: { bg:'#eab308', light:'#fde047', dark:'#a16207', text:'#000', safe:'#fef08a' }
};

const COLOR_ORDER = ['red','green','yellow','blue'];

/* 
  لوحة اللودو 15x15:
  - مربع البيت: 6x6 في كل ركن
  - المسار: 3 خلايا عرض
  - المركز: 3x3 مثلث
*/

const CELL = 15; // عدد الخلايا في صف/عمود

// مسار كل لاعب (52 خطوة + 5 للمنزل)
const PATHS = {
  red: [
    // الدوران الرئيسي (52 خطوة: 0-51)
    [6,1],[6,2],[6,3],[6,4],[6,5],         // 0-4
    [5,6],[4,6],[3,6],[2,6],[1,6],[0,6],   // 5-10
    [0,7],                                  // 11
    [0,8],[1,8],[2,8],[3,8],[4,8],[5,8],   // 12-17
    [6,9],[6,10],[6,11],[6,12],[6,13],[6,14], // 18-23
    [7,14],                                 // 24
    [8,14],[8,13],[8,12],[8,11],[8,10],[8,9], // 25-30
    [9,8],[10,8],[11,8],[12,8],[13,8],[14,8], // 31-36
    [14,7],                                 // 37
    [14,6],[13,6],[12,6],[11,6],[10,6],[9,6], // 38-43
    [8,5],[8,4],[8,3],[8,2],[8,1],[8,0],   // 44-49
    [7,0],                                  // 50
    [6,0],                                  // 51  ← نقطة الدخول للممر
    // ممر المنزل الأحمر (5 خطوات: 52-56)
    [7,1],[7,2],[7,3],[7,4],[7,5]          // 52-56
  ],
  green: [
    // الدوران الرئيسي (52 خطوة: 0-51)
    [1,8],[2,8],[3,8],[4,8],[5,8],          // 0-4
    [6,9],[6,10],[6,11],[6,12],[6,13],[6,14], // 5-10
    [7,14],                                 // 11
    [8,14],[8,13],[8,12],[8,11],[8,10],[8,9], // 12-17
    [9,8],[10,8],[11,8],[12,8],[13,8],[14,8], // 18-23
    [14,7],                                 // 24
    [14,6],[13,6],[12,6],[11,6],[10,6],[9,6], // 25-30
    [8,5],[8,4],[8,3],[8,2],[8,1],[8,0],   // 31-36
    [7,0],                                  // 37
    [6,0],[6,1],[6,2],[6,3],[6,4],[6,5],   // 38-43
    [5,6],[4,6],[3,6],[2,6],[1,6],[0,6],   // 44-49
    [0,7],                                  // 50
    [0,8],                                  // 51 ← نقطة الدخول للممر
    // ممر المنزل الأخضر (5 خطوات: 52-56)
    [1,7],[2,7],[3,7],[4,7],[5,7]           // 52-56
  ],
  yellow: [
    // الدوران الرئيسي (52 خطوة: 0-51)
    [8,13],[8,12],[8,11],[8,10],[8,9],      // 0-4
    [9,8],[10,8],[11,8],[12,8],[13,8],[14,8], // 5-10
    [14,7],                                 // 11
    [14,6],[13,6],[12,6],[11,6],[10,6],[9,6], // 12-17
    [8,5],[8,4],[8,3],[8,2],[8,1],[8,0],   // 18-23
    [7,0],                                  // 24
    [6,0],[6,1],[6,2],[6,3],[6,4],[6,5],   // 25-30
    [5,6],[4,6],[3,6],[2,6],[1,6],[0,6],   // 31-36
    [0,7],                                  // 37
    [0,8],[1,8],[2,8],[3,8],[4,8],[5,8],   // 38-43
    [6,9],[6,10],[6,11],[6,12],[6,13],[6,14], // 44-49
    [7,14],                                 // 50
    [8,14],                                 // 51 ← نقطة الدخول للممر
    // ممر المنزل الأصفر (5 خطوات: 52-56)
    [7,13],[7,12],[7,11],[7,10],[7,9]       // 52-56
  ],
  blue: [
    // الدوران الرئيسي (52 خطوة: 0-51)
    [13,6],[12,6],[11,6],[10,6],[9,6],      // 0-4
    [8,5],[8,4],[8,3],[8,2],[8,1],[8,0],   // 5-10
    [7,0],                                  // 11
    [6,0],[6,1],[6,2],[6,3],[6,4],[6,5],   // 12-17
    [5,6],[4,6],[3,6],[2,6],[1,6],[0,6],   // 18-23
    [0,7],                                  // 24
    [0,8],[1,8],[2,8],[3,8],[4,8],[5,8],   // 25-30
    [6,9],[6,10],[6,11],[6,12],[6,13],[6,14], // 31-36
    [7,14],                                 // 37
    [8,14],[8,13],[8,12],[8,11],[8,10],[8,9], // 38-43
    [9,8],[10,8],[11,8],[12,8],[13,8],[14,8], // 44-49
    [14,7],                                 // 50
    [14,6],                                 // 51 ← نقطة الدخول للممر
    // ممر المنزل الأزرق (5 خطوات: 52-56)
    [13,7],[12,7],[11,7],[10,7],[9,7]       // 52-56
  ]
};

// خلايا الحماية (النجوم)
const SAFE_CELLS_GRID = [
  [6,1],[1,6],[6,11],[11,8],[8,13],[13,8],[8,3],[3,8],
  [6,2],[2,8],[8,12],[12,6]
];

// بيوت كل لون (لحفظ القطع في البيت)
const HOME_POSITIONS = {
  red:    [[1,1],[2,1],[1,2],[2,2]],
  green:  [[1,11],[2,11],[1,12],[2,12]],
  yellow: [[11,11],[12,11],[11,12],[12,12]],
  blue:   [[11,1],[12,1],[11,2],[12,2]]
};

const STAR_POSITIONS = [
  [6,1],[8,2],[1,6],[2,8],[6,11],[8,12],[11,6],[12,8],
  [1,8],[2,6],[8,13],[13,8],[11,8],[12,6],[8,1],[6,2]
];

let canvas, ctx, cellSize;

function initBoard() {
  canvas = document.getElementById('ludo-canvas');
  ctx = canvas.getContext('2d');
  resizeBoard();
  window.addEventListener('resize', resizeBoard);
  canvas.addEventListener('click', onBoardClick);
  canvas.addEventListener('touchend', e => {
    e.preventDefault();
    const t = e.changedTouches[0];
    onBoardClick({ clientX: t.clientX, clientY: t.clientY });
  }, { passive: false });
}

function resizeBoard() {
  const wrapper = document.getElementById('board-wrapper');
  if (!wrapper) return;
  const available = Math.min(
    wrapper.clientWidth  - 12,
    wrapper.clientHeight - 12,
    560
  );
  const size = Math.max(available, 270);
  cellSize = Math.floor(size / 15);
  canvas.width  = cellSize * 15;
  canvas.height = cellSize * 15;
  if (window.G) drawBoard();
}

/* ─── MAIN DRAW ─── */
function drawBoard() {
  if (!ctx || !cellSize) return;
  const G = window.G;
  const cs = cellSize;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Board background
  ctx.fillStyle = '#e8eef7';
  roundRect(ctx, 0, 0, canvas.width, canvas.height, 12);
  ctx.fill();

  // Draw all cells
  for (let r = 0; r < 15; r++)
    for (let c = 0; c < 15; c++)
      drawCell(r, c, cs);

  // Center triangles
  drawCenter(cs);

  // Pieces
  if (G) {
    // collect pieces per grid cell to offset stacked ones
    const cellMap = {};
    G.players.forEach((pl, pi) => {
      pl.pieces.forEach((pos, idx) => {
        if (pos >= 57) return;
        let key;
        if (pos === -1) {
          const hp = HOME_POSITIONS[pl.color][idx];
          key = `${hp[0]}_${hp[1]}`;
        } else {
          const cell = PATHS[pl.color][pos];
          if (!cell) return;
          key = `${cell[0]}_${cell[1]}`;
        }
        if (!cellMap[key]) cellMap[key] = [];
        cellMap[key].push({ pl, pi, pos, idx });
      });
    });

    // Draw pieces with stacking offset
    Object.values(cellMap).forEach(group => {
      group.forEach((item, gi) => {
        const { pl, pi, pos, idx } = item;
        let gr, gc;
        if (pos === -1) {
          [gr, gc] = HOME_POSITIONS[pl.color][idx];
        } else {
          [gr, gc] = PATHS[pl.color][pos];
        }
        const offset = getStackOffset(gi, group.length, cs);
        drawPiece(gr, gc, pl.color, G, pi, idx, offset);
      });
    });

    // Movable piece highlights
    if (G.movablePieces && G.movablePieces.length > 0) {
      G.movablePieces.forEach(({ playerIdx, pieceIdx }) => {
        if (playerIdx !== G.currentPlayer) return;
        const pl = G.players[playerIdx];
        const pos = pl.pieces[pieceIdx];
        let gr, gc;
        if (pos === -1) [gr, gc] = HOME_POSITIONS[pl.color][pieceIdx];
        else { const cell = PATHS[pl.color][pos]; if (!cell) return; [gr, gc] = cell; }
        const x = gc * cs + cs / 2;
        const y = gr * cs + cs / 2;
        // Pulsing ring
        ctx.beginPath();
        ctx.arc(x, y, cs * 0.46, 0, Math.PI * 2);
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = Math.max(2, cs * 0.055);
        ctx.setLineDash([cs * 0.18, cs * 0.12]);
        ctx.stroke();
        ctx.setLineDash([]);
      });
    }
  }
}

function getStackOffset(index, total, cs) {
  if (total === 1) return { x: 0, y: 0 };
  const spread = cs * 0.22;
  const positions = [
    { x: -spread, y: -spread }, { x: spread, y: -spread },
    { x: -spread, y:  spread }, { x: spread, y:  spread }
  ];
  return positions[index % 4] || { x: 0, y: 0 };
}

/* ─── CELL DRAW ─── */
function drawCell(r, c, cs) {
  const x = c * cs, y = r * cs;
  let fill = '#f0f4fc'; // default path color

  // ── Home corners ──
  const isRedHome    = r <= 5 && c <= 5;
  const isBlueHome   = r <= 5 && c >= 9;
  const isGreenHome  = r >= 9 && c <= 5;
  const isYellowHome = r >= 9 && c >= 9;

  // Inner safe circle area (6x6 → 4x4 circle zone)
  const isRedInner    = r >= 1 && r <= 4 && c >= 1 && c <= 4;
  const isBlueInner   = r >= 1 && r <= 4 && c >= 10 && c <= 13;
  const isGreenInner  = r >= 10 && r <= 13 && c >= 1 && c <= 4;
  const isYellowInner = r >= 10 && r <= 13 && c >= 10 && c <= 13;

  if (isRedHome) {
    fill = '#ef4444';
    if (isRedInner) fill = '#fca5a5';
  } else if (isBlueHome) {
    fill = '#3b82f6';
    if (isBlueInner) fill = '#93c5fd';
  } else if (isGreenHome) {
    fill = '#22c55e';
    if (isGreenInner) fill = '#86efac';
  } else if (isYellowHome) {
    fill = '#eab308';
    if (isYellowInner) fill = '#fde047';
  }
  // Colored home paths
  else if (r >= 1 && r <= 5 && c === 7) fill = '#fecaca';  // Red column
  else if (r === 7 && c >= 1 && c <= 5) fill = '#bbf7d0';  // Green row
  else if (r >= 9 && r <= 13 && c === 7) fill = '#fef08a'; // Yellow column
  else if (r === 7 && c >= 9 && c <= 13) fill = '#bfdbfe'; // Blue row

  ctx.fillStyle = fill;
  ctx.fillRect(x, y, cs, cs);

  // Grid lines
  ctx.strokeStyle = 'rgba(0,0,0,0.1)';
  ctx.lineWidth = 0.5;
  ctx.strokeRect(x + 0.5, y + 0.5, cs - 1, cs - 1);

  // Home circle backdrop
  if ((isRedHome && isRedInner) || (isBlueHome && isBlueInner) ||
      (isGreenHome && isGreenInner) || (isYellowHome && isYellowInner)) {
    // Will be drawn by the large oval in drawHomeArea
  }

  // Star (safe cells) - not on corners, not center
  const isSafe = STAR_POSITIONS.some(([sr, sc]) => sr === r && sc === c);
  const isCenter = r >= 6 && r <= 8 && c >= 6 && c <= 8;
  if (isSafe && !isCenter) {
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.font = `${Math.round(cs * 0.55)}px serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('★', x + cs / 2, y + cs / 2);
  }

  // Starting arrows
  const starts = {
    red:    [6, 1], green:  [1, 8],
    yellow: [8, 13], blue:  [13, 6]
  };
  Object.entries(starts).forEach(([col, [sr, sc]]) => {
    if (r !== sr || c !== sc) return;
    const C = COLORS[col];
    ctx.fillStyle = C.bg;
    ctx.beginPath();
    ctx.arc(x + cs/2, y + cs/2, cs * 0.36, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${Math.round(cs * 0.38)}px sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('▶', x + cs/2, y + cs/2);
  });

  // Home area inner oval (drawn once per 4x4 block)
  if (r === 1 && c === 1) drawHomeOval(1, 1, 4, 'red',    cs);
  if (r === 1 && c === 10) drawHomeOval(1, 10, 4, 'blue',  cs);
  if (r === 10 && c === 1) drawHomeOval(10, 1, 4, 'green', cs);
  if (r === 10 && c === 10) drawHomeOval(10, 10, 4,'yellow',cs);
}

function drawHomeOval(startR, startC, size, color, cs) {
  const C = COLORS[color];
  const x = startC * cs;
  const y = startR * cs;
  const w = size * cs;
  const h = size * cs;
  const pad = cs * 0.18;

  // White card
  ctx.fillStyle = 'rgba(255,255,255,0.82)';
  roundRect(ctx, x + pad, y + pad, w - pad*2, h - pad*2, cs * 0.5);
  ctx.fill();
}

/* ─── CENTER ─── */
function drawCenter(cs) {
  const ox = 6 * cs, oy = 6 * cs;
  const S  = 3 * cs;
  const mx = ox + S / 2, my = oy + S / 2;

  const triangles = [
    { color: '#ef4444', pts: [[ox, oy], [ox+S, oy], [mx, my]] },        // red - top
    { color: '#22c55e', pts: [[ox, oy], [ox, oy+S], [mx, my]] },        // green - left
    { color: '#eab308', pts: [[ox+S, oy+S], [ox, oy+S], [mx, my]] },    // yellow - bottom
    { color: '#3b82f6', pts: [[ox+S, oy], [ox+S, oy+S], [mx, my]] }     // blue - right
  ];

  triangles.forEach(t => {
    ctx.beginPath();
    ctx.moveTo(t.pts[0][0], t.pts[0][1]);
    ctx.lineTo(t.pts[1][0], t.pts[1][1]);
    ctx.lineTo(t.pts[2][0], t.pts[2][1]);
    ctx.closePath();
    ctx.fillStyle = t.color;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1;
    ctx.stroke();
  });

  // Center crown
  ctx.font = `${Math.round(cs * 1.1)}px serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('👑', mx, my);
}

/* ─── PIECE ─── */
function drawPiece(r, c, color, G, playerIdx, pieceIdx, offset = { x: 0, y: 0 }) {
  const cs = cellSize;
  const x = c * cs + cs / 2 + offset.x;
  const y = r * cs + cs / 2 + offset.y;
  const radius = cs * 0.36;
  const col = COLORS[color];

  // Drop shadow
  ctx.beginPath();
  ctx.arc(x + 1.5, y + 2.5, radius, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fill();

  // Body gradient
  const grad = ctx.createRadialGradient(
    x - radius * 0.35, y - radius * 0.35, radius * 0.05,
    x, y, radius
  );
  grad.addColorStop(0, col.light);
  grad.addColorStop(0.6, col.bg);
  grad.addColorStop(1, col.dark);

  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();

  // Rim
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Inner ring
  ctx.beginPath();
  ctx.arc(x, y, radius * 0.56, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Shine
  ctx.beginPath();
  ctx.arc(x - radius * 0.28, y - radius * 0.28, radius * 0.22, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.fill();

  // Number
  ctx.fillStyle = col.text;
  ctx.font = `900 ${Math.round(radius * 0.9)}px Cairo, sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(pieceIdx + 1, x, y + 1);
}

/* ─── UTILITIES ─── */
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function onBoardClick(e) {
  if (!window.G) return;
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width  / rect.width;
  const scaleY = canvas.height / rect.height;
  const x = (e.clientX - rect.left) * scaleX;
  const y = (e.clientY - rect.top)  * scaleY;
  const col = Math.floor(x / cellSize);
  const row = Math.floor(y / cellSize);
  window.handleBoardClick(row, col);
}

/* ─── DICE FACE ─── */
const DICE_DOTS = {
  1: [[0.5,0.5]],
  2: [[0.27,0.27],[0.73,0.73]],
  3: [[0.27,0.27],[0.5,0.5],[0.73,0.73]],
  4: [[0.27,0.27],[0.73,0.27],[0.27,0.73],[0.73,0.73]],
  5: [[0.27,0.27],[0.73,0.27],[0.5,0.5],[0.27,0.73],[0.73,0.73]],
  6: [[0.27,0.22],[0.73,0.22],[0.27,0.5],[0.73,0.5],[0.27,0.78],[0.73,0.78]]
};

function renderDiceFace(n) {
  const el = document.getElementById('dice-face');
  if (!el) return;
  if (!n || n === 0) { el.innerHTML = '🎲'; return; }
  const dots = DICE_DOTS[n];
  if (!dots) { el.textContent = n; return; }
  const sz = 58, dr = Math.round(sz * 0.09);
  let svg = `<svg width="${sz}" height="${sz}" viewBox="0 0 ${sz} ${sz}" xmlns="http://www.w3.org/2000/svg">`;
  svg += `<rect width="${sz}" height="${sz}" rx="10" fill="white"/>`;
  dots.forEach(([cx,cy]) => {
    svg += `<circle cx="${Math.round(cx*sz)}" cy="${Math.round(cy*sz)}" r="${dr}" fill="#1e293b"/>`;
  });
  svg += '</svg>';
  el.innerHTML = svg;
}



