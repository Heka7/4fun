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
let isHost = false;
let selectedRoomSize = 3;
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
  myColorOnline = COLOR_ORDER[0]; // المضيف دايماً أول لون

  const roomData = {
    host: myOnlineId,
    size: selectedRoomSize,
    status: 'waiting',
    players: {
      [myOnlineId]: {
        name: name,
        color: myColorOnline,
        slot: 0,
        ready: false
      }
    },
    gameState: null,
    chat: null,
    createdAt: Date.now()
  };

  db.ref('ludo_rooms/' + code).set(roomData).then(() => {
    showLobby(code);
    listenLobby(code);
  }).catch(err => alert('خطأ: ' + err.message));
}

/* ===== الانضمام لغرفة ===== */
function joinRoom() {
  const name = getPlayerName();
  if (!name) return;

  const code = document.getElementById('roomCodeInput').value.trim();
  if (!code || code.length !== 5) return alert('أدخل كود صحيح (5 أرقام)');

  myOnlineId = Date.now().toString();
  isHost = false;

  db.ref('ludo_rooms/' + code).once('value', snap => {
    if (!snap.exists()) return alert('❌ الغرفة مش موجودة!');
    const room = snap.val();

    if (room.status !== 'waiting') return alert('❌ اللعبة بدأت بالفعل!');

    const players = room.players || {};
    const slots = Object.values(players).map(p => p.slot);
    let nextSlot = 0;
    while (slots.includes(nextSlot)) nextSlot++;

    if (nextSlot >= room.size) return alert('❌ الغرفة ممتلئة!');

    myColorOnline = COLOR_ORDER[nextSlot];
    onlineRoom = code;

    db.ref('ludo_rooms/' + code + '/players/' + myOnlineId).set({
      name: name,
      color: myColorOnline,
      slot: nextSlot,
      ready: false
    }).then(() => {
      showLobby(code);
      listenLobby(code);
    });
  });
}

/* ===== لوبي الانتظار ===== */
function showLobby(code) {
  showScreen('screen-lobby');
  document.getElementById('lobby-code').textContent = code;
}

function listenLobby(code) {
  if (onlineListener) onlineListener.off();

  onlineListener = db.ref('ludo_rooms/' + code);
  onlineListener.on('value', snap => {
    if (!snap.exists()) { alert('انتهت الغرفة'); showScreen('screen-menu'); return; }
    const room = snap.val();

    // تحديث قائمة اللاعبين
    const players = Object.values(room.players || {}).sort((a,b) => a.slot - b.slot);
    const lobbyEl = document.getElementById('lobby-players');
    lobbyEl.innerHTML = players.map(p => `
      <div class="lobby-player-card">
        <div class="lobby-player-color" style="background:${COLORS[p.color].bg}"></div>
        <span class="lobby-player-name">${p.name}</span>
        <span style="margin-right:auto; font-size:0.8rem; color:${p.ready ? '#22c55e' : '#94a3b8'}">
          ${p.ready ? '✅ جاهز' : '⏳ انتظار'}
        </span>
      </div>
    `).join('');

    const statusEl = document.getElementById('lobby-status');
    statusEl.textContent = `${players.length} / ${room.size} لاعبين`;

    // زر البدء (المضيف فقط)
    const startBtn = document.getElementById('start-online-btn');
    if (isHost) {
      startBtn.classList.toggle('hidden', players.length < 2);
    }

    // لو اللعبة بدأت
    if (room.status === 'playing' && room.gameState) {
      startOnlineGameFromState(room.gameState, room.players);
    }

    // الشات
    if (room.chat) updateChatMessages(room.chat);
  });
}

function copyCode() {
  navigator.clipboard.writeText(onlineRoom || '').then(() => {
    const btn = document.querySelector('.copy-btn');
    btn.textContent = '✅ تم النسخ!';
    setTimeout(() => btn.textContent = '📋 نسخ', 1500);
  }).catch(() => alert('الكود: ' + onlineRoom));
}

function leaveRoom() {
  if (onlineRoom) {
    if (isHost) {
      db.ref('ludo_rooms/' + onlineRoom).remove();
    } else {
      db.ref('ludo_rooms/' + onlineRoom + '/players/' + myOnlineId).remove();
    }
    if (onlineListener) onlineListener.off();
    onlineRoom = null;
  }
  showMenu();
}

