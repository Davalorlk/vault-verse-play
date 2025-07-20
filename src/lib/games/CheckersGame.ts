const Checkers: any = {
  setup: () => ({
    board: [
      [null, 'b', null, 'b', null, 'b', null, 'b'],
      ['b', null, 'b', null, 'b', null, 'b', null],
      [null, 'b', null, 'b', null, 'b', null, 'b'],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      ['w', null, 'w', null, 'w', null, 'w', null],
      [null, 'w', null, 'w', null, 'w', null, 'w'],
      ['w', null, 'w', null, 'w', null, 'w', null]
    ],
    winner: null,
  }),

  turn: {
    minMoves: 1,
    maxMoves: 1,
  },

  moves: {
    move: (G: any, ctx: any, from: any, to: any) => {
      const piece = G.board[from.row][from.col];
      if (piece && IsValidCheckersMove(G.board, from, to, ctx.currentPlayer)) {
        G.board[to.row][to.col] = piece;
        G.board[from.row][from.col] = null;
        
        // Promote to king if reaching opposite end
        if ((piece === 'w' && to.row === 0) || (piece === 'b' && to.row === 7)) {
          G.board[to.row][to.col] = piece.toUpperCase();
        }
      }
    },
  },

  endIf: (G: any, ctx: any) => {
    // Simplified end condition
    return null;
  },
};

function IsValidCheckersMove(board: any, from: any, to: any, player: any) {
  const piece = board[from.row][from.col];
  if (!piece) return false;
  
  const isPlayerPiece = (player === '0' && (piece === 'w' || piece === 'W')) || 
                       (player === '1' && (piece === 'b' || piece === 'B'));
  
  return isPlayerPiece && board[to.row][to.col] === null;
}

export class CheckersGame {
  board: string[][];
  currentPlayer: string;
  winner: string | null;
  game: any;

  constructor() {
    this.board = [
      ['', 'b', '', 'b', '', 'b', '', 'b'],
      ['b', '', 'b', '', 'b', '', 'b', ''],
      ['', 'b', '', 'b', '', 'b', '', 'b'],
      ['', '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['w', '', 'w', '', 'w', '', 'w', ''],
      ['', 'w', '', 'w', '', 'w', '', 'w'],
      ['w', '', 'w', '', 'w', '', 'w', '']
    ];
    this.currentPlayer = 'w';
    this.winner = null;
    this.game = Checkers;
    console.log('Checkers game initialized with board:', this.board);
  }

  getValidMoves(row: number, col: number): any[] {
    const moves = [];
    const piece = this.board[row][col];
    if (!piece) return moves;
    const isWhite = piece === 'w' || piece === 'W';
    const isBlack = piece === 'b' || piece === 'B';
    const directions = [];
    if (piece === 'w' || piece === 'W') directions.push([-1, -1], [-1, 1]);
    if (piece === 'b' || piece === 'B') directions.push([1, -1], [1, 1]);
    if (piece === 'W' || piece === 'B') directions.push([1, -1], [1, 1], [-1, -1], [-1, 1]);
    // Check for captures first
    const captures = [];
    for (const [dr, dc] of directions) {
      const r1 = row + dr, c1 = col + dc;
      const r2 = row + 2 * dr, c2 = col + 2 * dc;
      if (r2 >= 0 && r2 < 8 && c2 >= 0 && c2 < 8 && this.board[r1][c1] && this.board[r1][c1].toLowerCase() !== piece.toLowerCase() && this.board[r2][c2] === '') {
        captures.push({ to: { row: r2, col: c2 }, capture: { row: r1, col: c1 } });
      }
    }
    if (captures.length > 0) return captures;
    // If no captures, allow normal moves
    for (const [dr, dc] of directions) {
      const r1 = row + dr, c1 = col + dc;
      if (r1 >= 0 && r1 < 8 && c1 >= 0 && c1 < 8 && this.board[r1][c1] === '') {
        moves.push({ to: { row: r1, col: c1 } });
      }
    }
    return moves;
  }

  makeMove(from: { row: number; col: number }, to: { row: number; col: number }): boolean {
    const piece = this.board[from.row][from.col];
    if (!piece) return false;
    const dr = to.row - from.row, dc = to.col - from.col;
    // Check for capture
    if (Math.abs(dr) === 2 && Math.abs(dc) === 2) {
      const capRow = from.row + dr / 2, capCol = from.col + dc / 2;
      this.board[capRow][capCol] = '';
    }
    this.board[to.row][to.col] = piece;
    this.board[from.row][from.col] = '';
    // Promote to king if reaching opposite end
    if ((piece === 'w' && to.row === 0) || (piece === 'b' && to.row === 7)) {
      this.board[to.row][to.col] = piece.toUpperCase();
    }
    // If another capture is possible from this piece, allow multi-jump
    if (Math.abs(dr) === 2 && this.getValidMoves(to.row, to.col).some(m => m.capture)) {
      this.currentPlayer = this.currentPlayer; // Same player continues
    } else {
      this.currentPlayer = this.currentPlayer === 'w' ? 'b' : 'w';
    }
    
    // Check for win condition
    this.checkWinCondition();
    
    console.log('Checkers move made, new turn:', this.currentPlayer);
    return true;
  }

  checkWinCondition(): void {
    // Check if either player has no pieces left
    let whitePieces = 0, blackPieces = 0;
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = this.board[row][col];
        if (piece === 'w' || piece === 'W') whitePieces++;
        if (piece === 'b' || piece === 'B') blackPieces++;
      }
    }
    
