/* ===== board.js ===== */

// الألوان - تطابق الصورة المرجعية
// TL=أزرق, TR=أحمر, BL=أصفر, BR=أخضر
const COLORS = {
  red:    { bg:'#1565C0', text:'#fff' },  // أزرق – TL
  green:  { bg:'#C62828', text:'#fff' },  // أحمر – TR
  yellow: { bg:'#F9A825', text:'#000' },  // أصفر – BL
  blue:   { bg:'#2E7D32', text:'#fff' }   // أخضر – BR
};

const COLOR_ORDER = ['red','green','yellow','blue'];

/* مسارات اللعبة الصحيحة – 52 خطوة دوران + 5 خطوات منزل = 57 */
const PATHS = {
  // red (TL) يبدأ من r=6,c=1 ويدور عكس عقارب الساعة
  red: [
    [6,1],[6,2],[6,3],[6,4],[6,5],
    [5,6],[4,6],[3,6],[2,6],[1,6],[0,6],
    [0,7],
    [0,8],[1,8],[2,8],[3,8],[4,8],[5,8],
    [6,9],[6,10],[6,11],[6,12],[6,13],[6,14],
    [7,14],
    [8,14],[8,13],[8,12],[8,11],[8,10],[8,9],
    [9,8],[10,8],[11,8],[12,8],[13,8],[14,8],
    [14,7],
    [14,6],[13,6],[12,6],[11,6],[10,6],[9,6],
    [8,5],[8,4],[8,3],[8,2],[8,1],[8,0],
    [7,0],
    [6,0],
    // ممر المنزل
    [7,1],[7,2],[7,3],[7,4],[7,5],[7,6]
  ],
  // green (TR) يبدأ من r=1,c=8
  green: [
    [1,8],[2,8],[3,8],[4,8],[5,8],
    [6,9],[6,10],[6,11],[6,12],[6,13],[6,14],
    [7,14],
    [8,14],[8,13],[8,12],[8,11],[8,10],[8,9],
    [9,8],[10,8],[11,8],[12,8],[13,8],[14,8],
    [14,7],
    [14,6],[13,6],[12,6],[11,6],[10,6],[9,6],
    [8,5],[8,4],[8,3],[8,2],[8,1],[8,0],
    [7,0],
    [6,0],[6,1],[6,2],[6,3],[6,4],[6,5],
    [5,6],[4,6],[3,6],[2,6],[1,6],[0,6],
    [0,7],
    [0,8],
    // ممر المنزل
    [1,7],[2,7],[3,7],[4,7],[5,7],[6,7]
  ],
  // yellow (BL) يبدأ من r=13,c=6
  yellow: [
    [13,6],[12,6],[11,6],[10,6],[9,6],
    [8,5],[8,4],[8,3],[8,2],[8,1],[8,0],
    [7,0],
    [6,0],[6,1],[6,2],[6,3],[6,4],[6,5],
    [5,6],[4,6],[3,6],[2,6],[1,6],[0,6],
    [0,7],
    [0,8],[1,8],[2,8],[3,8],[4,8],[5,8],
    [6,9],[6,10],[6,11],[6,12],[6,13],[6,14],
    [7,14],
    [8,14],[8,13],[8,12],[8,11],[8,10],[8,9],
    [9,8],[10,8],[11,8],[12,8],[13,8],[14,8],
    [14,7],
    [14,6],
    // ممر المنزل
    [13,7],[12,7],[11,7],[10,7],[9,7],[8,7]
  ],
  // blue (BR) يبدأ من r=8,c=13
  blue: [
    [8,13],[8,12],[8,11],[8,10],[8,9],
    [9,8],[10,8],[11,8],[12,8],[13,8],[14,8],
    [14,7],
    [14,6],[13,6],[12,6],[11,6],[10,6],[9,6],
    [8,5],[8,4],[8,3],[8,2],[8,1],[8,0],
    [7,0],
    [6,0],[6,1],[6,2],[6,3],[6,4],[6,5],
    [5,6],[4,6],[3,6],[2,6],[1,6],[0,6],
    [0,7],
    [0,8],[1,8],[2,8],[3,8],[4,8],[5,8],
    [6,9],[6,10],[6,11],[6,12],[6,13],[6,14],
    [7,14],
    [8,14],
    // ممر المنزل
    [7,13],[7,12],[7,11],[7,10],[7,9],[7,8]
  ]
};

// مواضع القطع في البيت (4 مربعات ملونة داخل كل ركن)
const HOME_POSITIONS = {
  red:    [[1,1],[1,2],[2,1],[2,2]],
  green:  [[1,11],[1,12],[2,11],[2,12]],
  yellow: [[11,1],[11,2],[12,1],[12,2]],
  blue:   [[11,11],[11,12],[12,11],[12,12]]
};

// خلايا الحماية (النجمة)
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

