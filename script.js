// Simple 2D platformer template (Canvas)
// Estrutura: player, tile map, moedas, inimigo simples, score

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const SCALE = 2; // use com sprites pixelados
const W = canvas.width;
const H = canvas.height;

// Assets (substitua pelas suas imagens em /assets)
const assets = {
  player: 'assets/girl.png',
  tiles: 'assets/tiles.png',
  coin: 'assets/coin.png',
  enemy: 'assets/enemy.png'
};

let images = {};
let keys = {};

// Load imagens simples
function loadImages(list, cb) {
  let toLoad = Object.keys(list).length;
  for (let k in list) {
    const img = new Image();
    img.src = list[k];
    img.onload = () => {
      images[k] = img;
      toLoad--;
      if (toLoad === 0) cb();
    };
    img.onerror = () => {
      console.warn(`Falha ao carregar ${list[k]}. Verifique o caminho em assets.`);
      images[k] = null;
      toLoad--;
      if (toLoad === 0) cb();
    };
  }
}

// --- Game state ---
const gravity = 0.9;
let score = 0;
let gameOver = false;

// Tile system (simples): 0 = vazio, 1 = plataforma sólida
const tileSize = 32;
const mapCols = Math.floor(W / tileSize);
const mapRows = Math.floor(H / tileSize);

// Exemplo de nível (matriz)
const level = [
  // cada número representa uma coluna de tiles; aqui criamos linhas visualmente
];

// cria um nível simples: chão + alguns blocos
function makeLevel() {
  const rows = mapRows;
  const cols = mapCols;
  const m = Array.from({length: rows}, () => Array(cols).fill(0));

  // chão nas últimas 2 linhas
  for (let c = 0; c < cols; c++) {
    m[rows-1][c] = 1;
    m[rows-2][c] = 1;
  }

  // alguns blocos soltos
  m[rows-4][5] = 1;
  m[rows-6][10] = 1;
  m[rows-5][14] = 1;
  m[rows-7][20] = 1;
  return m;
}
let tileMap = makeLevel();

// Moedas (posições em tiles)
let coins = [
  {x: 5*tileSize, y: (mapRows-5)*tileSize, taken:false},
  {x: 10*tileSize, y: (mapRows-7)*tileSize, taken:false},
  {x: 14*tileSize, y: (mapRows-6)*tileSize, taken:false}
];

// Inimigo simples
let enemy = {x: 500, y: (mapRows-3)*tileSize - 32, w: 32, h: 32, dir: -1, speed: 1.2};

// Player
const player = {
  x: 80,
  y: (mapRows-4)*tileSize - 32,
  w: 28,
  h: 32,
  vx: 0,
  vy: 0,
  speed: 2.6,
  onGround: false,
  facing: 1 // 1 direita, -1 esquerda
};

function rectsOverlap(a,b) {
  return a.x < b.x + b.w && a.x + a.w > b.x &&
         a.y < b.y + b.h && a.y + a.h > b.y;
}

// Tile collision helper
function tileAtPixel(x,y) {
  const col = Math.floor(x / tileSize);
  const row = Math.floor(y / tileSize);
  if (row < 0 || col < 0 || row >= tileMap.length || col >= tileMap[0].length) return 0;
  return tileMap[row][col];
}

function collideWithTiles(obj) {
  // simples: verifica quatro cantos
  obj.onGround = false;
  // prever movimento vertical
  obj.y += obj.vy;
  // checar colisões verticais
  const points = [
    {x: obj.x + 2, y: obj.y + obj.h},
    {x: obj.x + obj.w - 2, y: obj.y + obj.h},
    {x: obj.x + 2, y: obj.y},
    {x: obj.x + obj.w - 2, y: obj.y}
  ];
  for (const p of points) {
    if (tileAtPixel(p.x, p.y) === 1) {
      // se colidiu por baixo (estava caindo)
      if (obj.vy > 0) {
        obj.y = Math.floor((p.y) / tileSize) * tileSize - obj.h;
        obj.vy = 0;
        obj.onGround = true;
      } else if (obj.vy < 0) {
        // bateu a cabeça
        obj.y = (Math.floor(p.y / tileSize) + 1) * tileSize;
        obj.vy = 0;
      }
    }
  }

  // prever movimento horizontal
  obj.x += obj.vx;
  const hpoints = [
    {x: obj.x, y: obj.y + 4},
    {x: obj.x + obj.w, y: obj.y + 4},
    {x: obj.x, y: obj.y + obj.h - 4},
    {x: obj.x + obj.w, y: obj.y + obj.h - 4}
  ];
  for (const p of hpoints) {
    if (tileAtPixel(p.x, p.y) === 1) {
      // colisão horizontal: simples correção
      if (obj.vx > 0) {
        obj.x = Math.floor(p.x / tileSize) * tileSize - obj.w - 0.01;
        obj.vx = 0;
      } else if (obj.vx < 0) {
        obj.x = (Math.floor(p.x / tileSize) + 1) * tileSize + 0.01;
        obj.vx = 0;
      }
    }
  }
}

