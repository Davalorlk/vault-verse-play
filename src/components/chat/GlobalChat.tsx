import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Send, Users, MessageCircle } from 'lucide-react';
import { socket } from '@/lib/socket';

interface Message {
  id: string;
  user: string;
  avatar: string;
  message: string;
  timestamp: Date;
  rank: string;
}

interface GlobalChatProps {
  user: any;
}

export const GlobalChat = ({ user }: GlobalChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Real-time message sync
  useEffect(() => {
    // TODO: Replace with Socket.IO logic
    const dummyMessages = [
      {
        id: '1',
        user: 'Alice',
        avatar: '👩',
        message: 'Hello, world!',
        timestamp: new Date(),
        rank: 'Novice'
      },
      {
        id: '2',
        user: 'Bob',
        avatar: '👨',
        message: 'Hi, Alice!',
        timestamp: new Date(),
        rank: 'Expert'
      }
    ];
    setMessages(dummyMessages);

    // TODO: Replace with real online users count
    setOnlineUsers(42);
  }, []);

  useEffect(() => {
    // Listen for incoming chat messages
    socket.on('chat-message', (msg) => {
      setMessages(prev => [
        ...prev,
        {
          ...msg,
          timestamp: new Date(msg.timestamp)
        }
      ]);
    });
    return () => {
      socket.off('chat-message');
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  useEffect(() => { scrollToBottom(); }, [messages]);

  const sendMessage = () => {
    if (newMessage.trim()) {
      const msg = {
        id: Date.now().toString(),
        user: user.displayName,
        avatar: user.avatar,
        message: newMessage,
        timestamp: new Date().toISOString(),
        rank: user.rank
      };
      socket.emit('chat-message', msg);
      setNewMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  const formatTime = (timestamp: Date) => {
    if (!timestamp) return '';
    if (typeof timestamp === 'string') timestamp = new Date(timestamp);
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700 h-[600px] flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-yellow-400" />
            Global Chat
          </CardTitle>
          <div className="flex items-center gap-2 text-green-400">
            <Users className="h-4 w-4" />
            <span className="text-sm font-medium">{onlineUsers.toLocaleString()} online</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 px-6">
          <div className="space-y-4 pb-4">
            {messages.map((msg) => (
              <div key={msg.id} className="flex items-start gap-3">
                <div className="text-2xl">{msg.avatar}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-white">{msg.user}</span>
                    <Badge 
                      variant="secondary" 
                      className="text-xs bg-yellow-400/20 text-yellow-400"
                    >
                      {msg.rank}
                    </Badge>
                    <span className="text-xs text-slate-400">{formatTime(msg.timestamp)}</span>
                  </div>
                  <p className="text-slate-300 break-words">{msg.message}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="p-6 pt-4 border-t border-slate-700">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
              maxLength={500}
            />
            <Button
              onClick={sendMessage}
              disabled={!newMessage.trim()}
              className="bg-yellow-500 hover:bg-yellow-600 text-slate-900"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <div className="text-xs text-slate-400 mt-2">
            {newMessage.length}/500 characters
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
