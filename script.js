// --- script.js (Estilo Subway Surfers - Tema Noite) ---

// 1. Configurações e Variáveis Iniciais
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const GAME_WIDTH = canvas.width;
const GAME_HEIGHT = canvas.height;

// --- Parâmetros de Jogo ---
const GRAVITY = 0.8;
const JUMP_VELOCITY = -15;
const LANE_SWITCH_SPEED = 8;
const PLAYER_WIDTH = 32;
const PLAYER_HEIGHT = 48;
const WORLD_SPEED = 4;

// Posições X fixas para as três pistas (baseado no centro do jogador)
const LANES_X = [
    GAME_WIDTH / 4,
    GAME_WIDTH / 2,
    GAME_WIDTH * 3 / 4
];

let coins = 0;
let lives = 3;
let gameTime = 0;
let timerInterval = null;
let gameRunning = false;

// Variáveis específicas do Endless Runner
let currentLane = 1;
let targetX = LANES_X[currentLane] - PLAYER_WIDTH / 2;
let generationDistance = 0; 

// 2. Funções de Utilidade (Colisão)
function checkAABB(objA, objB) {
    return objA.x < objB.x + objB.width &&
           objA.x + objA.width > objB.x &&
           objA.y < objB.y + objB.height &&
           objA.y + objA.height > objB.y;
}