// Input
window.addEventListener('keydown', e => {
  keys[e.code] = true;
});
window.addEventListener('keyup', e => {
  keys[e.code] = false;
});

// Restart
document.getElementById('restart').addEventListener('click', () => {
  restart();
});

function restart() {
  tileMap = makeLevel();
  coins.forEach(c => c.taken = false);
  score = 0;
  player.x = 80; player.y = (mapRows-4)*tileSize - 32; player.vx = 0; player.vy = 0;
  gameOver = false;
}

// Update loop
function update(dt) {
  if (gameOver) return;

  // Player controls: left/right/jump
  let accel = 0;
  if (keys['ArrowLeft'] || keys['KeyA']) { accel = -1; player.facing = -1; }
  if (keys['ArrowRight'] || keys['KeyD']) { accel = 1; player.facing = 1; }

  player.vx = accel * player.speed;
  // jump
  if ((keys['ArrowUp'] || keys['KeyW'] || keys['Space']) && player.onGround) {
    player.vy = -14;
    player.onGround = false;
  }

  // gravity
  player.vy += gravity;
  if (player.vy > 16) player.vy = 16;

  // Apply collisions with tiles
  collideWithTiles(player);

  // Coins
  coins.forEach(c => {
    if (!c.taken) {
      const coinRect = {x:c.x, y:c.y, w:24, h:24};
      if (rectsOverlap(player, coinRect)) {
        c.taken = true;
        score += 10;
        updateScore();
      }
    }
  });

  // Enemy simple patrol
  enemy.x += enemy.dir * enemy.speed;
  // inverte ao encostar em plataformas
  const leftFoot = {x: enemy.x, y: enemy.y + enemy.h + 2};
  const rightFoot = {x: enemy.x + enemy.w, y: enemy.y + enemy.h + 2};
  if (tileAtPixel(leftFoot.x, leftFoot.y) === 0 || tileAtPixel(rightFoot.x, rightFoot.y) === 0) {
    enemy.dir *= -1;
  }
  // bate no player?
  if (rectsOverlap(player, enemy)) {
    // se o player estiver caindo sobre o inimigo, derrota o inimigo
    if (player.vy > 0 && (player.y + player.h - enemy.y) < 16) {
      // stomp
      score += 20;
      enemy.x = -1000; // tira temporariamente
      player.vy = -8;
      updateScore();
    } else {
      // jogador perde: restart simples
      gameOver = true;
      setTimeout(() => alert('Você perdeu! Aperte Reiniciar.'), 50);
    }
  }
}

function updateScore() {
  document.getElementById('score').textContent = `Score: ${score}`;
}

// Draw
function draw() {
  ctx.clearRect(0,0,W,H);

  // draw tiles
  for (let r=0;r<tileMap.length;r++){
    for (let c=0;c<tileMap[0].length;c++){
      if (tileMap[r][c] === 1) {
        ctx.fillStyle = "#7b5e3c"; // cor temporária
        ctx.fillRect(c*tileSize, r*tileSize, tileSize, tileSize);
        // se tiver tileset: desenhe imagem em vez do fillRect
        // if (images.tiles) ctx.drawImage(images.tiles, ...)
      }
    }
  }

  // Draw coins
  coins.forEach(c => {
    if (!c.taken) {
      if (images.coin) {
        ctx.drawImage(images.coin, c.x, c.y, 24, 24);
      } else {
        ctx.fillStyle = 'gold';
        ctx.beginPath();
        ctx.arc(c.x+12, c.y+12, 10, 0, Math.PI*2);
        ctx.fill();
      }
    }
  });

  // Draw enemy
  if (enemy.x > -500) {
    if (images.enemy) ctx.drawImage(images.enemy, enemy.x, enemy.y, enemy.w, enemy.h);
    else {
      ctx.fillStyle = 'crimson';
      ctx.fillRect(enemy.x, enemy.y, enemy.w, enemy.h);
    }
  }

  // Draw player (placeholder)
  if (images.player) {
    // desenha sprite (ajuste conforme seu spritesheet)
    ctx.drawImage(images.player, player.x, player.y, player.w, player.h);
  } else {
    ctx.fillStyle = '#2a9d8f';
    ctx.fillRect(player.x, player.y, player.w, player.h);
  }
}

// Main loop
let last = 0;
function loop(ts) {
  const dt = (ts - last) / 1000;
  last = ts;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

// Start
loadImages(assets, () => {
  updateScore();
  requestAnimationFrame(loop);
});
