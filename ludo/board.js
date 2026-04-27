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
    const rect = canvas.getBoundingClientRect();
    onBoardClick({ clientX: t.clientX, clientY: t.clientY, rect });
  }, { passive: false });
}

function resizeBoard() {
  const wrapper = document.getElementById('board-wrapper');
  const maxW = Math.min(wrapper.clientWidth - 16, wrapper.clientHeight - 16, 520);
  const size = Math.max(maxW, 280);
  cellSize = Math.floor(size / 15);
  canvas.width = cellSize * 15;
  canvas.height = cellSize * 15;
  if (window.G) drawBoard();
}

function drawBoard() {
  if (!ctx) return;
  const G = window.G;
  const cs = cellSize;
  const w = cs * 15;
  const h = cs * 15;

  ctx.clearRect(0, 0, w, h);

  // خلفية
  ctx.fillStyle = '#1e2a3f';
  ctx.fillRect(0, 0, w, h);

  // رسم كل خلية
  for (let r = 0; r < 15; r++) {
    for (let c = 0; c < 15; c++) {
      drawCell(r, c, cs);
    }
  }

  // رسم القطع
  if (G) {
    G.players.forEach((pl, pi) => {
      pl.pieces.forEach((pos, idx) => {
        if (pos === -1) {
          // في البيت
          const hp = HOME_POSITIONS[pl.color][idx];
          drawPiece(hp[0], hp[1], pl.color, false, G, pi, idx);
        } else if (pos >= 57) {
          // وصلت للمنزل - لا ترسم
        } else {
          const path = PATHS[pl.color];
          if (path[pos]) {
            const [gr, gc] = path[pos];
            drawPiece(gr, gc, pl.color, pos >= 51, G, pi, idx);
          }
        }
      });
    });
  }

  // رسم تمييز القطع القابلة للتحريك
  if (G && G.movablePieces && G.movablePieces.length > 0) {
    G.movablePieces.forEach(({ playerIdx, pieceIdx }) => {
      if (playerIdx !== G.currentPlayer) return;
      const pl = G.players[playerIdx];
      const pos = pl.pieces[pieceIdx];
      let gr, gc;
      if (pos === -1) {
        [gr, gc] = HOME_POSITIONS[pl.color][pieceIdx];
      } else {
        [gr, gc] = PATHS[pl.color][pos];
      }
      const x = gc * cs + cs / 2;
      const y = gr * cs + cs / 2;
      ctx.beginPath();
      ctx.arc(x, y, cs * 0.45, 0, Math.PI * 2);
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 3;
      ctx.setLineDash([4, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
    });
  }

  // رسم المركز (المثلثات)
  drawCenter(cs);
}

function drawCell(r, c, cs) {
  const x = c * cs;
  const y = r * cs;

  // تحديد لون الخلية
  let fillColor = '#f1f5f9';

  // الأركان الملونة (بيوت اللاعبين)
  if (r <= 5 && c <= 5) fillColor = COLORS.red.bg;
  else if (r <= 5 && c >= 9) fillColor = COLORS.blue.bg;
  else if (r >= 9 && c <= 5) fillColor = COLORS.green.bg;
  else if (r >= 9 && c >= 9) fillColor = COLORS.yellow.bg;
  // ممرات ملونة
  else if (r >= 1 && r <= 5 && c === 7) fillColor = COLORS.red.light;   // ممر أحمر
  else if (r === 7 && c >= 1 && c <= 5) fillColor = COLORS.green.light; // ممر أخضر
  else if (r >= 9 && r <= 13 && c === 7) fillColor = COLORS.yellow.light;// ممر أصفر
  else if (r === 7 && c >= 9 && c <= 13) fillColor = COLORS.blue.light; // ممر أزرق

  ctx.fillStyle = fillColor;
  ctx.fillRect(x, y, cs, cs);

  // خط الشبكة
  ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  ctx.lineWidth = 0.5;
  ctx.strokeRect(x, y, cs, cs);

  // النجوم (خلايا الحماية)
  const isSafe = STAR_POSITIONS.some(([sr, sc]) => sr === r && sc === c);
  if (isSafe && !(r >= 6 && r <= 8 && c >= 6 && c <= 8)) {
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.font = `${cs * 0.55}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('★', x + cs / 2, y + cs / 2);
  }

  // نقطة البداية لكل لون
  const starts = { red: [6,1], green: [1,8], yellow: [8,13], blue: [13,6] };
  Object.entries(starts).forEach(([col, [sr, sc]]) => {
    if (r === sr && c === sc) {
      ctx.fillStyle = COLORS[col].bg;
      ctx.beginPath();
      ctx.arc(x + cs/2, y + cs/2, cs*0.35, 0, Math.PI*2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${cs*0.4}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('▶', x + cs/2, y + cs/2);
    }
  });
}

function drawCenter(cs) {
  const cx = 7 * cs;
  const cy = 7 * cs;
  const s = cs * 3;

  // رسم 4 مثلثات ملونة
  const triangles = [
    { color: COLORS.red.bg,    points: [[cx,cy],[cx+s,cy],[cx+s/2,cy+s/2]] },
    { color: COLORS.green.bg,  points: [[cx,cy],[cx,cy+s],[cx+s/2,cy+s/2]] },
    { color: COLORS.yellow.bg, points: [[cx+s,cy+s],[cx,cy+s],[cx+s/2,cy+s/2]] },
    { color: COLORS.blue.bg,   points: [[cx+s,cy],[cx+s,cy+s],[cx+s/2,cy+s/2]] }
  ];

  triangles.forEach(t => {
    ctx.beginPath();
    ctx.moveTo(t.points[0][0], t.points[0][1]);
    ctx.lineTo(t.points[1][0], t.points[1][1]);
    ctx.lineTo(t.points[2][0], t.points[2][1]);
    ctx.closePath();
    ctx.fillStyle = t.color;
    ctx.fill();
  });

  // تاج في المنتصف
  ctx.font = `${cs * 0.9}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('👑', cx + s/2, cy + s/2);
}

function drawPiece(r, c, color, inHome, G, playerIdx, pieceIdx) {
  const cs = cellSize;
  const x = c * cs + cs / 2;
  const y = r * cs + cs / 2;
  const radius = cs * 0.38;

  // ظل
  ctx.beginPath();
  ctx.arc(x + 1, y + 2, radius, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fill();

  // الجسم
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  const col = COLORS[color];
  const grad = ctx.createRadialGradient(x - radius*0.3, y - radius*0.3, 0, x, y, radius);
  grad.addColorStop(0, col.light);
  grad.addColorStop(1, col.dark);
  ctx.fillStyle = grad;
  ctx.fill();

  // حافة
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // حلقة داخلية
  ctx.beginPath();
  ctx.arc(x, y, radius * 0.55, 0, Math.PI * 2);
  ctx.strokeStyle = col.text === '#fff' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // رقم القطعة (صغير)
  ctx.fillStyle = col.text;
  ctx.font = `bold ${radius * 0.8}px Cairo, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(pieceIdx + 1, x, y);
}

function onBoardClick(e) {
  if (!window.G) return;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const col = Math.floor(x / cellSize);
  const row = Math.floor(y / cellSize);
  window.handleBoardClick(row, col);
}

function highlightPiece(r, c) {
  const cs = cellSize;
  const x = c * cs + cs / 2;
  const y = r * cs + cs / 2;
  ctx.beginPath();
  ctx.arc(x, y, cs * 0.48, 0, Math.PI * 2);
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 3;
  ctx.setLineDash([5, 3]);
  ctx.stroke();
  ctx.setLineDash([]);
}

// أيقونة النرد بالنقط
const DICE_DOTS = {
  1: [[0.5,0.5]],
  2: [[0.25,0.25],[0.75,0.75]],
  3: [[0.25,0.25],[0.5,0.5],[0.75,0.75]],
  4: [[0.25,0.25],[0.75,0.25],[0.25,0.75],[0.75,0.75]],
  5: [[0.25,0.25],[0.75,0.25],[0.5,0.5],[0.25,0.75],[0.75,0.75]],
  6: [[0.25,0.25],[0.75,0.25],[0.25,0.5],[0.75,0.5],[0.25,0.75],[0.75,0.75]]
};

function renderDiceFace(n) {
  const el = document.getElementById('dice-face');
  if (!n || n === 0) { el.innerHTML = '🎲'; return; }
  const dots = DICE_DOTS[n];
  if (!dots) { el.textContent = n; return; }
  const size = 56;
  const r = 5;
  let svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">`;
  svg += `<rect width="${size}" height="${size}" rx="8" fill="white"/>`;
  dots.forEach(([cx, cy]) => {
    svg += `<circle cx="${cx*size}" cy="${cy*size}" r="${r}" fill="#1a1a2e"/>`;
  });
  svg += '</svg>';
  el.innerHTML = svg;
}
