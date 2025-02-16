// handle the stuff about chess board
//took help of chatGPT to handle reflection of moves to other player and used some snippets to initialize board rules.
const initGame = () => {
    const socket = io();
    const game = new Chess();
    const playerColor = window.PLAYER_COLOR;
    const moveHistory = document.getElementById('moveHistory');
    const statusText = document.getElementById('statusText');
    const gameStatus = document.getElementById('gameStatus');
    
    let gameActive = gameStatus.getAttribute('data-waiting') === 'False';
    
    function isGameActive() {
        return gameActive;
    }
    
    function updateStatus() {
        let status = '';
        let moveColor = game.turn() === 'b' ? 'Black' : 'White';
        
        if (game.in_checkmate()) {
            status = `Game over, ${moveColor} is in checkmate.`;
        } else if (game.in_draw()) {
            status = 'Game over, drawn position';
        } else {
            status = `${moveColor}'s turn`;
            if (game.in_check()) {
                status += `, ${moveColor} is in check`;
            }
        }
        
        statusText.textContent = isGameActive() ? status : 'Waiting for opponent to join...';
    }
    
    function updateMoveHistory(move) {
        const moveText = `${move.color === 'w' ? 'White' : 'Black'}: ${move.from}-${move.to}`;
        const moveElement = document.createElement('p');
        moveElement.textContent = moveText;
        moveHistory.appendChild(moveElement);
        moveHistory.scrollTop = moveHistory.scrollHeight;
    }
    
    const config = {
        draggable: true,
        position: 'start',
        orientation: playerColor,
        onDragStart: (source, piece, position, orientation) => {
            if (!isGameActive()) return false;
            if (game.game_over()) return false;
            
            const isPlayerTurn = (game.turn() === 'w' && playerColor === 'white') ||
                            (game.turn() === 'b' && playerColor === 'black');
            if (!isPlayerTurn) return false;
            
            const isPlayerPiece = (playerColor === 'white' && piece.search(/^b/) === -1) ||
                                (playerColor === 'black' && piece.search(/^w/) === -1);
            return isPlayerPiece;
        },
        onDrop: (source, target) => {
            if (!isGameActive()) return 'snapback';
            
            const move = game.move({
                from: source,
                to: target,
                promotion: 'q'
            });
            
            if (move === null) return 'snapback';
            
            socket.emit('move', {
                from: source,
                to: target,
                fen: game.fen(),
                move: move
            });
            
            updateStatus();
            updateMoveHistory(move);
        },
        onSnapEnd: () => {
            board.position(game.fen());
        }
    };
    
    const board = Chessboard('board', config);
    /* 
    socket.on('move_made', (data) => {
        const move = game.move({
            from: data.from,
            to: data.to,
            promotion: 'q'
        });
        
        board.position(game.fen());
        updateStatus();
        updateMoveHistory(move);
    });
    
    socket.on('opponent_joined', (data) => {
        gameActive = true;
        statusText.textContent = 'Game in Progress';
        const opponentInfo = document.createElement('p');
        opponentInfo.textContent = `Playing against: ${data.black_player}`;
        gameStatus.appendChild(opponentInfo);
    });
    
    socket.on('game_start', (data) => {
        if (data.position !== 'start') {
            game.load(data.position);
            board.position(data.position);
        }
        gameActive = data.status === 'playing';
        updateStatus();
    });
    
    updateStatus();
    */
};