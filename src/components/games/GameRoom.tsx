import { sendSignal, listenSignals } from '@/lib/webrtcSignaling';
import { ArrowLeft, Send, Users, MessageCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { db } from '@/lib/firebase';
import { ref, onValue, set, push, off } from 'firebase/database';
import { ChessBoard } from './ChessBoard';
import { TicTacToe } from './TicTacToe';
import { ConnectFour } from './ConnectFour';
import { Ludo } from './Ludo';
import { DotAndBox } from './DotAndBox';
import { Gomoku } from './Gomoku';
import { Hangman } from './Hangman';
import { NineHoles } from './NineHoles';
import { GuessWho } from './GuessWho';

interface GameMessage {
  id: string;
  user: string;
  avatar: string;
  message: string;
  timestamp: Date;
  type: 'chat' | 'system';
}

interface GameRoomProps {
  gameId: string;
  gameName: string;
  user: any;
  roomName: string;
  playMode: 'player' | 'computer';
  onLeave: () => void;
}

export const GameRoom = ({ gameId, gameName, user, roomName, playMode, onLeave }: GameRoomProps) => {
  // Real-time game state and chat sync
  const [messages, setMessages] = useState<GameMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [gameState, setGameState] = useState('waiting');
  const [opponent, setOpponent] = useState<any>(null);
  const [localStream, setLocalStream] = useState<MediaStream|null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream|null>(null);
  const [callActive, setCallActive] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pcRef = useRef<RTCPeerConnection|null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Listen for chat and game state changes
  useEffect(() => {
    const messagesRef = ref(db, `rooms/${roomName}/games/${gameId}/messages`);
    const stateRef = ref(db, `rooms/${roomName}/games/${gameId}/state`);
    const opponentRef = ref(db, `rooms/${roomName}/games/${gameId}/opponent`);

    const handleMessages = (snapshot: any) => {
      const val = snapshot.val();
      setMessages(val ? Object.values(val) : []);
    };
    const handleState = (snapshot: any) => {
      setGameState(snapshot.val() || 'waiting');
    };
    const handleOpponent = (snapshot: any) => {
      setOpponent(snapshot.val());
    };

    onValue(messagesRef, handleMessages);
    onValue(stateRef, handleState);
    onValue(opponentRef, handleOpponent);

    // Register self as opponent if slot is empty
    set(ref(db, `rooms/${roomName}/games/${gameId}/opponent`), {
      name: user.displayName,
      avatar: user.avatar,
      rank: user.rank || 'Novice',
    });

    return () => {
      off(messagesRef, 'value', handleMessages);
      off(stateRef, 'value', handleState);
      off(opponentRef, 'value', handleOpponent);
    };
  }, [roomName, gameId, user]);

  const sendMessage = () => {
    if (newMessage.trim()) {
      const messagesRef = ref(db, `rooms/${roomName}/games/${gameId}/messages`);
      push(messagesRef, {
        id: Date.now().toString(),
        user: user.displayName,
        avatar: user.avatar,
        message: newMessage,
        timestamp: new Date().toISOString(),
        type: 'chat',
      });
      setNewMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderGameBoard = () => {
    const gameProps = { roomName, user, isMyTurn: true, playMode };
    switch (gameId) {
      case 'chess':
        return <ChessBoard {...gameProps} />;
      case 'tictactoe':
        return <TicTacToe {...gameProps} />;
      case 'connect4':
        return <ConnectFour {...gameProps} />;
      case 'ludo':
        return <Ludo {...gameProps} />;
      case 'dotandbox':
        return <DotAndBox {...gameProps} />;
      case 'gomoku':
        return <Gomoku {...gameProps} />;
      case 'hangman':
        return <Hangman {...gameProps} />;
      case 'nineholes':
        return <NineHoles {...gameProps} />;
      case 'guesswho':
        return <GuessWho {...gameProps} />;
      default:
        return (
          <div className="bg-slate-700/50 rounded-lg p-4 md:p-8 flex items-center justify-center min-h-[300px] md:min-h-[400px]">
            <div className="text-center space-y-4">
              <div className="text-4xl md:text-6xl mb-4">🎮</div>
              <h3 className="text-lg md:text-xl font-semibold text-white">{gameName}</h3>
              <p className="text-slate-400 text-sm md:text-base">Game board will be implemented here</p>
            </div>
          </div>
        );
    }
  };

  // WebRTC setup
  useEffect(() => {
    if (!callActive) return;
    const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
    pcRef.current = pc;
    navigator.mediaDevices.getUserMedia({ audio: true, video: false }).then(stream => {
      setLocalStream(stream);
      stream.getTracks().forEach(track => pc.addTrack(track, stream));
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    });
    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
    };
    pc.onicecandidate = (event) => {
      if (event.candidate) sendSignal(roomName, 'candidate', event.candidate);
    };
    listenSignals(roomName, async (type, data) => {
      if (type === 'offer') {
        await pc.setRemoteDescription(new RTCSessionDescription(data));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        sendSignal(roomName, 'answer', answer);
      } else if (type === 'answer') {
        await pc.setRemoteDescription(new RTCSessionDescription(data));
      } else if (type === 'candidate') {
        await pc.addIceCandidate(new RTCIceCandidate(data));
      }
    });
    // Initiator
    if (user.isInitiator) {
      pc.createOffer().then(offer => {
        pc.setLocalDescription(offer);
        sendSignal(roomName, 'offer', offer);
      });
    }
    return () => {
      pc.close();
      setLocalStream(null);
      setRemoteStream(null);
    };
  }, [callActive, roomName, user.isInitiator]);

  return (
    <div className="space-y-4 lg:space-y-0">
      {/* Header - Always at top */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={onLeave}
                className="text-slate-400 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <CardTitle className="text-white text-lg md:text-xl">{gameName}</CardTitle>
            </div>
            <Badge className="bg-green-500/20 text-green-400">
              <Users className="h-3 w-3 mr-1" />
              2/2 Players
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Player Info */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg">
              <span className="text-xl md:text-2xl">{user.avatar}</span>
              <div>
                <div className="font-medium text-white text-sm md:text-base">{user.displayName}</div>
                <Badge variant="secondary" className="text-xs bg-yellow-400/20 text-yellow-400">
                  {user.rank}
                </Badge>
              </div>
            </div>

            <div className="text-center text-white font-bold text-lg">VS</div>

            <div className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg">
              <span className="text-xl md:text-2xl">{opponent?.avatar}</span>
              <div>
                <div className="font-medium text-white text-sm md:text-base">{opponent?.name}</div>
                <Badge variant="secondary" className="text-xs bg-blue-400/20 text-blue-400">
                  {opponent?.rank}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Game Area - Side by side layout for larger screens */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 min-h-[500px]">
        {/* Game Board Area */}
        <div className="lg:col-span-2">
          <Card className="bg-slate-800/50 border-slate-700 h-full">
            <CardContent className="p-4 md:p-6 h-full">
              {renderGameBoard()}
            </CardContent>
          </Card>
        </div>

        {/* Chat Area - Side panel on desktop, below on mobile */}
        <div className="lg:col-span-1">
          <Card className="bg-slate-800/50 border-slate-700 h-full flex flex-col">
            <CardHeader className="pb-4">
              <CardTitle className="text-white flex items-center gap-2 text-base md:text-lg">
                <MessageCircle className="h-4 w-4 md:h-5 md:w-5 text-yellow-400" />
                Game Chat
              </CardTitle>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col p-0 min-h-0 bg-gradient-to-br from-slate-900 to-slate-800 rounded-b-lg shadow-inner">
              {/* Voice chat UI */}
              {callActive && (
                <div className="flex flex-col items-center mb-2">
                  <div className="flex gap-2 items-center">
                    <video ref={localVideoRef} autoPlay muted className="w-12 h-12 rounded-full bg-slate-700" />
                    <span className="text-slate-400">You</span>
                    <video ref={remoteVideoRef} autoPlay className="w-12 h-12 rounded-full bg-slate-700" />
                    <span className="text-slate-400">Opponent</span>
                  </div>
                  <Button className="mt-2 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded shadow" size="sm" onClick={() => setCallActive(false)}>
                    End Call
                  </Button>
                </div>
              )}
              <div className="flex items-center gap-2 mb-2">
                <Button className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded shadow" size="sm" variant="outline" onClick={() => setCallActive(true)}>
                  🎤 Voice Call
                </Button>
                <span className="text-xs text-slate-400">(Beta)</span>
              </div>
              <ScrollArea className="flex-1 px-4 md:px-6">
                <div className="space-y-3 md:space-y-4 pb-4">
                  {messages.map((msg) => (
                    <div key={msg.id} className={`${msg.type === 'system' ? 'text-center' : 'flex items-start gap-2 md:gap-3'}`}>
                      {msg.type === 'system' ? (
                        <div className="bg-slate-700/50 rounded-lg p-2 shadow">
                          <p className="text-xs md:text-sm text-slate-300">{msg.message}</p>
                          <span className="text-xs text-slate-500">{formatTime(msg.timestamp)}</span>
                        </div>
                      ) : (
                        <>
                          <div className="text-sm md:text-lg flex-shrink-0 bg-yellow-400 rounded-full w-8 h-8 flex items-center justify-center font-bold shadow">{msg.avatar}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-white text-xs md:text-sm truncate">{msg.user}</span>
                              <span className="text-xs text-slate-400 flex-shrink-0">{formatTime(msg.timestamp)}</span>
                            </div>
                            <p className="text-slate-300 text-xs md:text-sm break-words bg-slate-800/60 rounded px-2 py-1 shadow">{msg.message}</p>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              <Separator className="bg-slate-700" />

              <div className="p-3 md:p-4 flex flex-col gap-2">
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Say something..."
                    className="bg-slate-700 border-slate-600 text-white placeholder-slate-400 text-xs md:text-sm rounded shadow"
                    maxLength={200}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    size="sm"
                    className="bg-yellow-500 hover:bg-yellow-600 text-slate-900 flex-shrink-0 rounded shadow"
                  >
                    <Send className="h-3 w-3" />
                  </Button>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {newMessage.length}/200
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
