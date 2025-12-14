// 5. Dados da Fase (REMOVIDO - Agora é gerado dinamicamente)
// ... (Remova o objeto 'levelData' grande) ...

let currentLevelEntities = [];

// Funções de Geração (Simples Gerador Básico de Obstáculos)
function generateEntities() {
    const LAST_ENTITY_X = currentLevelEntities.length > 0
        ? currentLevelEntities[currentLevelEntities.length - 1].x
        : GAME_WIDTH;

    // Apenas gera se a última entidade estiver perto o suficiente (distância mínima de 150 pixels)
    if (LAST_ENTITY_X > GAME_WIDTH - 150) {
        return;
    }

    // Geração de Entidades
    // 1. Escolhe uma pista aleatória para o obstáculo
    const LANE_INDEX = Math.floor(Math.random() * 3);
    const X_POS = LANES_X[LANE_INDEX] - 15; // Ajuste para o centro da entidade (30px/2)

    // 2. Decide se gera um inimigo ou uma moeda
    const type = Math.random() < 0.6 ? 'enemy' : 'coin'; // 60% chance de ser inimigo
    
    // Posição Y no chão (base do canvas - altura da entidade)
    const Y_POS = GAME_HEIGHT - 32 - (type === 'coin' ? 20 : 30); 

    let newEntity;
    if (type === 'enemy') {
        // Inimigo (Obstáculo fixo que se move com o mundo)
        newEntity = new Enemy(GAME_WIDTH, Y_POS, 0); // speed 0, só se move com o WORLD_SPEED
    } else {
        // Moeda
        newEntity = new Coin(GAME_WIDTH, Y_POS);
    }

    currentLevelEntities.push(newEntity);
    
    // Geração de mais moedas (bônus na pista adjacente)
    if (type === 'coin' && Math.random() < 0.5) {
        const ADJACENT_LANE = (LANE_INDEX + 1) % 3;
        const ADJACENT_X = LANES_X[ADJACENT_LANE] - 10;
        currentLevelEntities.push(new Coin(GAME_WIDTH + 50, GAME_HEIGHT - 100)); // Moeda aérea
    }
}

// 6. Funções de Controle de Jogo (Simplificadas)

function initializeGame() {
    // Apenas um chão inicial
    currentLevelEntities = [
        new Platform(0, GAME_HEIGHT - 32, GAME_WIDTH, 32, '#6c3b0d'),
    ];
    
    resetPlayerPosition();

    gameTime = 0;
    updateUI();
}

// ... (handleWin é removido, pois o jogo nunca "vence" formalmente) ...

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

function resetPlayerPosition() {
    // Move o jogador para a pista central no início ou morte
    currentLane = 1;
    player.x = LANES_X[currentLane] - PLAYER_WIDTH / 2;
    player.y = GAME_HEIGHT - 32 - PLAYER_HEIGHT; 
    targetX = player.x; // Define o alvo inicial
    player.velocityY = 0;
    player.isGrounded = true;
}


// 7. Lógica Principal de Movimento e Colisão (Adaptada para Movimento do Mundo)

function applyPhysicsAndCollisions() {
    // Movimento do Jogador (Gravidade e Transição de Pista)
    player.update();

    // Movimento do Mundo (World Scroll)
    currentLevelEntities.forEach(entity => {
        entity.x -= WORLD_SPEED;
    });
    generationDistance += WORLD_SPEED;
    
    // Geração de novas entidades
    generateEntities();

    // Colisão (Apenas colisões verticais e interações são relevantes)
    player.isGrounded = false;

    currentLevelEntities.forEach(entity => {
        if (!entity.toRemove && checkAABB(player, entity)) {
            
            // Colisão com o Chão (a única plataforma relevante)
            if (entity.type === 'platform') {
                if (player.velocityY >= 0 && player.y + player.height <= entity.y + player.velocityY) {
                    player.velocityY = 0;
                    player.y = entity.y - player.height;
                    player.isGrounded = true;
                }
            } 
            
            // Interações
            else if (entity.type === 'coin') {
                entity.toRemove = true;
                coins++;
                updateUI();
            } else if (entity.type === 'enemy') {
                // Em Subway Surfers, inimigos e obstáculos não podem ser pulados (geralmente)
                handleDeath();
            }
        }
    });

    // Limites da Tela (APENAS VERTICAL)
    if (player.y > GAME_HEIGHT) {
        handleDeath();
    }

    // Limpeza de Entidades que saíram da tela
    currentLevelEntities = currentLevelEntities.filter(e => !e.toRemove && e.x + e.width > 0);
}

// 8. Loop Principal e Desenho
function draw() {
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Linhas Guia para as pistas (Opcional, para ajudar a visualizar)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    LANES_X.forEach(x => {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, GAME_HEIGHT);
        ctx.stroke();
    });

    // Desenha as Entidades
    currentLevelEntities.forEach(entity => {
        entity.draw();
        // Os inimigos agora só se movem com o mundo, então removemos entity.update()
    });

    player.draw();
}

// 9. Controle de Eventos (AGORA CONTROLA A TROCA DE PISTAS)
document.addEventListener('keydown', (e) => {
    if (!gameRunning) return;
    
    // Pulo (vertical)
    if ((e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') && player.isGrounded) {
        player.velocityY = JUMP_VELOCITY;
        player.isGrounded = false;
    }

    // Troca de Pista (horizontal)
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
    // O movimento de X do jogador é tratado no player.update() para ser suave
});

document.addEventListener('keyup', (e) => {
    // Não precisamos mais de keyup, pois o movimento é baseado em posição alvo
});

// 10. Inicia o Jogo (MANTIDO)
function startGame() {
    initializeGame();
    gameRunning = true;
    timerInterval = setInterval(updateTimer, 1000); 
    gameLoop();
}

startGame();
