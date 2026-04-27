/* ===== ai.js - ذكاء اصطناعي اللودو ===== */

/*
  استراتيجية الذكاء الاصطناعي:
  - سهل: عشوائي تماماً
  - متوسط: يفضل القتل والخروج والتقدم
  - صعب: تقييم كامل للموقف
*/

function aiChoosePiece(G, playerIdx, dice) {
  const pl = G.players[playerIdx];
  const movable = getMovablePieces(G, playerIdx, dice);
  if (movable.length === 0) return -1;
  if (movable.length === 1) return movable[0];

  const diff = G.aiDifficulty || 'medium';

  if (diff === 'easy') {
    return movable[Math.floor(Math.random() * movable.length)];
  }

  // تقييم كل قطعة
  let best = -1;
  let bestScore = -Infinity;

  movable.forEach(pieceIdx => {
    const score = evalMove(G, playerIdx, pieceIdx, dice, diff);
    if (score > bestScore) {
      bestScore = score;
      best = pieceIdx;
    }
  });

  return best;
}

function evalMove(G, playerIdx, pieceIdx, dice, diff) {
  const pl = G.players[playerIdx];
  const path = PATHS[pl.color];
  const pos = pl.pieces[pieceIdx];
  let score = 0;

  // الخروج من البيت بـ 6
  if (pos === -1 && dice === 6) {
    score += 80;
    // لو في لاعب عدو على نقطة البداية
    const startCell = path[0];
    if (isEnemyAt(G, playerIdx, startCell[0], startCell[1])) score += 50;
    return score;
  }

  if (pos === -1) return -1000; // مستحيل

  const newPos = pos + dice;
  const totalPath = path.length;

  // وصول للمنزل
  if (newPos === totalPath - 1) { score += 200; return score; }
  if (newPos > totalPath - 1) return -1000; // تجاوز

  // الخلية الجديدة
  const [nr, nc] = path[newPos];

  // قتل لاعب آخر
  if (canKill(G, playerIdx, nr, nc)) score += 120;

  // الهروب من خطر
  if (isInDanger(G, playerIdx, pos) && !isSafeCell(nr, nc)) score += 30;

  // التقدم
  score += (newPos / (totalPath - 1)) * 60;

  // دخول مسار المنزل (الملون)
  if (newPos >= 51) score += 40;

  // الوصول لخلية آمنة
  if (isSafeCell(nr, nc)) score += 25;

  // لا تتحرك للأمام وتخلي لاعب خلفك يضربك (صعب فقط)
  if (diff === 'hard') {
    if (isInDangerAfterMove(G, playerIdx, newPos)) score -= 20;
  }

  return score;
}

function getMovablePieces(G, playerIdx, dice) {
  const pl = G.players[playerIdx];
  const path = PATHS[pl.color];
  const movable = [];

  pl.pieces.forEach((pos, idx) => {
    if (pos >= 57) return; // وصلت
    if (pos === -1 && dice !== 6) return; // في البيت وما طلع 6
    if (pos === -1 && dice === 6) { movable.push(idx); return; }

    const newPos = pos + dice;
    if (newPos <= path.length - 1) movable.push(idx);
  });

  return movable;
}

function canKill(G, playerIdx, r, c) {
  if (isSafeCell(r, c)) return false;
  return G.players.some((pl, i) => {
    if (i === playerIdx) return false;
    return pl.pieces.some(pos => {
      if (pos < 0 || pos >= 57) return false;
      const [pr, pc] = PATHS[pl.color][pos] || [null, null];
      return pr === r && pc === c;
    });
  });
}

function isEnemyAt(G, playerIdx, r, c) {
  return G.players.some((pl, i) => {
    if (i === playerIdx) return false;
    return pl.pieces.some(pos => {
      if (pos < 0 || pos >= 57) return false;
      const cell = PATHS[pl.color][pos];
      return cell && cell[0] === r && cell[1] === c;
    });
  });
}

function isSafeCell(r, c) {
  return STAR_POSITIONS.some(([sr, sc]) => sr === r && sc === c);
}

function isInDanger(G, playerIdx, pos) {
  if (pos < 0 || pos >= 52) return false;
  const pl = G.players[playerIdx];
  const [r, c] = PATHS[pl.color][pos];
  if (isSafeCell(r, c)) return false;
  // هل هناك لاعب يمكنه الوصول لهذه الخلية؟
  return G.players.some((opl, i) => {
    if (i === playerIdx) return false;
    return opl.pieces.some(opos => {
      if (opos < 0 || opos >= 52) return false;
      for (let d = 1; d <= 6; d++) {
        const np = opos + d;
        if (np < PATHS[opl.color].length) {
          const cell = PATHS[opl.color][np];
          if (cell && cell[0] === r && cell[1] === c) return true;
        }
      }
      return false;
    });
  });
}

function isInDangerAfterMove(G, playerIdx, newPos) {
  if (newPos >= 51) return false;
  const pl = G.players[playerIdx];
  const [r, c] = PATHS[pl.color][newPos];
  if (isSafeCell(r, c)) return false;
  return G.players.some((opl, i) => {
    if (i === playerIdx) return false;
    return opl.pieces.some(opos => {
      if (opos < 0 || opos >= 52) return false;
      for (let d = 1; d <= 6; d++) {
        const np = opos + d;
        if (np < PATHS[opl.color].length) {
          const cell = PATHS[opl.color][np];
          if (cell && cell[0] === r && cell[1] === c) return true;
        }
      }
      return false;
    });
  });
}
