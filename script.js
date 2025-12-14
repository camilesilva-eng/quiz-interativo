// --- script.js OTIMIZADO (com Sprite e Níveis Adicionais) ---

// 1. Configurações e Variáveis Iniciais
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const GAME_WIDTH = canvas.width;
const GAME_HEIGHT = canvas.height;

// Parâmetros
const GRAVITY = 0.8;
const JUMP_VELOCITY = -15;
const MOVE_SPEED = 5;
const PLAYER_DIM = 32; // Dimensões do quadrado de colisão da jogadora

let coins = 0;
let lives = 3;
let currentLevelIndex = 0;
let gameRunning = false;
let assetsLoaded = 0;
const totalAssets = 1; // Apenas a sprite da jogadora por enquanto

// 2. Carregamento de Assets (Novo!)
const playerSprite = new Image();
playerSprite.src = 'girl-sprite.png'; // Garanta que esta imagem está na mesma pasta!

playerSprite.onload = () => {
    assetsLoaded++;
    if (assetsLoaded === totalAssets) {
        startGame(); // Inicia o jogo somente após o carregamento da sprite
    }
};
playerSprite.onerror = () => {
    console.error("Erro ao carregar a sprite da jogadora.");
    // Pode adicionar uma lógica para carregar uma sprite fallback ou exibir uma mensagem
    // Para fins de teste, vamos iniciar o jogo mesmo com erro na sprite (desenhará o quadrado azul)
    assetsLoaded++;
    if (assetsLoaded === totalAssets) {
        startGame();
    }
};

// 3. Funções de Utilidade (Colisão)
function checkAABB(objA, objB) {
    return objA.x < objB.x + objB.width &&
           objA.x + objA.width > objB.x &&
           objA.y < objB.y + objB.height &&
           objA.y + objA.height > objB.y;
}

// 4. Classes de Jogo
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
    constructor(x, y, w, h, color = 'darkgreen') {
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
        this.x += this.speed * this.direction;
        if (this.x <= 0 || this.x + this.width >= GAME_WIDTH) {
            this.direction *= -1;
        }
    }
    draw() {
        ctx.fillStyle = 'red';
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

class Goal extends Platform {
    constructor(x, y, w, h) {
        super(x, y, w, h, 'lime');
    }
    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText("GOAL", this.x + this.width / 2, this.y + this.height / 2 + 6);
    }
}

