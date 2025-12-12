// Obtém o elemento canvas e o contexto 2D
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// --- 1. Carregamento do Sprite (NOVO) ---
const playerSprite = new Image();
playerSprite.src = 'girl_sprite.png'; // CERTIFIQUE-SE QUE ESTE ARQUIVO EXISTE!

// Se o sprite não for quadrado, ajuste as dimensões:
const PLAYER_WIDTH = 32;  // Largura do seu sprite
const PLAYER_HEIGHT = 32; // Altura do seu sprite

// --- Configurações Globais ---
const GAME_WIDTH = canvas.width;
const GAME_HEIGHT = canvas.height;
const GRAVITY = 0.8; 
const JUMP_VELOCITY = -17; 
const MOVE_SPEED = 5;

// --- Objeto Jogador ---
let player = {
    x: 50,
    y: GAME_HEIGHT - 80, 
    width: PLAYER_WIDTH,    // Usando a largura do sprite
    height: PLAYER_HEIGHT,  // Usando a altura do sprite
    velocityX: 0,
    velocityY: 0,
    isGrounded: false 
};

// ... [O restante da sua classe Platform e Goal permanece o mesmo] ...

class Platform {
    constructor(x, y, w, h, color = 'green') {
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
        this.color = color;
    }
}

class Goal extends Platform {
    constructor(x, y, w, h) {
        super(x, y, w, h, 'yellow');
    }
}

// Definição das Fases (MANTIDO)
const levels = [
    {
        name: "Fase Fácil",
        platforms: [
            new Platform(0, GAME_HEIGHT - 50, GAME_WIDTH, 50, 'darkgreen'),
            new Platform(200, GAME_HEIGHT - 150, 150, 20),
            new Platform(450, GAME_HEIGHT - 250, 150, 20),
            new Goal(GAME_WIDTH - 70, GAME_HEIGHT - 100, 50, 50)
        ],
        playerStart: { x: 50, y: GAME_HEIGHT - 80 }
    },
    {
        name: "Fase Difícil",
        platforms: [
            new Platform(0, GAME_HEIGHT - 50, GAME_WIDTH, 50, 'darkred'),
            new Platform(100, GAME_HEIGHT - 100, 50, 20), 
            new Platform(300, GAME_HEIGHT - 250, 200, 20), 
            new Platform(600, GAME_HEIGHT - 150, 100, 20), 
            new Goal(GAME_WIDTH - 70, GAME_HEIGHT - 100, 50, 50)
        ],
        playerStart: { x: 50, y: GAME_HEIGHT - 80 }
    }
];

let currentLevelIndex = 0;
let currentPlatforms = [];
let currentGoal;

function loadLevel(index) {
    if (index >= levels.length) {
        alert("Parabéns! Você completou todas as fases!");
        currentLevelIndex = 0; 
    }

    const levelData = levels[currentLevelIndex];
    document.querySelector('h1').textContent = `Fase Atual: ${levelData.name}`;

    currentPlatforms = levelData.platforms.filter(p => !(p instanceof Goal));
    currentGoal = levelData.platforms.find(p => p instanceof Goal);
    
    player.x = levelData.playerStart.x;
    player.y = levelData.playerStart.y;
    player.velocityY = 0;
    player.velocityX = 0;
    player.isGrounded = false;
}

function checkCollision(objA, objB) {
    return objA.x < objB.x + objB.width &&
           objA.x + objA.width > objB.x &&
           objA.y < objB.y + objB.height &&
           objA.y + objA.height > objB.y;
}

function applyPhysicsAndCollisions() {
    // ... [A lógica de física e colisão permanece a mesma] ...
    
    // 1. Aplicar gravidade
    if (!player.isGrounded) {
        player.velocityY += GRAVITY;
    }
    
    // 2. Atualizar posição com velocidade
    player.x += player.velocityX;
    player.y += player.velocityY;

    player.isGrounded = false;
    
    // 3. Checar colisão com Plataformas
    [...currentPlatforms, currentGoal].forEach(platform => {
        // Colisão vertical (de cima)
        if (player.velocityY >= 0 && 
            player.x < platform.x + platform.width &&
            player.x + player.width > platform.x &&
            player.y + player.height > platform.y &&
            player.y < platform.y) 
        {
            // Pousar na plataforma
            player.velocityY = 0;
            player.y = platform.y - player.height;
            player.isGrounded = true;
        }

        // Colisão com o objetivo (Goal)
        if (platform === currentGoal && checkCollision(player, currentGoal)) {
            currentLevelIndex++;
            loadLevel(currentLevelIndex);
        }
    });

    // 4. Checar limites da tela 
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > GAME_WIDTH) player.x = GAME_WIDTH - player.width;

    // 5. Game Over (Se cair para fora da tela)
    if (player.y > GAME_HEIGHT) {
        alert(`Game Over! Você caiu. Reiniciando a fase ${levels[currentLevelIndex].name}.`);
        loadLevel(currentLevelIndex);
    }
}

// --- Funções de Desenho (ATUALIZADA) ---

function drawPlayer() {
    // Desenha a imagem do sprite
    ctx.drawImage(
        playerSprite, 
        player.x, 
        player.y, 
        player.width, 
        player.height
    );
}

function draw() {
    // Limpa a tela
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Desenha plataformas
    [...currentPlatforms, currentGoal].forEach(platform => {
        ctx.fillStyle = platform.color;
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);

        if (platform === currentGoal) {
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 3;
            ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
        }
    });
    
    // Desenha o Jogador
    drawPlayer();
}

// --- Loop Principal do Jogo e Controles (MANTIDO) ---

function gameLoop() {
    applyPhysicsAndCollisions();
    draw();
    requestAnimationFrame(gameLoop);
}

document.addEventListener('keydown', (e) => {
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
    if ((e.key === 'ArrowLeft' || e.key === 'a') && player.velocityX < 0) {
        player.velocityX = 0;
    } else if ((e.key === 'ArrowRight' || e.key === 'd') && player.velocityX > 0) {
        player.velocityX = 0;
    }
});

// --- Inicia o Jogo ---

// Espera o sprite carregar antes de iniciar o jogo para evitar erros.
playerSprite.onload = () => {
    loadLevel(currentLevelIndex);
    gameLoop();
};
// Se o sprite já estiver no cache, inicia imediatamente:
if (playerSprite.complete) {
    loadLevel(currentLevelIndex);
    gameLoop();
}
