/* ===== board.js ===== */

const COLORS = {
  red:    { bg:'#1565C0', text:'#fff' },
  green:  { bg:'#C62828', text:'#fff' },
  yellow: { bg:'#F9A825', text:'#000' },
  blue:   { bg:'#2E7D32', text:'#fff' }
};

const COLOR_ORDER = ['red','green','yellow','blue'];

const PATHS = {
  red: [
    [6,1],[6,2],[6,3],[6,4],[6,5],
    [5,6],[4,6],[3,6],[2,6],[1,6],[0,6],[0,7],
    [0,8],[1,8],[2,8],[3,8],[4,8],[5,8],
    [6,9],[6,10],[6,11],[6,12],[6,13],[6,14],[7,14],
    [8,14],[8,13],[8,12],[8,11],[8,10],[8,9],
    [9,8],[10,8],[11,8],[12,8],[13,8],[14,8],[14,7],
    [14,6],[13,6],[12,6],[11,6],[10,6],[9,6],
    [8,5],[8,4],[8,3],[8,2],[8,1],[8,0],[7,0],[6,0],
    [7,1],[7,2],[7,3],[7,4],[7,5],[7,6]
  ],
  green: [
    [1,8],[2,8],[3,8],[4,8],[5,8],
    [6,9],[6,10],[6,11],[6,12],[6,13],[6,14],[7,14],
    [8,14],[8,13],[8,12],[8,11],[8,10],[8,9],
    [9,8],[10,8],[11,8],[12,8],[13,8],[14,8],[14,7],
    [14,6],[13,6],[12,6],[11,6],[10,6],[9,6],
    [8,5],[8,4],[8,3],[8,2],[8,1],[8,0],[7,0],
    [6,0],[6,1],[6,2],[6,3],[6,4],[6,5],
    [5,6],[4,6],[3,6],[2,6],[1,6],[0,6],[0,7],[0,8],
    [1,7],[2,7],[3,7],[4,7],[5,7],[6,7]
  ],
  yellow: [
    [13,6],[12,6],[11,6],[10,6],[9,6],
    [8,5],[8,4],[8,3],[8,2],[8,1],[8,0],[7,0],
    [6,0],[6,1],[6,2],[6,3],[6,4],[6,5],
    [5,6],[4,6],[3,6],[2,6],[1,6],[0,6],[0,7],
    [0,8],[1,8],[2,8],[3,8],[4,8],[5,8],
    [6,9],[6,10],[6,11],[6,12],[6,13],[6,14],[7,14],
    [8,14],[8,13],[8,12],[8,11],[8,10],[8,9],
    [9,8],[10,8],[11,8],[12,8],[13,8],[14,8],[14,7],[14,6],
    [13,7],[12,7],[11,7],[10,7],[9,7],[8,7]
  ],
  blue: [
    [8,13],[8,12],[8,11],[8,10],[8,9],
    [9,8],[10,8],[11,8],[12,8],[13,8],[14,8],[14,7],
    [14,6],[13,6],[12,6],[11,6],[10,6],[9,6],
    [8,5],[8,4],[8,3],[8,2],[8,1],[8,0],[7,0],
    [6,0],[6,1],[6,2],[6,3],[6,4],[6,5],
    [5,6],[4,6],[3,6],[2,6],[1,6],[0,6],[0,7],
    [0,8],[1,8],[2,8],[3,8],[4,8],[5,8],
    [6,9],[6,10],[6,11],[6,12],[6,13],[6,14],[7,14],[8,14],
    [7,13],[7,12],[7,11],[7,10],[7,9],[7,8]
  ]
};

// مراكز القطع في البيت – بإحداثيات شبكة صحيحة
// كل خانة تمثل مركز مربع 2×2
const HOME_POSITIONS = {
  red:    [[2,2],[2,4],[4,2],[4,4]],
  green:  [[2,11],[2,13],[4,11],[4,13]],
  yellow: [[11,2],[11,4],[13,2],[13,4]],
  blue:   [[11,11],[11,13],[13,11],[13,13]]
};

