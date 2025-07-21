import { BellOff, MessageSquare, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Notification {
  id: string;
  type: 'message' | 'friend_request' | 'mention';
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  // Additional data based on type
  senderId?: string;
  senderDisplayName?: string;
  senderAvatar?: string;
}

interface NotificationListProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onClearAll: () => void;
  onViewMessage?: (senderId: string) => void;
}

export const NotificationList = ({ notifications, onMarkAsRead, onClearAll, onViewMessage }: NotificationListProps) => {
  const unreadNotifications = notifications.filter(n => !n.read);

  return (
    <Card className="w-80 bg-slate-800/90 border-slate-700 shadow-lg fixed top-16 right-4 z-50">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg text-white">Notifications ({unreadNotifications.length})</CardTitle>
        <Button variant="ghost" size="sm" onClick={onClearAll} disabled={notifications.length === 0}>
          Clear All
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {notifications.length === 0 ? (
          <p className="text-slate-400 text-center py-4">No new notifications.</p>
        ) : (
          <ScrollArea className="h-72">
            <div className="space-y-2 p-4">
              {notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`flex items-start space-x-3 p-3 rounded-md cursor-pointer ${
                    notification.read ? 'bg-slate-700/50 text-slate-400' : 'bg-slate-700 text-white'
                  }`}
                  onClick={() => onMarkAsRead(notification.id)}
                >
                  <div className="flex-shrink-0">
                    {notification.type === 'dm' && <MessageSquare className="h-5 w-5 text-blue-400" />}
                    {notification.type === 'friend_request' && <UserPlus className="h-5 w-5 text-green-400" />}
                    {notification.type === 'mention' && <MessageSquare className="h-5 w-5 text-purple-400" />}
                  </div>
                  <div className="flex-1">
                    {/* Show sender info for DM notifications */}
                    {notification.type === 'dm' && (
                      <div className="flex items-center space-x-2 mb-1">
                        {notification.senderAvatar && (
                          <img src={notification.senderAvatar} alt="avatar" className="w-6 h-6 rounded-full" />
                        )}
                        <span className="font-semibold">{notification.senderDisplayName || 'Unknown'}</span>
                      </div>
                    )}
                    <p className="font-semibold">{notification.title}</p>
                    <p className="text-sm">{notification.body}</p>
                    <span className="text-xs text-slate-500">
                      {new Date(notification.timestamp).toLocaleString()}
                    </span>
                  </div>
                  {notification.type === 'dm' && !notification.read && onViewMessage && (
                    <Button size="sm" variant="outline" onClick={() => onViewMessage(notification.senderId!)}>
                      View
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};