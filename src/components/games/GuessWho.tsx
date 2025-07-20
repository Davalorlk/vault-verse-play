import { socket } from '@/lib/socket';
import { useEffect, useState } from 'react';

const CHARACTERS = [
  { name: 'Alice', hair: 'blonde', glasses: true, hat: false, gender: 'female', hobby: 'painting' },
  { name: 'Bob', hair: 'brown', glasses: false, hat: true, gender: 'male', hobby: 'cycling' },
  { name: 'Carol', hair: 'red', glasses: true, hat: false, gender: 'female', hobby: 'reading' },
  { name: 'Dave', hair: 'black', glasses: false, hat: false, gender: 'male', hobby: 'cooking' },
  { name: 'Eve', hair: 'blonde', glasses: false, hat: true, gender: 'female', hobby: 'music' },
  { name: 'Frank', hair: 'brown', glasses: true, hat: false, gender: 'male', hobby: 'gardening' },
  { name: 'Grace', hair: 'red', glasses: false, hat: true, gender: 'female', hobby: 'dancing' },
  { name: 'Henry', hair: 'black', glasses: true, hat: false, gender: 'male', hobby: 'writing' }
];

export function GuessWho({ roomName, user, isMyTurn, playMode }: { roomName: string, user: any, isMyTurn: boolean, playMode: 'player' | 'computer' }) {
  const [myCharacter, setMyCharacter] = useState('');
  const [opponentCharacter, setOpponentCharacter] = useState('');
  const [guess, setGuess] = useState('');
  const [winner, setWinner] = useState('');
  const [gameStarted, setGameStarted] = useState(false);
  const [gamePhase, setGamePhase] = useState<'setup' | 'playing' | 'finished'>('setup');
  const [myPlayerIndex, setMyPlayerIndex] = useState<number>(0);
  const [playersReady, setPlayersReady] = useState(0);

  useEffect(() => {
    if (playMode === 'player') {
      socket.emit('join-game-room', { roomName, gameId: 'guesswho' });
      
      socket.on('game-initialized', (data: { playerIndex: number, gameStarted: boolean }) => {
        console.log('Guess Who game initialized:', data);
        const validPlayerIndex = typeof data.playerIndex === 'number' && !isNaN(data.playerIndex) ? data.playerIndex : 0;
        setMyPlayerIndex(validPlayerIndex);
        setGameStarted(data.gameStarted || false);
      });
      
      const handleGameState = (state: any) => {
        console.log('Guess Who game state update received:', state);
        if (state.phase) {
          setGamePhase(state.phase);
        }
        if (state.playersReady !== undefined) {
          setPlayersReady(state.playersReady);
        }
        if (state.winner) {
          setWinner(state.winner);
          setGamePhase('finished');
        }
        if (state.correctCharacter && state.guess) {
          // Only reveal opponent's character at the end
          setOpponentCharacter(state.correctCharacter);
        }
      };
      
      const handlePlayerJoined = (data: { playersCount: number }) => {
        console.log('Guess Who player joined:', data);
        if (data.playersCount === 2) {
          setGameStarted(true);
        }
      };
      
      socket.on('game-state-update', handleGameState);
      socket.on('player-joined', handlePlayerJoined);
      
      return () => {
        socket.off('game-state-update', handleGameState);
        socket.off('game-initialized');
        socket.off('player-joined', handlePlayerJoined);
      };
    } else {
      // Computer mode setup
      setGameStarted(true);
      setGamePhase('setup');
      setPlayersReady(0);
      setMyPlayerIndex(0);
    }
  }, [roomName, user, playMode]);

  useEffect(() => {
    if (playMode === 'computer' && gamePhase === 'finished' && winner) {
      const timer = setTimeout(() => {
        setMyCharacter('');
        setOpponentCharacter('');
        setGuess('');
        setWinner('');
        setGamePhase('setup');
        setPlayersReady(0);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [gamePhase, winner, playMode]);

  function chooseCharacter(charName: string) {
    const charObj = CHARACTERS.find(c => c.name === charName);
    if (!charObj) return;
    
    setMyCharacter(charObj.name);
    
    if (playMode === 'player') {
      console.log('Emitting Guess Who character selection:', charName);
      socket.emit('game-state-update', {
        roomName,
        gameId: 'guesswho',
        state: { 
          myCharacter: charObj.name,
          playerIndex: myPlayerIndex
        }
      });
    } else {
      // Computer picks a character
      const compChar = CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
      setOpponentCharacter(compChar.name);
      setGamePhase('playing');
    }
  }

  function makeGuess() {
    if (!guess.trim()) return;
    
    if (playMode === 'player') {
      console.log('Making guess:', guess);
      socket.emit('guess-who-guess', {
        roomName,
        guess: guess.trim()
      });
    } else {
      // Computer game logic
      if (!opponentCharacter) return;
      if (guess === opponentCharacter) {
        setWinner('You');
      } else {
        setWinner('Computer');
      }
      setGamePhase('finished');
    }
    setGuess('');
  }

  const isMyTurnToPlay = playMode === 'computer' || (playMode === 'player' && gameStarted);
  const displayPlayerIndex = typeof myPlayerIndex === 'number' && !isNaN(myPlayerIndex) ? myPlayerIndex + 1 : 1;

  return (
    <div className="flex flex-col items-center justify-center w-full h-full px-3 py-4">
      {/* Status Display */}
      {playMode === 'player' && (
        <div className="mb-4 text-center w-full max-w-md">
          {!gameStarted ? (
            <div className="text-yellow-500 font-bold text-sm p-3 bg-slate-800/50 rounded-lg">
              Waiting for another player to join...
            </div>
          ) : (
            <div className="space-y-2 p-3 bg-slate-800/50 rounded-lg">
              <div className="text-white text-sm">
                You are: <span className="font-bold text-yellow-500 text-lg">Player {displayPlayerIndex}</span>
              </div>
              <div className="text-xs text-slate-400">
                Phase: {gamePhase} | Players ready: {playersReady}/2
              </div>
            </div>
          )}
        </div>
      )}

      <div className="space-y-4 w-full max-w-4xl">
        {gamePhase === 'setup' && (
          <>
            <div className="text-center">
              <h3 className="text-xl font-bold text-white mb-2">Choose Your Character</h3>
              <p className="text-slate-400 mb-4">Select a character for your opponent to guess</p>
              {myCharacter && (
                <p className="text-green-400 mb-4">
                  Your character: <span className="font-bold">{myCharacter}</span>
                  {playMode === 'player' && playersReady < 2 && ' (Waiting for opponent...)'}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {CHARACTERS.map(char => (
                <button 
                  key={char.name} 
                  className={`p-3 rounded-lg border-2 transition-all text-sm ${
                    myCharacter === char.name 
                      ? 'bg-yellow-400 border-yellow-500 text-slate-900' 
                      : 'bg-slate-700 border-slate-600 text-white hover:bg-slate-600'
                  }`} 
                  onClick={() => chooseCharacter(char.name)}
                  disabled={!isMyTurnToPlay || (playMode === 'player' && myCharacter !== '')}
                >
                  <div className="font-bold">{char.name}</div>
                  <div className="text-xs opacity-75">
                    {char.gender}, {char.hair} hair
                    {char.glasses ? ', glasses' : ''}
                    {char.hat ? ', hat' : ''}
                  </div>
                  <div className="text-xs opacity-75">Hobby: {char.hobby}</div>
                </button>
              ))}
            </div>
          </>
        )}

        {gamePhase === 'playing' && (
          <>
            <div className="text-center">
              <h3 className="text-xl font-bold text-white mb-2">Make Your Guess</h3>
              <p className="text-slate-400 mb-4">
                Your character: <span className="font-bold text-yellow-400">{myCharacter}</span>
              </p>
              <p className="text-slate-300 mb-4">
                Try to guess your opponent's character!
              </p>
            </div>

            <div className="text-center">
              <div className="flex flex-col sm:flex-row gap-2 justify-center items-center">
                <input 
                  value={guess} 
                  onChange={e => setGuess(e.target.value)} 
                  className="border px-3 py-2 rounded bg-slate-700 text-white border-slate-600 w-full sm:w-auto" 
                  placeholder="Enter character name"
                  disabled={!isMyTurnToPlay}
                />
                <button 
                  onClick={makeGuess} 
                  className="bg-yellow-400 hover:bg-yellow-500 px-4 py-2 rounded shadow font-bold text-slate-900 transition w-full sm:w-auto"
                  disabled={!isMyTurnToPlay || !guess.trim()}
                >
                  Make Guess
                </button>
              </div>
            </div>
          </>
        )}

        {gamePhase === 'finished' && winner && (
          <div className="text-center">
            <div className="text-2xl font-bold mb-4 text-green-500">
              {playMode === 'computer' ? 
                `Winner: ${winner}` :
                winner === `Player ${displayPlayerIndex}` ? 'You won! 🎉' : 'You lost! 😢'
              }
            </div>
            {opponentCharacter && (
              <div className="text-white mb-4">
                The opponent's character was: <span className="font-bold text-yellow-400">{opponentCharacter}</span>
              </div>
            )}
            <button
              onClick={() => {
                setMyCharacter('');
                setOpponentCharacter('');
                setGuess('');
                setWinner('');
                setGamePhase('setup');
                setPlayersReady(0);
                if (playMode === 'player') {
                  socket.emit('reset-game', { roomName, gameId: 'guesswho' });
                }
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded shadow"
            >
              Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
