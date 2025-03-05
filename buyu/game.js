class CollisionEffect {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.lifetime = 30; // 0.5秒
        this.image = new Image();
        this.image.src = 'explosion.png';
        this.size = 40;
        this.opacity = 1;
    }

    update() {
        this.lifetime--;
        this.opacity = this.lifetime / 30;
        return this.lifetime > 0;
    }

    draw(ctx) {
        if (this.image.complete) {
            ctx.save();
            ctx.globalAlpha = this.opacity;
            ctx.translate(this.x, this.y);
            const scale = 1 - (this.lifetime / 30) * 0.5;
            ctx.scale(scale, scale);
            ctx.drawImage(this.image, -this.size/2, -this.size/2, this.size, this.size);
            ctx.restore();
        }
    }
}

class Bullet {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 5;
        this.speed = 5;
        this.angle = -Math.PI / 2;
    }

    update() {
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;

        if (this.x - this.radius <= 0 || this.x + this.radius >= 800) {
            this.angle = Math.PI - this.angle;
        }
        if (this.y - this.radius <= 0 || this.y + this.radius >= 600) {
            this.angle = -this.angle;
        }
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#FF0000';
        ctx.fill();
    }
}

class ScorePopup {
    constructor(score, x, y) {
        this.score = score;
        this.x = x;
        this.y = y;
        this.lifetime = 60;
        this.opacity = 1;
    }

    update() {
        this.lifetime--;
        this.opacity = this.lifetime / 60;
        return this.lifetime > 0;
    }

    draw(ctx) {
        ctx.fillStyle = `rgba(0, 0, 0, ${this.opacity})`;
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`+${this.score}`, this.x, this.y);
    }
}
class Target {
    constructor() {
        const sizes = [30, 40, 50, 60, 80];
        this.size = sizes[Math.floor(Math.random() * sizes.length)];
        
        this.respawn();
        
        switch(this.size) {
            case 30:
                this.color = '#00FF00';
                this.disappearChance = 0.5;
                this.score = 2;
                break;
            case 40:
                this.color = '#0000FF';
                this.disappearChance = 0.2;
                this.score = 5;
                break;
            case 50:
                this.color = '#800080';
                this.disappearChance = 0.1;
                this.score = 10;
                break;
            case 60:
                this.color = '#FFC0CB';
                this.disappearChance = 0.05;
                this.score = 20;
                break;
            case 80:
                this.color = '#FFD700';
                this.disappearChance = 0.02;
                this.score = 50;
                break;
        }
        // 降低方块移动速度
        this.speedX = (Math.random() - 0.5) * 2; // 从4改为2
        this.speedY = (Math.random() - 0.5) * 2; // 从4改为2
    }

