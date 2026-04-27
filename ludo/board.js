/* ===== board.js - رسم لوحة اللودو على Canvas ===== */

// ألوان الصورة الأصلية (تم تغيير المسميات لتطابق الترتيب المنطقي مع الصورة)
// الصورة: TL=Blue, TR=Red, BR=Green, BL=Yellow
// الكود المنطقي: Red=TL, Green=TR, Yellow=BR, Blue=BL
const COLORS = {
  red:    { bg:'#2e3192', light:'#5c5fc7', dark:'#1a1c54', text:'#fff', name: 'الأزرق' },   // منطقياً أحمر -> بصرياً أزرق (TL)
  green:  { bg:'#ed1c24', light:'#ff5c5c', dark:'#a30000', text:'#fff', name: 'الأحمر' },   // منطقياً أخضر -> بصرياً أحمر (TR)
  yellow: { bg:'#00a651', light:'#45d688', dark:'#006b34', text:'#fff', name: 'الأخضر' },   // منطقياً أصفر -> بصرياً أخضر (BR)
  blue:   { bg:'#fff200', light:'#ffff7a', dark:'#b5aa00', text:'#000', name: 'الأصفر' }    // منطقياً أزرق -> بصرياً أصفر (BL)
};

const COLOR_ORDER = ['red','green','yellow','blue'];

const CELL = 15;

// بناء المسارات بشكل دقيق 52 خلية دوران + 6 خلايا منزل (المجموع 57)
function generatePaths() {
  const mainPath = [];
  // الجزء العلوي الأيسر (6x3)
  for(let i=0; i<5; i++) mainPath.push([6, i]); // 0-4
  for(let i=5; i>=0; i--) mainPath.push([i, 6]); // 5-10
  mainPath.push([0, 7]); // 11 (جسر علوي)
  for(let i=0; i<=5; i++) mainPath.push([i, 8]); // 12-17
  for(let i=9; i<=14; i++) mainPath.push([6, i]); // 18-23
  mainPath.push([7, 14]); // 24 (جسر أيمن)
  for(let i=14; i>=9; i--) mainPath.push([8, i]); // 25-30
  for(let i=9; i<=14; i++) mainPath.push([i, 8]); // 31-36
  mainPath.push([14, 7]); // 37 (جسر سفلي)
  for(let i=14; i>=9; i--) mainPath.push([i, 6]); // 38-43
  for(let i=5; i>=0; i--) mainPath.push([8, i]); // 44-49
  mainPath.push([7, 0]); // 50 (جسر أيسر)
  // الخلية 51 هي البداية لتكتمل الدورة (لكن لا تستخدمها الألوان في مسارها الرئيسي)
  mainPath.push([6, 0]); // 51

  const paths = {};
  
  // Red (TL) - يبدأ من [6,1] (Index 1) وينتهي عند [7,0] (Index 50)
  paths.red = [];
  for(let i=1; i<=51; i++) paths.red.push(mainPath[i % 52]);
  for(let i=1; i<=6; i++) paths.red.push([7, i]); // ممر المنزل (7,6 هو المركز)

  // Green (TR) - يبدأ من [1,8] (Index 13) وينتهي عند [0,7] (Index 11)
  paths.green = [];
  for(let i=13; i<52+13; i++) paths.green.push(mainPath[i % 52]);
  for(let i=1; i<=6; i++) paths.green.push([i, 7]);

  // Yellow (BR) - يبدأ من [8,13] (Index 27) وينتهي عند [7,14] (Index 24)
  paths.yellow = [];
  for(let i=27; i<52+27; i++) paths.yellow.push(mainPath[i % 52]);
  for(let i=13; i>=8; i--) paths.yellow.push([7, i]);

  // Blue (BL) - يبدأ من [13,6] (Index 39) وينتهي عند [14,7] (Index 37)
  paths.blue = [];
  for(let i=39; i<52+39; i++) paths.blue.push(mainPath[i % 52]);
  for(let i=13; i>=8; i--) paths.blue.push([i, 7]);

  return paths;
}

const PATHS = generatePaths();

const HOME_POSITIONS = {
  red:    [[1,1],[1,2],[2,1],[2,2]],
  green:  [[1,11],[1,12],[2,11],[2,12]],
  yellow: [[11,11],[11,12],[12,11],[12,12]],
  blue:   [[11,1],[11,2],[12,1],[12,2]]
};

const STAR_POSITIONS = [[6,1],[1,8],[8,13],[13,6], [8,2],[1,6],[6,12],[12,8]];

let canvas, ctx, cellSize;

function initBoard() {
  canvas = document.getElementById('ludo-canvas');
  ctx = canvas.getContext('2d');
  resizeBoard();
  window.addEventListener('resize', resizeBoard);
  canvas.addEventListener('click', onBoardClick);
}

