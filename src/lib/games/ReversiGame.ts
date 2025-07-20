export class ReversiGame {
  board: string[][];
  currentPlayer: string;
  winner: string | null;
  
  constructor() {
    this.board = this.initializeBoard();
    this.currentPlayer = 'B'; // Black starts
    this.winner = null;
  }
  
  private initializeBoard(): string[][] {
    const board = Array(8).fill(null).map(() => Array(8).fill(''));
    
    // Initial setup
    board[3][3] = 'W';
    board[3][4] = 'B';
    board[4][3] = 'B';
    board[4][4] = 'W';
    
    return board;
  }
  
  isValidMove(row: number, col: number): boolean {
    if (this.board[row][col] !== '') return false;
    
    const directions = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
    
    for (const [dr, dc] of directions) {
      if (this.hasFlippablePieces(row, col, dr, dc)) {
        return true;
      }
    }
    
    return false;
  }
  
  private hasFlippablePieces(row: number, col: number, dr: number, dc: number): boolean {
    const opponent = this.currentPlayer === 'B' ? 'W' : 'B';
    let r = row + dr;
    let c = col + dc;
    let hasOpponent = false;
    
    while (r >= 0 && r < 8 && c >= 0 && c < 8) {
      if (this.board[r][c] === '') return false;
      if (this.board[r][c] === opponent) {
        hasOpponent = true;
      } else if (this.board[r][c] === this.currentPlayer) {
        return hasOpponent;
      }
      r += dr;
      c += dc;
    }
    
    return false;
  }
  
  makeMove(row: number, col: number): boolean {
    if (!this.isValidMove(row, col)) return false;
    
    this.board[row][col] = this.currentPlayer;
    this.flipPieces(row, col);
    this.currentPlayer = this.currentPlayer === 'B' ? 'W' : 'B';
    
    // Check if next player has valid moves
    if (!this.hasValidMoves()) {
      this.currentPlayer = this.currentPlayer === 'B' ? 'W' : 'B';
      if (!this.hasValidMoves()) {
        this.determineWinner();
      }
    }
    
    return true;
  }
  
  private flipPieces(row: number, col: number): void {
    const directions = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
    
    for (const [dr, dc] of directions) {
      if (this.hasFlippablePieces(row, col, dr, dc)) {
        let r = row + dr;
        let c = col + dc;
        
        while (r >= 0 && r < 8 && c >= 0 && c < 8 && this.board[r][c] !== this.currentPlayer) {
          this.board[r][c] = this.currentPlayer;
          r += dr;
          c += dc;
        }
      }
    }
  }
  
  hasValidMoves(): boolean {
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (this.isValidMove(row, col)) {
          return true;
        }
      }
    }
    return false;
  }
  
  getValidMoves(): { row: number; col: number }[] {
    const moves = [];
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (this.isValidMove(row, col)) {
          moves.push({ row, col });
        }
      }
    }
    return moves;
  }
  
  private determineWinner(): void {
    let blackCount = 0;
    let whiteCount = 0;
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (this.board[row][col] === 'B') blackCount++;
        if (this.board[row][col] === 'W') whiteCount++;
      }
    }
    
    if (blackCount > whiteCount) {
      this.winner = 'B';
    } else if (whiteCount > blackCount) {
      this.winner = 'W';
    } else {
      this.winner = 'Draw';
    }
  }
  
  loadState(state: any): void {
    this.board = state.board;
    this.currentPlayer = state.currentPlayer;
    this.winner = state.winner;
  }
  
  getScore(): { black: number; white: number } {
    let black = 0;
    let white = 0;
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (this.board[row][col] === 'B') black++;
        if (this.board[row][col] === 'W') white++;
      }
    }
    
    return { black, white };
  }
  
  // --- AI Section ---
  static getBestMove(board: string[][], player: string, depth: number = 3): { row: number, col: number } | null {
    let bestScore = -Infinity;
    let bestMove: { row: number, col: number } | null = null;
    const moves = ReversiGame.getValidMovesStatic(board, player);
    for (const move of moves) {
      const testBoard = ReversiGame.makeTestMove(board, move.row, move.col, player);
      const score = ReversiGame.minimax(testBoard, depth - 1, false, player, player === 'B' ? 'W' : 'B');
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }
    return bestMove;
  }

  private static minimax(board: string[][], depth: number, maximizing: boolean, ai: string, human: string): number {
    const moves = ReversiGame.getValidMovesStatic(board, maximizing ? ai : human);
    if (depth === 0 || moves.length === 0) {
      return ReversiGame.evaluateBoard(board, ai, human);
    }
    if (maximizing) {
      let maxEval = -Infinity;
      for (const move of moves) {
        const testBoard = ReversiGame.makeTestMove(board, move.row, move.col, ai);
        const evalScore = ReversiGame.minimax(testBoard, depth - 1, false, ai, human);
        maxEval = Math.max(maxEval, evalScore);
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const move of moves) {
        const testBoard = ReversiGame.makeTestMove(board, move.row, move.col, human);
        const evalScore = ReversiGame.minimax(testBoard, depth - 1, true, ai, human);
        minEval = Math.min(minEval, evalScore);
      }
      return minEval;
    }
  }

  private static evaluateBoard(board: string[][], ai: string, human: string): number {
    // Simple: difference in piece count, bonus for corners
    let aiCount = 0, humanCount = 0, aiCorners = 0, humanCorners = 0;
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (board[row][col] === ai) aiCount++;
        if (board[row][col] === human) humanCount++;
      }
    }
    // Corners
    const corners = [[0,0],[0,7],[7,0],[7,7]];
    for (const [r, c] of corners) {
      if (board[r][c] === ai) aiCorners++;
      if (board[r][c] === human) humanCorners++;
    }
    return (aiCount - humanCount) + (aiCorners - humanCorners) * 5;
  }

  private static getValidMovesStatic(board: string[][], player: string): { row: number, col: number }[] {
    const moves = [];
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (ReversiGame.isValidMoveStatic(board, row, col, player)) {
          moves.push({ row, col });
        }
      }
    }
    return moves;
  }

  private static isValidMoveStatic(board: string[][], row: number, col: number, player: string): boolean {
    if (board[row][col] !== '') return false;
    const opponent = player === 'B' ? 'W' : 'B';
    const directions = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
    for (const [dr, dc] of directions) {
      let r = row + dr, c = col + dc, hasOpponent = false;
      while (r >= 0 && r < 8 && c >= 0 && c < 8) {
        if (board[r][c] === '') break;
        if (board[r][c] === opponent) hasOpponent = true;
        else if (board[r][c] === player) return hasOpponent;
        r += dr; c += dc;
      }
    }
    return false;
  }

  private static makeTestMove(board: string[][], row: number, col: number, player: string): string[][] {
    const testBoard = board.map(r => [...r]);
    const opponent = player === 'B' ? 'W' : 'B';
    const directions = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
    testBoard[row][col] = player;
    for (const [dr, dc] of directions) {
      let r = row + dr, c = col + dc, pieces = [];
      while (r >= 0 && r < 8 && c >= 0 && c < 8) {
        if (testBoard[r][c] === '') break;
        if (testBoard[r][c] === opponent) pieces.push([r, c]);
        else if (testBoard[r][c] === player) {
          for (const [pr, pc] of pieces) testBoard[pr][pc] = player;
          break;
        } else break;
        r += dr; c += dc;
      }
    }
    return testBoard;
  }

  checkWinner(row: number, col: number): void {
    // Count pieces for each player
    let blackCount = 0, whiteCount = 0;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (this.board[r][c] === 'B') blackCount++;
        else if (this.board[r][c] === 'W') whiteCount++;
      }
    }

    // Check if game is over (no valid moves for either player)
    const blackMoves = this.getAvailableMoves('B');
    const whiteMoves = this.getAvailableMoves('W');
    
    if (blackMoves.length === 0 && whiteMoves.length === 0) {
      if (blackCount > whiteCount) {
        this.winner = 'B';
      } else if (whiteCount > blackCount) {
        this.winner = 'W';
      } else {
        this.winner = 'Draw';
      }
    }
  }
}
