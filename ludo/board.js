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

  // Board background (white)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw all cells
  for (let r = 0; r < 15; r++)
    for (let c = 0; c < 15; c++)
      drawCell(r, c, cs);

  // Center triangles
  drawCenter(cs);
  
  // Board border
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 3;
  ctx.strokeRect(1.5, 1.5, canvas.width - 3, canvas.height - 3);

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
        ctx.strokeStyle = '#000';
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
  let fill = '#f4f5f7'; // default path color
  let drawGrid = true;

  // ── Home corners ──
  const isRedHome    = r <= 5 && c <= 5;
  const isGreenHome  = r <= 5 && c >= 9;
  const isBlueHome   = r >= 9 && c <= 5;
  const isYellowHome = r >= 9 && c >= 9;

  let cornerColor = null;
  if (isRedHome) { fill = COLORS.red.bg; cornerColor = 'red'; drawGrid = false; }
  else if (isGreenHome) { fill = COLORS.green.bg; cornerColor = 'green'; drawGrid = false; }
  else if (isBlueHome) { fill = COLORS.blue.bg; cornerColor = 'blue'; drawGrid = false; }
  else if (isYellowHome) { fill = COLORS.yellow.bg; cornerColor = 'yellow'; drawGrid = false; }
  
  // Colored home paths
  else if (r >= 1 && r <= 5 && c === 7) fill = COLORS.green.bg;  // Top column -> Green
  else if (r >= 9 && r <= 13 && c === 7) fill = COLORS.blue.bg;  // Bottom column -> Blue
  else if (r === 7 && c >= 1 && c <= 5) fill = COLORS.red.bg;    // Left row -> Red
  else if (r === 7 && c >= 9 && c <= 13) fill = COLORS.yellow.bg;// Right row -> Yellow

  // Start cells
  if (r === 1 && c === 8) fill = COLORS.green.bg;
  if (r === 6 && c === 1) fill = COLORS.red.bg;
  if (r === 8 && c === 13) fill = COLORS.yellow.bg;
  if (r === 13 && c === 6) fill = COLORS.blue.bg;

  ctx.fillStyle = fill;
  ctx.fillRect(x, y, cs, cs);

  // Grid lines
  if (drawGrid) {
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, cs, cs);
  } else {
    if ((r === 0 && c === 0) || (r === 0 && c === 9) || (r === 9 && c === 0) || (r === 9 && c === 9)) {
       ctx.strokeStyle = '#000';
       ctx.lineWidth = 1.5;
       ctx.strokeRect(x, y, 6*cs, 6*cs);
    }
  }

  // Home area inner square (drawn once per 6x6 block)
  if (r === 0 && c === 0) drawHomeArea(0, 0, 'red', cs);
  if (r === 0 && c === 9) drawHomeArea(0, 9, 'green', cs);
  if (r === 9 && c === 0) drawHomeArea(9, 0, 'blue', cs);
  if (r === 9 && c === 9) drawHomeArea(9, 9, 'yellow', cs);

  // Arrows on start cells
  const starts = {
    red:    [6, 1], green:  [1, 8],
    yellow: [8, 13], blue:  [13, 6]
  };
  Object.entries(starts).forEach(([col, [sr, sc]]) => {
    if (r !== sr || c !== sc) return;
    drawArrow(x + cs/2, y + cs/2, col, cs);
  });
  
  // Arrows on entrance cells
  const enters = {
    red: [7,0], green: [0,7], yellow: [7,14], blue: [14,7]
  };
  Object.entries(enters).forEach(([col, [er, ec]]) => {
    if (r !== er || c !== ec) return;
    drawArrow(x + cs/2, y + cs/2, col, cs);
  });
}

function drawArrow(x, y, color, cs) {
  // Arrow pointing right for Red, down for Green, left for Yellow, up for Blue
  ctx.fillStyle = '#000';
  ctx.beginPath();
  let size = cs * 0.18;
  if (color === 'red') { 
    ctx.moveTo(x - size, y - size); ctx.lineTo(x + size*1.5, y); ctx.lineTo(x - size, y + size);
  } else if (color === 'green') { 
    ctx.moveTo(x - size, y - size); ctx.lineTo(x, y + size*1.5); ctx.lineTo(x + size, y - size);
  } else if (color === 'yellow') { 
    ctx.moveTo(x + size, y - size); ctx.lineTo(x - size*1.5, y); ctx.lineTo(x + size, y + size);
  } else if (color === 'blue') { 
    ctx.moveTo(x - size, y + size); ctx.lineTo(x, y - size*1.5); ctx.lineTo(x + size, y + size);
  }
  ctx.fill();
}

function drawHomeArea(startR, startC, color, cs) {
  const C = COLORS[color].bg;
  const x = startC * cs;
  const y = startR * cs;
  
  const pad = cs * 1.2;
  const w = 3.6 * cs;
  
  // White card
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x + pad, y + pad, w, w);
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + pad, y + pad, w, w);

  // 4 small boxes
  ctx.fillStyle = C;
  const sz = cs * 1.0;
  const inPad = cs * 0.45;

  const bx = x + pad + inPad;
  const by = y + pad + inPad;
  const bx2 = x + pad + w - inPad - sz;
  const by2 = y + pad + w - inPad - sz;

  ctx.fillRect(bx, by, sz, sz); ctx.strokeRect(bx, by, sz, sz);
  ctx.fillRect(bx2, by, sz, sz); ctx.strokeRect(bx2, by, sz, sz);
  ctx.fillRect(bx, by2, sz, sz); ctx.strokeRect(bx, by2, sz, sz);
  ctx.fillRect(bx2, by2, sz, sz); ctx.strokeRect(bx2, by2, sz, sz);
}

/* ─── CENTER ─── */
function drawCenter(cs) {
  const ox = 6 * cs, oy = 6 * cs;
  const S  = 3 * cs;
  const mx = ox + S / 2, my = oy + S / 2;

  const triangles = [
    { color: COLORS.green.bg, pts: [[ox, oy], [ox+S, oy], [mx, my]] },        // top - green
    { color: COLORS.red.bg,   pts: [[ox, oy], [ox, oy+S], [mx, my]] },        // left - red
    { color: COLORS.blue.bg,  pts: [[ox, oy+S], [ox+S, oy+S], [mx, my]] },    // bottom - blue
    { color: COLORS.yellow.bg,pts: [[ox+S, oy], [ox+S, oy+S], [mx, my]] }     // right - yellow
  ];

  triangles.forEach(t => {
    ctx.beginPath();
    ctx.moveTo(t.pts[0][0], t.pts[0][1]);
    ctx.lineTo(t.pts[1][0], t.pts[1][1]);
    ctx.lineTo(t.pts[2][0], t.pts[2][1]);
    ctx.closePath();
    ctx.fillStyle = t.color;
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.stroke();
  });
}

/* ─── PIECE ─── */
function drawPiece(r, c, color, G, playerIdx, pieceIdx, offset = { x: 0, y: 0 }) {
  const cs = cellSize;
  const x = c * cs + cs / 2 + offset.x;
  const y = r * cs + cs / 2 + offset.y;
  const radius = cs * 0.35;
  const col = COLORS[color];

  // Flat Piece
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = col.bg;
  ctx.fill();

  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Inner ring
  ctx.beginPath();
  ctx.arc(x, y, radius * 0.6, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Number
  ctx.fillStyle = col.text;
  ctx.font = `bold ${Math.round(radius * 0.9)}px Arial, sans-serif`;
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



