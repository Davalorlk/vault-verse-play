import { useEffect, useState } from 'react';
import { socket } from '@/lib/socket';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserPlus, Search, MessageSquare, User as UserIcon, UserCheck, UserX } from 'lucide-react';
import { toast } from 'sonner';

interface Friend {
  friend_uid: string;
  display_name: string;
  avatar: string;
  status: 'pending' | 'accepted' | 'blocked';
}

interface FriendsListProps {
  currentUser: any;
  onSelectFriend: (friend: Friend) => void;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://mind-vault-kcfw.onrender.com';

export const FriendsList = ({ currentUser, onSelectFriend }: FriendsListProps) => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [findUserSearchTerm, setFindUserSearchTerm] = useState('');
  const [foundUsers, setFoundUsers] = useState<any[]>([]);
  const [searchPerformed, setSearchPerformed] = useState(false); // New state to track if a search has been performed
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('friends');

  const fetchFriends = async () => {
    if (!currentUser?.uid) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/friends/${currentUser.uid}`);
      if (response.ok) {
        const data = await response.json();
        setFriends(data);
      } else {
        toast.error('Failed to fetch friends.');
      }
    } catch (error) {
      console.error('Error fetching friends:', error);
      toast.error('Error fetching friends.');
    }
  };

  const searchUsers = async () => {
    if (!findUserSearchTerm.trim()) {
      setFoundUsers([]);
      setSearchPerformed(false);
      return;
    }
    setSearchPerformed(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/search?query=${findUserSearchTerm}`);
      if (response.ok) {
        const data = await response.json();
        // Filter out self and already friends
        const filteredData = data.filter((user: any) => 
          user.uid !== currentUser.uid && 
          !friends.some(f => f.friend_uid === user.uid)
        );
        setFoundUsers(filteredData);
      } else {
        setFoundUsers([]); // Clear previous results on error
        toast.error('Failed to search users.');
      }
    } catch (error: any) {
      console.error('Error searching users:', error);
      setFoundUsers([]); // Clear previous results on error
      toast.error(`Error searching users: ${error.message || error}`);
    }
  };

  const sendFriendRequest = async (receiverUid: string) => {
    try {
      if (receiverUid === currentUser.uid) {
        toast.error('You cannot send a friend request to yourself.');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/friends/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderId: currentUser.uid, receiverId: receiverUid }),
      });
      if (response.ok) {
        toast.success('Friend request sent!');
        socket.emit('friend-request-sent', { senderId: currentUser.uid, receiverId: receiverUid, senderDisplayName: currentUser.displayName, senderAvatar: currentUser.avatar });
        fetchFriends(); // Refresh list
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to send friend request.');
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
      toast.error('Error sending friend request.');
    }
  };

  const acceptFriendRequest = async (senderId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/friends/accept`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderId, receiverId: currentUser.uid }),
      });
      if (response.ok) {
        toast.success('Friend request accepted!');
        fetchFriends(); // Refresh list
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to accept friend request.');
      }
    } catch (error) {
      console.error('Error accepting friend request:', error);
      toast.error('Error accepting friend request.');
    }
  };

  const removeFriend = async (friendUid: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/friends/remove`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user1Id: currentUser.uid, user2Id: friendUid }),
      });
      if (response.ok) {
        toast.success('Friend removed.');
        fetchFriends(); // Refresh list
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to remove friend.');
      }
    } catch (error) {
      console.error('Error removing friend:', error);
      toast.error('Error removing friend.');
    }
  };

  useEffect(() => {
    fetchFriends();

    socket.on('presence-update', (users: any[]) => {
      setOnlineUsers(users);
    });
    socket.emit('get-presence');

    return () => {
      socket.off('presence-update');
    };
  }, [currentUser]);

  const isOnline = (friendUid: string) => {
    return onlineUsers.some(u => u.uid === friendUid);
  };

  const getFriendshipStatus = (targetUid: string) => {
    const friend = friends.find(f => f.friend_uid === targetUid);
    if (!friend) return 'none';
    if (friend.status === 'pending') {
      // Check if it's an incoming request or outgoing
      const isIncoming = friends.some(f => f.friend_uid === targetUid && f.status === 'pending' && f.friend_uid !== currentUser.uid);
      return isIncoming ? 'incoming_pending' : 'outgoing_pending';
    }
    return friend.status;
  };

  const acceptedFriends = friends.filter(f => f.status === 'accepted').filter(friend =>
    friend.display_name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const pendingRequests = friends.filter(f => f.status === 'pending' && f.friend_uid !== currentUser.uid);
  const sentRequests = friends.filter(f => f.status === 'pending' && f.friend_uid === currentUser.uid);

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg shadow-lg mb-6">
        <UserIcon className="h-12 w-12 text-white mb-3" />
        <h2 className="text-2xl font-bold text-white mb-2">Connect with fellow gamers</h2>
        <p className="text-slate-200 text-center">Build your gaming community by adding friends and sending messages.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="friends">
            <UserIcon className="h-4 w-4 mr-2" />
            Friends ({acceptedFriends.length})
          </TabsTrigger>
          <TabsTrigger value="requests">
            <UserPlus className="h-4 w-4 mr-2" />
            Requests ({pendingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="find">
            <Search className="h-4 w-4 mr-2" />
            Find Friends
          </TabsTrigger>
        </TabsList>

        <TabsContent value="friends" className="mt-4">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Your Friends</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Search friends..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
              />
              {acceptedFriends.length > 0 ? (
                <div className="space-y-2">
                  {acceptedFriends.map(friend => (
                    <div key={friend.friend_uid} className="flex items-center justify-between p-3 rounded-md bg-slate-700/30 border border-slate-600">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src={friend.avatar} />
                          <AvatarFallback>{friend.display_name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-white">{friend.display_name}</div>
                          <div className={`text-xs ${isOnline(friend.friend_uid) ? 'text-green-400' : 'text-slate-400'}`}>
                            {isOnline(friend.friend_uid) ? 'Online' : 'Offline'}
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-600" onClick={() => onSelectFriend(friend)}>
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => removeFriend(friend.friend_uid)}>
                          <UserX className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 text-center">No friends yet. Send a request!</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests" className="mt-4">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Friend Requests</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {pendingRequests.length > 0 ? (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-white">Incoming Requests</h3>
                  {pendingRequests.map(request => (
                    <div key={request.friend_uid} className="flex items-center justify-between p-3 rounded-md bg-slate-700/30 border border-slate-600">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src={request.avatar} />
                          <AvatarFallback>{request.display_name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="font-medium text-white">{request.display_name}</div>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white" onClick={() => acceptFriendRequest(request.friend_uid)}>
                          <UserCheck className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-600" onClick={() => removeFriend(request.friend_uid)}>
                          <UserX className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 text-center">No incoming friend requests.</p>
              )}

              {sentRequests.length > 0 ? (
                <div className="space-y-2 mt-4">
                  <h3 className="text-lg font-semibold text-white">Sent Requests</h3>
                  {sentRequests.map(request => (
                    <div key={request.friend_uid} className="flex items-center justify-between p-3 rounded-md bg-slate-700/30 border border-slate-600">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src={request.avatar} />
                          <AvatarFallback>{request.display_name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="font-medium text-white">{request.display_name}</div>
                      </div>
                      <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">Pending</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 text-center">No sent friend requests.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="find" className="mt-4">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Find New Friends</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <Input
                  placeholder="Search by username or display name"
                  value={findUserSearchTerm}
                  onChange={(e) => setFindUserSearchTerm(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                />
                <Button onClick={searchUsers} className="bg-blue-500 hover:bg-blue-600 text-white">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              {foundUsers.length > 0 ? (
                <div className="space-y-2">
                  {foundUsers.map(user => {
                    const status = getFriendshipStatus(user.uid);
                    return (
                      <div key={user.uid} className="flex items-center justify-between p-3 rounded-md bg-slate-700/30 border border-slate-600">
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback>{user.displayName[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-white">{user.displayName}</div>
                            <div className="text-xs text-slate-400">@{user.username}</div>
                          </div>
                        </div>
                        <div>
                          {status === 'none' && (
                            <Button size="sm" onClick={() => sendFriendRequest(user.uid)}>
                              Add Friend
                            </Button>
                          )}
                          {status === 'accepted' && (
                            <Badge variant="secondary" className="bg-green-500/20 text-green-400">Friends</Badge>
                          )}
                          {status === 'incoming_pending' && (
                            <div className="flex space-x-2">
                              <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white" onClick={() => acceptFriendRequest(user.uid)}>
                                Accept
                              </Button>
                              <Button size="sm" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-600" onClick={() => removeFriend(user.uid)}>
                                Decline
                              </Button>
                            </div>
                          )}
                          {status === 'outgoing_pending' && (
                            <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">Request Sent</Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                searchPerformed && findUserSearchTerm.trim() !== '' ? (
                  <p className="text-slate-400 text-center">Player doesn't exist or is already your friend.</p>
                ) : (
                  <p className="text-slate-400 text-center">Search for users to add them as friends.</p>
                )
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};