import { Game } from "./engine/game.js";
import { getBestMove } from "./engine/ai.js";
import { drawBoard } from "./ui/render.js";
import { playDice } from "./ui/sound.js";

let game = new Game();

function update(){
  drawBoard(game);
  document.getElementById("dice").innerText = game.dice;
}

window.rollDice = function(){

  playDice();

  game.rollDice();

  // اللاعب
  game.move(0,0);

  // AI
  if(game.turn === 1){
    let move = getBestMove(game,1);
    setTimeout(()=>{
      game.rollDice();
      game.move(1,move);
      update();
    },600);
  }

  update();
};

update();