/**
 * Aether Leap - Mario Competitor Engine
 * Pure Vanilla JS & Canvas API
 */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game State
let isPlaying = false;
let score = 0;
let lastTime = 0;
let cameraX = 0;
let targetCameraX = 0;
let particles = [];


// UI Elements
const menu = document.getElementById('menu');
const gameOverUI = document.getElementById('game-over');
const scoreDisplay = document.getElementById('score');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');

// Configuration
const CONFIG = {
    gravity: 0.8,
    friction: 0.8,
    jumpForce: -16,
    speed: 8,
    tileSize: 64,
    playerWidth: 64,
    playerHeight: 64,
    groundY: 0
};

// Assets
const assets = {
    background: new Image(),
    player: new Image(),
    tiles: new Image(),
    coin: new Image(),
    enemy: new Image()
};

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = Math.random() * 5 + 2;
        this.vx = (Math.random() - 0.5) * 10;
        this.vy = (Math.random() - 0.5) * 10;
        this.life = 1.0;
        this.decay = Math.random() * 0.02 + 0.02;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
        this.vy += 0.2; // gravity
    }

    draw() {
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x - cameraX, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }
}


assets.background.src = 'assets/background.png';
assets.player.src = 'assets/player.png';
assets.tiles.src = 'assets/tiles.png';
assets.coin.src = 'assets/coin.png';
assets.enemy.src = 'assets/enemy.png';

// Input Handling
const keys = {};
window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => keys[e.code] = false);

class Player {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = 100;
        this.y = canvas.height - CONFIG.tileSize - 200;
        this.vx = 0;
        this.vy = 0;
        this.width = CONFIG.playerWidth;
        this.height = CONFIG.playerHeight;
        this.grounded = false;
        this.facing = 1; // 1 for right, -1 for left
    }

    update() {
        // Movement
        if (keys['ArrowRight']) {
            this.vx = CONFIG.speed;
            this.facing = 1;
        } else if (keys['ArrowLeft']) {
            this.vx = -CONFIG.speed;
            this.facing = -1;
        } else {
            this.vx *= CONFIG.friction;
        }

        // Jump
        if (keys['Space'] && this.grounded) {
            this.vy = CONFIG.jumpForce;
            this.grounded = false;
        }

        // Gravity
        this.vy += CONFIG.gravity;

        // Apply Velocity
        this.x += this.vx;
        this.y += this.vy;

        // Ground Collision (Simple for now)
        if (this.y + this.height > canvas.height - 100) {
            this.y = canvas.height - 100 - this.height;
            this.vy = 0;
            this.grounded = true;
        }

        // Camera Follow (Smooth)
        targetCameraX = this.x - canvas.width / 3;
        if (targetCameraX < 0) targetCameraX = 0;
        cameraX += (targetCameraX - cameraX) * 0.1;

        // Particles when moving
        if (this.grounded && Math.abs(this.vx) > 0.1 && Math.random() > 0.7) {
            particles.push(new Particle(this.x + this.width / 2, this.y + this.height, '#fff'));
        }
    }


    draw() {
        ctx.save();
        if (this.facing === -1) {
            ctx.translate(this.x - cameraX + this.width, this.y);
            ctx.scale(-1, 1);
            ctx.drawImage(assets.player, 0, 0, this.width, this.height);
        } else {
            ctx.drawImage(assets.player, this.x - cameraX, this.y, this.width, this.height);
        }
        ctx.restore();
    }
}

class Level {
    constructor() {
        this.platforms = [];
        this.coins = [];
        this.enemies = [];
        this.generate();
    }

    generate() {
        // Simple procedural platform generation
        for (let i = 0; i < 20; i++) {
            this.platforms.push({
                x: i * 400 + Math.random() * 100,
                y: canvas.height - 200 - Math.random() * 200,
                w: 200,
                h: 40
            });

            if (Math.random() > 0.3) {
                this.coins.push({
                    x: i * 400 + 100,
                    y: canvas.height - 400,
                    w: 32,
                    h: 32,
                    collected: false
                });
            }
        }
    }

    draw() {
        // Draw Ground
        ctx.fillStyle = '#1a1c2c';
        ctx.fillRect(0 - cameraX, canvas.height - 100, 10000, 100);

        // Draw Platforms
        this.platforms.forEach(p => {
            ctx.drawImage(assets.tiles, 0, 0, 50, 50, p.x - cameraX, p.y, p.w, p.h);
        });

        // Draw Coins
        this.coins.forEach(c => {
            if (!c.collected) {
                ctx.drawImage(assets.coin, c.x - cameraX, c.y, c.w, c.h);
            }
        });
    }

    checkCollisions(player) {
        // Platform Collision
        player.grounded = false;
        if (player.y + player.height >= canvas.height - 100) {
            player.grounded = true;
        }

        this.platforms.forEach(p => {
            if (player.x < p.x + p.w &&
                player.x + player.width > p.x &&
                player.y + player.height > p.y &&
                player.y + player.height < p.y + p.h &&
                player.vy > 0) {
                player.y = p.y - player.height;
                player.vy = 0;
                player.grounded = true;
            }
        });

        // Coin Collision
        this.coins.forEach(c => {
            if (!c.collected &&
                player.x < c.x + c.w &&
                player.x + player.width > c.x &&
                player.y < c.y + c.h &&
                player.y + player.height > c.y) {
                c.collected = true;
                score += 10;
                scoreDisplay.innerText = score;
                // Sparkle particles
                for(let i=0; i<10; i++) particles.push(new Particle(c.x + c.w/2, c.y + c.h/2, '#ffd700'));
            }

        });
    }
}

const player = new Player();
let level = new Level();

function init() {
    resize();
    window.addEventListener('resize', resize);
    
    startBtn.addEventListener('click', startGame);
    restartBtn.addEventListener('click', startGame);
}

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

function startGame() {
    isPlaying = true;
    score = 0;
    scoreDisplay.innerText = '0';
    player.reset();
    level = new Level();
    menu.classList.add('hidden');
    gameOverUI.classList.add('hidden');
    requestAnimationFrame(gameLoop);
}

function gameLoop(timestamp) {
    if (!isPlaying) return;

    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Parallax Background
    const bgWidth = canvas.width;
    const bgX = -(cameraX * 0.2) % bgWidth;
    ctx.drawImage(assets.background, bgX, 0, bgWidth, canvas.height);
    ctx.drawImage(assets.background, bgX + bgWidth, 0, bgWidth, canvas.height);

    // Update & Draw
    player.update();
    level.checkCollisions(player);
    level.draw();
    player.draw();

    // Particles
    particles = particles.filter(p => p.life > 0);
    particles.forEach(p => {
        p.update();
        p.draw();
    });

    // Death check

    if (player.y > canvas.height) {
        endGame();
    }

    requestAnimationFrame(gameLoop);
}

function endGame() {
    isPlaying = false;
    gameOverUI.classList.remove('hidden');
    document.getElementById('final-score').innerText = score;
}

init();
