
export class GomokuGame {
  board: string[][];
  currentPlayer: string;
  winner: string | null;
  size: number;

  constructor(size: number = 15) {
    this.size = size;
    this.board = Array(size).fill(null).map(() => Array(size).fill(''));
    this.currentPlayer = 'X';
    this.winner = null;
  }

  isValidMove(row: number, col: number): boolean {
    return this.board[row][col] === '' && !this.winner;
  }

  makeMove(row: number, col: number): boolean {
    if (!this.isValidMove(row, col)) return false;
    
    this.board[row][col] = this.currentPlayer;
    this.checkWinner(row, col);
    this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
    return true;
  }

  checkWinner(row: number, col: number): void {
    const directions = [
      [0, 1], [1, 0], [1, 1], [1, -1]
    ];

    for (const [dRow, dCol] of directions) {
      let count = 1;
      
      // Check positive direction
      for (let i = 1; i < 5; i++) {
        const newRow = row + i * dRow;
        const newCol = col + i * dCol;
        if (newRow >= 0 && newRow < this.size && newCol >= 0 && newCol < this.size && 
            this.board[newRow][newCol] === this.currentPlayer) {
          count++;
        } else break;
      }
      
      // Check negative direction
      for (let i = 1; i < 5; i++) {
        const newRow = row - i * dRow;
        const newCol = col - i * dCol;
        if (newRow >= 0 && newRow < this.size && newCol >= 0 && newCol < this.size && 
            this.board[newRow][newCol] === this.currentPlayer) {
          count++;
        } else break;
      }

      if (count >= 5) {
        this.winner = this.currentPlayer;
        return;
      }
    }
  }

  getAvailableMoves(): { row: number; col: number }[] {
    const moves: { row: number; col: number }[] = [];
    for (let row = 0; row < this.size; row++) {
      for (let col = 0; col < this.size; col++) {
        if (this.board[row][col] === '') {
          moves.push({ row, col });
        }
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
