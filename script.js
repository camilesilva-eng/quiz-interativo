// --- script.js (Fase Grande, Retângulo e Temporizador) ---

// 1. Configurações e Variáveis Iniciais
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const GAME_WIDTH = canvas.width;
const GAME_HEIGHT = canvas.height;

// Parâmetros
const GRAVITY = 0.8;
const JUMP_VELOCITY = -15;
const MOVE_SPEED = 6; // Um pouco mais rápido
const PLAYER_WIDTH = 32; // Largura do retângulo
const PLAYER_HEIGHT = 48; // Altura do retângulo

let coins = 0;
let lives = 3;
let gameRunning = false;
let gameTime = 0; // Tempo em segundos
let timerInterval = null; // Para controlar o temporizador

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
    constructor(x, y, w, h, color = '#6c3b0d') { // Cor de tijolo/terra
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
        this.startY = y; 
    }
    update() {
        this.x += this.speed * this.direction;
        
        // Simplesmente inverte a direção quando atinge os limites da tela para este exemplo
        // Em um jogo real, você faria isso com base em plataformas.
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
        ctx.fillText("VITÓRIA", this.x + this.width / 2, this.y + this.height / 2 + 6);
    }
}

// 4. Objeto Jogador (AGORA É UM RETÂNGULO EM PÉ!)
let player = {
    x: 50,
    y: 0,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    velocityX: 0,
    velocityY: 0,
    isGrounded: false,
    draw: function() {
        // Personagem: Retângulo em pé (Azul Escuro para destacar)
        ctx.fillStyle = 'darkblue';
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
};

// 5. Dados da Fase Única (Desafio Aumentado)
const levelData = {
    name: "Fase Única: O Grande Desafio",
    playerStart: { x: 50, y: 0 },
    platforms: [
        // Chão principal (longo e com buracos)
        { x: 0, y: GAME_HEIGHT - 32, w: 200, h: 32 }, // Chão inicial
        { x: 300, y: GAME_HEIGHT - 32, w: 500, h: 32 }, // Resto do chão

        // Plataformas flutuantes para pulos difíceis
        { x: 150, y: GAME_HEIGHT - 100, w: 80, h: 20 },
        { x: 280, y: GAME_HEIGHT - 180, w: 60, h: 20 },
        { x: 400, y: GAME_HEIGHT - 250, w: 100, h: 20 },

        // Plataforma secreta alta (Moedas bônus)
        { x: 550, y: GAME_HEIGHT - 300, w: 50, h: 20, color: 'brown' },

        // Ponte final (inimigo patrulhando)
        { x: 650, y: GAME_HEIGHT - 150, w: 120, h: 20 },
    ],
    coins: [
        { x: 180, y: GAME_HEIGHT - 130 }, 
        { x: 300, y: GAME_HEIGHT - 210 }, 
        { x: 450, y: GAME_HEIGHT - 280 }, 
        { x: 560, y: GAME_HEIGHT - 330 }, // Moeda secreta
        { x: 700, y: GAME_HEIGHT - 180 }, 
        { x: 740, y: GAME_HEIGHT - 180 }
    ],
    enemies: [
        { x: 350, y: GAME_HEIGHT - 62, speed: 1.5 }, // Patrulha no chão
        { x: 450, y: GAME_HEIGHT - 280, speed: 0.5 }, // Patrulha lenta na plataforma
        { x: 680, y: GAME_HEIGHT - 180, speed: 2 } // Patrulha rápida na ponte
    ],
    goal: { x: GAME_WIDTH - 80, y: GAME_HEIGHT - 80, w: 40, h: 48 }
};

let currentLevelEntities = [];

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
    document.getElementById('level-title').textContent = levelData.name;
    document.getElementById('time-count').textContent = formatTime(gameTime);
}

function resetPlayerPosition() {
    const start = levelData.playerStart;
    player.x = start.x;
    player.y = start.y;
    player.velocityX = 0;
    player.velocityY = 0;
    player.isGrounded = false;
}

function initializeGame() {
    resetPlayerPosition();

    currentLevelEntities = [
        ...levelData.platforms.map(p => new Platform(p.x, p.y, p.w, p.h, p.color)),
        ...levelData.coins.map(c => new Coin(c.x, c.y)),
        ...levelData.enemies.map(e => new Enemy(e.x, e.y, e.speed)),
        new Goal(levelData.goal.x, levelData.goal.y, levelData.goal.w, levelData.goal.h)
    ];

    gameTime = 0;
    updateUI();
}

function handleWin() {
    gameRunning = false;
    clearInterval(timerInterval);
    alert(`VITÓRIA! Você completou a fase em ${formatTime(gameTime)} com ${coins} moedas!`);
    // Reinicia o jogo
    coins = 0;
    lives = 3;
    startGame();
}

function handleDeath() {
    lives--;
    if (lives <= 0) {
        gameRunning = false;
        clearInterval(timerInterval);
        alert("Fim de Jogo! Tente novamente.");
        // Reinicia totalmente
        coins = 0;
        lives = 3;
        startGame();
    } else {
        // Volta para o início da fase com menos uma vida
        resetPlayerPosition();
        updateUI();
    }
}

// 7. Lógica Principal de Movimento e Colisão
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
                // Pisar no inimigo
                if (player.y + player.height < entity.y + entity.height && player.velocityY > 0) {
                    entity.toRemove = true;
                    player.velocityY = JUMP_VELOCITY / 2;
                } else {
                    handleDeath(); // Se for colisão lateral ou por baixo
                }
            } else if (entity instanceof Goal) {
                if (player.isGrounded) { 
                    handleWin();
                }
            }
        }
    });

    // Limites da Tela e Morte por Queda
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > GAME_WIDTH) player.x = GAME_WIDTH - player.width;
    if (player.y > GAME_HEIGHT) {
        handleDeath();
    }

    currentLevelEntities = currentLevelEntities.filter(e => !e.toRemove);
}

// 8. Loop Principal e Desenho
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

// 9. Controle de Eventos
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

// 10. Inicia o Jogo
function startGame() {
    initializeGame();
    gameRunning = true;
    // Inicia o temporizador, atualizando a cada 1000ms (1 segundo)
    timerInterval = setInterval(updateTimer, 1000); 
    gameLoop();
}

startGame();
