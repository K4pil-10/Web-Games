const pieces_map ={
    wK: '♔', wQ:'♕', wR:'♖', wB:'♗', wN:'♘', wP:'♙',
    bK: '♚', bQ: '♛', bR: '♜', bB: '♝', bN: '♞', bP: '♟'
}

const piece_values = {
    P:1, N:3, B:3, R:5, Q:9, K:20
};

const PST = {
    P:[
     0,  0,  0,  0,  0,  0,  0,  0,
     50, 50, 50, 50, 50, 50, 50, 50,
     10, 10, 20, 30, 30, 20, 10, 10,
     5,  5, 10, 25, 25, 10,  5,  5,
     0,  0,  0, 20, 20,  0,  0,  0,
     5, -5,-10,  0,  0,-10, -5,  5,
     5, 10, 10,-20,-20, 10, 10,  5,
     0, 0, 0, 0, 0, 0, 0, 0
    ],
    
    N:[
     -50,-40,-30,-30,-30,-30,-40,-50,
     -40,-20,  0,  0,  0,  0,-20,-40,
     -30,  0, 10, 15, 15, 10,  0,-30,
     -30,  5, 15, 20, 20, 15,  5,-30,
     -30,  0, 15, 20, 20, 15,  0,-30,
     -30,  5, 10, 15, 15, 10,  5,-30,
     -40,-20,  0,  5,  5,  0,-20,-40,
     -50,-40,-30,-30,-30,-30,-40,-50 
    ],

    B:[
     -20,-10,-10,-10,-10,-10,-10,-20,
     -10,  0,  0,  0,  0,  0,  0,-10,
     -10,  0,  5, 10, 10,  5,  0,-10,
     -10,  5,  5, 10, 10,  5,  5,-10,
     -10,  0, 10, 10, 10, 10,  0,-10,
     -10, 10, 10, 10, 10, 10, 10,-10,
     -10,  5,  0,  0,  0,  0,  5,-10,
     -20,-10,-10,-10,-10,-10,-10,-20  
    ],

    R:[
      0,  0,  0,  0,  0,  0,  0,  0,
      5, 10, 10, 10, 10, 10, 10,  5,
     -5,  0,  0,  0,  0,  0,  0, -5,
     -5,  0,  0,  0,  0,  0,  0, -5,
     -5,  0,  0,  0,  0,  0,  0, -5,
     -5,  0,  0,  0,  0,  0,  0, -5,
     -5,  0,  0,  0,  0,  0,  0, -5,
      0,  0,  0,  5,  5,  0,  0,  0     
    ],

    Q:[
     -20,-10,-10, -5, -5,-10,-10,-20,
     -10,  0,  0,  0,  0,  0,  0,-10,
     -10,  0,  5,  5,  5,  5,  0,-10,
     -5,  0,  5,  5,  5,  5,  0, -5,
      0,  0,  5,  5,  5,  5,  0, -5,
     -10,  5,  5,  5,  5,  5,  0,-10,
     -10,  0,  5,  0,  0,  0,  0,-10,
     -20,-10,-10, -5, -5,-10,-10,-20
    ],

    K:[
     -30,-40,-40,-50,-50,-40,-40,-30,
     -30,-40,-40,-50,-50,-40,-40,-30,
     -30,-40,-40,-50,-50,-40,-40,-30,
     -30,-40,-40,-50,-50,-40,-40,-30,
     -20,-30,-30,-40,-40,-30,-30,-20,
     -10,-20,-20,-20,-20,-20,-20,-10,
      20, 20,  0,  0,  0,  0, 20, 20,
      20, 30, 10,  0,  0, 10, 30, 20       
    ]
};

let board = Array(64).fill(null);
let turn = 'w';
let selectedSquare = null;
let validDestination = [];
let gameOver= false;
let lastMovePair= null;
let castleRights= {
    w:{
        k:true,
        q:true
    },
    b:{
        k:true,
        q:true
    }
};

let enPassantTarget= null;
let capturedByWhite= [];
let capturedByBlack = [];
let moveHistory= [];
let aiDepth= 2;
let aiThinking = false;
let pendingPromotion = null; 

