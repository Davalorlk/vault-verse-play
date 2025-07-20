
export class ReversiAI {
  static getBestMove(board: string[][], playerSymbol: string = 'W'): { row: number; col: number } | null {
    const opponentSymbol = playerSymbol === 'W' ? 'B' : 'W';
    
    // Get all valid moves
    const validMoves = this.getValidMoves(board, playerSymbol);
    if (validMoves.length === 0) return null;
    
    // Strategy priorities:
    // 1. Take corners (highest priority)
    // 2. Maximize piece count gain
    // 3. Avoid positions next to corners (unless taking corner)
    // 4. Prefer edges over interior
    
    const corners = [
      { row: 0, col: 0 }, { row: 0, col: 7 },
      { row: 7, col: 0 }, { row: 7, col: 7 }
    ];
    
    // Check for corner moves
    for (const corner of corners) {
      if (validMoves.some(move => move.row === corner.row && move.col === corner.col)) {
        return corner;
      }
    }
    
    // Evaluate each move by piece count gain
    let bestMove = validMoves[0];
    let bestScore = -1;
    
    for (const move of validMoves) {
      const testBoard = this.simulateMove(board, move.row, move.col, playerSymbol);
      const score = this.evaluatePosition(testBoard, move, playerSymbol);
      
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }
    
    return bestMove;
  }
  
  private static getValidMoves(board: string[][], player: string): { row: number; col: number }[] {
    const moves: { row: number; col: number }[] = [];
    const opponent = player === 'B' ? 'W' : 'B';
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (board[row][col] === '' && this.canFlip(board, row, col, player)) {
          moves.push({ row, col });
        }
      }
    }
    
    return moves;
  }
  
  private static canFlip(board: string[][], row: number, col: number, player: string): boolean {
    const opponent = player === 'B' ? 'W' : 'B';
    const directions = [[-1,-1], [-1,0], [-1,1], [0,-1], [0,1], [1,-1], [1,0], [1,1]];
    
    for (const [dr, dc] of directions) {
      let r = row + dr;
      let c = col + dc;
      let hasOpponent = false;
      
      while (r >= 0 && r < 8 && c >= 0 && c < 8 && board[r][c] === opponent) {
        hasOpponent = true;
        r += dr;
        c += dc;
      }
      
      if (hasOpponent && r >= 0 && r < 8 && c >= 0 && c < 8 && board[r][c] === player) {
        return true;
      }
    }
    
    return false;
  }
  
  private static simulateMove(board: string[][], row: number, col: number, player: string): string[][] {
    const newBoard = board.map(row => [...row]);
    newBoard[row][col] = player;
    
    const opponent = player === 'B' ? 'W' : 'B';
    const directions = [[-1,-1], [-1,0], [-1,1], [0,-1], [0,1], [1,-1], [1,0], [1,1]];
    
    for (const [dr, dc] of directions) {
      const toFlip: {r: number, c: number}[] = [];
      let r = row + dr;
      let c = col + dc;
      
      while (r >= 0 && r < 8 && c >= 0 && c < 8 && newBoard[r][c] === opponent) {
        toFlip.push({r, c});
        r += dr;
        c += dc;
      }
      
      if (toFlip.length > 0 && r >= 0 && r < 8 && c >= 0 && c < 8 && newBoard[r][c] === player) {
        toFlip.forEach(({r, c}) => newBoard[r][c] = player);
      }
    }
    
    return newBoard;
  }
  
  private static evaluatePosition(board: string[][], move: { row: number; col: number }, player: string): number {
    // Count pieces gained
    const pieceCount = this.countPieces(board, player);
    
    // Position weights
    let positionBonus = 0;
    
    // Corner bonus
    if ((move.row === 0 || move.row === 7) && (move.col === 0 || move.col === 7)) {
      positionBonus += 100;
    }
    // Edge bonus
    else if (move.row === 0 || move.row === 7 || move.col === 0 || move.col === 7) {
      positionBonus += 10;
    }
    // Avoid squares next to corners
    else if (this.isNextToCorner(move.row, move.col)) {
      positionBonus -= 20;
    }
    
    return pieceCount + positionBonus;
  }
  
  private static countPieces(board: string[][], player: string): number {
    let count = 0;
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (board[row][col] === player) count++;
      }
    }
    return count;
  }
  
  private static isNextToCorner(row: number, col: number): boolean {
    const nearCorners = [
      [0, 1], [1, 0], [1, 1], // near top-left
      [0, 6], [1, 6], [1, 7], // near top-right
      [6, 0], [6, 1], [7, 1], // near bottom-left
      [6, 6], [6, 7], [7, 6]  // near bottom-right
    ];
    
    return nearCorners.some(([r, c]) => r === row && c === col);
  }
}