const STAR_POSITIONS = [
  [6,1],[8,2],[1,6],[2,8],
  [6,11],[8,12],[11,6],[12,8],
  [13,6],[6,13],[1,8],[8,1]
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
  const size = Math.min(wrapper.clientWidth - 10, wrapper.clientHeight - 10, 560);
  cellSize = Math.floor(Math.max(size, 270) / 15);
  canvas.width = cellSize * 15;
  canvas.height = cellSize * 15;
  if (window.G) drawBoard();
}

function drawBoard() {
  if (!ctx || !cellSize) return;
  const G = window.G;
  const cs = cellSize;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // رسم الخلايا
  for (let r = 0; r < 15; r++)
    for (let c = 0; c < 15; c++)
      drawCell(r, c, cs);

  // مناطق البيت (4 مربعات كبيرة)
  drawHomeAreas(cs);

  // المركز
  drawCenter(cs);

  // حدود خارجية
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 3;
  ctx.strokeRect(1.5, 1.5, canvas.width - 3, canvas.height - 3);

  // القطع
  if (G) {
    G.players.forEach((pl) => {
      pl.pieces.forEach((pos, idx) => {
        if (pos >= 57) return;
        let r, c;
        if (pos === -1) [r, c] = HOME_POSITIONS[pl.color][idx];
        else { const cell = PATHS[pl.color][pos]; if (!cell) return; [r, c] = cell; }
        drawPiece(r, c, pl.color, idx, cs);
      });
    });

    // تمييز القطع المتاحة
    if (G.movablePieces && G.movablePieces.length > 0) {
      G.movablePieces.forEach(({ playerIdx, pieceIdx }) => {
        if (playerIdx !== G.currentPlayer) return;
        const pl = G.players[playerIdx];
        const pos = pl.pieces[pieceIdx];
        let r, c;
        if (pos === -1) [r, c] = HOME_POSITIONS[pl.color][pieceIdx];
        else { const cell = PATHS[pl.color][pos]; if (!cell) return; [r, c] = cell; }
        ctx.beginPath();
        ctx.arc(c * cs, r * cs, cs * 0.52, 0, Math.PI * 2);
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
      });
    }
  }
}

/* ── منطقة البيت: 4 مربعات ملونة كبيرة ── */
function drawHomeAreas(cs) {
  // كل ركن: origin (r0,c0) = الخلية [0,0] في الزاوية
  const defs = [
    { color: 'red',    r0: 0, c0: 0 },
    { color: 'green',  r0: 0, c0: 9 },
    { color: 'yellow', r0: 9, c0: 0 },
    { color: 'blue',   r0: 9, c0: 9 },
  ];

  defs.forEach(({ color, r0, c0 }) => {
    const C = COLORS[color];
    // المربع الأبيض الداخلي: 4×4 خلايا تبدأ من (r0+1, c0+1)
    const wx = (c0 + 1) * cs;
    const wy = (r0 + 1) * cs;
    const wSize = 4 * cs;

    ctx.fillStyle = '#fff';
    ctx.fillRect(wx, wy, wSize, wSize);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.strokeRect(wx, wy, wSize, wSize);

    // 4 مربعات ملونة – كل واحد 2×2 خلية
    [[0,0],[0,2],[2,0],[2,2]].forEach(([dr, dc]) => {
      const pad = cs * 0.12;
      const sx = wx + dc * cs + pad;
      const sy = wy + dr * cs + pad;
      const sw = 2 * cs - pad * 2;

      ctx.fillStyle = C.bg;
      roundRect(sx, sy, sw, sw, cs * 0.22);
      ctx.fill();

      ctx.strokeStyle = 'rgba(0,0,0,0.45)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // لمعة داخلية
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      roundRect(sx + sw * 0.1, sy + sw * 0.08, sw * 0.55, sw * 0.3, cs * 0.12);
      ctx.fill();
    });
  });
}