function pieceColor(p){
    return p ? p[0] : null;
}

function pieceType(p){
    return p ? p[1] : null;
}

function idxToAlg(idx){
    const files= 'abcdefgh';
    return files[idx % 8] + (8-Math.floor(idx/8));
}

function initGame(){
    board= Array(64).fill(null);
    const backRow = ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'];

    for (let i =0; i<8; i++){
        board[i] = 'b' + backRow[i];
        board[8 + i]= 'bP';
        board[48 + i]= 'wP';
        board[56 + i]= 'w' + backRow[i]
    }


    turn = 'w';

    selectedSquare= null;
    validDestination=[];
    gameOver= false;
    lastMovePair = null;
    castleRights = {
        w: {
            k: true,
            q: true
        },
            b:{
            k:true,
            q:true
        }
    };
    enPassantTarget= null;
    capturedByWhite= [];
    capturedByBlack= [];
    moveHistory= [];
    aiThinking= false;

    if(typeof updateUIStatus ==="function") 
        updateUIStatus("Your turn - White");
    if(typeof renderBoard === "function")
        renderBoard();
    if(typeof updateCaptureDisplay ==="function")
        updateCaptureDisplay();
    if(typeof updateMoveLogPanel === "function")
        updateMoveLogPanel();
    if(typeof updateActiveLabel ==="function")
        updateActiveLabel();

}

function findKing(color, boardState = board){
    return boardState.findIndex(p => p === color + 'K');
}

function isInCheck(boardState, color){
    const kingIdx = findKing(color, boardState);
    if(kingIdx === -1) return false;
    const opp = color === 'w' ? 'b' : 'w';
    for (let i = 0; i<64; i++){
        const p = boardState[i];
        if (p && pieceColor(p) === opp){
             const moves = getRawMovesForPiece(boardState, i, opp, null, null);
             if (moves.includes(kingIdx)) return true;
            
         }
    }
    return false;
}

function getRawMovesForPiece(b, idx, color, cr, ep){
    const piece = b[idx];
    if(!piece) return [];
    const type = pieceType(piece);
    const r = Math.floor(idx / 8), c = idx % 8;
    const opp = color === 'w' ? 'b' : 'w';
    const moves = [];
    const addMove = (i) => {
        if(i >= 0 && i <64) moves.push(i);
    };

    const slide = (dr, dc) =>{
        let nr = r + dr, nc = c +dc;
        while(nr >= 0 && nr <8 && nc >= 0 && nc <8){
            const nidx = nr * 8 + nc;
            if(b[nidx]){
                if(pieceColor (b[nidx]) === opp) addMove(nidx);
                break;
            }
            addMove(nidx);
            nr += dr; 
            nc += dc;
        }
    };

    if (type === 'P'){
        const dir = color === 'w' ? -1 : 1;
        const startRow = color === 'w' ? 6 :1;
        const oneStep = (r + dir) * 8 + c ;
    if (r + dir >=0 && r + dir <8 && ! b[oneStep]){
        addMove(oneStep);
        if (r === startRow && !b[(r + dir *2) * 8 + c]) addMove((r + dir * 2) * 8 + c);
    }

    for (let dc of [-1, 1]){
        const nc = c + dc;
        if (nc >=0  && nc <8){
            const capIdx = (r + dir) * 8 + nc;
            if(b[capIdx] && pieceColor(b[capIdx]) === opp) addMove(capIdx);
            if(ep !== null && capIdx === ep) addMove(capIdx);
        }
    }
}

if (type === 'N'){
    const offsets = [[-2,-1], [-2,1], [-1,-2], [-1,2], [1, -2], [1,2], [2,-1], [2,1]];
    for (let [dr,dc] of offsets){
        const nr = r + dr, nc = c + dc;
        if (nr >=0 && nr <8 && nc >=0 && nc<8){
            const nidx= nr * 8 + nc;
            if (!b[nidx] || pieceColor (b[nidx]) === opp) addMove(nidx);
        }
    }
}

if (type === 'B' || type == 'Q') 
    for (let [dr, dc] of [[-1,-1], [-1,1], [1,-1], [1,1]]) slide(dr, dc);
if (type == 'R' || type === 'Q') 
    for (let [dr, dc] of [[-1,0], [1,0], [0,-1], [0,1]]) slide(dr, dc);

if (type === 'K'){
    for (let dr = -1; dr <= 1; dr ++) for (let dc =-1; dc <=1; dc++){
        if (dr ===0 && dc ===0) continue;
        const nr = r + dr, nc = c + dc;
        if (nr >=0 && nr <8 && nc >=0 && nc <8){
            const nidx = nr * 8 + nc;
            if (!b[nidx] || pieceColor(b[nidx]) === opp) addMove(nidx)
        }
    }
    if (cr){
        const row =color ==='w' ? 7 : 0;
        if (cr[color].k && !b[row*8+5] && !b[row*8+6]){
            const tempBoard = [...b];
            tempBoard[row*8+5] = color + 'K';
            tempBoard[row*8+4]= null;
            if(!isInCheck(tempBoard,color)) addMove(row*8+6);
        }

        if(cr[color].q && !b[row * 8 +3] && !b[row * 8 +2] && !b[row *8 +1]){
            const tempBoard = [...b];
            tempBoard[row * 8 + 3] = color + 'K';
            tempBoard[row * 8 + 4] = null;
            if(!isInCheck(tempBoard,color)) addMove(row * 8+2) ;
         }
    
      }
    }

    return moves;

}



