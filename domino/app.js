// app.js
let currentUser = {
    id: localStorage.getItem('domino_user_id') || 'user_' + Math.random().toString(36).substr(2, 9),
    name: localStorage.getItem('domino_user_name') || ''
};
localStorage.setItem('domino_user_id', currentUser.id);

let currentRoom = null;
let isHost = false;
let gameListeners = [];
let players = {};
let myHand = [];
let gameState = null;
let boardTiles = [];

// DOM Elements
const screens = {
    lobby: document.getElementById('lobby-screen'),
    room: document.getElementById('room-screen'),
    game: document.getElementById('game-screen'),
    result: document.getElementById('result-screen')
};

function showScreen(screenName) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[screenName].classList.add('active');
}

// Helpers
function showToast(msg) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 3000);
}

function generateRoomCode() {
    return Math.random().toString(36).substring(2, 6).toUpperCase();
}

// Generate Domino Set
function generateTiles(playerCount) {
    let tiles = [];
    for (let i = 0; i <= 6; i++) {
        for (let j = i; j <= 6; j++) {
            // Remove 0-0 for 3 players
            if (playerCount === 3 && i === 0 && j === 0) continue;
            tiles.push({ left: i, right: j, id: `${i}-${j}` });
        }
    }
    // Shuffle
    for (let i = tiles.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
    }
    return tiles;
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    const nameInput = document.getElementById('player-name');
    nameInput.value = currentUser.name;
    nameInput.addEventListener('input', (e) => {
        currentUser.name = e.target.value.trim();
        localStorage.setItem('domino_user_name', currentUser.name);
    });

    // Create Room
    document.getElementById('btn-create-room').addEventListener('click', async () => {
        if (!currentUser.name) return showToast('يرجى إدخال اسمك أولاً');
        const roomId = generateRoomCode();
        currentRoom = roomId;
        isHost = true;
        
        await window.firebaseSet(window.firebaseRef(window.firebaseDB, `rooms/${roomId}`), {
            status: 'waiting',
            host: currentUser.id,
            createdAt: Date.now()
        });

        joinRoom(roomId);
    });

    // Join Room
    document.getElementById('btn-join-room').addEventListener('click', () => {
        if (!currentUser.name) return showToast('يرجى إدخال اسمك أولاً');
        const roomId = document.getElementById('room-code-input').value.toUpperCase().trim();
        if (!roomId) return showToast('أدخل كود الغرفة');
        
        // Check if room exists
        window.firebaseGet(window.firebaseRef(window.firebaseDB, `rooms/${roomId}`)).then((snapshot) => {
            if (snapshot.exists() && snapshot.val().status === 'waiting') {
                isHost = snapshot.val().host === currentUser.id;
                joinRoom(roomId);
            } else {
                showToast('الغرفة غير موجودة أو اللعبة بدأت بالفعل');
            }
        });
    });

    // Leave Room
    document.getElementById('btn-leave-room').addEventListener('click', leaveRoom);

    // Start Game
    document.getElementById('btn-start-game').addEventListener('click', startGame);

    // Chat
    document.getElementById('btn-room-chat-send').addEventListener('click', () => sendChat('room'));
    document.getElementById('room-chat-input').addEventListener('keypress', (e) => e.key === 'Enter' && sendChat('room'));
    
    document.getElementById('btn-game-chat-send').addEventListener('click', () => sendChat('game'));
    document.getElementById('game-chat-input').addEventListener('keypress', (e) => e.key === 'Enter' && sendChat('game'));

    // Sidebar
    document.getElementById('btn-game-menu').addEventListener('click', () => {
        document.getElementById('game-sidebar').classList.add('open');
    });
    document.getElementById('btn-close-sidebar').addEventListener('click', () => {
        document.getElementById('game-sidebar').classList.remove('open');
    });
});

function joinRoom(roomId) {
    currentRoom = roomId;
    document.getElementById('display-room-code').textContent = roomId;
    showScreen('room');

    const playerRef = window.firebaseRef(window.firebaseDB, `rooms/${roomId}/players/${currentUser.id}`);
    window.firebaseSet(playerRef, {
        name: currentUser.name,
        isHost: isHost,
        connected: true
    });
    window.firebaseOnDisconnect(playerRef).remove();

    listenToRoom(roomId);
}