/* ===== بدء اللعبة الأونلاين (من المضيف) ===== */
function startOnlineGame() {
  if (!isHost) return;
  db.ref('ludo_rooms/' + onlineRoom + '/players').once('value', snap => {
    const players = Object.values(snap.val() || {}).sort((a,b) => a.slot - b.slot);
    const initialState = buildInitialGameState(players.map(p => ({
      name: p.name,
      color: p.color,
      isHuman: true
    })));
    db.ref('ludo_rooms/' + onlineRoom).update({
      status: 'playing',
      gameState: initialState
    });
  });
}

function startOnlineGameFromState(state, playersData) {
  const playersObj = Object.values(playersData).sort((a,b) => a.slot - b.slot);
  window.G = JSON.parse(JSON.stringify(state));
  window.G.mode = 'online';
  window.G.myColor = myColorOnline;
  window.G.myId = myOnlineId;
  window.G.roomCode = onlineRoom;

  showScreen('screen-game');
  document.getElementById('chat-container').classList.remove('hidden');
  initBoard();
  updateHUD();
  drawBoard();
  updateGameControls();

  // استماع لتحديثات الحالة
  listenGameState();
}

/* ===== مزامنة حالة اللعبة ===== */
function pushGameState() {
  if (!onlineRoom) return;
  db.ref('ludo_rooms/' + onlineRoom + '/gameState').set(window.G);
}

function listenGameState() {
  db.ref('ludo_rooms/' + onlineRoom + '/gameState').on('value', snap => {
    if (!snap.exists()) return;
    const state = snap.val();
    if (!state) return;

    // لا تحدث لو دورك انت وانت اللي بعت
    const myColor = myColorOnline;
    const activeColor = COLOR_ORDER[state.currentPlayer];

    window.G = state;
    window.G.mode = 'online';
    window.G.myColor = myColor;
    window.G.myId = myOnlineId;
    window.G.roomCode = onlineRoom;

    drawBoard();
    updateHUD();
    updateGameControls();
    checkWinCondition();
  });

  db.ref('ludo_rooms/' + onlineRoom + '/chat').on('value', snap => {
    if (snap.exists()) updateChatMessages(snap.val());
  });
}

/* ===== الشات ===== */
function toggleChat() {
  chatOpen = !chatOpen;
  const panel = document.getElementById('chat-panel');
  panel.classList.toggle('hidden', !chatOpen);
  if (chatOpen) {
    unreadChat = 0;
    document.getElementById('chat-badge').classList.add('hidden');
    const msgs = document.getElementById('chat-messages');
    msgs.scrollTop = msgs.scrollHeight;
  }
}

function sendChat() {
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text || !onlineRoom) return;

  const name = getPlayerName();
  const msgId = Date.now().toString();

  db.ref('ludo_rooms/' + onlineRoom + '/chat/' + msgId).set({
    author: name,
    authorId: myOnlineId,
    text: text,
    t: Date.now()
  });

  input.value = '';
}

function updateChatMessages(chatData) {
  if (!chatData) return;
  const msgs = document.getElementById('chat-messages');
  const sorted = Object.values(chatData).sort((a,b) => a.t - b.t);
  msgs.innerHTML = sorted.map(m => `
    <div class="chat-msg ${m.authorId === myOnlineId ? 'mine' : ''}">
      <span class="chat-author">${m.author}:</span> ${escapeHtml(m.text)}
    </div>
  `).join('');
  msgs.scrollTop = msgs.scrollHeight;

  if (!chatOpen) {
    unreadChat++;
    const badge = document.getElementById('chat-badge');
    badge.classList.remove('hidden');
    badge.textContent = unreadChat > 9 ? '9+' : unreadChat;
  }
}

function addSystemMsg(text) {
  const msgs = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.className = 'chat-msg system';
  div.textContent = text;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

/* ===== اختيار حجم الغرفة ===== */
function selectRoomSize(btn) {
  document.querySelectorAll('.room-size-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  selectedRoomSize = parseInt(btn.dataset.size);
}

/* ===== إظهار/إخفاء أقسام الأونلاين ===== */
function showCreateRoom() {
  document.getElementById('create-room-section').classList.remove('hidden');
  document.getElementById('join-room-section').classList.add('hidden');
  document.querySelector('.online-options').classList.add('hidden');
}

function showJoinRoom() {
  document.getElementById('join-room-section').classList.remove('hidden');
  document.getElementById('create-room-section').classList.add('hidden');
  document.querySelector('.online-options').classList.add('hidden');
}
