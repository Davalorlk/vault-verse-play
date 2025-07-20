
export interface Ship {
  name: string;
  size: number;
  positions: { row: number; col: number }[];
  hits: boolean[];
  sunk: boolean;
}

export class BattleshipGame {
  player1Board: string[][]; // 'S' = ship, 'H' = hit, 'M' = miss, '' = empty
  player2Board: string[][];
  player1Ships: Ship[];
  player2Ships: Ship[];
  currentPlayer: string;
  phase: 'setup' | 'battle';
  winner: string | null;
  
  constructor() {
    this.player1Board = Array(10).fill(null).map(() => Array(10).fill(''));
    this.player2Board = Array(10).fill(null).map(() => Array(10).fill(''));
    this.player1Ships = this.createShips();
    this.player2Ships = this.createShips();
    this.currentPlayer = '1';
    this.phase = 'setup';
    this.winner = null;
  }
  
  private createShips(): Ship[] {
    return [
      { name: 'Carrier', size: 5, positions: [], hits: [], sunk: false },
      { name: 'Battleship', size: 4, positions: [], hits: [], sunk: false },
      { name: 'Cruiser', size: 3, positions: [], hits: [], sunk: false },
      { name: 'Submarine', size: 3, positions: [], hits: [], sunk: false },
      { name: 'Destroyer', size: 2, positions: [], hits: [], sunk: false }
    ];
  }
  
  placeShip(player: string, shipIndex: number, startRow: number, startCol: number, horizontal: boolean): boolean {
    const ships = player === '1' ? this.player1Ships : this.player2Ships;
    const board = player === '1' ? this.player1Board : this.player2Board;
    const ship = ships[shipIndex];
    
    // Check if placement is valid
    if (!this.isValidPlacement(board, ship.size, startRow, startCol, horizontal)) {
      return false;
    }
    
    // Clear previous position if ship was already placed
    if (ship.positions.length > 0) {
      ship.positions.forEach(pos => {
        board[pos.row][pos.col] = '';
      });
    }
    
    // Place ship
    ship.positions = [];
    ship.hits = Array(ship.size).fill(false);
    
    for (let i = 0; i < ship.size; i++) {
      const row = horizontal ? startRow : startRow + i;
      const col = horizontal ? startCol + i : startCol;
      ship.positions.push({ row, col });
      board[row][col] = 'S';
    }
    
    return true;
  }
  
  private isValidPlacement(board: string[][], size: number, startRow: number, startCol: number, horizontal: boolean): boolean {
    for (let i = 0; i < size; i++) {
      const row = horizontal ? startRow : startRow + i;
      const col = horizontal ? startCol + i : startCol;
      
      if (row < 0 || row >= 10 || col < 0 || col >= 10) {
        return false;
      }
      
      if (board[row][col] === 'S') {
        return false;
      }
    }
    
    return true;
  }
  
  randomPlaceShips(player: string): void {
    const ships = player === '1' ? this.player1Ships : this.player2Ships;
    
    ships.forEach((ship, index) => {
      let placed = false;
      let attempts = 0;
      
      while (!placed && attempts < 100) {
        const horizontal = Math.random() < 0.5;
        const startRow = Math.floor(Math.random() * 10);
        const startCol = Math.floor(Math.random() * 10);
        
        if (this.placeShip(player, index, startRow, startCol, horizontal)) {
          placed = true;
        }
        attempts++;
      }
    });
  }
  
  attack(attacker: string, row: number, col: number): { hit: boolean; sunk: boolean; shipName?: string } {
    const targetBoard = attacker === '1' ? this.player2Board : this.player1Board;
    const targetShips = attacker === '1' ? this.player2Ships : this.player1Ships;
    
    if (targetBoard[row][col] === 'H' || targetBoard[row][col] === 'M') {
      return { hit: false, sunk: false }; // Already attacked
    }
    
    if (targetBoard[row][col] === 'S') {
      targetBoard[row][col] = 'H';
      
      // Find which ship was hit
      const hitShip = targetShips.find(ship => 
        ship.positions.some(pos => pos.row === row && pos.col === col)
      );
      
      if (hitShip) {
        const posIndex = hitShip.positions.findIndex(pos => pos.row === row && pos.col === col);
        hitShip.hits[posIndex] = true;
        
        // Check if ship is sunk
        if (hitShip.hits.every(hit => hit)) {
          hitShip.sunk = true;
          
          // Check if all ships are sunk
          if (targetShips.every(ship => ship.sunk)) {
            this.winner = attacker;
          }
          
          return { hit: true, sunk: true, shipName: hitShip.name };
        }
        
        return { hit: true, sunk: false, shipName: hitShip.name };
      }
    } else {
      targetBoard[row][col] = 'M';
    }
    
    this.currentPlayer = attacker === '1' ? '2' : '1';
    return { hit: false, sunk: false };
  }
  
  allShipsPlaced(player: string): boolean {
    const ships = player === '1' ? this.player1Ships : this.player2Ships;
    return ships.every(ship => ship.positions.length === ship.size);
  }
  
  startBattle(): void {
    if (this.allShipsPlaced('1') && this.allShipsPlaced('2')) {
      this.phase = 'battle';
    }
  }
  
  loadState(state: any): void {
    Object.assign(this, state);
  }
}