function leaveRoom() {
    if (currentRoom) {
        const playerRef = window.firebaseRef(window.firebaseDB, `rooms/${currentRoom}/players/${currentUser.id}`);
        window.firebaseRemove(playerRef);
        clearListeners();
        currentRoom = null;
        isHost = false;
        showScreen('lobby');
    }
}

function clearListeners() {
    gameListeners.forEach(unsubscribe => unsubscribe());
    gameListeners = [];
}

function listenToRoom(roomId) {
    clearListeners();
    
    // Listen to players
    const playersRef = window.firebaseRef(window.firebaseDB, `rooms/${roomId}/players`);
    const unsubPlayers = window.firebaseOnValue(playersRef, (snapshot) => {
        players = snapshot.val() || {};
        updatePlayersList();
    });
    gameListeners.push(unsubPlayers);

    // Listen to room status
    const statusRef = window.firebaseRef(window.firebaseDB, `rooms/${roomId}/status`);
    const unsubStatus = window.firebaseOnValue(statusRef, (snapshot) => {
        const status = snapshot.val();
        if (status === 'playing') {
            initGameUI();
        } else if (status === 'finished') {
            showScreen('result');
        } else if (!status) {
            // Room closed
            leaveRoom();
            showToast('تم إغلاق الغرفة');
        }
    });
    gameListeners.push(unsubStatus);

    // Listen to chat
    const chatRef = window.firebaseRef(window.firebaseDB, `rooms/${roomId}/chat`);
    const unsubChat = window.firebaseOnValue(chatRef, (snapshot) => {
        const messages = snapshot.val() || {};
        updateChat(messages);
    });
    gameListeners.push(unsubChat);

    // Listen to Game State
    const gameStateRef = window.firebaseRef(window.firebaseDB, `rooms/${roomId}/gameState`);
    const unsubGameState = window.firebaseOnValue(gameStateRef, (snapshot) => {
        if (snapshot.exists()) {
            gameState = snapshot.val();
            updateGameUI();
        }
    });
    gameListeners.push(unsubGameState);
}

function updatePlayersList() {
    const list = document.getElementById('players-list');
    list.innerHTML = '';
    const playerIds = Object.keys(players);
    document.getElementById('players-count').textContent = playerIds.length;

    playerIds.forEach(id => {
        const p = players[id];
        const li = document.createElement('li');
        li.className = 'player-item';
        li.innerHTML = `<span>${p.name} ${id === currentUser.id ? '(أنت)' : ''}</span> 
                        ${p.isHost ? '<span class="host-badge">قائد</span>' : ''}`;
        list.appendChild(li);
    });

    if (isHost) {
        const startBtn = document.getElementById('btn-start-game');
        const waitMsg = document.getElementById('waiting-host-msg');
        startBtn.classList.remove('hidden');
        waitMsg.classList.add('hidden');
        // Only allow start if 2, 3, or 4 players
        startBtn.disabled = playerIds.length < 2 || playerIds.length > 4;
    }
}

function sendChat(type) {
    const input = document.getElementById(`${type}-chat-input`);
    const text = input.value.trim();
    if (!text || !currentRoom) return;

    window.firebasePush(window.firebaseRef(window.firebaseDB, `rooms/${currentRoom}/chat`), {
        senderId: currentUser.id,
        senderName: currentUser.name,
        text: text,
        timestamp: Date.now()
    });
    input.value = '';
}

function updateChat(messages) {
    const msgsArray = Object.values(messages).sort((a, b) => a.timestamp - b.timestamp);
    
    const updateContainer = (containerId) => {
        const container = document.getElementById(containerId);
        if(!container) return;
        container.innerHTML = '';
        msgsArray.forEach(msg => {
            const div = document.createElement('div');
            div.className = `chat-msg ${msg.senderId === currentUser.id ? 'self' : ''}`;
            div.innerHTML = `<span class="sender">${msg.senderName}</span>${msg.text}`;
            container.appendChild(div);
        });
        container.scrollTop = container.scrollHeight;
    };

    updateContainer('room-chat-messages');
    updateContainer('game-chat-messages');
}

