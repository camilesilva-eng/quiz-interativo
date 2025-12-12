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

// --- Carregamento de Assets (Sprites) ---
const assets = {};
const assetList = [
    { name: 'player', src: 'girl_sprite.png' },
    { name: 'coin', src: 'coin_sprite.png' },
    { name: 'enemy', src: 'enemy_sprite.png' }
];

let assetsLoaded = 0;
function loadAssets() {
    assetList.forEach(asset => {
        assets[asset.name] = new Image();
        assets[asset.name].onload = () => {
            assetsLoaded++;
            if (assetsLoaded === assetList.length) {
                startGame();
            }
        };
        assets[asset.name].src = asset.src;
    });
}

// --- Classes de Jogo ---

// Classe Base para Itens (Plataforma, Inimigo, Moeda)
class Entity {
    constructor(x, y, w, h, type) {
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
        this.type = type;
        this.toRemove = false; // Flag para remoção
    }
    // Método de colisão simples AABB
    checkCollision(other) {
        return this.x < other.x + other.width &&
               this.x + this.width > other.x &&
               this.y < other.y + other.height &&
               this.y + this.height > other.y;
    }
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
        // Desenha o bloco (simulando pixel art)
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = '#666'; // Borda
        ctx.fillRect(this.x, this.y + this.height - 4, this.width, 4); 
    }
}

class Coin extends Entity {
    constructor(x, y) {
        super(x, y, 20, 20, 'coin');
    }
    draw() {
        ctx.drawImage(assets.coin, this.x, this.y, this.width, this.height);
    }
}

class Enemy extends Entity {
    constructor(x, y, speed) {
        super(x, y, 30, 30, 'enemy');
        this.speed = speed;
        this.direction = 1; // 1 = direita, -1 = esquerda
    }
    update() {
        // Movimento simples (anda para os lados)
        this.x += this.speed * this.direction;

        // Inverte a direção se atingir as bordas (lógica simplificada)
        if (this.x <= 0 || this.x + this.width >= GAME_WIDTH) {
            this.direction *= -1;
        }
    }
    draw() {
        ctx.drawImage(assets.enemy, this.x, this.y, this.width, this.height);
    }
}

// --- Objeto Jogador ---
let player = {
    x: 50,
    y: 0,
    width: PLAYER_DIM,
    height: PLAYER_DIM,
    velocityX: 0,
    velocityY: 0,
    isGrounded: false,
    draw: function() {
        ctx.drawImage(assets.player, this.x, this.y, this.width, this.height);
    }
};

// --- Dados do Nível (Fases) ---

// Define o objetivo de "vitória" para passar de fase
class Goal extends Platform {
    constructor(x, y, w, h) {
        super(x, y, w, h, 'yellow');
    }
    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        // Texto para o objetivo
        ctx.fillStyle = 'black';
        ctx.font = '12px Arial';
        ctx.fillText("GOAL", this.x + 5, this.y + this.height / 2 + 4);
    }
}

const levels = [
    {
        name: "Fase 1: O Início Fácil",
        platforms: [
            new Platform(0, GAME_HEIGHT - 32, GAME_WIDTH, 32, 'darkgreen'), // Chão
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

    // Carrega todas as entidades (Plataformas, Itens, Inimigos)
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

function applyPhysicsAndCollisions() {
    // 1. Aplica Gravidade
    if (!player.isGrounded) {
        player.velocityY += GRAVITY;
    }
    
    // 2. Atualiza Posição
    player.x += player.velocityX;
    player.y += player.velocityY;

    player.isGrounded = false;
    
    // 3. Checagem de Colisão com Entidades
    currentLevelEntities.forEach(entity => {
        if (!entity.toRemove && player.checkCollision(entity)) {
            
            // Colisão com Plataforma ou Objetivo
            if (entity.type === 'platform' || entity instanceof Goal) {
                // Aterrizagem (Colisão de cima)
                if (player.velocityY >= 0 && 
                    player.y + player.height <= entity.y + player.velocityY) // Verifica se vinha de cima
                {
                    player.velocityY = 0;
                    player.y = entity.y - player.height;
                    player.isGrounded = true;
                }
            }

            // Colisão com Moeda
            if (entity.type === 'coin') {
                entity.toRemove = true;
                coins++;
                updateUI();
            }

            // Colisão com Inimigo
            if (entity.type === 'enemy') {
                // Derrotar Inimigo (Pulou em cima)
                if (player.velocityY > 0 && 
                    player.y + player.height <= entity.y + player.velocityY) // Colisão de cima
                {
                    entity.toRemove = true;
                    player.velocityY = JUMP_VELOCITY / 2; // Pulo de ricochete
                } 
                // Morrer (Colisão lateral ou por baixo)
                else {
                    handleDeath();
                }
            }
        }
    });

    // 4. Checagem de Objetivo
    if (player.checkCollision(currentGoal)) {
        currentLevelIndex++;
        loadLevel(currentLevelIndex);
    }

    // 5. Game Over (Caiu para fora da tela)
    if (player.y > GAME_HEIGHT) {
        handleDeath();
    }
    
    // 6. Limites laterais da tela
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > GAME_WIDTH) player.x = GAME_WIDTH - player.width;

    // 7. Remove entidades marcadas para remoção (coletadas/derrotadas)
    currentLevelEntities = currentLevelEntities.filter(e => !e.toRemove);
}

// --- Loop Principal ---

function draw() {
    // Limpa a tela
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Desenha todas as entidades
    currentLevelEntities.forEach(entity => {
        entity.draw();
        if (entity.type === 'enemy') {
            entity.update(); // Move o inimigo
        }
    });
    
    // Desenha o Jogador
    player.draw();
}

function gameLoop() {
    if (gameRunning) {
        applyPhysicsAndCollisions();
        draw();
    }
    requestAnimationFrame(gameLoop);
}

// --- Controle de Eventos (Teclado) ---

document.addEventListener('keydown', (e) => {
    if (gameRunning) {
        // Pulo (só pode pular se estiver no chão)
        if ((e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') && player.isGrounded) {
            player.velocityY = JUMP_VELOCITY;
            player.isGrounded = false; 
        }
        // Movimento Horizontal
        if (e.key === 'ArrowLeft' || e.key === 'a') {
            player.velocityX = -MOVE_SPEED;
        } else if (e.key === 'ArrowRight' || e.key === 'd') {
            player.velocityX = MOVE_SPEED;
        }
    }
});

document.addEventListener('keyup', (e) => {
    // Parar de mover horizontalmente
    if ((e.key === 'ArrowLeft' || e.key === 'a') && player.velocityX < 0) {
        player.velocityX = 0;
    } else if ((e.key === 'ArrowRight' || e.key === 'd') && player.velocityX > 0) {
        player.velocityX = 0;
    }
});

// --- Inicia o Jogo ---

function startGame() {
    gameRunning = true;
    loadLevel(currentLevelIndex);
    gameLoop();
}

// Começa carregando todos os assets
loadAssets();  
     
  
  
 
 
