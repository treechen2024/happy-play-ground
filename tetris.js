// 遊戲常數
const BLOCK_SIZE = 30;
const COLS = 10;
const ROWS = 20;
const SHAPES = [
    [[1, 1, 1, 1]], // I
    [[1, 1], [1, 1]], // O
    [[1, 1, 1], [0, 1, 0]], // T
    [[1, 1, 1], [1, 0, 0]], // L
    [[1, 1, 1], [0, 0, 1]], // J
    [[1, 1, 0], [0, 1, 1]], // S
    [[0, 1, 1], [1, 1, 0]] // Z
];
const COLORS = ['#00f0f0', '#f0f000', '#a000f0', '#f0a000', '#0000f0', '#00f000', '#f00000'];

class Tetris {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.nextCanvas = document.getElementById('nextPiece');
        this.nextCtx = this.nextCanvas.getContext('2d');
        this.scoreElement = document.getElementById('score');
        this.levelElement = document.getElementById('level');
        this.startBtn = document.getElementById('startBtn');
        this.pauseBtn = document.getElementById('pauseBtn');

        this.grid = Array(ROWS).fill().map(() => Array(COLS).fill(0));
        this.score = 0;
        this.level = 1;
        this.gameOver = false;
        this.isPaused = false;

        this.currentPiece = null;
        this.currentColor = null;
        this.nextPiece = null;
        this.nextColor = null;

        this.bindEvents();
    }

    bindEvents() {
        document.addEventListener('keydown', this.handleKeyPress.bind(this));
        this.startBtn.addEventListener('click', () => {
            this.reset();
            this.start();
            this.startBtn.textContent = '重新開始';
        });
        this.pauseBtn.addEventListener('click', () => this.togglePause());
    }

    reset() {
        this.grid = Array(ROWS).fill().map(() => Array(COLS).fill(0));
        this.score = 0;
        this.level = 1;
        this.gameOver = false;
        this.isPaused = false;
        this.currentPiece = null;
        this.currentColor = null;
        this.nextPiece = null;
        this.nextColor = null;
        this.updateScore();
        this.draw();
    }

    start() {
        if (!this.currentPiece) {
            this.generateNewPiece();
            this.gameLoop();
        }
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        this.pauseBtn.textContent = this.isPaused ? '繼續' : '暫停';
    }

    generateNewPiece() {
        if (this.nextPiece === null) {
            const index = Math.floor(Math.random() * SHAPES.length);
            this.nextPiece = SHAPES[index];
            this.nextColor = COLORS[index];
        }

        this.currentPiece = this.nextPiece;
        this.currentColor = this.nextColor;
        this.currentX = Math.floor(COLS / 2) - Math.floor(this.currentPiece[0].length / 2);
        this.currentY = 0;

        const index = Math.floor(Math.random() * SHAPES.length);
        this.nextPiece = SHAPES[index];
        this.nextColor = COLORS[index];

        if (this.checkCollision()) {
            this.gameOver = true;
        }

        this.drawNextPiece();
    }

    checkCollision() {
        for (let y = 0; y < this.currentPiece.length; y++) {
            for (let x = 0; x < this.currentPiece[y].length; x++) {
                if (this.currentPiece[y][x]) {
                    const newX = this.currentX + x;
                    const newY = this.currentY + y;
                    if (newX < 0 || newX >= COLS || newY >= ROWS || 
                        (newY >= 0 && this.grid[newY][newX])) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    rotatePiece() {
        const newPiece = this.currentPiece[0].map((_, i) =>
            this.currentPiece.map(row => row[i]).reverse()
        );
        const oldPiece = this.currentPiece;
        this.currentPiece = newPiece;
        if (this.checkCollision()) {
            this.currentPiece = oldPiece;
        }
    }

    moveDown() {
        this.currentY++;
        if (this.checkCollision()) {
            this.currentY--;
            this.freeze();
            this.clearLines();
            this.generateNewPiece();
            return false;
        }
        return true;
    }

    moveLeft() {
        this.currentX--;
        if (this.checkCollision()) {
            this.currentX++;
        }
    }

    moveRight() {
        this.currentX++;
        if (this.checkCollision()) {
            this.currentX--;
        }
    }

    freeze() {
        for (let y = 0; y < this.currentPiece.length; y++) {
            for (let x = 0; x < this.currentPiece[y].length; x++) {
                if (this.currentPiece[y][x]) {
                    this.grid[this.currentY + y][this.currentX + x] = this.currentColor;
                }
            }
        }
    }

    clearLines() {
        let linesCleared = 0;
        for (let y = ROWS - 1; y >= 0; y--) {
            if (this.grid[y].every(cell => cell !== 0)) {
                this.grid.splice(y, 1);
                this.grid.unshift(Array(COLS).fill(0));
                linesCleared++;
                y++;
            }
        }
        if (linesCleared > 0) {
            this.score += linesCleared * 100 * this.level;
            this.level = Math.floor(this.score / 1000) + 1;
            this.updateScore();
        }
    }

    updateScore() {
        this.scoreElement.textContent = this.score;
        this.levelElement.textContent = this.level;
    }

    drawBlock(x, y, color, ctx = this.ctx) {
        ctx.fillStyle = color;
        ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        ctx.strokeStyle = '#000';
        ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    }

    drawNextPiece() {
        this.nextCtx.clearRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
        const offsetX = (this.nextCanvas.width - this.nextPiece[0].length * BLOCK_SIZE) / 2;
        const offsetY = (this.nextCanvas.height - this.nextPiece.length * BLOCK_SIZE) / 2;

        for (let y = 0; y < this.nextPiece.length; y++) {
            for (let x = 0; x < this.nextPiece[y].length; x++) {
                if (this.nextPiece[y][x]) {
                    this.drawBlock(
                        x + offsetX / BLOCK_SIZE,
                        y + offsetY / BLOCK_SIZE,
                        this.nextColor,
                        this.nextCtx
                    );
                }
            }
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 繪製已固定的方塊
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                if (this.grid[y][x]) {
                    this.drawBlock(x, y, this.grid[y][x]);
                }
            }
        }

        // 繪製當前方塊
        if (this.currentPiece) {
            for (let y = 0; y < this.currentPiece.length; y++) {
                for (let x = 0; x < this.currentPiece[y].length; x++) {
                    if (this.currentPiece[y][x]) {
                        this.drawBlock(
                            this.currentX + x,
                            this.currentY + y,
                            this.currentColor
                        );
                    }
                }
            }
        }

        if (this.gameOver) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '30px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('遊戲結束', this.canvas.width / 2, this.canvas.height / 2);
            this.startBtn.textContent = '重新開始';
        }
    }

    handleKeyPress(event) {
        if (this.gameOver || this.isPaused) return;

        switch(event.keyCode) {
            case 37: // 左箭頭
                this.moveLeft();
                break;
            case 39: // 右箭頭
                this.moveRight();
                break;
            case 40: // 下箭頭
                this.moveDown();
                break;
            case 38: // 上箭頭
                this.rotatePiece();
                break;
            case 32: // 空白鍵
                while(this.moveDown());
                break;
        }
        this.draw();
    }

    gameLoop() {
        if (!this.gameOver && !this.isPaused) {
            this.moveDown();
            this.draw();
        }
        setTimeout(() => this.gameLoop(), 1000 / this.level);
    }
}

// 當頁面載入完成後初始化遊戲
window.addEventListener('load', () => {
    const game = new Tetris();
});