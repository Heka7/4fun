import { Game } from "../engine/game.js";

const firebaseConfig = {
  apiKey: "YOUR_KEY",
  databaseURL: "YOUR_DB"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

export function createRoom(game){
  let code = Math.floor(10000+Math.random()*90000)+"";
  db.ref("rooms/"+code).set(game);
  return code;
}

export function listenRoom(code, cb){
  db.ref("rooms/"+code).on("value", snap=>{
    if(snap.val()) cb(snap.val());
  });
}

export function sync(code, game){
  db.ref("rooms/"+code).set(game);
}