// Game Logic
async function startGame() {
    const playerIds = Object.keys(players);
    if (playerIds.length < 2 || playerIds.length > 4) return;

    const tiles = generateTiles(playerIds.length);
    const hands = {};
    let tilesPerPlayer = playerIds.length === 3 ? 9 : 7;
    
    playerIds.forEach(id => {
        hands[id] = tiles.splice(0, tilesPerPlayer);
    });

    // Find who starts (highest double or highest tile)
    let startPlayerId = playerIds[0];
    let maxWeight = -1;
    let startTile = null;

    for (const id of playerIds) {
        hands[id].forEach(tile => {
            let weight = tile.left === tile.right ? tile.left * 100 : tile.left + tile.right;
            if (weight > maxWeight) {
                maxWeight = weight;
                startPlayerId = id;
                startTile = tile;
            }
        });
    }

    const initialGameState = {
        turn: startPlayerId,
        board: [],
        boneyard: tiles, // remaining tiles
        playerHands: hands,
        leftEnd: -1,
        rightEnd: -1,
        playerOrder: playerIds,
        turnIndex: playerIds.indexOf(startPlayerId)
    };

    await window.firebaseUpdate(window.firebaseRef(window.firebaseDB, `rooms/${currentRoom}`), {
        status: 'playing',
        gameState: initialGameState
    });
}

function initGameUI() {
    showScreen('game');
    // Set up pan/zoom for board (simplified for now)
}

function updateGameUI() {
    if (!gameState) return;

    // 1. Update Turn Indicator
    const currentTurnPlayer = players[gameState.turn];
    document.getElementById('current-turn-name').textContent = currentTurnPlayer ? currentTurnPlayer.name : '...';
    
    const isMyTurn = gameState.turn === currentUser.id;
    if (isMyTurn) {
        document.getElementById('turn-indicator').style.color = '#4ade80';
    } else {
        document.getElementById('turn-indicator').style.color = '#fcd34d';
    }

    // 2. Update Opponents
    const oppArea = document.getElementById('opponents-area');
    oppArea.innerHTML = '';
    gameState.playerOrder.forEach(id => {
        if (id !== currentUser.id) {
            const hand = gameState.playerHands[id] || [];
            const pName = players[id] ? players[id].name : 'Unknown';
            oppArea.innerHTML += `
                <div class="opponent-card ${gameState.turn === id ? 'active-turn' : ''}">
                    <span class="name">${pName}</span>
                    <span class="tiles-count">${hand.length} <i class="fa-solid fa-layer-group"></i></span>
                </div>
            `;
        }
    });

    // 3. Update My Hand
    myHand = gameState.playerHands[currentUser.id] || [];
    renderMyHand();

    // 4. Update Board
    renderBoard();

    // 5. Update Boneyard/Pass
    const boneyardCount = gameState.boneyard ? gameState.boneyard.length : 0;
    const boneyardContainer = document.getElementById('boneyard-container');
    const passBtn = document.getElementById('btn-pass-turn');
    
    document.getElementById('boneyard-count').textContent = boneyardCount;
    
    if (isMyTurn) {
        const canPlay = hasPlayableTile();
        if (!canPlay) {
            if (boneyardCount > 0) {
                boneyardContainer.classList.remove('hidden');
                passBtn.classList.add('hidden');
            } else {
                boneyardContainer.classList.add('hidden');
                passBtn.classList.remove('hidden');
            }
        } else {
            boneyardContainer.classList.add('hidden');
            passBtn.classList.add('hidden');
        }
    } else {
        boneyardContainer.classList.add('hidden');
        passBtn.classList.add('hidden');
    }

    // Check Win Condition
    checkWinCondition();
}

function getDotHTML(value) {
    if (value === 0) return '';
    let dots = '';
    const layouts = {
        1: ['dot-1'],
        2: ['dot-2-1', 'dot-2-2'],
        3: ['dot-3-1', 'dot-3-2', 'dot-3-3'],
        4: ['dot-4-1', 'dot-4-2', 'dot-4-3', 'dot-4-4'],
        5: ['dot-5-1', 'dot-5-2', 'dot-5-3', 'dot-5-4', 'dot-5-5'],
        6: ['dot-6-1', 'dot-6-2', 'dot-6-3', 'dot-6-4', 'dot-6-5', 'dot-6-6']
    };
    layouts[value].forEach(cls => {
        dots += `<div class="dot ${cls}"></div>`;
    });
    return dots;
}

function createTileHTML(left, right, isVertical = false) {
    return `
        <div class="domino-half">${getDotHTML(left)}</div>
        <div class="domino-half">${getDotHTML(right)}</div>
    `;
}

