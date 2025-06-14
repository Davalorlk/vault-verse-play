
import React, { useState, useEffect } from 'react';
import { socket } from '@/lib/socket';

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

function getBestGuessWhoQuestion(remaining: any[], asked: Set<string>) {
  const attrs = ['hair', 'glasses', 'hat', 'gender', 'hobby'];
  let bestAttr = null, bestScore = 999;
  for (const attr of attrs) {
    if (asked.has(attr)) continue;
    const values = new Set(remaining.map(c => c[attr]));
    if (values.size < 2) continue;
    for (const val of values) {
      const count = remaining.filter(c => c[attr] === val).length;
      const score = Math.abs(remaining.length/2 - count);
      if (score < bestScore) {
        bestScore = score;
        bestAttr = { attr, val };
      }
    }
  }
  return bestAttr;
}

function getBestGuessWhoGuess(remaining: any[]) {
  if (remaining.length === 1) return remaining[0].name;
  return remaining[Math.floor(Math.random()*remaining.length)].name;
}

export function GuessWho({ roomName, user, isMyTurn, playMode }: { roomName: string, user: any, isMyTurn: boolean, playMode: 'player' | 'computer' }) {
  const [myCharacter, setMyCharacter] = useState('');
  const [opponentCharacter, setOpponentCharacter] = useState('');
  const [guess, setGuess] = useState('');
  const [winner, setWinner] = useState('');
  const [gameStarted, setGameStarted] = useState(false);
  const [gamePhase, setGamePhase] = useState<'setup' | 'playing' | 'finished'>('setup');
  const [myPlayerIndex, setMyPlayerIndex] = useState<number>(0);
  const [questions, setQuestions] = useState<string[]>([]);
  const [remainingCharacters, setRemainingCharacters] = useState(CHARACTERS);

  useEffect(() => {
    if (playMode === 'player') {
      socket.emit('join-game-room', { roomName, gameId: 'guesswho' });
      
      socket.on('game-initialized', (data: { playerIndex: number, gameStarted: boolean }) => {
        console.log('Guess Who game initialized:', data);
        setMyPlayerIndex(data.playerIndex);
        setGameStarted(data.gameStarted);
      });
      
      const handleGameState = (state: any) => {
        console.log('Guess Who game state update received:', state);
        if (state.phase) {
          setGamePhase(state.phase);
          setMyCharacter(state.myCharacter || '');
          setOpponentCharacter(state.opponentCharacter || '');
          setWinner(state.winner || '');
          setQuestions(state.questions || []);
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
      setMyCharacter('');
      setOpponentCharacter('');
      setGuess('');
      setWinner('');
      setGameStarted(true);
      setGamePhase('setup');
      setQuestions([]);
      setRemainingCharacters(CHARACTERS);
    }
  }, [roomName, user, playMode]);

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
          phase: 'setup',
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
      const isCorrect = guess === opponentCharacter;
      setWinner(isCorrect ? `Player ${myPlayerIndex + 1}` : `Player ${myPlayerIndex === 0 ? 2 : 1}`);
      setGamePhase('finished');
      
      socket.emit('game-state-update', {
        roomName,
        gameId: 'guesswho',
        state: { 
          phase: 'finished',
          winner: isCorrect ? `Player ${myPlayerIndex + 1}` : `Player ${myPlayerIndex === 0 ? 2 : 1}`,
          guess: guess
        }
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
  }

  // Computer AI for asking questions and making guesses
  useEffect(() => {
    if (playMode === 'computer' && gamePhase === 'playing' && !winner) {
      setTimeout(() => {
        if (remainingCharacters.length <= 2) {
          // Make a guess
          const computerGuess = getBestGuessWhoGuess(remainingCharacters);
          if (computerGuess === myCharacter) {
            setWinner('Computer');
          } else {
            setWinner('You');
          }
          setGamePhase('finished');
        } else {
          // Ask a question
          const askedSet = new Set(questions);
          const question = getBestGuessWhoQuestion(remainingCharacters, askedSet);
          if (question) {
            const newQuestion = `Does your character have ${question.attr} ${question.val}?`;
            setQuestions(prev => [...prev, newQuestion]);
            
            // Filter remaining characters based on answer
            const myChar = CHARACTERS.find(c => c.name === myCharacter);
            const answer = myChar && myChar[question.attr] === question.val;
            
            if (answer) {
              setRemainingCharacters(prev => prev.filter(c => c[question.attr] === question.val));
            } else {
              setRemainingCharacters(prev => prev.filter(c => c[question.attr] !== question.val));
            }
          }
        }
      }, 2000);
    }
  }, [gamePhase, remainingCharacters, questions, myCharacter, playMode, winner]);

  const isMyTurnToPlay = playMode === 'computer' || (playMode === 'player' && gameStarted);

  return (
    <div className="flex flex-col items-center justify-center w-full h-full px-3">
      {/* Status Display */}
      {playMode === 'player' && (
        <div className="mb-4 text-center w-full">
          {!gameStarted ? (
            <div className="text-yellow-500 font-bold text-sm sm:text-base p-3 bg-slate-800/50 rounded-lg">
              Waiting for another player to join...
            </div>
          ) : (
            <div className="space-y-2 p-3 bg-slate-800/50 rounded-lg">
              <div className="text-white text-sm">
                You are: <span className="font-bold text-yellow-500 text-lg">Player {myPlayerIndex + 1}</span>
              </div>
              <div className="text-xs text-slate-400">
                Phase: {gamePhase} | Game started: {gameStarted ? 'Yes' : 'No'}
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
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {CHARACTERS.map(char => (
                <button 
                  key={char.name} 
                  className={`p-3 rounded-lg border-2 transition-all ${
                    myCharacter === char.name 
                      ? 'bg-yellow-400 border-yellow-500 text-slate-900' 
                      : 'bg-slate-700 border-slate-600 text-white hover:bg-slate-600'
                  }`} 
                  onClick={() => chooseCharacter(char.name)}
                  disabled={!isMyTurnToPlay}
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
            </div>

            {playMode === 'computer' && questions.length > 0 && (
              <div className="bg-slate-800 p-4 rounded-lg">
                <h4 className="text-white font-bold mb-2">Computer's Questions:</h4>
                <div className="space-y-1">
                  {questions.map((q, i) => (
                    <div key={i} className="text-slate-300 text-sm">{q}</div>
                  ))}
                </div>
              </div>
            )}

            <div className="text-center">
              <input 
                value={guess} 
                onChange={e => setGuess(e.target.value)} 
                className="border px-3 py-2 rounded bg-slate-700 text-white border-slate-600 mr-2" 
                placeholder="Enter character name"
                disabled={!isMyTurnToPlay}
              />
              <button 
                onClick={makeGuess} 
                className="bg-yellow-400 hover:bg-yellow-500 px-4 py-2 rounded shadow font-bold text-slate-900 transition"
                disabled={!isMyTurnToPlay || !guess.trim()}
              >
                Make Guess
              </button>
            </div>
          </>
        )}

        {gamePhase === 'finished' && winner && (
          <div className="text-center">
            <div className="text-2xl font-bold mb-4 text-green-500">
              {playMode === 'computer' ? 
                `Winner: ${winner}` :
                winner === `Player ${myPlayerIndex + 1}` ? 'You won! 🎉' : 'You lost! 😢'
              }
            </div>
            <button
              onClick={() => {
                setMyCharacter('');
                setOpponentCharacter('');
                setGuess('');
                setWinner('');
                setGamePhase('setup');
                setQuestions([]);
                setRemainingCharacters(CHARACTERS);
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