function getLegalMovesForPiece(b, idx, color, cr, ep){
    const raw = getRawMovesForPiece(b, idx, color, cr, ep);
    return raw.filter(to =>{
        const newBoard= b.slice();
        const piece = newBoard[idx];
        newBoard[to] = piece;
        newBoard[idx] = null;
        let newEp = ep;
        if(pieceType(piece) === 'P' && to === ep){
            const dir = color ==='w' ? 8 : -8;
            newBoard[to + dir] = null;
        }

        if(pieceType(piece) === 'K' && Math.abs((to % 8) - (idx % 8)) === 2)
            newEp = null;
        return !isInCheck(newBoard, color);

    });
}

function getAllMoves(boardState,color,cr,ep){
    const moves = [];
    for (let i= 0; i<64; i++){
        if(boardState[i] && pieceColor(boardState[i]) === color){
            const movesFrom = getLegalMovesForPiece(boardState, i, color, cr, ep);
            for (let to of movesFrom){

                moves.push({
                    from:i, to
                });
            }
        }

     }
    
    return moves;

}

function hasLegalMoves(color){
    for (let i = 0; i<64; i++){
        if(board[i] && pieceColor(board[i]) === color && getLegalMovesForPiece(board,i,color, castleRights, enPassantTarget).length >0)
            return true;
    }
    return false;
}

