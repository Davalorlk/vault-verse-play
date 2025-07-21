import { useEffect, useState, useRef } from 'react';
import { socket } from '@/lib/socket';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  id?: number;
  sender_id: string;
  receiver_id: string;
  content: string;
  timestamp: string;
}

interface DirectChatWindowProps {
  currentUser: any;
  friend: {
    friend_uid: string;
    display_name: string;
    avatar: string;
  };
  onCloseChat: () => void;
}

const getConversationKey = (user1Id: string, user2Id: string) => {
  // Ensure consistent key regardless of sender/receiver order
  const sortedIds = [user1Id, user2Id].sort();
  return `dm_messages_${sortedIds[0]}_${sortedIds[1]}`;
};

export const DirectChatWindow = ({ currentUser, friend, onCloseChat }: DirectChatWindowProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Emit user-online on mount (ensures backend knows this user is online)
  useEffect(() => {
    if (currentUser?.uid) {
      socket.emit('user-online', {
        uid: currentUser.uid,
        displayName: currentUser.displayName,
        avatar: currentUser.avatar,
        rank: currentUser.rank
      });
    }
  }, [currentUser]);

  // Load messages from local storage on component mount or friend change
  useEffect(() => {
    const conversationKey = getConversationKey(currentUser.uid, friend.friend_uid);
    const storedMessages = localStorage.getItem(conversationKey);
    if (storedMessages) {
      setMessages(JSON.parse(storedMessages));
    } else {
      setMessages([]);
    }

    const handleReceiveDm = (message: Message) => {
      // Only add message if it's relevant to the current chat window
      if (
        (message.sender_id === friend.friend_uid && message.receiver_id === currentUser.uid) ||
        (message.sender_id === currentUser.uid && message.receiver_id === friend.friend_uid)
      ) {
        setMessages((prevMessages) => {
          const updatedMessages = [...prevMessages, message];
          localStorage.setItem(conversationKey, JSON.stringify(updatedMessages));
          return updatedMessages;
        });
      }
    };

    socket.on('receive-dm', handleReceiveDm);

    return () => {
      socket.off('receive-dm', handleReceiveDm);
    };
  }, [currentUser, friend]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const messageData = {
      senderId: currentUser.uid,
      receiverId: friend.friend_uid,
      content: newMessage.trim(),
      timestamp: new Date().toISOString(),
      senderDisplayName: currentUser.displayName,
      senderAvatar: currentUser.avatar
    };

    socket.emit('send-dm', messageData);
    
    // Optimistically add message to local state and storage
    setMessages((prevMessages) => {
      const updatedMessages = [...prevMessages, messageData];
      const conversationKey = getConversationKey(currentUser.uid, friend.friend_uid);
      localStorage.setItem(conversationKey, JSON.stringify(updatedMessages));
      return updatedMessages;
    });

    setNewMessage('');
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700 flex flex-col h-[70vh]">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center space-x-3">
          <Avatar>
            <AvatarImage src={friend.avatar} />
            <AvatarFallback>{friend.display_name[0]}</AvatarFallback>
          </Avatar>
          <CardTitle className="text-white">{friend.display_name}</CardTitle>
        </div>
        <Button variant="ghost" size="icon" onClick={onCloseChat}>
          <XCircle className="h-5 w-5 text-slate-400" />
        </Button>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.sender_id === currentUser.uid ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] p-3 rounded-lg ${
                msg.sender_id === currentUser.uid
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-white'
              }`}
            >
              <p>{msg.content}</p>
              <span className="text-xs opacity-75 mt-1 block">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </CardContent>
      <div className="p-4 border-t border-slate-700 flex space-x-2">
        <Input
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleSendMessage();
            }
          }}
          className="flex-1 bg-slate-700 border-slate-600 text-white"
        />
        <Button onClick={handleSendMessage} className="bg-blue-500 hover:bg-blue-600 text-white">
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </Card>
  );
};