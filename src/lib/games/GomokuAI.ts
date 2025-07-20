export class GomokuAI {
  static getBestMove(board: string[][], playerSymbol: string = 'O', depth: number = 2): { row: number; col: number } | null {
    let bestScore = -Infinity;
    let bestMove: { row: number; col: number } | null = null;
    const size = board.length;
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        if (board[row][col] === '') {
          board[row][col] = playerSymbol;
          const score = this.minimax(board, depth - 1, false, playerSymbol, playerSymbol === 'O' ? 'X' : 'O');
          board[row][col] = '';
          if (score > bestScore) {
            bestScore = score;
            bestMove = { row, col };
          }
        }
      }
    }
    return bestMove;
  }

  private static minimax(board: string[][], depth: number, maximizing: boolean, ai: string, human: string): number {
    const winner = this.checkWinner(board, ai) ? ai : (this.checkWinner(board, human) ? human : null);
    if (winner === ai) return 10000 + depth;
    if (winner === human) return -10000 - depth;
    if (this.isDraw(board) || depth === 0) return this.evaluateBoard(board, ai, human);

    const size = board.length;
    if (maximizing) {
      let maxEval = -Infinity;
      for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
          if (board[row][col] === '') {
            board[row][col] = ai;
            const evalScore = this.minimax(board, depth - 1, false, ai, human);
            board[row][col] = '';
            maxEval = Math.max(maxEval, evalScore);
          }
        }
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
          if (board[row][col] === '') {
            board[row][col] = human;
            const evalScore = this.minimax(board, depth - 1, true, ai, human);
            board[row][col] = '';
            minEval = Math.min(minEval, evalScore);
          }
        }
      }
      return minEval;
    }
  }

  private static isDraw(board: string[][]): boolean {
    for (let row = 0; row < board.length; row++) {
      for (let col = 0; col < board.length; col++) {
        if (board[row][col] === '') return false;
      }
    }
    return true;
  }

  private static checkWinner(board: string[][], symbol: string): boolean {
    const size = board.length;
    const directions = [[0,1], [1,0], [1,1], [1,-1]];
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        if (board[row][col] === symbol) {
          for (const [dr, dc] of directions) {
            let count = 1;
            let r = row + dr, c = col + dc;
            while (r >= 0 && r < size && c >= 0 && c < size && board[r][c] === symbol) {
              count++;
              if (count >= 5) return true;
              r += dr;
              c += dc;
            }
          }
        }
      }
    }
    return false;
  }

  private static evaluateBoard(board: string[][], ai: string, human: string): number {
    // Simple: count open-ended 2/3/4-in-a-rows for AI and human
    return this.countPatterns(board, ai, 4) * 1000 +
           this.countPatterns(board, ai, 3) * 100 +
           this.countPatterns(board, ai, 2) * 10
         - this.countPatterns(board, human, 4) * 1200
         - this.countPatterns(board, human, 3) * 120
         - this.countPatterns(board, human, 2) * 12;
  }

  private static countPatterns(board: string[][], symbol: string, length: number): number {
    const size = board.length;
    let count = 0;
    const directions = [[0,1], [1,0], [1,1], [1,-1]];
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        for (const [dr, dc] of directions) {
          let streak = 0;
          let r = row, c = col;
          while (r >= 0 && r < size && c >= 0 && c < size && board[r][c] === symbol) {
            streak++;
            r += dr;
            c += dc;
          }
          if (streak === length) {
            // Check open ends
            const beforeR = row - dr, beforeC = col - dc;
            const afterR = row + dr * length, afterC = col + dc * length;
            const openBefore = beforeR >= 0 && beforeR < size && beforeC >= 0 && beforeC < size && board[beforeR][beforeC] === '';
            const openAfter = afterR >= 0 && afterR < size && afterC >= 0 && afterC < size && board[afterR][afterC] === '';
            if (openBefore || openAfter) count++;
          }
        }
      }
    }
    return count;
  }
}
