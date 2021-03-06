const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');

canvas.width = innerWidth;
canvas.height = innerHeight;

const scoreEl = document.querySelector('#scoreEl');
const startGameBtn = document.querySelector('#startGameBtn');
const modalEl = document.querySelector("#modalEl");
const bigScoreEl = document.querySelector("#bigScoreEl");

class Player {
    constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
        this.fireSpeed = 2;
        this.fireCount = 5;
    }

    draw() {
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI*2, false);
        c.fillStyle = this.color;
        c.fill();
    }

    update() {
        this.draw();
        this.x = Math.min(Math.max(this.x + this.velocity.x, 0), canvas.width);
        this.y = Math.min(Math.max(this.y + this.velocity.y, 0), canvas.height);
    }
}

class Projectile {
    constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
    }

    draw() {
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI*2, false);
        c.fillStyle = this.color;
        c.fill();
    }

    update() {
        this.draw();
        this.x = this.x + this.velocity.x;
        this.y = this.y + this.velocity.y;
    }
}

class Enemy {
    constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
    }

    draw() {
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI*2, false);
        c.fillStyle = this.color;
        c.fill();
    }

    update() {
        this.draw();
        this.x += this.velocity.x;
        this.y += this.velocity.y;
    }
}

const friction = 0.98;
class Particle {
    constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
        this.alpha = 1;
    }

    draw() {
        c.save();
        c.globalAlpha = this.alpha;
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI*2, false);
        c.fillStyle = this.color;
        c.fill();
        c.restore();
    }

    update() {
        this.draw();
        this.velocity.x *= friction;
        this.velocity.y *= friction;
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.alpha -= 0.01;
    }
}


let x = canvas.width / 2;
let y = canvas.height / 2;

let player = new Player(x, y, 10, 'white', { x: 0, y: 0});
let projectiles = [];
let enemies = [];
let particles = [];
let score = 0;

function init() {
    player = new Player(x, y, 10, 'white', { x: 0, y: 0});
    projectiles = [];
    enemies = [];
    particles = [];
    score = 0;
    scoreEl.innerHTML = score;
    bigScoreEl.innerHTML = score;
}

function spawnProjectiles() {
    setInterval(() => {
        for ( let i=0; i<player.fireCount; ++i ) {
            const angle = Math.atan2(player.velocity.y, player.velocity.x) + (Math.PI / 3 / 2) - (i * Math.PI / 3 / player.fireCount);
            const velocity = {
                x: Math.cos(angle) * 5,
                y: Math.sin(angle) * 5
            }
            projectiles.push(new Projectile(player.x, player.y, 4.5, 'white', velocity));
        }
    }, 1000 / player.fireSpeed);
}

function spawnEnemies() {
    setInterval(() => {
        const radius = Math.random() * (30 - 4) + 4;
        
        let x;
        let y;

        if ( Math.random() < 0.5 ) {
            x = Math.random() < 0.5 ? 0 - radius : canvas.width + radius;
            y = Math.random() * canvas.height;
            
        } else {
            x = Math.random() * canvas.width;
            y = Math.random() < 0.5 ? 0 - radius : canvas.height + radius;
        }
        const color = `hsl(${Math.random() * 360}, 50%, 50%)`;
        const angle = Math.atan2(player.y - y, 
            player.x - x);
        const velocity = {
            x: Math.cos(angle),
            y: Math.sin(angle)
        };
        enemies.push(new Enemy(x, y, radius, color, velocity));
    }, 1000);
}

let animationId;
function animate() {
    animationId = requestAnimationFrame(animate);
    c.fillStyle = 'rgba(0, 0, 0, 0.1)';
    c.fillRect(0, 0, canvas.width, canvas.height);
    player.update();
    particles.forEach((particle, index) => {
        if ( particle.alpha <= 0 ) {
            particles.splice(index, 1);
        } else {
            particle.update();
        }
    })
    projectiles.forEach((projectile, index) => {
        projectile.update();

        // remove from edges of screen
        if ( projectile.x + projectile.radius < 0 ||
            projectile.x - projectile.radius > canvas.width ||
            projectile.y + projectile.radius < 0 ||
            projectile.y - projectile.radius > canvas.width ) {
            setTimeout(() => {
                projectiles.splice(index, 1);
            }, 0);
        }
    });
    enemies.forEach((enemy, index) => {
        enemy.update();

        const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);

        // end game
        if ( dist - enemy.radius - player.radius < 1 ) {
            cancelAnimationFrame(animationId);
            modalEl.style.display = 'flex';
            bigScoreEl.innerHTML = score;
        }

        projectiles.forEach((projectile, projectileIndex) => {
            const dist = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y);

            // when projectiles touch enemy
            if ( dist - enemy.radius - projectile.radius < 1 ) {
                // create explosions
                for ( let i=0; i<enemy.radius * 2; ++i ) {
                    particles.push(new Particle(projectile.x, projectile.y, Math.random() * 2, 
                    enemy.color, { 
                        x: (Math.random() - 0.5) * (Math.random() * 6), 
                        y: (Math.random() - 0.5) * (Math.random() * 6)
                    }));
                }
                
                if ( enemy.radius - 10 > 5 ) {
                    // increase our score
                    score += 100;
                    scoreEl.innerHTML = score;

                    gsap.to(enemy, {
                        radius: enemy.radius - 10
                    });
                    // enemy.radius -= 10;
                    setTimeout(() => {
                        projectiles.splice(projectileIndex, 1);
                    }, 0);
                } else {
                    // remove from scene altogether
                    score += 250;
                    scoreEl.innerHTML = score;
                    
                    setTimeout(() => {
                        enemies.splice(index, 1);
                        projectiles.splice(projectileIndex, 1);
                    }, 0);
                }
            }
        });
    });
}

window.addEventListener('resize', () => {
    // resize
    canvas.width = innerWidth;
    canvas.height = innerHeight;
});

window.addEventListener('mousemove', (event) => {
    // move player to mouse
    const angle = Math.atan2(event.clientY - player.y, 
        event.clientX - player.x);
    const velocity = {
        x: Math.cos(angle) * 4,
        y: Math.sin(angle) * 4
    };
    player.velocity = velocity;

    // enemy chase player
    enemies.forEach((enemy) => {
        const angle = Math.atan2(player.y - enemy.y, 
            player.x - enemy.x);
        const velocity = {
            x: Math.cos(angle) * 2,
            y: Math.sin(angle) * 2
        };
        enemy.velocity = velocity;
    });
});

startGameBtn.addEventListener('click', () => {
    init();
    animate();
    spawnProjectiles();
    spawnEnemies();
    modalEl.style.display = 'none';
});