    if (whitePieces === 0) {
      this.winner = 'b';
      return;
    }
    if (blackPieces === 0) {
      this.winner = 'w';
      return;
    }
    
    // Check if current player has no valid moves
    const currentPlayerMoves = this.getAvailableMoves();
    if (currentPlayerMoves.length === 0) {
      this.winner = this.currentPlayer === 'w' ? 'b' : 'w';
    }
  }

  getAvailableMoves(): any[] {
    const moves = [];
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = this.board[row][col];
        if (piece && ((this.currentPlayer === 'w' && (piece === 'w' || piece === 'W')) || 
                     (this.currentPlayer === 'b' && (piece === 'b' || piece === 'B')))) {
          const validMoves = this.getValidMoves(row, col);
          validMoves.forEach(move => {
            moves.push({ from: { row, col }, to: move.to });
          });
        }
      }
    }
    return moves;
  }

  loadState(state: any): void {
    console.log('Loading checkers state:', state);
    
    // Only update if the state actually has the expected properties
    if (state.board && Array.isArray(state.board)) {
      this.board = state.board.map(row => [...row]); // Deep copy to prevent reference issues
      console.log('Checkers board updated to:', this.board);
    }
    
    if (state.currentPlayer) {
      this.currentPlayer = state.currentPlayer;
      console.log('Checkers current player updated to:', this.currentPlayer);
    }
    
    if (state.winner !== undefined) {
      this.winner = state.winner;
    }
  }

  // --- AI Section ---
  static getBestMove(board: string[][], player: string, depth: number = 3): { from: { row: number, col: number }, to: { row: number, col: number } } | null {
    let bestScore = -Infinity;
    let bestMove: { from: { row: number, col: number }, to: { row: number, col: number } } | null = null;
    const moves = CheckersGame.getAllMoves(board, player);
    for (const move of moves) {
      const testBoard = CheckersGame.makeTestMove(board, move.from, move.to, player);
      const score = CheckersGame.minimax(testBoard, depth - 1, false, player, player === 'w' ? 'b' : 'w');
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }
    return bestMove;
  }

  private static minimax(board: string[][], depth: number, maximizing: boolean, ai: string, human: string): number {
    const moves = CheckersGame.getAllMoves(board, maximizing ? ai : human);
    if (depth === 0 || moves.length === 0) {
      return CheckersGame.evaluateBoard(board, ai, human);
    }
    if (maximizing) {
      let maxEval = -Infinity;
      for (const move of moves) {
        const testBoard = CheckersGame.makeTestMove(board, move.from, move.to, ai);
        const evalScore = CheckersGame.minimax(testBoard, depth - 1, false, ai, human);
        maxEval = Math.max(maxEval, evalScore);
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const move of moves) {
        const testBoard = CheckersGame.makeTestMove(board, move.from, move.to, human);
        const evalScore = CheckersGame.minimax(testBoard, depth - 1, true, ai, human);
        minEval = Math.min(minEval, evalScore);
      }
      return minEval;
    }
  }

  private static evaluateBoard(board: string[][], ai: string, human: string): number {
    // Simple: difference in piece count, king bonus
    let aiCount = 0, humanCount = 0, aiKings = 0, humanKings = 0;
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (board[row][col] === ai) aiCount++;
        if (board[row][col] === human) humanCount++;
        if (board[row][col] === ai.toUpperCase()) aiKings++;
        if (board[row][col] === human.toUpperCase()) humanKings++;
      }
    }
    return (aiCount - humanCount) + (aiKings - humanKings) * 2;
  }

  static getAllMoves(board: string[][], player: string): { from: { row: number, col: number }, to: { row: number, col: number }, capture?: { row: number, col: number } }[] {
    const moves = [];
    const captures = [];
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece && ((player === 'w' && (piece === 'w' || piece === 'W')) || (player === 'b' && (piece === 'b' || piece === 'B')))) {
          const validMoves = CheckersGame.getValidMovesStatic(board, row, col, player);
          for (const move of validMoves) {
            if (move.capture) captures.push({ from: { row, col }, to: { row: move.row, col: move.col }, capture: move.capture });
            else moves.push({ from: { row, col }, to: { row: move.row, col: move.col } });
          }
        }
      }
    }
    return captures.length > 0 ? captures : moves;
  }

  static getValidMovesStatic(board: string[][], row: number, col: number, player: string): { row: number, col: number, capture?: { row: number, col: number } }[] {
    const moves = [];
    const piece = board[row][col];
    if (!piece) return moves;
    const directions = [];
    if (piece === 'w' || piece === 'W') directions.push([-1, -1], [-1, 1]);
    if (piece === 'b' || piece === 'B') directions.push([1, -1], [1, 1]);
    if (piece === 'W' || piece === 'B') directions.push([1, -1], [1, 1], [-1, -1], [-1, 1]);
    // Check for captures first
    const captures = [];
    for (const [dr, dc] of directions) {
      const r1 = row + dr, c1 = col + dc;
      const r2 = row + 2 * dr, c2 = col + 2 * dc;
      if (r2 >= 0 && r2 < 8 && c2 >= 0 && c2 < 8 && board[r1][c1] && board[r1][c1].toLowerCase() !== piece.toLowerCase() && board[r2][c2] === '') {
        captures.push({ row: r2, col: c2, capture: { row: r1, col: c1 } });
      }
    }
    if (captures.length > 0) return captures;
    // If no captures, allow normal moves
    for (const [dr, dc] of directions) {
      const r1 = row + dr, c1 = col + dc;
      if (r1 >= 0 && r1 < 8 && c1 >= 0 && c1 < 8 && board[r1][c1] === '') {
        moves.push({ row: r1, col: c1 });
      }
    }
    return moves;
  }

  static makeTestMove(board: string[][], from: { row: number, col: number }, to: { row: number, col: number }, player: string): string[][] {
    const testBoard = board.map(r => [...r]);
    const piece = testBoard[from.row][from.col];
    const dr = to.row - from.row, dc = to.col - from.col;
    if (Math.abs(dr) === 2 && Math.abs(dc) === 2) {
      const capRow = from.row + dr / 2, capCol = from.col + dc / 2;
      testBoard[capRow][capCol] = '';
    }
    testBoard[to.row][to.col] = piece;
    testBoard[from.row][from.col] = '';
    // Promote to king if reaching opposite end
    if ((piece === 'w' && to.row === 0) || (piece === 'b' && to.row === 7)) {
      testBoard[to.row][to.col] = piece.toUpperCase();
    }
    return testBoard;
  }
}

export { Checkers };