// 3. Classes de Jogo
class Entity {
    constructor(x, y, w, h, type) {
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
        this.type = type;
        this.toRemove = false;
    }
    draw(color) {
        ctx.fillStyle = color || 'grey';
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

class Platform extends Entity {
    constructor(x, y, w, h, color = '#333333') { // Cor de Asfalto Escuro
        super(x, y, w, h, 'platform');
        this.color = color;
    }
    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

class Coin extends Entity {
    constructor(x, y) {
        super(x, y, 20, 20, 'coin');
    }
    draw() {
        ctx.fillStyle = 'yellow';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.strokeStyle = '#daa520';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
    }
}

class Enemy extends Entity {
    constructor(x, y, speed) {
        super(x, y, 30, 30, 'enemy');
        this.speed = speed;
        this.direction = 1;
    }
    update() {
        // Inimigos fixos no endless runner
    }
    draw() {
        ctx.fillStyle = 'red';
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

// REMOVIDA CLASSE GOAL

// 4. Objeto Jogador
let player = {
    x: LANES_X[1] - PLAYER_WIDTH / 2,
    y: GAME_HEIGHT - 32 - PLAYER_HEIGHT,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    velocityX: 0,
    velocityY: 0,
    isGrounded: true,
    
    update: function() {
        if (!this.isGrounded) {
            this.velocityY += GRAVITY;
        }
        this.y += this.velocityY;

        const dx = targetX - this.x;
        if (Math.abs(dx) > LANE_SWITCH_SPEED) {
            this.x += Math.sign(dx) * LANE_SWITCH_SPEED;
        } else {
            this.x = targetX;
        }
    },

    draw: function() {
        // Azul claro para destacar na noite
        ctx.fillStyle = 'lightblue'; 
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
};

let currentLevelEntities = [];

// Funções de Geração
function generateEntities() {
    // Distância mínima entre obstáculos (ajustável)
    const MIN_DISTANCE = 250; 
    let LAST_ENTITY_X = GAME_WIDTH;

    if (currentLevelEntities.length > 0) {
        // Encontra a entidade mais à direita
        LAST_ENTITY_X = currentLevelEntities.reduce((max, e) => Math.max(max, e.x), -Infinity);
    }

    if (LAST_ENTITY_X > GAME_WIDTH - MIN_DISTANCE) {
        return;
    }

    // Garante que a próxima entidade comece FORA da tela
    const START_X = LAST_ENTITY_X > GAME_WIDTH ? LAST_ENTITY_X : GAME_WIDTH;

    // Decide o número de pistas afetadas (1, 2 ou 3)
    const affectedLanesCount = Math.floor(Math.random() * 3) + 1; // 1, 2 ou 3
    const availableLanes = [0, 1, 2].sort(() => 0.5 - Math.random()); // Pistas aleatórias

    // Define qual pista deve conter o item bom (moeda) ou o obstáculo
    for (let i = 0; i < affectedLanesCount; i++) {
        const LANE_INDEX = availableLanes[i];
        const X_POS = LANES_X[LANE_INDEX] - 15;
        const Y_POS_GROUND = GAME_HEIGHT - 32 - 30; // Altura do obstáculo no chão
        
        let newEntity;
        
        // 70% de chance de ser obstáculo (Enemy) no chão
        if (Math.random() < 0.7) { 
            newEntity = new Enemy(START_X + (i * 50), Y_POS_GROUND, 0); 
        } else {
            // 30% de chance de ser moeda
            newEntity = new Coin(START_X + (i * 50), Y_POS_GROUND - 50); // Moeda flutuante
        }

        currentLevelEntities.push(newEntity);
    }
}

// 6. Funções de Controle de Jogo
function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
}

function updateTimer() {
    if (gameRunning) {
        gameTime++;
        document.getElementById('time-count').textContent = formatTime(gameTime);
    }
}

function updateUI() {
    document.getElementById('coin-count').textContent = coins;
    document.getElementById('life-count').textContent = lives;
    document.getElementById('level-title').textContent = "🌌 Corrida Infinita Noturna";
    document.getElementById('time-count').textContent = formatTime(gameTime);
}

function resetPlayerPosition() {
    currentLane = 1;
    player.x = LANES_X[currentLane] - PLAYER_WIDTH / 2;
    player.y = GAME_HEIGHT - 32 - PLAYER_HEIGHT; 
    targetX = player.x;
    player.velocityY = 0;
    player.isGrounded = true;
}

function initializeGame() {
    // Apenas o chão inicial
    currentLevelEntities = [
        new Platform(0, GAME_HEIGHT - 32, GAME_WIDTH, 32, '#333333'), // Chão de asfalto
    ];
    
    resetPlayerPosition();

    gameTime = 0;
    updateUI();
}

function handleDeath() {
    lives--;
    if (lives <= 0) {
        gameRunning = false;
        clearInterval(timerInterval);
        alert(`Fim de Jogo! Você atingiu ${formatTime(gameTime)} e coletou ${coins} moedas.`);
        // Reinicia totalmente
        coins = 0;
        lives = 3;
        startGame();
    } else {
        // Volta para a pista central
        resetPlayerPosition();
        updateUI();
    }
}

// 7. Lógica Principal de Movimento e Colisão
function applyPhysicsAndCollisions() {
    player.update();

    // Movimento do Mundo (World Scroll)
    currentLevelEntities.forEach(entity => {
        entity.x -= WORLD_SPEED;
    });
    
    generateEntities();

    player.isGrounded = false;

    // Colisão
    currentLevelEntities.forEach(entity => {
        if (!entity.toRemove && checkAABB(player, entity)) {
            
            if (entity.type === 'platform') {
                if (player.velocityY >= 0 && player.y + player.height <= entity.y + player.velocityY) {
                    player.velocityY = 0;
                    player.y = entity.y - player.height;
                    player.isGrounded = true;
                }
            } else if (entity.type === 'coin') {
                entity.toRemove = true;
                coins++;
                updateUI();
            } else if (entity.type === 'enemy') {
                handleDeath();
            }
        }
    });

    // Limites da Tela (Queda)
    if (player.y > GAME_HEIGHT) {
        handleDeath();
    }

    // Limpeza de Entidades que saíram da tela
    currentLevelEntities = currentLevelEntities.filter(e => !e.toRemove && e.x + e.width > 0);
}

// 8. Loop Principal e Desenho
function draw() {
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Linhas Guia para as pistas
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'; // Linhas mais escuras
    ctx.lineWidth = 2;
    LANES_X.forEach(x => {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, GAME_HEIGHT);
        ctx.stroke();
    });

    currentLevelEntities.forEach(entity => {
        entity.draw();
    });

    player.draw();
}

function gameLoop() {
    if (gameRunning) {
        applyPhysicsAndCollisions();
        draw();
    }
    requestAnimationFrame(gameLoop);
}

// 9. Controle de Eventos (Troca de Pista)
document.addEventListener('keydown', (e) => {
    if (!gameRunning) return;
    
    // Pulo
    if ((e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') && player.isGrounded) {
        player.velocityY = JUMP_VELOCITY;
        player.isGrounded = false;
    }

    // Troca de Pista
    if (e.key === 'ArrowLeft' || e.key === 'a') {
        if (currentLane > 0) {
            currentLane--;
            targetX = LANES_X[currentLane] - PLAYER_WIDTH / 2;
        }
    } else if (e.key === 'ArrowRight' || e.key === 'd') {
        if (currentLane < 2) {
            currentLane++;
            targetX = LANES_X[currentLane] - PLAYER_WIDTH / 2;
        }
    }
});

document.addEventListener('keyup', (e) => {
    // Não é necessário keyup
});

// 10. Inicia o Jogo
function startGame() {
    initializeGame();
    gameRunning = true;
    timerInterval = setInterval(updateTimer, 1000); 
    gameLoop();
}

startGame();
