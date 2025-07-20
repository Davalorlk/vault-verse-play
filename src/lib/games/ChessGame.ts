import { Chess, Move } from 'chess.js';

export class ChessGame {
  private chess: Chess;

  constructor(fen?: string) {
    this.chess = new Chess(fen);
  }

  // Getter for the board state in the 2D array format expected by the UI
  get board(): (string | null)[][] {
    return this.chess.board().map(row => 
      row.map(square => {
        if (!square) return '';
        return square.color === 'w' ? square.type.toUpperCase() : square.type.toLowerCase();
      })
    );
  }

  // Getter for the current player's turn
  get currentPlayer(): 'white' | 'black' {
    return this.chess.turn() === 'w' ? 'white' : 'black';
  }

  // Getter for the winner
  get winner(): 'white' | 'black' | 'draw' | null {
    if (!this.chess.isGameOver()) return null;
    if (this.chess.isCheckmate()) {
      return this.currentPlayer === 'white' ? 'black' : 'white';
    }
    // isStalemate, isThreefoldRepetition, isInsufficientMaterial, isDraw
    return 'draw';
  }

  // Check if the game is over
  isGameOver(): boolean {
    return this.chess.isGameOver();
  }

  isCheckmate(): boolean {
    return this.chess.isCheckmate();
  }
  
  // Make a move
  move(move: string | { from: string; to: string; promotion?: string }): Move | null {
    try {
      const result = this.chess.move(move);
      return result;
    } catch (e) {
      console.error("Invalid move:", move, e);
      return null;
    }
  }

  // Get all possible moves for a given square
  moves(options?: { square?: string; verbose?: boolean }): Move[] | string[] {
    return this.chess.moves(options);
  }

  // Get the FEN string for the current position
  fen(): string {
    return this.chess.fen();
  }

  // Load a position from a FEN string
  load(fen: string): boolean {
    return this.chess.load(fen);
  }

  // Load state (simplified for this wrapper)
  loadState(state: { fen?: string; board?: any; currentPlayer?: any; winner?: any }): void {
    if (state.fen) {
      this.load(state.fen);
    } else if (state.board) {
      // This is a rough conversion if we get a board object instead of FEN.
      // A full implementation would need a more robust board-to-FEN converter.
      // For now, we rely on FEN being passed for state sync.
      console.warn("Loading from board object is not fully supported. Use FEN for reliability.");
    }
  }

  // Utility to convert algebraic notation to coordinates
  algebraicToCoords(notation: string): { row: number; col: number } | null {
    if (!/^[a-h][1-8]$/.test(notation)) return null;
    const col = notation.charCodeAt(0) - 'a'.charCodeAt(0);
    const row = 8 - parseInt(notation[1], 10);
    return { row, col };
  }
  
  // Utility to convert coordinates to algebraic notation
  algebraicNotation(row: number, col: number): string {
    return String.fromCharCode('a'.charCodeAt(0) + col) + (8 - row);
  }

  squareToCoords(square: string): { row: number; col: number } {
    const coords = this.algebraicToCoords(square);
    if (!coords) throw new Error(`Invalid square notation: ${square}`);
    return coords;
  }
}