function applyMoveSimulate(b, from, to, color, ep, crSim){
    const newBoard = b.slice();
    const piece= newBoard[from];
    const pType= pieceType(piece);
    newBoard[to] = piece;
    newBoard[from]= null;
    let newEp = null;
    const newCr = {
        w: {
            k: crSim.w.k,
            q: crSim.w.q
        },
        b:{
            k:crSim.b.k,
            q: crSim.b.q
        }
    };
    if (pType === 'K'){
        newCr[color].k = false;
        newCr[color].q = false;
        const dc = (to % 8) - (from % 8);
        if(Math.abs(dc) === 2){
            const row = Math.floor(from / 8);
            if(dc > 0){
                newBoard[to-1] = newBoard[to+1];
                newBoard[to +1] = null;
            }
            else{
                newBoard[to+1] = newBoard[to-2];
                newBoard[to-2]= null;
            }
        }
    }

        if(pType === 'R'){
            if (from == 56) newCr.w.q = false;
            if (from === 63) newCr.w.k = false;
            if (from === 0) newCr.b.q = false;
            if (from === 7) newCr.b.k = false;
        }


        if (pType ==='P'){
            if(to ===ep){
                const dir = color ==='w' ? 8 : -8;
                newBoard[to + dir] = null;
            }

            const dr = Math.abs(Math.floor(from/8) - Math.floor(to/8));
            if(dr ===2) newEp = (from + to) >>1;
            if(Math.floor(to/8) === 0 || Math.floor(to/8) === 7) newBoard[to] = color + 'Q';
        }
        return {
            newBoard, newEp, newCr
        };
}

    function evaluateBoard(b){
        let score =0;
        for (let i =0; i <64; i++){
            const p = b[i];
            if(!p) continue;
            const col = pieceColor(p);
            const type = pieceType(p);
            const val =piece_values[type];
            const r = Math.floor(i/8), c= i%8;
            const pstIdx = col === 'w' ? i : (7-r)  * 8 +c;
            const pstVal = PST[type] ? PST[type][pstIdx]: 0;
            const contribution = (val + pstVal);
            score += (col === 'b') ? contribution : -contribution;
        }
        return score;
    }

    function minimax(b, depth, alpha, beta, isMax, color,cr, ep){
        if(depth ===0)
            return evaluateBoard(b);
        const moves = getAllMoves(b, color, cr, ep);
        if(moves.length ===0) return isInCheck(b,color) ? (isMax ? -30000 : 30000) : 0;

        const nextColor = color === 'w' ? 'b' : 'w';
        if(isMax){
            let maxEval = -Infinity;
            for (let move of moves){
                const {
                    newBoard, newEp, newCr
                }= applyMoveSimulate(b,move.from, move.to,color, ep, cr);

                const score = minimax(newBoard,depth-1,alpha,beta,false, nextColor, newCr, newEp);
                maxEval = Math.max(maxEval,score);
                alpha =Math.max(alpha, score);
                if(beta <= alpha)
                    break; 
            }
            return maxEval;
        } else{
            let minEval = Infinity;
            for (let move of moves){
                const {
                    newBoard, newEp, newCr
                } = applyMoveSimulate (b, move.from, move.to, color, ep, cr);
                const score = minimax(newBoard, depth-1, alpha, beta, true, nextColor,newCr,newEp);
                minEval = Math.min(minEval, score);
                beta = Math.min(beta,score);
                if(beta <=alpha)
                    break;
            }
            return minEval;
        }
    }

    function getBestMoveAI(depthLimit){
        const moves = getAllMoves(board, 'b', castleRights, enPassantTarget);
        if(moves.length === 0)
            return null;
        let bestScore = -Infinity;
        let bestMove = null;
        for (let move of moves){
            const {
                newBoard, newEp, newCr
            } = applyMoveSimulate(board,move.from,move.to, 'b', enPassantTarget, castleRights);
            const score = minimax(newBoard,depthLimit-1,-Infinity,Infinity,false, 'w', newCr, newEp);
            if(score > bestScore){
                bestScore =score;
                bestMove= move;
            }
        }
        return bestMove;
    }

    function executeRealMove(from,to, color, isPlayerMove, promotionChoice = null){
        const piece = board[from];
        const pType= pieceType(piece);
        const capturedPiece = board[to];
        let special = '';
        let promotionApplied = false;
        let newEnPassant = null;


        if(pType ==='P' && to === enPassantTarget){
            const dir = color === 'w' ? 8 : -8;
            const capIdx = to + dir;
            if(color === 'w')
                capturedByWhite.push(board[capIdx]);
            else capturedByBlack.push(board[capIdx]);
            board[capIdx] = null;
            special = 'ep';
        }

        board[to] = piece;
        board[from] = null;

        if(pType ==='P' && (Math.floor(to / 8) ===0 || Math.floor(to/8) ===7)){
            if(isPlayerMove && color ==='w' && !promotionChoice){
                pendingPromotion= {
                    to, color, from, capturedPiece,special
                };
                showPromotionModal(color);
                return false;
            }
            else{
                const promoPiece = promotionChoice || (color + 'Q');
                board[to] = promoPiece;
                promotionApplied = true;
                special= 'promo';
            }
        }

        if (pType === 'K'){
            castleRights[color].k = false;
            castleRights[color].q = false
            const dc= (to % 8) - (from % 8);
            if (Math.abs(dc) ===2){
                if (dc > 0) {
                    board[to-1] = board[to +1];
                    board[to+1] = null;
                }
                else{
                    board[to+1] = board[to-2];
                    board[to-2] = null;
                }
                special = 'castle';
            }
        }

        if(pType === 'R'){

        
            if (from ==56) castleRights.w.q=false;
            if(from ==63) castleRights.w.k= false;
            if(from === 0) castleRights.b.q = false;
            if(from ===7) castleRights.b.k = false; 
        }

    if(pType ==='P' && Math.abs(Math.floor(from/8) - Math.floor(to/8)) ===2){
        newEnPassant = (from + to) >> 1;
    } else{
        newEnPassant= null;
    }

    enPassantTarget = newEnPassant;
    return true;

}

