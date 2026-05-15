const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 800; canvas.height = 450;

// CONFIGURATION
const config = {
    gravity: 0.6,
    speed: 4,
    jump: 12,
    coins: 0,
    state: 'DIALOGUE' // DIALOGUE, PLAY, SHOP, GAMEOVER
};

// ASSETS
const assets = {
    player: new Image(),
    tiles: new Image(),
    bg: new Image(),
    enemy: new Image()
};
assets.player.src = 'assets/player.png';
assets.tiles.src = 'assets/tiles.png';
assets.bg.src = 'assets/background.png';
assets.enemy.src = 'assets/enemy.png';

// DIALOGUE SYSTEM
const story = [
    { name: "Mike", text: "El ! Tu m'entends ? Le Monde à l'Envers gagne du terrain..." },
    { name: "Eleven", text: "Je dois... fermer la porte. Préparez les gaufres." }
];
let currentText = 0;

function showDialogue() {
    const box = document.getElementById('dialogue-container');
    if (currentText < story.length) {
        box.classList.remove('hidden');
        document.getElementById('speaker-name').innerText = story[currentText].name;
        typeWriter(story[currentText].text);
    } else {
        box.classList.add('hidden');
        config.state = 'PLAY';
        document.getElementById('bgMusic').play();
    }
}

function typeWriter(text) {
    let i = 0;
    const msg = document.getElementById('message');
    msg.innerText = "";
    const timer = setInterval(() => {
        msg.innerText += text[i];
        i++;
        if (i >= text.length) clearInterval(timer);
    }, 50);
}

// CLASSES
class Player {
    constructor() {
        this.x = 100; this.y = 300;
        this.w = 40; this.h = 60;
        this.dy = 0; this.dx = 0;
        this.onGround = false;
    }
    update() {
        if (keys.ArrowRight) this.dx = config.speed;
        else if (keys.ArrowLeft) this.dx = -config.speed;
        else this.dx = 0;

        if (keys.ArrowUp && this.onGround) {
            this.dy = -config.jump;
            this.onGround = false;
        }

        this.dy += config.gravity;
        this.y += this.dy;
        this.x += this.dx;

        // Collision sol simple
        if (this.y + this.h > 400) {
            this.y = 400 - this.h;
            this.dy = 0;
            this.onGround = true;
        }
    }
    draw() {
        ctx.fillStyle = '#ff003c'; // Remplacer par ctx.drawImage(assets.player, ...)
        ctx.fillRect(this.x, this.y, this.w, this.h);
    }
}

const p = new Player();
const keys = {};
window.onkeydown = (e) => {
    keys[e.key] = true;
    if (e.key === 'Enter' && config.state === 'DIALOGUE') {
        currentText++;
        showDialogue();
    }
    if (e.key === 's') config.state = 'SHOP', toggleShopUI();
};
window.onkeyup = (e) => keys[e.key] = false;

// BOUTIQUE LOGIQUE
function toggleShopUI() {
    document.getElementById('shop-screen').classList.toggle('hidden');
    document.getElementById('coin-count').innerText = config.coins;
}

function buy(item) {
    if (item === 'speed' && config.coins >= 10) {
        config.speed += 2; config.coins -= 10;
    }
    // Ajouter les autres items...
    document.getElementById('coin-count').innerText = config.coins;
}

function closeShop() {
    config.state = 'PLAY';
    toggleShopUI();
}

// BOUCLE DE JEU
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Background parallax
    ctx.drawImage(assets.bg, 0, 0, canvas.width, canvas.height);

    if (config.state === 'PLAY') {
        p.update();
        p.draw();
        
        // Simuler collecte
        if (Math.random() > 0.99) config.coins++;
    }

    requestAnimationFrame(gameLoop);
}

// INIT
showDialogue();
gameLoop();
