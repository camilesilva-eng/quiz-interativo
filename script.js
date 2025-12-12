// Obtém o elemento canvas e o contexto 2D para desenhar
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// --- Configurações do Jogo ---
const GAME_WIDTH = canvas.width;
const GAME_HEIGHT = canvas.height;
const GRAVITY = 0.98;
const JUMP_STRENGTH = 15;

// --- Objeto Jogador ---
let player = {
    x: 50,
    y: GAME_HEIGHT - 80, // Quase no chão
    width: 30,
    height: 30,
    color: 'blue',
    velocityX: 0,
    velocityY: 0,
    isJumping: false
};

// --- Funções de Desenho ---
function drawPlayer() {
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);
}

function drawGround() {
    ctx.fillStyle = 'green';
    // Desenha o chão na parte inferior
    ctx.fillRect(0, GAME_HEIGHT - 50, GAME_WIDTH, 50);
}

function updateGame() {
    // 1. Limpa a tela a cada frame
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // 2. Aplicar Gravidade
    if (player.y + player.height < GAME_HEIGHT - 50) {
        player.velocityY += GRAVITY;
    } else {
        // Colidir com o "chão"
        player.velocityY = 0;
        player.y = GAME_HEIGHT - 50 - player.height;
        player.isJumping = false;
    }

    // 3. Atualizar Posição
    player.x += player.velocityX;
    player.y += player.velocityY;

    // 4. Desenhar elementos
    drawGround();
    drawPlayer();

    // 5. Loop do jogo
    requestAnimationFrame(updateGame);
}

// --- Controle de Eventos (Teclado) ---
document.addEventListener('keydown', (e) => {
    // Tecla Espaço ou Cima para pular
    if ((e.key === ' ' || e.key === 'ArrowUp') && !player.isJumping) {
        player.velocityY = -JUMP_STRENGTH; // Força para cima
        player.isJumping = true;
    }
    // Tecla Esquerda/Direita para mover (simples)
    if (e.key === 'ArrowLeft') {
        player.velocityX = -3;
    } else if (e.key === 'ArrowRight') {
        player.velocityX = 3;
    }
});

document.addEventListener('keyup', (e) => {
    // Parar de mover horizontalmente quando a tecla é solta
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        player.velocityX = 0;
    }
});

// Inicia o Loop do Jogo
updateGame();
