
export class BattleshipAI {
  private static lastHit: { row: number; col: number } | null = null;
  private static huntDirection: { dr: number; dc: number } | null = null;
  private static huntQueue: { row: number; col: number }[] = [];
  
  static getBestMove(board: string[][], attackBoard: string[][]): { row: number; col: number } | null {
    // Hunt mode: We hit a ship and need to find the rest
    if (this.huntQueue.length > 0) {
      const target = this.huntQueue.shift()!;
      if (this.isValidTarget(attackBoard, target.row, target.col)) {
        return target;
      }
      return this.getBestMove(board, attackBoard); // Try again if target was invalid
    }
    
    // If we have a recent hit, search around it
    if (this.lastHit) {
      const adjacentMoves = this.getAdjacentMoves(this.lastHit.row, this.lastHit.col, attackBoard);
      if (adjacentMoves.length > 0) {
        return adjacentMoves[0];
      } else {
        this.lastHit = null; // Ship probably sunk, reset
      }
    }
    
    // Target mode: Use probability-based targeting
    return this.getBestProbabilityMove(attackBoard);
  }
  
  static onAttackResult(row: number, col: number, result: 'hit' | 'miss' | 'sunk'): void {
    if (result === 'hit') {
      this.lastHit = { row, col };
      
      // Add adjacent cells to hunt queue
      const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
      for (const [dr, dc] of directions) {
        const newRow = row + dr;
        const newCol = col + dc;
        if (newRow >= 0 && newRow < 10 && newCol >= 0 && newCol < 10) {
          this.huntQueue.push({ row: newRow, col: newCol });
        }
      }
    } else if (result === 'sunk') {
      // Ship sunk, reset hunt mode
      this.lastHit = null;
      this.huntDirection = null;
      this.huntQueue = [];
    }
  }
  
  private static isValidTarget(attackBoard: string[][], row: number, col: number): boolean {
    return row >= 0 && row < 10 && col >= 0 && col < 10 && 
           attackBoard[row][col] !== 'H' && attackBoard[row][col] !== 'M';
  }
  
  private static getAdjacentMoves(row: number, col: number, attackBoard: string[][]): { row: number; col: number }[] {
    const moves: { row: number; col: number }[] = [];
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    
    for (const [dr, dc] of directions) {
      const newRow = row + dr;
      const newCol = col + dc;
      if (this.isValidTarget(attackBoard, newRow, newCol)) {
        moves.push({ row: newRow, col: newCol });
      }
    }
    
    return moves;
  }
  
  private static getBestProbabilityMove(attackBoard: string[][]): { row: number; col: number } | null {
    const probabilityGrid = this.calculateProbabilities(attackBoard);
    
    let bestMove = null;
    let highestProbability = -1;
    
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 10; col++) {
        if (this.isValidTarget(attackBoard, row, col) && 
            probabilityGrid[row][col] > highestProbability) {
          highestProbability = probabilityGrid[row][col];
          bestMove = { row, col };
        }
      }
    }
    
    // If no probability-based move found, use checkerboard pattern
    if (!bestMove) {
      for (let row = 0; row < 10; row++) {
        for (let col = 0; col < 10; col++) {
          if (this.isValidTarget(attackBoard, row, col) && (row + col) % 2 === 0) {
            return { row, col };
          }
        }
      }
      
      // Fall back to any available cell
      for (let row = 0; row < 10; row++) {
        for (let col = 0; col < 10; col++) {
          if (this.isValidTarget(attackBoard, row, col)) {
            return { row, col };
          }
        }
      }
    }
    
    return bestMove;
  }
  
  private static calculateProbabilities(attackBoard: string[][]): number[][] {
    const probabilities = Array(10).fill(0).map(() => Array(10).fill(0));
    const shipSizes = [5, 4, 3, 3, 2]; // Standard battleship ship sizes
    
    // For each ship size, calculate where it could fit
    for (const shipSize of shipSizes) {
      // Check horizontal placements
      for (let row = 0; row < 10; row++) {
        for (let col = 0; col <= 10 - shipSize; col++) {
          if (this.canPlaceShip(attackBoard, row, col, shipSize, true)) {
            for (let i = 0; i < shipSize; i++) {
              probabilities[row][col + i]++;
            }
          }
        }
      }
      
      // Check vertical placements
      for (let row = 0; row <= 10 - shipSize; row++) {
        for (let col = 0; col < 10; col++) {
          if (this.canPlaceShip(attackBoard, row, col, shipSize, false)) {
            for (let i = 0; i < shipSize; i++) {
              probabilities[row + i][col]++;
            }
          }
        }
      }
    }
    
    return probabilities;
  }
  
  private static canPlaceShip(attackBoard: string[][], startRow: number, startCol: number, 
                             size: number, horizontal: boolean): boolean {
    for (let i = 0; i < size; i++) {
      const row = horizontal ? startRow : startRow + i;
      const col = horizontal ? startCol + i : startCol;
      
      // If we've already attacked this cell and it was a miss, ship can't be here
      if (attackBoard[row][col] === 'M') {
        return false;
      }
    }
    return true;
  }
}
