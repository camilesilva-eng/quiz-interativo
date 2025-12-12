// --- Configurações Iniciais ---
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const GAME_WIDTH = canvas.width;
const GAME_HEIGHT = canvas.height;

// --- Parâmetros de Jogo ---
const GRAVITY = 0.8;
const JUMP_VELOCITY = -15;
const MOVE_SPEED = 5;
const PLAYER_DIM = 32;

let coins = 0;
let lives = 3;
let currentLevelIndex = 0;
let gameRunning = false;

// --- Classes de Jogo ---

// Classe Base para Entidades
class Entity {
    constructor(x, y, w, h, type) {
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
        this.type = type;
        this.toRemove = false; 
    }
    checkCollision(other) {
        return this.x < other.x + other.width &&
               this.x + this.width > other.x &&
               this.y < other.y + other.height &&
               this.y + this.height > other.y;
    }
    // Método draw padrão (será substituído ou usado para plataformas)
    draw(color) {
        ctx.fillStyle = color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

class Platform extends Entity {
    constructor(x, y, w, h, color = 'darkgreen') {
        super(x, y, w, h, 'platform');
        this.color = color;
    }
    draw() {
        // Bloco simples de plataforma
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

class Coin extends Entity {
    constructor(x, y) {
        super(x, y, 20, 20, 'coin');
    }
    draw() {
        // Moeda: um círculo amarelo
        ctx.fillStyle = 'yellow';
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#daa520'; // Contorno
        ctx.stroke();
    }
}

class Enemy extends Entity {
    constructor(x, y, speed) {
        super(x, y, 30, 30, 'enemy');
        this.speed = speed;
        this.direction = 1; 
    }
    update() {
        this.x += this.speed * this.direction;
        if (this.x <= 0 || this.x + this.width >= GAME_WIDTH) {
            this.direction *= -1;
        }
    }
    draw() {
        // Inimigo: um quadrado vermelho
        ctx.fillStyle = 'red';
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

// Classe Objetivo
class Goal extends Platform {
    constructor(x, y, w, h) {
        super(x, y, w, h, 'yellow');
    }
    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = 'black'; 
        ctx.font = '12px Arial';
        ctx.textAlign = 'center'; // Alinha o texto no centro do bloco
        ctx.fillText("GOAL", this.x + this.width / 2, this.y + this.height / 2 + 4);
    }
}

// --- Objeto Jogador (A Menina) ---
let player = {
    x: 50,
    y: 0,
    width: PLAYER_DIM,
    height: PLAYER_DIM,
    velocityX: 0,
    velocityY: 0,
    isGrounded: false,
    draw: function() {
        // Jogador: um quadrado AZUL (simulando a menina)
        ctx.fillStyle = 'blue';
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
};

// --- Dados do Nível (Fases) ---
// MANTIDO O MESMO
const levels = [
    {
        name: "Fase 1: O Início Fácil",
        platforms: [
            new Platform(0, GAME_HEIGHT - 32, GAME_WIDTH, 32, 'darkgreen'), 
            new Platform(150, GAME_HEIGHT - 100, 100, 20),
            new Platform(350, GAME_HEIGHT - 180, 80, 20),
            new Goal(GAME_WIDTH - 50, GAME_HEIGHT - 80, 40, 48)
        ],
        coins: [new Coin(200, GAME_HEIGHT - 130), new Coin(370, GAME_HEIGHT - 210)],
        enemies: [new Enemy(500, GAME_HEIGHT - 62, 1)],
        playerStart: { x: 50, y: 0 }
    },
    {
        name: "Fase 2: Mais Desafios",
        platforms: [
            new Platform(0, GAME_HEIGHT - 32, GAME_WIDTH, 32, 'darkred'),
            new Platform(100, GAME_HEIGHT - 150, 60, 20),
            new Platform(250, GAME_HEIGHT - 250, 50, 20),
            new Platform(400, GAME_HEIGHT - 100, 200, 20),
            new Goal(GAME_WIDTH - 50, GAME_HEIGHT - 80, 40, 48)
        ],
        coins: [new Coin(120, GAME_HEIGHT - 180), new Coin(500, GAME_HEIGHT - 130), new Coin(550, GAME_HEIGHT - 130)],
        enemies: [new Enemy(150, GAME_HEIGHT - 62, 2), new Enemy(450, GAME_HEIGHT - 62, 1.5)],
        playerStart: { x: 50, y: 0 }
    }
];

let currentLevelEntities = [];
let currentGoal;

// --- Funções de Jogo ---

function updateUI() {
    document.getElementById('coin-count').textContent = coins;
    document.getElementById('life-count').textContent = lives;
    document.getElementById('level-title').textContent = levels[currentLevelIndex].name;
}

function resetPlayerPosition() {
    const start = levels[currentLevelIndex].playerStart;
    player.x = start.x;
    player.y = start.y;
    player.velocityX = 0;
    player.velocityY = 0;
    player.isGrounded = false;
}

function loadLevel(index) {
    if (index >= levels.length) {
        alert("Parabéns! Você completou o jogo!");
        currentLevelIndex = 0;
        coins = 0;
        lives = 3;
    }

    const levelData = levels[currentLevelIndex];
    resetPlayerPosition();

    currentLevelEntities = [
        ...levelData.platforms, 
        ...levelData.coins.map(c => new Coin(c.x, c.y)), 
        ...levelData.enemies.map(e => new Enemy(e.x, e.y, e.speed))
    ];
    currentGoal = currentLevelEntities.find(e => e instanceof Goal);

    updateUI();
}

function handleDeath() {
    lives--;
    if (lives <= 0) {
        alert("Fim de Jogo! Tente novamente.");
        lives = 3;
        coins = 0;
        currentLevelIndex = 0;
    }
    loadLevel(currentLevelIndex);
}

// ... [A função applyPhysicsAndCollisions permanece a mesma] ...
function checkCollision(objA, objB) {
    return objA.x < objB.x + objB.width &&
           objA.x + objA.width > objB.x &&
           objA.y < objB.y + objB.height &&
           objA.y + objA.height > objB.y;
}

function applyPhysicsAndCollisions() {
    if (!player.isGrounded) {
        player.velocityY += GRAVITY;
    }
    
    player.x += player.velocityX;
    player.y += player.velocityY;

    player.isGrounded = false;
    
    currentLevelEntities.forEach(entity => {
        if (!entity.toRemove && checkCollision(player, entity)) {
            
            if (entity.type === 'platform' || entity instanceof Goal) {
                if (player.velocityY >= 0 && player.y + player.height <= entity.y + player.velocityY) {
                    player.velocityY = 0;
                    player.y = entity.y - player.height;
                    player.isGrounded = true;
                }
            }

            if (entity.type === 'coin') {
                entity.toRemove = true;
                coins++;
                updateUI();
            }

            if (entity.type === 'enemy') {
                if (player.velocityY > 0 && player.y + player.height <= entity.y + player.velocityY) {
                    entity.toRemove = true;
                    player.velocityY = JUMP_VELOCITY / 2;
                } 
                else {
                    handleDeath();
                }
            }
        }
    });

    if (player.x < 0) player.x = 0;
    if (player.x + player.width > GAME_WIDTH) player.x = GAME_WIDTH - player.width;

    if (player.y > GAME_HEIGHT) {
        handleDeath();
    }
    
    currentLevelEntities = currentLevelEntities.filter(e => !e.toRemove);
}

// --- Loop Principal e Desenho ---

function draw() {
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Desenha todas as entidades
    currentLevelEntities.forEach(entity => {
        entity.draw();
        if (entity.type === 'enemy') {
            entity.update(); 
        }
    });
    
    player.draw();
}

function gameLoop() {
    // Agora o loop é mais simples, pois não tem que esperar assets
    if (gameRunning) {
        applyPhysicsAndCollisions();
        draw();
    }
    requestAnimationFrame(gameLoop);
}

// --- Controle de Eventos (Teclado) ---
// MANTIDO O MESMO
document.addEventListener('keydown', (e) => {
    if (gameRunning) {
        if ((e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') && player.isGrounded) {
            player.velocityY = JUMP_VELOCITY;
            player.isGrounded = false; 
        }
        if (e.key === 'ArrowLeft' || e.key === 'a') {
            player.velocityX = -MOVE_SPEED;
        } else if (e.key === 'ArrowRight' || e.key === 'd') {
            player.velocityX = MOVE_SPEED;
        }
    }
});

document.addEventListener('keyup', (e) => {
    if ((e.key === 'ArrowLeft' || e.key === 'a') && player.velocityX < 0) {
        player.velocityX = 0;
    } else if ((e.key === 'ArrowRight' || e.key === 'd') && player.velocityX > 0) {
        player.velocityX = 0;
    }
});

// --- Inicia o Jogo (SIMPLIFICADO) ---

function startGame() {
    gameRunning = true;
    loadLevel(currentLevelIndex);
    gameLoop();
}

// Inicia o jogo imediatamente após o carregamento do script
startGame();