/* ── رسم اللوحة الرئيسي ── */
function drawBoard() {
  if (!ctx || !cellSize) return;
  const G = window.G;
  const cs = cellSize;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // خلفية بيضاء
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // رسم كل خلية
  for (let r = 0; r < 15; r++)
    for (let c = 0; c < 15; c++)
      drawCell(r, c, cs);

  // المركز
  drawCenter(cs);

  // حدود خارجية
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);

  // القطع
  if (G) {
    const cellMap = {};
    G.players.forEach((pl, pi) => {
      pl.pieces.forEach((pos, idx) => {
        if (pos >= 57) return;
        let key;
        if (pos === -1) {
          const hp = HOME_POSITIONS[pl.color][idx];
          key = `H${hp[0]}_${hp[1]}`;
        } else {
          const cell = PATHS[pl.color][pos];
          if (!cell) return;
          key = `P${cell[0]}_${cell[1]}`;
        }
        if (!cellMap[key]) cellMap[key] = [];
        cellMap[key].push({ pl, pi, idx });
      });
    });

    Object.values(cellMap).forEach(group => {
      group.forEach((item, gi) => {
        const { pl, idx } = item;
        const pos = pl.pieces[idx];
        let gr, gc;
        if (pos === -1) [gr, gc] = HOME_POSITIONS[pl.color][idx];
        else [gr, gc] = PATHS[pl.color][pos];
        drawPiece(gr, gc, pl.color, gi, group.length, idx, cs);
      });
    });

    // تمييز القطع القابلة للحركة
    if (G.movablePieces && G.movablePieces.length > 0) {
      G.movablePieces.forEach(({ playerIdx, pieceIdx }) => {
        if (playerIdx !== G.currentPlayer) return;
        const pl = G.players[playerIdx];
        const pos = pl.pieces[pieceIdx];
        let gr, gc;
        if (pos === -1) [gr, gc] = HOME_POSITIONS[pl.color][pieceIdx];
        else { const cell = PATHS[pl.color][pos]; if (!cell) return; [gr, gc] = cell; }
        // حلقة وميض ذهبية
        ctx.beginPath();
        ctx.arc(gc * cs + cs / 2, gr * cs + cs / 2, cs * 0.44, 0, Math.PI * 2);
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([5, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
      });
    }
  }
}

/* ── رسم خلية ── */
function drawCell(r, c, cs) {
  const x = c * cs, y = r * cs;

  // تحديد المنطقة
  const inRedHome    = r <= 5 && c <= 5;
  const inGreenHome  = r <= 5 && c >= 9;
  const inYellowHome = r >= 9 && c <= 5;
  const inBlueHome   = r >= 9 && c >= 9;
  const inCenter     = r >= 6 && r <= 8 && c >= 6 && c <= 8;

  // الركن الداخلي الأبيض (المربع الكبير بداخله 4 مربعات ملونة)
  const inRedInner    = r >= 1 && r <= 4 && c >= 1 && c <= 4;
  const inGreenInner  = r >= 1 && r <= 4 && c >= 10 && c <= 13;
  const inYellowInner = r >= 10 && r <= 13 && c >= 1 && c <= 4;
  const inBlueInner   = r >= 10 && r <= 13 && c >= 10 && c <= 13;

  let fill = '#ffffff';

  if (!inCenter) {
    if (inRedHome)    fill = COLORS.red.bg;
    if (inGreenHome)  fill = COLORS.green.bg;
    if (inYellowHome) fill = COLORS.yellow.bg;
    if (inBlueHome)   fill = COLORS.blue.bg;

    // المربع الداخلي الأبيض
    if (inRedInner || inGreenInner || inYellowInner || inBlueInner) fill = '#ffffff';

    // الممرات الملونة
    if (r === 7 && c >= 1 && c <= 5)  fill = COLORS.red.bg;
    if (c === 7 && r >= 1 && r <= 5)  fill = COLORS.green.bg;
    if (r === 7 && c >= 9 && c <= 13) fill = COLORS.yellow.bg;
    if (c === 7 && r >= 9 && r <= 13) fill = COLORS.blue.bg;

    // خلية البداية (أعمق لون قليلاً)
    if (r === 6 && c === 1)  fill = COLORS.red.bg;
    if (r === 1 && c === 8)  fill = COLORS.green.bg;
    if (r === 13 && c === 6) fill = COLORS.yellow.bg;
    if (r === 8 && c === 13) fill = COLORS.blue.bg;
  }

  ctx.fillStyle = fill;
  ctx.fillRect(x, y, cs, cs);
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 0.8;
  ctx.strokeRect(x, y, cs, cs);

  // المربعات الصغيرة الملونة داخل الركن الأبيض
  const homePos = [
    ...HOME_POSITIONS.red.map(p => ({p, color: COLORS.red.bg})),
    ...HOME_POSITIONS.green.map(p => ({p, color: COLORS.green.bg})),
    ...HOME_POSITIONS.yellow.map(p => ({p, color: COLORS.yellow.bg})),
    ...HOME_POSITIONS.blue.map(p => ({p, color: COLORS.blue.bg})),
  ];
  homePos.forEach(({p, color}) => {
    if (p[0] === r && p[1] === c) {
      const pad = cs * 0.08;
      ctx.fillStyle = color;
      ctx.fillRect(x + pad, y + pad, cs - pad*2, cs - pad*2);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + pad, y + pad, cs - pad*2, cs - pad*2);
    }
  });

  // النجمة (خلايا الحماية)
  if (STAR_POSITIONS.some(p => p[0] === r && p[1] === c) && !inCenter) {
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.font = `${Math.round(cs * 0.5)}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('★', x + cs/2, y + cs/2);
  }

  // الأسهم عند نقاط الدخول والبداية
  const arrowMap = [
    { r:6,  c:1,  dir:'right' }, // red start
    { r:1,  c:8,  dir:'down'  }, // green start
    { r:13, c:6,  dir:'up'    }, // yellow start
    { r:8,  c:13, dir:'left'  }, // blue start
    { r:7,  c:0,  dir:'right' }, // red entry
    { r:0,  c:7,  dir:'down'  }, // green entry
    { r:14, c:7,  dir:'up'    }, // yellow entry
    { r:7,  c:14, dir:'left'  }, // blue entry
  ];
  const arrow = arrowMap.find(a => a.r === r && a.c === c);
  if (arrow) drawArrow(x + cs/2, y + cs/2, arrow.dir, cs);
}

/* ── السهم ── */
function drawArrow(cx, cy, dir, cs) {
  const s = cs * 0.22;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  if (dir === 'right') {
    ctx.moveTo(cx - s, cy - s * 0.65);
    ctx.lineTo(cx + s, cy);
    ctx.lineTo(cx - s, cy + s * 0.65);
  } else if (dir === 'left') {
    ctx.moveTo(cx + s, cy - s * 0.65);
    ctx.lineTo(cx - s, cy);
    ctx.lineTo(cx + s, cy + s * 0.65);
  } else if (dir === 'up') {
    ctx.moveTo(cx - s * 0.65, cy + s);
    ctx.lineTo(cx, cy - s);
    ctx.lineTo(cx + s * 0.65, cy + s);
  } else if (dir === 'down') {
    ctx.moveTo(cx - s * 0.65, cy - s);
    ctx.lineTo(cx, cy + s);
    ctx.lineTo(cx + s * 0.65, cy - s);
  }
  ctx.closePath();
  ctx.fill();
}

/* ── المركز (4 مثلثات) ── */
function drawCenter(cs) {
  const ox = 6 * cs, oy = 6 * cs;
  const S = 3 * cs;
  const mx = ox + S / 2, my = oy + S / 2;

  const triangles = [
    { color: COLORS.green.bg,  pts: [[ox, oy], [ox+S, oy], [mx, my]] },     // أعلى – أحمر (green منطقياً)
    { color: COLORS.red.bg,    pts: [[ox, oy], [ox, oy+S], [mx, my]] },     // يسار – أزرق (red منطقياً)
    { color: COLORS.blue.bg,   pts: [[ox+S, oy+S],[ox, oy+S],[mx, my]] },   // أسفل – أخضر (blue منطقياً)
    { color: COLORS.yellow.bg, pts: [[ox+S, oy],[ox+S, oy+S],[mx, my]] },   // يمين – أصفر (yellow منطقياً)
  ];

  triangles.forEach(t => {
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
function drawPiece(r, c, color, stackIdx, stackTotal, pieceNum, cs) {
  const spread = cs * 0.18;
  const offsets = [
    {x:-spread, y:-spread}, {x:spread, y:-spread},
    {x:-spread,  y:spread}, {x:spread,  y:spread}
  ];
  const off = stackTotal <= 1 ? {x:0, y:0} : offsets[stackIdx % 4];

  const x = c * cs + cs/2 + off.x;
  const y = r * cs + cs/2 + off.y;
  const rad = cs * (stackTotal > 1 ? 0.28 : 0.36);
  const col = COLORS[color];

  // ظل
  ctx.beginPath();
  ctx.arc(x + 1.5, y + 2, rad, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fill();

  // جسم القطعة
  ctx.beginPath();
  ctx.arc(x, y, rad, 0, Math.PI * 2);
  ctx.fillStyle = col.bg;
  ctx.fill();
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // بريق صغير
  ctx.beginPath();
  ctx.arc(x - rad * 0.3, y - rad * 0.3, rad * 0.28, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.fill();

  // رقم
  ctx.fillStyle = col.text;
  ctx.font = `bold ${Math.round(rad * 0.9)}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(pieceNum + 1, x, y + 1);
}

/* ── النقر على اللوحة ── */
function onBoardClick(e) {
  if (!window.G) return;
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) * (canvas.width / rect.width);
  const y = (e.clientY - rect.top) * (canvas.height / rect.height);
  window.handleBoardClick(Math.floor(y / cellSize), Math.floor(x / cellSize));
}

/* ── النرد (SVG) ── */
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
