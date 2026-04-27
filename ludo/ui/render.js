import { PATH } from "../engine/board.js";

export function drawBoard(game){

  const board = document.getElementById("board");
  board.innerHTML = "";

  for(let i=0;i<225;i++){
    let cell = document.createElement("div");
    cell.className = "cell";

    game.players.forEach(p=>{
      p.pieces.forEach(pos=>{
        if(PATH[pos] === i){
          let piece = document.createElement("div");
          piece.className = "piece " + p.color;

          piece.style.transform="scale(0)";
          setTimeout(()=>{
            piece.style.transform="scale(1)";
          },50);

          cell.appendChild(piece);
        }
      });
    });

    board.appendChild(cell);
  }
}