function renderMyHand() {
    const handDiv = document.getElementById('player-hand');
    handDiv.innerHTML = '';
    
    const isMyTurn = gameState.turn === currentUser.id;
    const boardEmpty = !gameState.board || gameState.board.length === 0;

    myHand.forEach((tile, index) => {
        const dom = document.createElement('div');
        dom.className = 'domino vertical';
        dom.innerHTML = createTileHTML(tile.left, tile.right, true);
        
        let playable = false;
        if (isMyTurn) {
            if (boardEmpty) {
                playable = true;
            } else {
                playable = tile.left === gameState.leftEnd || tile.right === gameState.leftEnd ||
                           tile.left === gameState.rightEnd || tile.right === gameState.rightEnd;
            }
        }

        if (playable) dom.classList.add('playable');

        dom.addEventListener('click', () => {
            if (playable) handleTilePlay(tile, index);
        });

        handDiv.appendChild(dom);
    });
}

function hasPlayableTile() {
    if (!gameState.board || gameState.board.length === 0) return true;
    for (let tile of myHand) {
        if (tile.left === gameState.leftEnd || tile.right === gameState.leftEnd ||
            tile.left === gameState.rightEnd || tile.right === gameState.rightEnd) {
            return true;
        }
    }
    return false;
}

let selectedTileForPlay = null;
let selectedTileIndex = -1;

function handleTilePlay(tile, index) {
    const boardEmpty = !gameState.board || gameState.board.length === 0;
    
    if (boardEmpty) {
        // First play
        commitPlay(tile, index, 'first');
        return;
    }

    const canPlayLeft = tile.left === gameState.leftEnd || tile.right === gameState.leftEnd;
    const canPlayRight = tile.left === gameState.rightEnd || tile.right === gameState.rightEnd;

    if (canPlayLeft && canPlayRight && gameState.leftEnd !== gameState.rightEnd) {
        // Ask where to play
        selectedTileForPlay = tile;
        selectedTileIndex = index;
        document.getElementById('play-side-modal').classList.remove('hidden');
    } else if (canPlayLeft) {
        commitPlay(tile, index, 'left');
    } else if (canPlayRight) {
        commitPlay(tile, index, 'right');
    }
}

// Modal actions
document.getElementById('btn-play-left').addEventListener('click', () => {
    document.getElementById('play-side-modal').classList.add('hidden');
    commitPlay(selectedTileForPlay, selectedTileIndex, 'left');
});
document.getElementById('btn-play-right').addEventListener('click', () => {
    document.getElementById('play-side-modal').classList.add('hidden');
    commitPlay(selectedTileForPlay, selectedTileIndex, 'right');
});
document.getElementById('btn-cancel-play').addEventListener('click', () => {
    document.getElementById('play-side-modal').classList.add('hidden');
    selectedTileForPlay = null;
});

async function commitPlay(tile, index, side) {
    let newBoard = gameState.board ? [...gameState.board] : [];
    let leftEnd = gameState.leftEnd;
    let rightEnd = gameState.rightEnd;

    // Placement logic - assigning x, y and orientation for CSS rendering
    let placedTile = { ...tile };
    
    if (newBoard.length === 0) {
        leftEnd = tile.left;
        rightEnd = tile.right;
        placedTile.x = 2500;
        placedTile.y = 2500;
        placedTile.isDouble = tile.left === tile.right;
        placedTile.orientation = placedTile.isDouble ? 'vertical' : 'horizontal';
        if (!placedTile.isDouble) {
            placedTile.openLeft = 'left'; 
            placedTile.openRight = 'right';
        }
        newBoard.push(placedTile);
    } else {
        // Find position
        // This is a simplified snake rendering logic. A true snake requires checking boundaries.
        // For now, we'll build a straight line outwards, and if it's a double, it's vertical.
        
        const isDouble = tile.left === tile.right;
        placedTile.isDouble = isDouble;
        placedTile.orientation = isDouble ? 'vertical' : 'horizontal';

        if (side === 'left') {
            const anchor = newBoard[0]; // Currently left-most
            if (tile.right === leftEnd) {
                placedTile.left = tile.left; placedTile.right = tile.right;
                leftEnd = tile.left;
            } else {
                placedTile.left = tile.right; placedTile.right = tile.left; // Flipped visually
                leftEnd = tile.right;
            }
            placedTile.x = anchor.x - (isDouble ? 45 : 65);
            placedTile.y = anchor.y;
            newBoard.unshift(placedTile);
        } else {
            const anchor = newBoard[newBoard.length - 1]; // Right-most
            if (tile.left === rightEnd) {
                placedTile.left = tile.left; placedTile.right = tile.right;
                rightEnd = tile.right;
            } else {
                placedTile.left = tile.right; placedTile.right = tile.left; // Flipped
                rightEnd = tile.left;
            }
            placedTile.x = anchor.x + (isDouble ? 45 : 65);
            placedTile.y = anchor.y;
            newBoard.push(placedTile);
        }
    }

    // Update hand
    let newHands = { ...gameState.playerHands };
    newHands[currentUser.id].splice(index, 1);

    // Next turn
    let nextIndex = (gameState.turnIndex + 1) % gameState.playerOrder.length;
    let nextTurn = gameState.playerOrder[nextIndex];

    await window.firebaseUpdate(window.firebaseRef(window.firebaseDB, `rooms/${currentRoom}/gameState`), {
        board: newBoard,
        leftEnd: leftEnd,
        rightEnd: rightEnd,
        playerHands: newHands,
        turn: nextTurn,
        turnIndex: nextIndex
    });
}