    respawn() {
        const edge = Math.floor(Math.random() * 4);
        switch(edge) {
            case 0:
                this.x = Math.random() * 800;
                this.y = 0;
                break;
            case 1:
                this.x = 800;
                this.y = Math.random() * 600;
                break;
            case 2:
                this.x = Math.random() * 800;
                this.y = 600;
                break;
            case 3:
                this.x = 0;
                this.y = Math.random() * 600;
                break;
        }
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x <= 0 || this.x + this.size >= 800) {
            this.speedX = -this.speedX;
            this.x = Math.max(0, Math.min(800 - this.size, this.x));
        }
        if (this.y <= 0 || this.y + this.size >= 600) {
            this.speedY = -this.speedY;
            this.y = Math.max(0, Math.min(600 - this.size, this.y));
        }
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.size, this.size);
        
        ctx.fillStyle = 'white';
        ctx.font = `bold ${this.size * 0.4}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
            this.score.toString(),
            this.x + this.size / 2,
            this.y + this.size / 2
        );
    }
}
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.score = 100;
        this.bullets = [];
        this.targets = [];
        this.scorePopups = [];
        this.effects = [];
        this.scoreElement = document.getElementById('score');

        this.canvas.width = 800;
        this.canvas.height = 600;

        this.shooterX = this.canvas.width / 2;
        this.shooterY = this.canvas.height - 50;
        this.shooterAngle = -Math.PI / 2;

        // 加载图片
        this.shooterImage = new Image();
        this.bulletImage = new Image();

        // 设置默认状态
        this.useDefaultShooter = true;
        this.useDefaultBullet = true;

        // 图片加载成功时切换到图片模式
        this.shooterImage.onload = () => {
            this.useDefaultShooter = false;
        };
        this.bulletImage.onload = () => {
            this.useDefaultBullet = false;
        };

        // 设置图片源
        this.shooterImage.src = 'shooter.png';
        this.bulletImage.src = 'bullet.png';

        for (let i = 0; i < 5; i++) {
            this.targets.push(new Target());
        }

        this.canvas.addEventListener('click', () => this.shoot());
        document.addEventListener('keydown', (e) => {
            if (e.key === 'a' || e.key === 'A') {
                this.shooterAngle -= 0.1;
            } else if (e.key === 'd' || e.key === 'D') {
                this.shooterAngle += 0.1;
            }
        });

        this.gameLoop();
    }

    shoot() {
        if (this.score > 0 && this.bullets.length < 10) {
            const bullet = new Bullet(this.shooterX, this.shooterY);
            bullet.angle = this.shooterAngle;
            this.bullets.push(bullet);
            this.score--;
            this.updateScore();
        }
    }

    checkCollision(bullet, target) {
        return bullet.x + bullet.radius > target.x &&
               bullet.x - bullet.radius < target.x + target.size &&
               bullet.y + bullet.radius > target.y &&
               bullet.y - bullet.radius < target.y + target.size;
    }

    updateScore() {
        this.scoreElement.textContent = `积分：${this.score}`;
    }

    update() {
        this.targets.forEach(target => target.update());
        this.scorePopups = this.scorePopups.filter(popup => popup.update());
        this.effects = this.effects.filter(effect => effect.update());

        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            bullet.update();

            for (let j = this.targets.length - 1; j >= 0; j--) {
                const target = this.targets[j];
                if (this.checkCollision(bullet, target)) {
                    // 添加碰撞特效
                    this.effects.push(new CollisionEffect(bullet.x, bullet.y));
                    this.bullets.splice(i, 1);
                    
                    if (Math.random() < target.disappearChance) {
                        this.score += target.score;
                        this.scorePopups.push(new ScorePopup(
                            target.score,
                            this.shooterX,
                            this.shooterY - 30
                        ));
                        this.targets.splice(j, 1);
                        this.targets.push(new Target());
                        this.updateScore();
                    }
                    break;
                }
            }
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制炮台
        this.ctx.save();
        this.ctx.translate(this.shooterX, this.shooterY);
        this.ctx.rotate(this.shooterAngle + Math.PI / 2);
        if (this.useDefaultShooter) {
            // 使用默认样式绘制炮台
            this.ctx.beginPath();
            this.ctx.arc(0, 0, 20, 0, Math.PI * 2);
            this.ctx.fillStyle = '#0000FF';
            this.ctx.fill();
            this.ctx.beginPath();
            this.ctx.moveTo(0, 0);
            this.ctx.lineTo(0, -30);
            this.ctx.strokeStyle = '#0000FF';
            this.ctx.lineWidth = 5;
            this.ctx.stroke();
        } else {
            this.ctx.drawImage(this.shooterImage, -20, -20, 40, 40);
        }
        this.ctx.restore();
        
        // 绘制其他元素
        this.targets.forEach(target => target.draw(this.ctx));
        
        // 绘制子弹
        this.bullets.forEach(bullet => {
            if (this.useDefaultBullet) {
                bullet.draw(this.ctx);
            } else {
                this.ctx.save();
                this.ctx.translate(bullet.x, bullet.y);
                this.ctx.rotate(bullet.angle + Math.PI / 2);
                this.ctx.drawImage(this.bulletImage, -bullet.radius, -bullet.radius, 
                                 bullet.radius * 2, bullet.radius * 2);
                this.ctx.restore();
            }
        });
        
        // 绘制特效
        this.effects.forEach(effect => effect.draw(this.ctx));
        this.scorePopups.forEach(popup => popup.draw(this.ctx));
    }

    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

window.onload = () => {
    new Game();
};