// 5. Objeto Jogador (AGORA USA A SPRITE!)
let player = {
    x: 50,
    y: 0,
    width: PLAYER_DIM,
    height: PLAYER_DIM,
    velocityX: 0,
    velocityY: 0,
    isGrounded: false,
    draw: function() {
        if (playerSprite.complete && playerSprite.naturalWidth > 0) {
            // Desenha a sprite. Assumindo que a sprite é do tamanho do PLAYER_DIM
            ctx.drawImage(playerSprite, this.x, this.y, this.width, this.height);
        } else {
            // Fallback: desenha um quadrado azul se a sprite não carregar
            ctx.fillStyle = 'blue';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }
};

// 6. Dados dos Níveis (Adicionados mais níveis estilo Mario!)
const levelsData = [
    {
        name: "Fase 1: O Início Fácil",
        playerStart: { x: 50, y: 0 },
        platforms: [
            { x: 0, y: GAME_HEIGHT - 32, w: GAME_WIDTH, h: 32, color: 'darkgreen' },
            { x: 150, y: GAME_HEIGHT - 100, w: 100, h: 20 },
            { x: 350, y: GAME_HEIGHT - 180, w: 80, h: 20 },
            { x: 600, y: GAME_HEIGHT - 100, w: 100, h: 20 },
        ],
        coins: [{ x: 200, y: GAME_HEIGHT - 130 }, { x: 370, y: GAME_HEIGHT - 210 }, { x: 650, y: GAME_HEIGHT - 130 }],
        enemies: [{ x: 500, y: GAME_HEIGHT - 62, speed: 1 }],
        goal: { x: GAME_WIDTH - 50, y: GAME_HEIGHT - 80, w: 40, h: 48 }
    },
    {
        name: "Fase 2: Mais Desafios",
        playerStart: { x: 50, y: 0 },
        platforms: [
            { x: 0, y: GAME_HEIGHT - 32, w: GAME_WIDTH, h: 32, color: 'darkred' },
            { x: 100, y: GAME_HEIGHT - 150, w: 60, h: 20 },
            { x: 250, y: GAME_HEIGHT - 250, w: 50, h: 20 },
            { x: 400, y: GAME_HEIGHT - 100, w: 200, h: 20 },
            { x: 650, y: GAME_HEIGHT - 200, w: 80, h: 20 },
        ],
        coins: [{ x: 120, y: GAME_HEIGHT - 180 }, { x: 500, y: GAME_HEIGHT - 130 }, { x: 550, y: GAME_HEIGHT - 130 }, { x: 680, y: GAME_HEIGHT - 230 }],
        enemies: [{ x: 150, y: GAME_HEIGHT - 62, speed: 2 }, { x: 450, y: GAME_HEIGHT - 62, speed: 1.5 }],
        goal: { x: GAME_WIDTH - 50, y: GAME_HEIGHT - 80, w: 40, h: 48 }
    },
    {
        name: "Fase 3: Labirinto Vertical",
        playerStart: { x: 50, y: 0 },
        platforms: [
            { x: 0, y: GAME_HEIGHT - 32, w: GAME_WIDTH, h: 32, color: 'darkblue' }, // Chão
            { x: 100, y: GAME_HEIGHT - 100, w: 80, h: 20 },
            { x: 200, y: GAME_HEIGHT - 180, w: 70, h: 20 },
            { x: 300, y: GAME_HEIGHT - 260, w: 60, h: 20 },
            { x: 450, y: GAME_HEIGHT - 150, w: 100, h: 20 },
            { x: 600, y: GAME_HEIGHT - 250, w: 80, h: 20 },
        ],
        coins: [{ x: 120, y: GAME_HEIGHT - 130 }, { x: 220, y: GAME_HEIGHT - 210 }, { x: 320, y: GAME_HEIGHT - 290 }, { x: 480, y: GAME_HEIGHT - 180 }, { x: 630, y: GAME_HEIGHT - 280 }],
        enemies: [{ x: 150, y: GAME_HEIGHT - 62, speed: 1.5 }, { x: 400, y: GAME_HEIGHT - 180, speed: 2 }],
        goal: { x: GAME_WIDTH - 50, y: GAME_HEIGHT - 80, w: 40, h: 48 }
    },
    {
        name: "Fase 4: Ponte e Quedas",
        playerStart: { x: 50, y: 0 },
        platforms: [
            { x: 0, y: GAME_HEIGHT - 32, w: 100, h: 32, color: 'darkorange' }, // Chão inicial
            { x: 200, y: GAME_HEIGHT - 100, w: 150, h: 20 },
            { x: 400, y: GAME_HEIGHT - 200, w: 100, h: 20 },
            { x: 600, y: GAME_HEIGHT - 100, w: 180, h: 20 },
            { x: 300, y: GAME_HEIGHT - 300, w: 50, h: 20 }, // Plataforma alta
        ],
        coins: [{ x: 270, y: GAME_HEIGHT - 130 }, { x: 430, y: GAME_HEIGHT - 230 }, { x: 650, y: GAME_HEIGHT - 130 }, { x: 310, y: GAME_HEIGHT - 330 }],
        enemies: [{ x: 250, y: GAME_HEIGHT - 130, speed: 1 }, { x: 680, y: GAME_HEIGHT - 130, speed: 1.5 }],
        goal: { x: GAME_WIDTH - 50, y: GAME_HEIGHT - 80, w: 40, h: 48 }
    }
];

let currentLevelEntities = [];

// 7. Funções de Controle de Jogo
function updateUI() {
    document.getElementById('coin-count').textContent = coins;
    document.getElementById('life-count').textContent = lives;
    document.getElementById('level-title').textContent = levelsData[currentLevelIndex].name;
}

function resetPlayerPosition() {
    const start = levelsData[currentLevelIndex].playerStart;
    player.x = start.x;
    player.y = start.y;
    player.velocityX = 0;
    player.velocityY = 0;
    player.isGrounded = false;
}

function loadLevel() {
    if (currentLevelIndex >= levelsData.length) {
        alert("Parabéns! Você completou o jogo!");
        currentLevelIndex = 0;
        coins = 0;
        lives = 3;
    }

    const levelData = levelsData[currentLevelIndex];
    resetPlayerPosition();

    currentLevelEntities = [
        ...levelData.platforms.map(p => new Platform(p.x, p.y, p.w, p.h, p.color)),
        ...levelData.coins.map(c => new Coin(c.x, c.y)),
        ...levelData.enemies.map(e => new Enemy(e.x, e.y, e.speed)),
        new Goal(levelData.goal.x, levelData.goal.y, levelData.goal.w, levelData.goal.h)
    ];

    updateUI();
}

function handleDeath() {
    lives--;
    if (lives <= 0) {
        alert("Fim de Jogo! Tente novamente.");
        lives = 3;
        coins = 0;
        currentLevelIndex = 0;
        loadLevel();
    } else {
        loadLevel();
    }
}

// 8. Lógica Principal de Movimento e Colisão
function applyPhysicsAndCollisions() {
    if (!player.isGrounded) {
        player.velocityY += GRAVITY;
    }
    player.isGrounded = false;

    // --- Colisão Horizontal (Eixo X) ---
    player.x += player.velocityX;
    currentLevelEntities.forEach(entity => {
        if (!entity.toRemove && (entity.type === 'platform' || entity instanceof Goal)) {
            if (checkAABB(player, entity)) {
                if (player.velocityX > 0) {
                    player.x = entity.x - player.width;
                } else if (player.velocityX < 0) {
                    player.x = entity.x + entity.width;
                }
                player.velocityX = 0;
            }
        }
    });

    // --- Colisão Vertical (Eixo Y) ---
    player.y += player.velocityY;
    currentLevelEntities.forEach(entity => {
        if (!entity.toRemove && (entity.type === 'platform' || entity instanceof Goal)) {
            if (checkAABB(player, entity)) {
                if (player.velocityY > 0) {
                    player.y = entity.y - player.height;
                    player.isGrounded = true;
                } else if (player.velocityY < 0) {
                    player.y = entity.y + entity.height;
                }
                player.velocityY = 0;
            }
        }
    });

    // --- Colisões de Interação (Moedas, Inimigos, Objetivo) ---
    currentLevelEntities.forEach(entity => {
        if (!entity.toRemove && checkAABB(player, entity)) {
            if (entity.type === 'coin') {
                entity.toRemove = true;
                coins++;
                updateUI();
            } else if (entity.type === 'enemy') {
                if (player.y + player.height < entity.y + entity.height && player.velocityY > 0) {
                    entity.toRemove = true;
                    player.velocityY = JUMP_VELOCITY / 2;
                } else {
                    handleDeath();
                }
            } else if (entity instanceof Goal) {
                currentLevelIndex++;
                loadLevel();
            }
        }
    });

    // Limites da Tela
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > GAME_WIDTH) player.x = GAME_WIDTH - player.width;
    if (player.y > GAME_HEIGHT) {
        handleDeath();
    }

    currentLevelEntities = currentLevelEntities.filter(e => !e.toRemove);
}