function buildNotation(from , to, piece, captured, special){
    const type = pieceType(piece);
    if(special === 'castle')
        return (to % 8 === 6) ? '0-0' : '0-0-0';
    let n = type !== 'P' ? type : '';
    if(captured || special == 'ep')
        n+= 'x';
    n += idxToAlg(to);
    if(special === 'promo')
        n+= '=Q';
    return n;
}


function finishTurn(color,from,to,notation){
    lastMovePair = [from,to];
    selectedSquare = null;
    validDestination = [];

    if(color === 'w'){
        moveHistory.push({
            num: moveHistory.length+1,
            white:notation,
            black:''
        });
    }
    else{
      if  (moveHistory.length >0 ) 
        moveHistory[moveHistory.length -1].black = notation;
      else moveHistory.push({
        num :1,
        white: '...',
        black:notation
      });
    }

    updateMoveLogPanel();
    updateCaptureDisplay();

    const next = color === 'w' ? 'b' : 'w';
    turn = next;
    updateActiveLabel();

    if(!hasLegalMoves(next)){
        gameOver = true;
        updateUIStatus(isInCheck(board,next)
        ? `Checkmate! ${color ==='w' ? 'White' : 'Black'} wins! 🎉` : 'Stalemate — Draw!') ;
        renderBoard();
        return;
    }

    updateUIStatus (next === 'w' ? 'Your turn — White' : 'AI thinking...');
    renderBoard();

    if(next === 'b'){
        aiThinking = true;
        setTimeout(()=>{
            const best = getBestMoveAI(aiDepth);
            if(best){
                const p = board[best.from];
                const cap = board[best.to];
                executeRealMove(best.from, best.to, 'b', false);
                aiThinking = false;
                finishTurn('b', best.from, best.to,buildNotation(best.from, best.to, p, cap, ''));
            }
            else{
                aiThinking = false;
            }
        },50);
    }
}



function renderBoard(){
    const boardE1 = document.getElementById('chessboard');
    boardE1.innerHTML = '';
    const inInCheckColor = isInCheck(board,turn) ? turn : null;
    const kingIdx = inInCheckColor ? findKing(inInCheckColor) : -1;

    for (let i = 0; i< 64; i++){
        const sq = document.createElement('div');
        const r = Math.floor (i/8), c= i %8;
        sq.className = 'square ' + ((r+c) % 2 ===0 ? 'light' : 'dark');

        if(lastMovePair && (i === lastMovePair[0] || i === lastMovePair[1]))
            sq.classList.add('last-move-highlight');
        if(i === kingIdx)
            sq.classList.add('check-highlight');
        if(selectedSquare ===i)
            sq.classList.add('selected');

        if(validDestination.includes(i)){
            if(board[i]){
                sq.classList.add('capture-hint');
            }
            else{
                const dot = document.createElement('div');
                dot.className = 'hint-dot';
                sq.appendChild(dot);
            }
        }

        if(board[i]){
            const span = document.createElement('span');
            span.className = 'piece';
            span.textContent = pieces_map[board[i]];
            sq.appendChild(span);
        }

        sq.addEventListener('click', ()=> handleSquareClick(i));
        boardE1.appendChild(sq);
    }

    const rankE1 = document.getElementById('rank-annotations');
    if(rankE1){
        rankE1.innerHTML = '';
        for(let r = 0; r<8; r++){
            const s= document.createElement('span');
            s.textContent = 8-r;
            rankE1.appendChild(s);
        }
    }

    const fileE1 = document.getElementById('file-annotations');
    if(fileE1){
        fileE1.innerHTML = '';
        for(let c = 0; c<8; c++){
            const s = document.createElement('span');
            s.textContent= 'abcdefgh'[c];
            fileE1.append(s);
        }
    }
}

