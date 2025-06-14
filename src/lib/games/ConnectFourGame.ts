
export class ConnectFourGame {
  board: string[][];
  currentPlayer: string;
  winner: string | null;

  constructor() {
    this.board = Array(6).fill(null).map(() => Array(7).fill(''));
    this.currentPlayer = 'R';
    this.winner = null;
  }

  isValidMove(col: number): boolean {
    return this.board[0][col] === '' && !this.winner;
  }

  makeMove(col: number): boolean {
    if (!this.isValidMove(col)) return false;

    // Find the lowest empty row in the column
    for (let row = 5; row >= 0; row--) {
      if (this.board[row][col] === '') {
        this.board[row][col] = this.currentPlayer;
        this.checkWinner(row, col);
        this.currentPlayer = this.currentPlayer === 'R' ? 'Y' : 'R';
        return true;
      }
    }
    return false;
  }

  checkWinner(row: number, col: number): void {
    const directions = [
      [0, 1], [1, 0], [1, 1], [1, -1]
    ];

    for (const [dRow, dCol] of directions) {
      let count = 1;
      
      // Check positive direction
      for (let i = 1; i < 4; i++) {
        const newRow = row + i * dRow;
        const newCol = col + i * dCol;
        if (newRow >= 0 && newRow < 6 && newCol >= 0 && newCol < 7 && 
            this.board[newRow][newCol] === this.currentPlayer) {
          count++;
        } else break;
      }
      
      // Check negative direction
      for (let i = 1; i < 4; i++) {
        const newRow = row - i * dRow;
        const newCol = col - i * dCol;
        if (newRow >= 0 && newRow < 6 && newCol >= 0 && newCol < 7 && 
            this.board[newRow][newCol] === this.currentPlayer) {
          count++;
        } else break;
      }

      if (count >= 4) {
        this.winner = this.currentPlayer;
        return;
      }
    }
  }

  getAvailableMoves(): number[] {
    const moves: number[] = [];
    for (let col = 0; col < 7; col++) {
      if (this.isValidMove(col)) {
        moves.push(col);
      }
    }
    return moves;
  }

  loadState(state: any): void {
    this.board = state.board;
    this.currentPlayer = state.currentPlayer;
    this.winner = state.winner;
  }
}