// 9. Loop Principal e Desenho
function draw() {
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    currentLevelEntities.forEach(entity => {
        entity.draw();
        if (entity.type === 'enemy') {
            entity.update();
        }
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

// 10. Controle de Eventos
document.addEventListener('keydown', (e) => {
    if (!gameRunning) return;

    if ((e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') && player.isGrounded) {
        player.velocityY = JUMP_VELOCITY;
        player.isGrounded = false;
    }
    if (e.key === 'ArrowLeft' || e.key === 'a') {
        player.velocityX = -MOVE_SPEED;
    } else if (e.key === 'ArrowRight' || e.key === 'd') {
        player.velocityX = MOVE_SPEED;
    }
});

document.addEventListener('keyup', (e) => {
    if (!gameRunning) return;

    if ((e.key === 'ArrowLeft' || e.key === 'a') && player.velocityX < 0) {
        player.velocityX = 0;
    } else if ((e.key === 'ArrowRight' || e.key === 'd') && player.velocityX > 0) {
        player.velocityX = 0;
    }
});

// 11. Inicia o Jogo (Agora espera os assets)
function startGame() {
    gameRunning = true;
    loadLevel();
    gameLoop();
}

// O jogo só iniciará automaticamente quando a sprite for carregada
// ou se houver um erro no carregamento.
// Você pode remover o `startGame()` daqui se quiser um botão de "Iniciar Jogo"
// document.addEventListener('DOMContentLoaded', () => { ... });
// Para este exemplo, manteremos a inicialização automática após o carregamento.