/* ── رسم خلية ── */
function drawCell(r, c, cs) {
  const x = c * cs, y = r * cs;
  const inCenter = r >= 6 && r <= 8 && c >= 6 && c <= 8;

  const isRedHome    = r <= 5 && c <= 5;
  const isGreenHome  = r <= 5 && c >= 9;
  const isYellowHome = r >= 9 && c <= 5;
  const isBlueHome   = r >= 9 && c >= 9;

  const isRedInner    = r >= 1 && r <= 4 && c >= 1 && c <= 4;
  const isGreenInner  = r >= 1 && r <= 4 && c >= 10 && c <= 13;
  const isYellowInner = r >= 10 && r <= 13 && c >= 1 && c <= 4;
  const isBlueInner   = r >= 10 && r <= 13 && c >= 10 && c <= 13;

  let fill = '#fff';

  if (!inCenter) {
    if (isRedHome)    fill = COLORS.red.bg;
    if (isGreenHome)  fill = COLORS.green.bg;
    if (isYellowHome) fill = COLORS.yellow.bg;
    if (isBlueHome)   fill = COLORS.blue.bg;
    if (isRedInner || isGreenInner || isYellowInner || isBlueInner) fill = '#fff';

    // ممرات المنزل
    if (r === 7 && c >= 1 && c <= 5)  fill = COLORS.red.bg;
    if (c === 7 && r >= 1 && r <= 5)  fill = COLORS.green.bg;
    if (r === 7 && c >= 9 && c <= 13) fill = COLORS.yellow.bg;
    if (c === 7 && r >= 9 && r <= 13) fill = COLORS.blue.bg;

    // خلايا البداية
    if (r === 6 && c === 1)  fill = COLORS.red.bg;
    if (r === 1 && c === 8)  fill = COLORS.green.bg;
    if (r === 13 && c === 6) fill = COLORS.yellow.bg;
    if (r === 8 && c === 13) fill = COLORS.blue.bg;
  }

  ctx.fillStyle = fill;
  ctx.fillRect(x, y, cs, cs);
  ctx.strokeStyle = '#888';
  ctx.lineWidth = 0.5;
  ctx.strokeRect(x, y, cs, cs);

  // نجمة الحماية
  if (STAR_POSITIONS.some(p => p[0] === r && p[1] === c) && !inCenter) {
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.font = `${Math.round(cs * 0.48)}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('★', x + cs / 2, y + cs / 2);
  }

  // الأسهم
  const arrowMap = [
    { r:6,  c:1,  dir:'right' },
    { r:1,  c:8,  dir:'down'  },
    { r:13, c:6,  dir:'up'    },
    { r:8,  c:13, dir:'left'  },
    { r:7,  c:0,  dir:'right' },
    { r:0,  c:7,  dir:'down'  },
    { r:14, c:7,  dir:'up'    },
    { r:7,  c:14, dir:'left'  },
  ];
  const arrow = arrowMap.find(a => a.r === r && a.c === c);
  if (arrow) drawArrow(x + cs / 2, y + cs / 2, arrow.dir, cs);
}

function drawArrow(cx, cy, dir, cs) {
  const s = cs * 0.22;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  if (dir === 'right') {
    ctx.moveTo(cx - s, cy - s * 0.6); ctx.lineTo(cx + s, cy); ctx.lineTo(cx - s, cy + s * 0.6);
  } else if (dir === 'left') {
    ctx.moveTo(cx + s, cy - s * 0.6); ctx.lineTo(cx - s, cy); ctx.lineTo(cx + s, cy + s * 0.6);
  } else if (dir === 'up') {
    ctx.moveTo(cx - s * 0.6, cy + s); ctx.lineTo(cx, cy - s); ctx.lineTo(cx + s * 0.6, cy + s);
  } else if (dir === 'down') {
    ctx.moveTo(cx - s * 0.6, cy - s); ctx.lineTo(cx, cy + s); ctx.lineTo(cx + s * 0.6, cy - s);
  }
  ctx.closePath();
  ctx.fill();
}

/* ── المركز ── */
function drawCenter(cs) {
  const ox = 6 * cs, oy = 6 * cs, S = 3 * cs;
  const mx = ox + S / 2, my = oy + S / 2;

  [
    { color: COLORS.green.bg,  pts: [[ox,oy],[ox+S,oy],[mx,my]] },
    { color: COLORS.red.bg,    pts: [[ox,oy],[ox,oy+S],[mx,my]] },
    { color: COLORS.blue.bg,   pts: [[ox+S,oy+S],[ox,oy+S],[mx,my]] },
    { color: COLORS.yellow.bg, pts: [[ox+S,oy],[ox+S,oy+S],[mx,my]] },
  ].forEach(t => {
    ctx.beginPath();
    ctx.moveTo(t.pts[0][0], t.pts[0][1]);
    ctx.lineTo(t.pts[1][0], t.pts[1][1]);
    ctx.lineTo(t.pts[2][0], t.pts[2][1]);
    ctx.closePath();
    ctx.fillStyle = t.color;
    ctx.fill();
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1;
    ctx.stroke();
  });
}

/* ── القطعة ── */
function drawPiece(r, c, color, pieceNum, cs) {
  // r,c هي مراكز الشبكة – الإحداثيات الحقيقية هي r*cs, c*cs
  const x = c * cs;
  const y = r * cs;
  const rad = cs * 0.38;
  const col = COLORS[color];

  // ظل
  ctx.beginPath();
  ctx.arc(x + 2, y + 2.5, rad, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fill();

  // جسم
  ctx.beginPath();
  ctx.arc(x, y, rad, 0, Math.PI * 2);
  ctx.fillStyle = col.bg;
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.6)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // حلقة داخلية
  ctx.beginPath();
  ctx.arc(x, y, rad * 0.62, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // بريق
  ctx.beginPath();
  ctx.arc(x - rad * 0.3, y - rad * 0.3, rad * 0.28, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.fill();

  // رقم
  ctx.fillStyle = col.text;
  ctx.font = `bold ${Math.round(rad * 0.95)}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(pieceNum + 1, x, y + 1);
}

/* ── roundRect ── */
function roundRect(x, y, w, h, r) {
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

/* ── النقر ── */
function onBoardClick(e) {
  if (!window.G) return;
  const rect = canvas.getBoundingClientRect();
  const px = (e.clientX - rect.left) * (canvas.width / rect.width);
  const py = (e.clientY - rect.top) * (canvas.height / rect.height);
  // float row/col للتوافق مع HOME_POSITIONS و PATHS
  window.handleBoardClick(py / cellSize, px / cellSize);
}

/* ── النرد ── */
const DICE_DOTS = {
  1: [[.5,.5]],
  2: [[.25,.25],[.75,.75]],
  3: [[.25,.25],[.5,.5],[.75,.75]],
  4: [[.25,.25],[.75,.25],[.25,.75],[.75,.75]],
  5: [[.25,.25],[.75,.25],[.5,.5],[.25,.75],[.75,.75]],
  6: [[.25,.22],[.75,.22],[.25,.5],[.75,.5],[.25,.78],[.75,.78]]
};

function renderDiceFace(n) {
  const el = document.getElementById('dice-face');
  if (!el) return;
  if (!n || n === 0) { el.innerHTML = '🎲'; return; }
  const dots = DICE_DOTS[n];
  if (!dots) { el.textContent = n; return; }
  const sz = 56, dr = Math.round(sz * 0.09);
  let svg = `<svg width="${sz}" height="${sz}" viewBox="0 0 ${sz} ${sz}" xmlns="http://www.w3.org/2000/svg">`;
  svg += `<rect width="${sz}" height="${sz}" rx="8" fill="white" stroke="#ccc" stroke-width="1"/>`;
  dots.forEach(([cx, cy]) => {
    svg += `<circle cx="${Math.round(cx*sz)}" cy="${Math.round(cy*sz)}" r="${dr}" fill="#1a1a2e"/>`;
  });
  svg += '</svg>';
  el.innerHTML = svg;
}