function resizeBoard() {
  const wrapper = document.getElementById('board-wrapper');
  if (!wrapper) return;
  const size = Math.min(wrapper.clientWidth - 20, wrapper.clientHeight - 20, 560);
  cellSize = Math.floor(size / 15);
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
  ctx.fillRect(0,0, canvas.width, canvas.height);

  for (let r = 0; r < 15; r++)
    for (let c = 0; c < 15; c++)
      drawCell(r, c, cs);

  drawCenter(cs);

  if (G) {
    const cellMap = {};
    G.players.forEach((pl, pi) => {
      pl.pieces.forEach((pos, idx) => {
        if (pos >= 56) return; // تم الانتهاء
        let key;
        if (pos === -1) {
          const hp = HOME_POSITIONS[pl.color][idx];
          key = `H_${hp[0]}_${hp[1]}`;
        } else {
          const cell = PATHS[pl.color][pos];
          if (!cell) return;
          key = `P_${cell[0]}_${cell[1]}`;
        }
        if (!cellMap[key]) cellMap[key] = [];
        cellMap[key].push({ pl, pi, idx });
      });
    });

    Object.values(cellMap).forEach(group => {
      group.forEach((item, gi) => {
        const { pl, pi, idx } = item;
        let gr, gc;
        const pos = pl.pieces[idx];
        if (pos === -1) [gr, gc] = HOME_POSITIONS[pl.color][idx];
        else [gr, gc] = PATHS[pl.color][pos];
        
        const offset = getStackOffset(gi, group.length, cs);
        drawPiece(gr, gc, pl.color, G, pi, idx, offset);
      });
    });

    if (G.movablePieces && G.movablePieces.length > 0) {
      G.movablePieces.forEach(({ playerIdx, pieceIdx }) => {
        if (playerIdx !== G.currentPlayer) return;
        const pl = G.players[playerIdx];
        const pos = pl.pieces[pieceIdx];
        let gr, gc;
        if (pos === -1) [gr, gc] = HOME_POSITIONS[pl.color][pieceIdx];
        else [gr, gc] = PATHS[pl.color][pos];
        
        ctx.beginPath();
        ctx.arc(gc*cs+cs/2, gr*cs+cs/2, cs*0.4, 0, Math.PI*2);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.setLineDash([4,2]);
        ctx.stroke();
        ctx.setLineDash([]);
      });
    }
  }
}

function getStackOffset(i, total, cs) {
  if (total <= 1) return {x:0, y:0};
  const spread = cs * 0.2;
  const offs = [{x:-spread,y:-spread},{x:spread,y:-spread},{x:-spread,y:spread},{x:spread,y:spread}];
  return offs[i % 4];
}

function drawCell(r, c, cs) {
  const x = c * cs, y = r * cs;
  let fill = '#fff';
  let border = '#000';

  // الركن (البيت)
  const isRedHome = r <= 5 && c <= 5;
  const isGreenHome = r <= 5 && c >= 9;
  const isYellowHome = r >= 9 && c >= 9;
  const isBlueHome = r >= 9 && c <= 5;

  if (isRedHome) fill = COLORS.red.bg;
  else if (isGreenHome) fill = COLORS.green.bg;
  else if (isYellowHome) fill = COLORS.yellow.bg;
  else if (isBlueHome) fill = COLORS.blue.bg;
  
  // الممرات الملونة
  else if (r === 7 && c >= 1 && c <= 5) fill = COLORS.red.bg;
  else if (c === 7 && r >= 1 && r <= 5) fill = COLORS.green.bg;
  else if (r === 7 && c >= 9 && c <= 13) fill = COLORS.yellow.bg;
  else if (c === 7 && r >= 9 && r <= 13) fill = COLORS.blue.bg;
  
  // خلايا البداية
  else if (r === 6 && c === 1) fill = COLORS.red.bg;
  else if (r === 1 && c === 8) fill = COLORS.green.bg;
  else if (r === 8 && c === 13) fill = COLORS.yellow.bg;
  else if (r === 13 && c === 6) fill = COLORS.blue.bg;

  ctx.fillStyle = fill;
  ctx.fillRect(x, y, cs, cs);
  ctx.strokeStyle = border;
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, cs, cs);

  // رسم المساحة البيضاء داخل البيت
  if ((isRedHome && r>=1 && r<=4 && c>=1 && c<=4) ||
      (isGreenHome && r>=1 && r<=4 && c>=10 && c<=13) ||
      (isYellowHome && r>=10 && r<=13 && c>=10 && c<=13) ||
      (isBlueHome && r>=10 && r<=13 && c>=1 && c<=4)) {
    ctx.fillStyle = '#fff';
    ctx.fillRect(x,y, cs, cs);
    ctx.strokeRect(x,y, cs, cs);
    
    // رسم المربعات الملونة الصغيرة
    const color = isRedHome ? COLORS.red.bg : (isGreenHome ? COLORS.green.bg : (isYellowHome ? COLORS.yellow.bg : COLORS.blue.bg));
    if ((r===1||r===2||r===10||r===11) && (c===1||c===2||c===10||c===11)) {
       // هذه هي أماكن HOME_POSITIONS تقريباً
    }
  }

  // رسم المربعات الصغيرة الملونة داخل المربع الأبيض
  if (HOME_POSITIONS.red.some(p => p[0]===r && p[1]===c)) { ctx.fillStyle = COLORS.red.bg; ctx.fillRect(x+cs*0.1, y+cs*0.1, cs*0.8, cs*0.8); ctx.strokeRect(x+cs*0.1, y+cs*0.1, cs*0.8, cs*0.8); }
  if (HOME_POSITIONS.green.some(p => p[0]===r && p[1]===c)) { ctx.fillStyle = COLORS.green.bg; ctx.fillRect(x+cs*0.1, y+cs*0.1, cs*0.8, cs*0.8); ctx.strokeRect(x+cs*0.1, y+cs*0.1, cs*0.8, cs*0.8); }
  if (HOME_POSITIONS.yellow.some(p => p[0]===r && p[1]===c)) { ctx.fillStyle = COLORS.yellow.bg; ctx.fillRect(x+cs*0.1, y+cs*0.1, cs*0.8, cs*0.8); ctx.strokeRect(x+cs*0.1, y+cs*0.1, cs*0.8, cs*0.8); }
  if (HOME_POSITIONS.blue.some(p => p[0]===r && p[1]===c)) { ctx.fillStyle = COLORS.blue.bg; ctx.fillRect(x+cs*0.1, y+cs*0.1, cs*0.8, cs*0.8); ctx.strokeRect(x+cs*0.1, y+cs*0.1, cs*0.8, cs*0.8); }

  // الأسهم
  const arrows = [
    {r:6, c:1, color:'#000', dir:'right'},
    {r:1, c:8, color:'#000', dir:'down'},
    {r:8, c:13, color:'#000', dir:'left'},
    {r:13, c:6, color:'#000', dir:'up'},
    // أسهم الدخول للمنزل
    {r:7, c:0, color:'#000', dir:'right'},
    {r:0, c:7, color:'#000', dir:'down'},
    {r:7, c:14, color:'#000', dir:'left'},
    {r:14, c:7, color:'#000', dir:'up'}
  ];
  const arrow = arrows.find(a => a.r === r && a.c === c);
  if (arrow) drawArrow(x+cs/2, y+cs/2, arrow.dir, cs);
}