function handleSquareClick(idx){
    if(gameOver || aiThinking || turn !== 'w')
        return;

    if (selectedSquare !==null && validDestination.includes(idx)){
        const from = selectedSquare;
        const piece= board[from];
        const captured = board[idx];
        const moved= executeRealMove(from, idx, 'w', true);
        if(moved === false)
            return;
        finishTurn('w', from, idx, buildNotation(from, idx, piece, captured, ''));
        return;
    }
    if(board[idx] && pieceColor(board[idx]) === 'w'){
        selectedSquare = idx;
        validDestination = getLegalMovesForPiece(board,idx,'w', castleRights, enPassantTarget);
        renderBoard();
        return;
    }

    selectedSquare = null;
    validDestination = [];
    renderBoard();
}

function showPromotionModal(color){
    const overlay = document.getElementById('promotionOverlay');
    const choices = document.getElementById('promoChoices');
    choices.innerHTML = '';
    const promos = [['Q','♕'],['R','♖'],['B','♗'],['N','♘']];
    for (let [type,sym] of promos){
        const btn = document.createElement('button');
        btn.className = 'promo-piece';
        btn.textContent = color === 'w' ? sym : {
            Q:'♛',R:'♜',B:'♝',N:'♞'}[type];
            btn.addEventListener ('click', ()=>{
                overlay.classList.remove('show');
                if(pendingPromotion){
                    const {
                        to,color :c, from, capturedPiece
                    } = pendingPromotion;
                    const code = color + type;
                    board[to] = code;
                    pendingPromotion = null;
                    finishTurn(c, from, to, buildNotation(from,to, c+'P', capturedPiece, 'promo'));
                }
            });
            choices.appendChild(btn);
        } 
        overlay.classList.add('show');
}


function updateUIStatus(msg){
    const el = document.getElementById('game-status');
    if(el) el.textContent = msg;
}

function updateActiveLabel(){
    const playerTag = document.getElementById('player-tag');
    const compTag= document.getElementById('comp-tag');
    if(!playerTag || !compTag)
        return;
    if(turn === 'w'){
        playerTag.classList.add('active');
        compTag.classList.remove('active');
    }
    else{
        compTag.classList.add('active');
        playerTag.classList.remove('active');
    }
}

function updateCaptureDisplay(){
    const wE1 = document.getElementById('white-captures');
    const bE1 = document.getElementById('black-captures');
    if (wE1) wE1.textContent = capturedByWhite.map(p => pieces_map[p] || p).join('');
    if (bE1) bE1.textContent = capturedByBlack.map(p => pieces_map[p] || p).join('');
}

function updateMoveLogPanel(){
const container = document.getElementById('move-log-container');
    if(!container)
        return;
    container.innerHTML = '';
    for(let entry of moveHistory){
        const div= document.createElement('div');
        div.className = 'move-entry';
        div.innerHTML = `<span class="move-num" ${entry.num}. </span>
        <span class = "white-move">${entry.white || ''} </span>
        <span class= "black-move">${entry.black || ''}</span>`;
        container.appendChild(div);
    }
    container.scrollTop = container.scrollHeight;
}

document.addEventListener('DOMContentLoaded', ()=>{
    initGame();
    document.querySelectorAll('.diff-option').forEach(btn =>{
        btn.addEventListener('click',() =>{
            document.querySelectorAll('.diff-option').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            aiDepth = parseInt(btn.dataset.diff);

        });
    });
    document.getElementById('reset-game').addEventListener('click', initGame);
});


