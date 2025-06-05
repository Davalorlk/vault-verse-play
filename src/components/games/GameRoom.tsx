
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Send, Users, MessageCircle } from 'lucide-react';

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
  onLeave: () => void;
}

export const GameRoom = ({ gameId, gameName, user, onLeave }: GameRoomProps) => {
  const [messages, setMessages] = useState<GameMessage[]>([
    {
      id: '1',
      user: 'System',
      avatar: '🤖',
      message: `Welcome to ${gameName}! Good luck and have fun!`,
      timestamp: new Date(Date.now() - 120000),
      type: 'system'
    },
    {
      id: '2',
      user: 'ChessKnight',
      avatar: '♞',
      message: 'Ready for a good game!',
      timestamp: new Date(Date.now() - 60000),
      type: 'chat'
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [gameState, setGameState] = useState('waiting');
  const [opponent] = useState({ name: 'ChessKnight', avatar: '♞', rank: 'Expert' });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = () => {
    if (newMessage.trim()) {
      const message: GameMessage = {
        id: Date.now().toString(),
        user: user.displayName,
        avatar: user.avatar,
        message: newMessage,
        timestamp: new Date(),
        type: 'chat'
      };
      setMessages(prev => [...prev, message]);
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
    return (
      <div className="bg-slate-700/50 rounded-lg p-4 md:p-8 flex items-center justify-center min-h-[300px] md:min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="text-4xl md:text-6xl mb-4">🎮</div>
          <h3 className="text-lg md:text-xl font-semibold text-white">{gameName}</h3>
          <p className="text-slate-400 text-sm md:text-base">Game board will be implemented here</p>
          <div className="space-y-2">
            <div className="text-sm text-slate-400">Status: <span className="text-yellow-400">Waiting for opponent</span></div>
            <Button 
              className="bg-green-500 hover:bg-green-600"
              onClick={() => setGameState('playing')}
            >
              Start Game (Demo)
            </Button>
          </div>
        </div>
      </div>
    );
  };

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
              <span className="text-xl md:text-2xl">{opponent.avatar}</span>
              <div>
                <div className="font-medium text-white text-sm md:text-base">{opponent.name}</div>
                <Badge variant="secondary" className="text-xs bg-blue-400/20 text-blue-400">
                  {opponent.rank}
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

            <CardContent className="flex-1 flex flex-col p-0 min-h-0">
              <ScrollArea className="flex-1 px-4 md:px-6">
                <div className="space-y-3 md:space-y-4 pb-4">
                  {messages.map((msg) => (
                    <div key={msg.id} className={`${msg.type === 'system' ? 'text-center' : 'flex items-start gap-2 md:gap-3'}`}>
                      {msg.type === 'system' ? (
                        <div className="bg-slate-700/50 rounded-lg p-2">
                          <p className="text-xs md:text-sm text-slate-300">{msg.message}</p>
                          <span className="text-xs text-slate-500">{formatTime(msg.timestamp)}</span>
                        </div>
                      ) : (
                        <>
                          <div className="text-sm md:text-lg flex-shrink-0">{msg.avatar}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-white text-xs md:text-sm truncate">{msg.user}</span>
                              <span className="text-xs text-slate-400 flex-shrink-0">{formatTime(msg.timestamp)}</span>
                            </div>
                            <p className="text-slate-300 text-xs md:text-sm break-words">{msg.message}</p>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              <Separator className="bg-slate-700" />

              <div className="p-3 md:p-4">
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Say something..."
                    className="bg-slate-700 border-slate-600 text-white placeholder-slate-400 text-xs md:text-sm"
                    maxLength={200}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    size="sm"
                    className="bg-yellow-500 hover:bg-yellow-600 text-slate-900 flex-shrink-0"
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
