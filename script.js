(function() {
    const SIZE = 4;
    let board = [];
    let score = 0;
    let gameOver = false;
    let winFlag = false;

    const gridEl = document.getElementById('grid');
    const scoreEl = document.getElementById('scoreValue');
    const messageEl = document.getElementById('gameMessage');

    // создаём 16 ячеек
    function createGridCells() {
        gridEl.innerHTML = '';
        for (let i = 0; i < SIZE * SIZE; i++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.setAttribute('data-index', i);
            cell.setAttribute('data-value', '0');
            cell.textContent = '';
            gridEl.appendChild(cell);
        }
    }
    createGridCells();

    function getCellByRowCol(row, col) {
        return gridEl.children[row * SIZE + col];
    }

    function renderBoard() {
        for (let r = 0; r < SIZE; r++) {
            for (let c = 0; c < SIZE; c++) {
                const val = board[r][c];
                const cell = getCellByRowCol(r, c);
                cell.setAttribute('data-value', val || '0');
                cell.textContent = val !== 0 ? val : '';
            }
        }
        scoreEl.textContent = score;
    }

    function addRandomTile() {
        const empty = [];
        for (let i = 0; i < SIZE; i++) {
            for (let j = 0; j < SIZE; j++) {
                if (board[i][j] === 0) empty.push([i, j]);
            }
        }
        if (empty.length === 0) return false;
        const [r, c] = empty[Math.floor(Math.random() * empty.length)];
        board[r][c] = Math.random() < 0.9 ? 2 : 4;
        return true;
    }

    function initBoard() {
        board = [
            [0,0,0,0],
            [0,0,0,0],
            [0,0,0,0],
            [0,0,0,0]
        ];
        score = 0;
        gameOver = false;
        winFlag = false;
        messageEl.textContent = '';
        addRandomTile();
        addRandomTile();
        renderBoard();
    }

    function slideAndMergeRow(row) {
        let newRow = row.filter(v => v !== 0);
        let rowScore = 0;
        for (let i = 0; i < newRow.length - 1; i++) {
            if (newRow[i] === newRow[i + 1]) {
                newRow[i] *= 2;
                rowScore += newRow[i];
                newRow.splice(i + 1, 1);
            }
        }
        while (newRow.length < SIZE) newRow.push(0);
        return { merged: newRow, score: rowScore };
    }

    function rotateBoardClockwise(b) {
        const n = SIZE;
        let rotated = Array(n).fill().map(() => Array(n).fill(0));
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                rotated[j][n - 1 - i] = b[i][j];
            }
        }
        return rotated;
    }

    function move(direction) {
        if (gameOver) return false;

        let currentBoard = board.map(row => [...row]);
        let totalAddScore = 0;
        let rotationsNeeded = 0;

        if (direction === 1) {
            currentBoard = rotateBoardClockwise(currentBoard);
            rotationsNeeded = 1;
        } else if (direction === 2) {
            currentBoard = rotateBoardClockwise(rotateBoardClockwise(currentBoard));
            rotationsNeeded = 2;
        } else if (direction === 3) {
            for (let r = 0; r < 3; r++) currentBoard = rotateBoardClockwise(currentBoard);
            rotationsNeeded = 3;
        }

        for (let i = 0; i < SIZE; i++) {
            const { merged, score: addScore } = slideAndMergeRow(currentBoard[i]);
            currentBoard[i] = merged;
            totalAddScore += addScore;
        }

        for (let r = 0; r < (4 - rotationsNeeded) % 4; r++) {
            currentBoard = rotateBoardClockwise(currentBoard);
        }

        if (JSON.stringify(board) === JSON.stringify(currentBoard)) {
            return false;
        }

        board = currentBoard;
        score += totalAddScore;
        addRandomTile();

        if (!winFlag) {
            for (let row of board) {
                if (row.includes(2048)) {
                    winFlag = true;
                    messageEl.textContent = '✨ GLITCH OVERLOAD: 2048 ✨';
                }
            }
        }

        if (!gameOver && !winFlag) {
            let hasEmpty = false;
            for (let row of board) if (row.includes(0)) hasEmpty = true;
            if (!hasEmpty && !canMerge()) {
                gameOver = true;
                messageEl.textContent = '💀 SYSTEM HALT — NO MOVES 💀';
            }
        }

        renderBoard();
        return true;
    }

    function canMerge() {
        for (let i = 0; i < SIZE; i++) {
            for (let j = 0; j < SIZE; j++) {
                const val = board[i][j];
                if (val === 0) continue;
                if (j < SIZE - 1 && board[i][j + 1] === val) return true;
                if (i < SIZE - 1 && board[i + 1][j] === val) return true;
            }
        }
        return false;
    }

    function handleKey(e) {
        if (gameOver) return;
        const key = e.key;
        e.preventDefault();
        if (key === 'ArrowLeft') move(0);
        else if (key === 'ArrowUp') move(1);
        else if (key === 'ArrowRight') move(2);
        else if (key === 'ArrowDown') move(3);
    }

    let touchStartX = 0, touchStartY = 0;
    function handleTouchStart(e) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    }
    function handleTouchEnd(e) {
        if (gameOver) return;
        if (!touchStartX) return;
        const dx = e.changedTouches[0].clientX - touchStartX;
        const dy = e.changedTouches[0].clientY - touchStartY;
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);

        if (Math.max(absDx, absDy) < 20) return;

        if (absDx > absDy) {
            if (dx > 0) move(2);
            else move(0);
        } else {
            if (dy > 0) move(3);
            else move(1);
        }
        touchStartX = 0;
    }

    document.getElementById('newGameBtn').addEventListener('click', () => {
        initBoard();
    });

    window.addEventListener('keydown', (e) => {
        if (e.key.startsWith('Arrow')) {
            e.preventDefault();
            handleKey(e);
        }
    });

    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: false });
    document.addEventListener('touchmove', (e) => {
        if (gameOver) return;
        e.preventDefault();
    }, { passive: false });

    initBoard();
})();