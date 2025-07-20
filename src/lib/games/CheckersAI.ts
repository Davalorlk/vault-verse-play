
export class CheckersAI {
  static getBestMove(board: string[][], playerSymbol: string = 'b'): any | null {
    const moves = this.getAllValidMoves(board, playerSymbol);
    if (moves.length === 0) return null;
    
    // Prioritize captures
    const captureMoves = moves.filter(move => move.isCapture);
    if (captureMoves.length > 0) {
      return this.selectBestCapture(captureMoves, board);
    }
    
    // If no captures, use strategic positioning
    return this.selectBestPositionalMove(moves, board, playerSymbol);
  }
  
  private static getAllValidMoves(board: string[][], player: string): any[] {
    const moves: any[] = [];
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece && ((player === 'b' && (piece === 'b' || piece === 'B')) || 
                     (player === 'w' && (piece === 'w' || piece === 'W')))) {
          const pieceMoves = this.getValidMovesForPiece(board, row, col);
          moves.push(...pieceMoves);
        }
      }
    }
    
    return moves;
  }
  
  private static getValidMovesForPiece(board: string[][], row: number, col: number): any[] {
    const piece = board[row][col];
    const moves: any[] = [];
    const isKing = piece === piece.toUpperCase();
    const isBlack = piece.toLowerCase() === 'b';
    
    // Define movement directions
    const directions = [];
    if (isKing) {
      directions.push([-1, -1], [-1, 1], [1, -1], [1, 1]);
    } else if (isBlack) {
      directions.push([1, -1], [1, 1]); // Black moves down
    } else {
      directions.push([-1, -1], [-1, 1]); // White moves up
    }
    
    // Check for captures first
    for (const [dr, dc] of directions) {
      const jumpRow = row + dr * 2;
      const jumpCol = col + dc * 2;
      const middleRow = row + dr;
      const middleCol = col + dc;
      
      if (this.isValidPosition(jumpRow, jumpCol) && 
          board[jumpRow][jumpCol] === '' &&
          board[middleRow][middleCol] &&
          this.isOpponentPiece(board[middleRow][middleCol], piece)) {
        moves.push({
          from: { row, col },
          to: { row: jumpRow, col: jumpCol },
          isCapture: true,
          capturedPiece: { row: middleRow, col: middleCol }
        });
      }
    }
    
    // If no captures, check regular moves
    if (moves.length === 0) {
      for (const [dr, dc] of directions) {
        const newRow = row + dr;
        const newCol = col + dc;
        
        if (this.isValidPosition(newRow, newCol) && board[newRow][newCol] === '') {
          moves.push({
            from: { row, col },
            to: { row: newRow, col: newCol },
            isCapture: false
          });
        }
      }
    }
    
    return moves;
  }
  
  private static isValidPosition(row: number, col: number): boolean {
    return row >= 0 && row < 8 && col >= 0 && col < 8;
  }
  
  private static isOpponentPiece(piece: string, myPiece: string): boolean {
    const pieceColor = piece.toLowerCase();
    const myColor = myPiece.toLowerCase();
    return pieceColor !== myColor;
  }
  
  private static selectBestCapture(captureMoves: any[], board: string[][]): any {
    // Prefer captures that promote to king
    const promotionMoves = captureMoves.filter(move => 
      (move.to.row === 0 && board[move.from.row][move.from.col].toLowerCase() === 'w') ||
      (move.to.row === 7 && board[move.from.row][move.from.col].toLowerCase() === 'b')
    );
    
    if (promotionMoves.length > 0) {
      return promotionMoves[0];
    }
    
    // Prefer capturing opponent kings
    const kingCaptures = captureMoves.filter(move => 
      board[move.capturedPiece.row][move.capturedPiece.col] === 
      board[move.capturedPiece.row][move.capturedPiece.col].toUpperCase()
    );
    
    if (kingCaptures.length > 0) {
      return kingCaptures[0];
    }
    
    return captureMoves[0];
  }
  
  private static selectBestPositionalMove(moves: any[], board: string[][], player: string): any {
    let bestMove = moves[0];
    let bestScore = -1000;
    
    for (const move of moves) {
      let score = 0;
      
      // Prefer advancing towards opponent
      if (player === 'b') {
        score += move.to.row - move.from.row; // Black wants to move down (increase row)
      } else {
        score += move.from.row - move.to.row; // White wants to move up (decrease row)
      }
      
      // Prefer moves toward center
      const centerDistance = Math.abs(move.to.row - 3.5) + Math.abs(move.to.col - 3.5);
      score += (7 - centerDistance) * 0.5;
      
      // Prefer promotion moves
      if ((move.to.row === 0 && player === 'w') || (move.to.row === 7 && player === 'b')) {
        score += 20;
      }
      
      // Avoid edges slightly
      if (move.to.row === 0 || move.to.row === 7 || move.to.col === 0 || move.to.col === 7) {
        score -= 1;
      }
      
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }
    
    return bestMove;
  }
}
