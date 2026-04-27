export class Game {
  constructor() {
    this.players = [
      this.createPlayer("red", 0),
      this.createPlayer("blue", 13),
      this.createPlayer("green", 26),
      this.createPlayer("yellow", 39),
    ];

    this.turn = 0;
    this.dice = 0;
    this.rank = [];
  }

  createPlayer(color, start) {
    return {
      color,
      start,
      pieces: [-1,-1,-1,-1]
    };
  }

  rollDice() {
    this.dice = Math.floor(Math.random()*6)+1;
    return this.dice;
  }

  move(playerIndex, pieceIndex) {
    let p = this.players[playerIndex];
    let pos = p.pieces[pieceIndex];

    if (pos === -1 && this.dice === 6) {
      p.pieces[pieceIndex] = p.start;
    } else if (pos >= 0) {
      p.pieces[pieceIndex] += this.dice;
    }

    this.handleKill(playerIndex, pieceIndex);
    this.checkWin(playerIndex);

    if (this.dice !== 6) {
      this.turn = (this.turn + 1) % this.players.length;
    }
  }

  handleKill(playerIndex, pieceIndex) {
    let pos = this.players[playerIndex].pieces[pieceIndex];

    this.players.forEach((enemy, ei) => {
      if (ei === playerIndex) return;

      enemy.pieces.forEach((ep, epi) => {
        if (ep === pos) {
          enemy.pieces[epi] = -1;
        }
      });
    });
  }

  checkWin(playerIndex) {
    let p = this.players[playerIndex];
    if (p.pieces.every(x => x >= 51)) {
      if (!this.rank.includes(playerIndex)) {
        this.rank.push(playerIndex);
      }
    }
  }
}