// Boneyard Draw
document.getElementById('btn-draw-tile').addEventListener('click', async () => {
    if (gameState.turn !== currentUser.id) return;
    if (hasPlayableTile()) return showToast('لديك ورقة يمكنك لعبها!');
    if (!gameState.boneyard || gameState.boneyard.length === 0) return;

    let newBoneyard = [...gameState.boneyard];
    let drawn = newBoneyard.pop();
    
    let newHands = { ...gameState.playerHands };
    newHands[currentUser.id].push(drawn);

    await window.firebaseUpdate(window.firebaseRef(window.firebaseDB, `rooms/${currentRoom}/gameState`), {
        boneyard: newBoneyard,
        playerHands: newHands
    });
});

// Pass Turn
document.getElementById('btn-pass-turn').addEventListener('click', async () => {
    if (gameState.turn !== currentUser.id) return;
    if (hasPlayableTile()) return showToast('لديك ورقة يمكنك لعبها!');
    
    let nextIndex = (gameState.turnIndex + 1) % gameState.playerOrder.length;
    let nextTurn = gameState.playerOrder[nextIndex];

    await window.firebaseUpdate(window.firebaseRef(window.firebaseDB, `rooms/${currentRoom}/gameState/turn`), nextTurn);
    await window.firebaseUpdate(window.firebaseRef(window.firebaseDB, `rooms/${currentRoom}/gameState/turnIndex`), nextIndex);
});

// Render Board
function renderBoard() {
    const boardDiv = document.getElementById('board');
    boardDiv.innerHTML = '';
    if (!gameState.board) return;

    // Calculate center offset
    let minX = 2500, maxX = 2500, minY = 2500, maxY = 2500;

    gameState.board.forEach(tile => {
        const dom = document.createElement('div');
        dom.className = `domino ${tile.orientation}`;
        dom.innerHTML = createTileHTML(tile.left, tile.right);
        
        dom.style.left = `${tile.x}px`;
        dom.style.top = `${tile.y}px`;
        
        boardDiv.appendChild(dom);

        if (tile.x < minX) minX = tile.x;
        if (tile.x > maxX) maxX = tile.x;
        if (tile.y < minY) minY = tile.y;
        if (tile.y > maxY) maxY = tile.y;
    });

    // Center board view
    const boardContainer = document.getElementById('board-container');
    const centerX = (minX + maxX) / 2 + 30; // + half domino width
    const centerY = (minY + maxY) / 2 + 15;
    
    boardDiv.style.transform = `translate(calc(50vw - ${centerX}px), calc(40vh - ${centerY}px))`;
}

// Check Win Condition
function checkWinCondition() {
    let winner = null;
    let isDraw = false;

    // 1. A player has 0 tiles
    for (let id in gameState.playerHands) {
        if (gameState.playerHands[id].length === 0) {
            winner = id;
            break;
        }
    }

    // 2. Blocked game (everyone passed and no boneyard)
    // Simplified check: we would normally need to track consecutive passes.
    // Let's rely on basic tile count for now. If winner found:
    if (winner) {
        endGame(winner);
    }
}

async function endGame(winnerId) {
    if (!isHost) return; // Only host handles ending the game logic in DB to avoid race conditions
    
    await window.firebaseUpdate(window.firebaseRef(window.firebaseDB, `rooms/${currentRoom}`), {
        status: 'finished',
        winner: winnerId
    });
}
