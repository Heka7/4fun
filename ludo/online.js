/* ===== online.js - Firebase & Chat ===== */

const firebaseConfig = {
  apiKey: "AIzaSyCp9_P3K__Sr76iKgaVG1iD4NluUqPtni4",
  authDomain: "heka-codenames.firebaseapp.com",
  databaseURL: "https://heka-codenames-default-rtdb.firebaseio.com",
  projectId: "heka-codenames",
  storageBucket: "heka-codenames.firebasestorage.app",
  messagingSenderId: "901713932504",
  appId: "1:901713932504:web:b6710ddf537cd3c7c4e7ad"
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let onlineRoom = null;
let onlineListener = null;
let myOnlineId = null;
let myColorOnline = null;
let mySlotOnline = null;
let isHost = false;
let selectedRoomSize = 4;
let chatOpen = false;
let unreadChat = 0;

/* ===== إنشاء غرفة ===== */
function createRoom() {
  const name = getPlayerName();
  if (!name) return;
  const code = Math.floor(10000 + Math.random() * 90000).toString();
  myOnlineId = Date.now().toString();
  isHost = true;
  onlineRoom = code;
  myColorOnline = COLOR_ORDER[0];
  mySlotOnline = 0;

  const roomData = {
    host: myOnlineId,
    size: selectedRoomSize,
    status: 'waiting',
    players: { [myOnlineId]: { name, color: myColorOnline, slot: 0 } },
    gameState: null,
    chat: null,
    createdAt: Date.now()
  };

  db.ref('ludo_rooms/' + code).set(roomData).then(() => {
    showLobby(code);
    listenLobby(code);
    setupDisconnect(code);
  });
}

/* ===== الانضمام لغرفة ===== */
function joinRoom() {
  const name = getPlayerName();
  if (!name) return;
  const code = document.getElementById('roomCodeInput').value.trim();
  if (!code || code.length !== 5) return alert('كود غير صحيح');
  myOnlineId = Date.now().toString();
  isHost = false;

  db.ref('ludo_rooms/' + code).once('value', snap => {
    if (!snap.exists()) return alert('الغرفة غير موجودة');
    const room = snap.val();
    const players = room.players || {};
    
    // محاولة البحث عن مكان فارغ أو العودة لمكاني إذا كنت قد خرجت واللعبة بدأت
    let slot = -1;
    if (room.status === 'playing' && room.gameState) {
      // البحث عن أول "بوت" (لاعب خرج) ليحل محله اللاعب العائد
      slot = room.gameState.players.findIndex(p => !p.isHuman);
      if (slot === -1) return alert('اللعبة بدأت ولا توجد أماكن');
    } else {
      const occupiedSlots = Object.values(players).map(p => p.slot);
      slot = 0; while(occupiedSlots.includes(slot)) slot++;
      if (slot >= room.size) return alert('الغرفة ممتلئة');
    }

    mySlotOnline = slot;
    myColorOnline = COLOR_ORDER[slot];
    onlineRoom = code;

    db.ref('ludo_rooms/' + code + '/players/' + myOnlineId).set({
      name: name, color: myColorOnline, slot: slot
    }).then(() => {
      showLobby(code);
      listenLobby(code);
      setupDisconnect(code);
      // إذا كانت اللعبة بدأت، أعلن أنني عدت إنسان
      if (room.status === 'playing') {
        db.ref('ludo_rooms/' + code + '/gameState/players/' + slot + '/isHuman').set(true);
        db.ref('ludo_rooms/' + code + '/gameState/players/' + slot + '/name').set(name);
      }
    });
  });
}

function setupDisconnect(code) {
  const pRef = db.ref('ludo_rooms/' + code + '/players/' + myOnlineId);
  pRef.onDisconnect().remove();
  
  // إذا بدأت اللعبة، اجعلني بوت عند الخروج فوراً
  const hRef = db.ref('ludo_rooms/' + code + '/gameState/players/' + mySlotOnline + '/isHuman');
  hRef.onDisconnect().set(false);
}

function listenLobby(code) {
  if (onlineListener) onlineListener.off();
  onlineListener = db.ref('ludo_rooms/' + code);
  onlineListener.on('value', snap => {
    if (!snap.exists()) { if(onlineRoom) alert('انتهت الغرفة'); showMenu(); return; }
    const room = snap.val();
    const players = Object.values(room.players || {}).sort((a,b) => a.slot - b.slot);
    
    document.getElementById('lobby-players').innerHTML = players.map(p => `
      <div class="lobby-player-card">
        <div class="lobby-player-color" style="background:${COLORS[p.color].bg}"></div>
        <span class="lobby-player-name">${p.name}</span>
      </div>
    `).join('');
    
    document.getElementById('lobby-status').textContent = `${players.length} / ${room.size} لاعبين`;
    const startBtn = document.getElementById('start-online-btn');
    if (isHost) startBtn.classList.toggle('hidden', players.length < 2);

    if (room.status === 'playing' && room.gameState) {
      if (!window.G) startOnlineGameFromState(room.gameState, room.players);
    }
    if (room.chat) updateChatMessages(room.chat);
  });
}

function startOnlineGame() {
  if (!isHost) return;
  db.ref('ludo_rooms/' + onlineRoom + '/players').once('value', snap => {
    const players = Object.values(snap.val() || {}).sort((a,b) => a.slot - b.slot);
    const pDefs = [];
    for(let i=0; i<selectedRoomSize; i++) {
      const p = players.find(x => x.slot === i);
      pDefs.push({
        name: p ? p.name : `بوت ${i+1}`,
        color: COLOR_ORDER[i],
        isHuman: !!p
      });
    }
    const initialState = buildInitialGameState(pDefs);
    db.ref('ludo_rooms/' + onlineRoom).update({ status: 'playing', gameState: initialState });
  });
}

function startOnlineGameFromState(state, playersData) {
  window.G = state;
  window.G.mode = 'online';
  window.G.myColor = myColorOnline;
  window.G.mySlot = mySlotOnline;
  window.G.roomCode = onlineRoom;

  showScreen('screen-game');
  document.getElementById('chat-container').classList.remove('hidden');
  initBoard(); updateHUD(); drawBoard(); updateGameControls(); startTimer();
  listenGameState();
}

function pushGameState() {
  if (!onlineRoom || !window.G) return;
  db.ref('ludo_rooms/' + onlineRoom + '/gameState').set(window.G);
}

function listenGameState() {
  db.ref('ludo_rooms/' + onlineRoom + '/gameState').on('value', snap => {
    const state = snap.val(); if (!state) return;
    
    // مزامنة حالة "الإنسان" محلياً
    const oldPlayer = window.G ? window.G.currentPlayer : -1;
    window.G = state;
    window.G.mode = 'online';
    window.G.myColor = myColorOnline;
    window.G.mySlot = mySlotOnline;
    window.G.roomCode = onlineRoom;

    drawBoard(); updateHUD(); updateGameControls();
    if (state.currentPlayer !== oldPlayer) startTimer();
    checkWinCondition();
  });
  db.ref('ludo_rooms/' + onlineRoom + '/chat').on('value', snap => {
    if (snap.exists()) updateChatMessages(snap.val());
  });
}

function leaveRoom() {
  if (onlineRoom) {
    if (isHost) db.ref('ludo_rooms/' + onlineRoom).remove();
    else db.ref('ludo_rooms/' + onlineRoom + '/players/' + myOnlineId).remove();
    if (onlineListener) onlineListener.off();
    onlineRoom = null;
  }
  showMenu();
}

function sendChat() {
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text || !onlineRoom) return;
  db.ref('ludo_rooms/' + onlineRoom + '/chat/' + Date.now()).set({
    author: getPlayerName(), authorId: myOnlineId, text, t: Date.now()
  });
  input.value = '';
}

function updateChatMessages(chatData) {
  const msgs = document.getElementById('chat-messages');
  const sorted = Object.values(chatData).sort((a,b) => a.t - b.t);
  msgs.innerHTML = sorted.map(m => `
    <div class="chat-msg ${m.authorId === myOnlineId ? 'mine' : ''}">
      <span class="chat-author">${m.author}:</span> ${m.text}
    </div>
  `).join('');
  msgs.scrollTop = msgs.scrollHeight;
}

function copyCode() {
  navigator.clipboard.writeText(onlineRoom).then(() => alert('تم النسخ: ' + onlineRoom));
}

function selectRoomSize(btn) {
  document.querySelectorAll('.room-size-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  selectedRoomSize = parseInt(btn.dataset.size);
}
