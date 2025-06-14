
import { Game } from 'boardgame.io';

const TicTacToe = Game({
  setup: () => ({
    cells: Array(9).fill(null),
    winner: null,
  }),

  turn: {
    minMoves: 1,
    maxMoves: 1,
  },

  moves: {
    clickCell: (G, ctx, id) => {
      if (G.cells[id] !== null) {
        return;
      }
      G.cells[id] = ctx.currentPlayer;
    },
  },

  endIf: (G, ctx) => {
    if (IsVictory(G.cells)) {
      return { winner: ctx.currentPlayer };
    }
    if (IsDraw(G.cells)) {
      return { draw: true };
    }
  },
});

// Helper functions
function IsVictory(cells) {
  const positions = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];

  const isRowComplete = (row) => {
    const symbols = row.map(i => cells[i]);
    return symbols.every(i => i !== null && i === symbols[0]);
  };

  return positions.map(isRowComplete).some(i => i === true);
}

function IsDraw(cells) {
  return cells.filter(c => c === null).length === 0;
}

export class TicTacToeGame {
  board: string[][];
  currentPlayer: string;
  winner: string | null;
  game: any;

  constructor() {
    this.board = [
      ['', '', ''],
      ['', '', ''],
      ['', '', '']
    ];
    this.currentPlayer = 'X';
    this.winner = null;
    this.game = TicTacToe;
  }

  isValidMove(row: number, col: number): boolean {
    return this.board[row][col] === '' && !this.winner;
  }

  makeMove(row: number, col: number): boolean {
    if (!this.isValidMove(row, col)) return false;
    
    this.board[row][col] = this.currentPlayer;
    this.checkWinner();
    this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
    return true;
  }

  checkWinner(): void {
    // Check rows
    for (let i = 0; i < 3; i++) {
      if (this.board[i][0] && this.board[i][0] === this.board[i][1] && this.board[i][1] === this.board[i][2]) {
        this.winner = this.board[i][0];
        return;
      }
    }

    // Check columns
    for (let i = 0; i < 3; i++) {
      if (this.board[0][i] && this.board[0][i] === this.board[1][i] && this.board[1][i] === this.board[2][i]) {
        this.winner = this.board[0][i];
        return;
      }
    }

    // Check diagonals
    if (this.board[0][0] && this.board[0][0] === this.board[1][1] && this.board[1][1] === this.board[2][2]) {
      this.winner = this.board[0][0];
      return;
    }
    if (this.board[0][2] && this.board[0][2] === this.board[1][1] && this.board[1][1] === this.board[2][0]) {
      this.winner = this.board[0][2];
      return;
    }

    // Check for draw
    const isDraw = this.board.every(row => row.every(cell => cell !== ''));
    if (isDraw) {
      this.winner = 'Draw';
    }
  }

  getAvailableMoves(): { row: number; col: number }[] {
    const moves: { row: number; col: number }[] = [];
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
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

export { TicTacToe };
