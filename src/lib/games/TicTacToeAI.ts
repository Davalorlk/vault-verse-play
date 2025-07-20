export class TicTacToeAI {
  static getBestMove(board: string[][], playerSymbol: string = 'O'): { row: number; col: number } | null {
    let bestScore = -Infinity;
    let move: { row: number; col: number } | null = null;
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        if (board[row][col] === '') {
          board[row][col] = playerSymbol;
          const score = this.minimax(board, 0, false, playerSymbol, playerSymbol === 'O' ? 'X' : 'O');
          board[row][col] = '';
          if (score > bestScore) {
            bestScore = score;
            move = { row, col };
          }
        }
      }
    }
    return move;
  }

  private static minimax(board: string[][], depth: number, isMaximizing: boolean, ai: string, human: string): number {
    const winner = this.checkWinner(board);
    if (winner === ai) return 10 - depth;
    if (winner === human) return depth - 10;
    if (this.isDraw(board)) return 0;

    if (isMaximizing) {
      let bestScore = -Infinity;
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
          if (board[row][col] === '') {
            board[row][col] = ai;
            bestScore = Math.max(bestScore, this.minimax(board, depth + 1, false, ai, human));
            board[row][col] = '';
          }
        }
      }
      return bestScore;
    } else {
      let bestScore = Infinity;
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
          if (board[row][col] === '') {
            board[row][col] = human;
            bestScore = Math.min(bestScore, this.minimax(board, depth + 1, true, ai, human));
            board[row][col] = '';
          }
        }
      }
      return bestScore;
    }
  }

  private static isDraw(board: string[][]): boolean {
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        if (board[row][col] === '') return false;
      }
    }
    return !this.checkWinner(board);
  }

  private static checkWinner(board: string[][]): string | null {
    // Check rows
    for (let row = 0; row < 3; row++) {
      if (board[row][0] && board[row][0] === board[row][1] && board[row][1] === board[row][2]) {
        return board[row][0];
      }
    }
    // Check columns
    for (let col = 0; col < 3; col++) {
      if (board[0][col] && board[0][col] === board[1][col] && board[1][col] === board[2][col]) {
        return board[0][col];
      }
    }
    // Check diagonals
    if (board[0][0] && board[0][0] === board[1][1] && board[1][1] === board[2][2]) {
      return board[0][0];
    }
    if (board[0][2] && board[0][2] === board[1][1] && board[1][1] === board[2][0]) {
      return board[0][2];
    }
    return null;
  }
}
