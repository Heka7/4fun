export function getBestMove(game,playerIndex){

  let player = game.players[playerIndex];
  let best = 0;
  let score = -999;

  player.pieces.forEach((pos,i)=>{
    let s = 0;

    if(pos === -1 && game.dice === 6) s += 50;
    if(pos >= 0) s += pos;

    game.players.forEach((enemy,ei)=>{
      if(ei!==playerIndex){
        enemy.pieces.forEach(ep=>{
          if(ep === pos + game.dice) s += 100;
        });
      }
    });

    if(s > score){
      score = s;
      best = i;
    }
  });

  return best;
}