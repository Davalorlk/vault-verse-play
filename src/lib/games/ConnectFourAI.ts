export class ConnectFourAI {
  static getBestMove(board: string[][], playerSymbol: string = 'Y', depth: number = 4): number | null {
    let bestScore = -Infinity;
    let bestCol: number | null = null;
    for (let col = 0; col < 7; col++) {
      if (this.isValidMove(board, col)) {
        const testBoard = this.makeTestMove(board, col, playerSymbol);
        const score = this.minimax(testBoard, depth - 1, false, playerSymbol, playerSymbol === 'Y' ? 'R' : 'Y', -Infinity, Infinity);
        if (score > bestScore) {
          bestScore = score;
          bestCol = col;
        }
      }
    }
    return bestCol;
  }

  private static minimax(board: string[][], depth: number, maximizing: boolean, ai: string, human: string, alpha: number, beta: number): number {
    const winner = this.checkWinner(board);
    if (winner === ai) return 10000 + depth;
    if (winner === human) return -10000 - depth;
    if (this.isDraw(board) || depth === 0) return this.evaluateBoard(board, ai, human);

    if (maximizing) {
      let maxEval = -Infinity;
      for (let col = 0; col < 7; col++) {
        if (this.isValidMove(board, col)) {
          const testBoard = this.makeTestMove(board, col, ai);
          const evalScore = this.minimax(testBoard, depth - 1, false, ai, human, alpha, beta);
          maxEval = Math.max(maxEval, evalScore);
          alpha = Math.max(alpha, evalScore);
          if (beta <= alpha) break;
        }
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (let col = 0; col < 7; col++) {
        if (this.isValidMove(board, col)) {
          const testBoard = this.makeTestMove(board, col, human);
          const evalScore = this.minimax(testBoard, depth - 1, true, ai, human, alpha, beta);
          minEval = Math.min(minEval, evalScore);
          beta = Math.min(beta, evalScore);
          if (beta <= alpha) break;
        }
      }
      return minEval;
    }
  }

  private static evaluateBoard(board: string[][], ai: string, human: string): number {
    // Simple evaluation: +score for 2/3 in a row for AI, -score for opponent
    let score = 0;
    // Center column preference
    for (let row = 0; row < 6; row++) {
      if (board[row][3] === ai) score += 3;
      if (board[row][3] === human) score -= 3;
    }
    // Horizontal, vertical, diagonal checks
    score += this.countPatterns(board, ai, 3) * 10;
    score -= this.countPatterns(board, human, 3) * 12;
    score += this.countPatterns(board, ai, 2) * 2;
    score -= this.countPatterns(board, human, 2) * 3;
    return score;
  }

  private static countPatterns(board: string[][], symbol: string, length: number): number {
    let count = 0;
    // Horizontal
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col <= 7 - length; col++) {
        let streak = 0;
        for (let k = 0; k < length; k++) {
          if (board[row][col + k] === symbol) streak++;
        }
        if (streak === length) count++;
      }
    }
    // Vertical
    for (let col = 0; col < 7; col++) {
      for (let row = 0; row <= 6 - length; row++) {
        let streak = 0;
        for (let k = 0; k < length; k++) {
          if (board[row + k][col] === symbol) streak++;
        }
        if (streak === length) count++;
      }
    }
    // Diagonal /
    for (let row = length - 1; row < 6; row++) {
      for (let col = 0; col <= 7 - length; col++) {
        let streak = 0;
        for (let k = 0; k < length; k++) {
          if (board[row - k][col + k] === symbol) streak++;
        }
        if (streak === length) count++;
      }
    }
    // Diagonal \
    for (let row = 0; row <= 6 - length; row++) {
      for (let col = 0; col <= 7 - length; col++) {
        let streak = 0;
        for (let k = 0; k < length; k++) {
          if (board[row + k][col + k] === symbol) streak++;
        }
        if (streak === length) count++;
      }
    }
    return count;
  }

  private static isValidMove(board: string[][], col: number): boolean {
    return board[0][col] === '';
  }

  private static makeTestMove(board: string[][], col: number, symbol: string): string[][] {
    const testBoard = board.map(row => [...row]);
    for (let row = 5; row >= 0; row--) {
      if (testBoard[row][col] === '') {
        testBoard[row][col] = symbol;
        break;
      }
    }
    return testBoard;
  }

  private static isDraw(board: string[][]): boolean {
    for (let col = 0; col < 7; col++) {
      if (board[0][col] === '') return false;
    }
    return !this.checkWinner(board);
  }

  private static checkWinner(board: string[][]): string | null {
    const rows = 6;
    const cols = 7;
    
    // Check horizontal
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols - 3; col++) {
        if (board[row][col] && 
            board[row][col] === board[row][col + 1] &&
            board[row][col] === board[row][col + 2] &&
            board[row][col] === board[row][col + 3]) {
          return board[row][col];
        }
      }
    }
    
    // Check vertical
    for (let row = 0; row < rows - 3; row++) {
      for (let col = 0; col < cols; col++) {
        if (board[row][col] && 
            board[row][col] === board[row + 1][col] &&
            board[row][col] === board[row + 2][col] &&
            board[row][col] === board[row + 3][col]) {
          return board[row][col];
        }
      }
    }
    
    // Check diagonal (top-left to bottom-right)
    for (let row = 0; row < rows - 3; row++) {
      for (let col = 0; col < cols - 3; col++) {
        if (board[row][col] && 
            board[row][col] === board[row + 1][col + 1] &&
            board[row][col] === board[row + 2][col + 2] &&
            board[row][col] === board[row + 3][col + 3]) {
          return board[row][col];
        }
      }
    }
    
    // Check diagonal (bottom-left to top-right)
    for (let row = 3; row < rows; row++) {
      for (let col = 0; col < cols - 3; col++) {
        if (board[row][col] && 
            board[row][col] === board[row - 1][col + 1] &&
            board[row][col] === board[row - 2][col + 2] &&
            board[row][col] === board[row - 3][col + 3]) {
          return board[row][col];
        }
      }
    }
    
    return null;
  }
}
