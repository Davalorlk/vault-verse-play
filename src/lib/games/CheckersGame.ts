
export class CheckersGame {
  board: string[][];
  currentPlayer: string;
  winner: string | null;

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
  }

  getValidMoves(row: number, col: number): any[] {
    // Simplified move validation
    const moves = [];
    const piece = this.board[row][col];
    
    if (piece === 'w' || piece === 'W') {
      // White pieces can move up (towards row 0)
      if (row > 0) {
        if (col > 0 && this.board[row - 1][col - 1] === '') {
          moves.push({ to: { row: row - 1, col: col - 1 } });
        }
        if (col < 7 && this.board[row - 1][col + 1] === '') {
          moves.push({ to: { row: row - 1, col: col + 1 } });
        }
      }
    }
    
    if (piece === 'b' || piece === 'B') {
      // Black pieces can move down (towards row 7)
      if (row < 7) {
        if (col > 0 && this.board[row + 1][col - 1] === '') {
          moves.push({ to: { row: row + 1, col: col - 1 } });
        }
        if (col < 7 && this.board[row + 1][col + 1] === '') {
          moves.push({ to: { row: row + 1, col: col + 1 } });
        }
      }
    }
    
    return moves;
  }

  makeMove(from: { row: number; col: number }, to: { row: number; col: number }): boolean {
    const piece = this.board[from.row][from.col];
    if (!piece) return false;
    
    this.board[to.row][to.col] = piece;
    this.board[from.row][from.col] = '';
    
    // Promote to king if reaching opposite end
    if ((piece === 'w' && to.row === 0) || (piece === 'b' && to.row === 7)) {
      this.board[to.row][to.col] = piece.toUpperCase();
    }
    
    this.currentPlayer = this.currentPlayer === 'w' ? 'b' : 'w';
    return true;
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
    this.board = state.board;
    this.currentPlayer = state.currentPlayer;
    this.winner = state.winner;
  }
}
