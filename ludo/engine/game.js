import { SAFE_CELLS } from "./board.js";

export class Game {
  constructor(){
    this.players = [
      this.createPlayer("red",0),
      this.createPlayer("blue",13),
      this.createPlayer("green",26),
      this.createPlayer("yellow",39),
    ];

    this.turn = 0;
    this.dice = 0;
  }

  createPlayer(color,start){
    return { color, start, pieces:[-1,-1,-1,-1] };
  }

  rollDice(){
    this.dice = Math.floor(Math.random()*6)+1;
    return this.dice;
  }

  move(playerIndex,pieceIndex){
    let p = this.players[playerIndex];
    let pos = p.pieces[pieceIndex];

    if(pos === -1 && this.dice === 6){
      p.pieces[pieceIndex] = p.start;
    }
    else if(pos >= 0){
      p.pieces[pieceIndex] += this.dice;
    }

    this.kill(playerIndex,pieceIndex);

    if(this.dice !== 6){
      this.turn = (this.turn+1)%this.players.length;
    }
  }

  kill(playerIndex,pieceIndex){
    let pos = this.players[playerIndex].pieces[pieceIndex];

    this.players.forEach((pl,i)=>{
      if(i===playerIndex) return;

      pl.pieces.forEach((p,pi)=>{
        if(p===pos && !SAFE_CELLS.includes(pos)){
          pl.pieces[pi] = -1;
        }
      });
    });
  }
}