function drawArrow(x, y, dir, cs) {
  ctx.fillStyle = '#000';
  ctx.beginPath();
  const s = cs * 0.2;
  if (dir === 'right') { ctx.moveTo(x-s, y-s); ctx.lineTo(x+s, y); ctx.lineTo(x-s, y+s); }
  else if (dir === 'left') { ctx.moveTo(x+s, y-s); ctx.lineTo(x-s, y); ctx.lineTo(x+s, y+s); }
  else if (dir === 'up') { ctx.moveTo(x-s, y+s); ctx.lineTo(x, y-s); ctx.lineTo(x+s, y+s); }
  else if (dir === 'down') { ctx.moveTo(x-s, y-s); ctx.lineTo(x, y+s); ctx.lineTo(x+s, y-s); }
  ctx.fill();
}

function drawCenter(cs) {
  const x = 6 * cs, y = 6 * cs, s = 3 * cs;
  const m = x + s/2;
  
  // Red Triangle (Left)
  ctx.fillStyle = COLORS.red.bg;
  ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(m,m); ctx.lineTo(x,y+s); ctx.fill(); ctx.stroke();
  // Green Triangle (Top)
  ctx.fillStyle = COLORS.green.bg;
  ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x+s,y); ctx.lineTo(m,m); ctx.fill(); ctx.stroke();
  // Yellow Triangle (Right)
  ctx.fillStyle = COLORS.yellow.bg;
  ctx.beginPath(); ctx.moveTo(x+s,y); ctx.lineTo(x+s,y+s); ctx.lineTo(m,m); ctx.fill(); ctx.stroke();
  // Blue Triangle (Bottom)
  ctx.fillStyle = COLORS.blue.bg;
  ctx.beginPath(); ctx.moveTo(x,y+s); ctx.lineTo(x+s,y+s); ctx.lineTo(m,m); ctx.fill(); ctx.stroke();
}

function drawPiece(r, c, color, G, playerIdx, pieceIdx, offset) {
  const cs = cellSize;
  const x = c * cs + cs/2 + offset.x;
  const y = r * cs + cs/2 + offset.y;
  const radius = cs * 0.38;
  const col = COLORS[color];

  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = col.bg;
  ctx.fill();
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = col.text;
  ctx.font = `bold ${radius}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(pieceIdx + 1, x, y);
}

function onBoardClick(e) {
  if (!window.G) return;
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) * (canvas.width / rect.width);
  const y = (e.clientY - rect.top) * (canvas.height / rect.height);
  const col = Math.floor(x / cellSize);
  const row = Math.floor(y / cellSize);
  window.handleBoardClick(row, col);
}
