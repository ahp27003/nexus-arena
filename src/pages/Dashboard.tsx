import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Trophy, MessageSquare, Calendar, Loader2, Send, User, MessageCircle } from 'lucide-react';
import { getTeams, getMatches } from '@/services/api';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useChats, Message } from '../hooks/use-chats';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import { getAvatarUrl } from '@/utils/avatar';
import ChatDrawer from '../components/chat/ChatDrawer';
import { toast } from 'sonner';

// If you need to attach profile info to a message, extend Message locally:
type MessageProfile = {
  username: string;
  avatar_url?: string;
};
type MessageWithProfile = Message & { profile?: MessageProfile };

// Global Chat Widget Component
const GlobalChatWidget = () => {
  // Global chat ID - must match the one in our database
  const GLOBAL_CHAT_ID = 'd1e2f3a4-b5c6-7d8e-9f0a-1b2c3d4e5f6a';
  
  const { user } = useAuth();
  const [messages, setMessages] = useState<MessageWithProfile[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch messages for the global chat from Supabase
  useEffect(() => {
    const fetchMessages = async () => {
      setIsLoading(true);
      try {
        // Get messages from the last 24 hours
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('chat_id', GLOBAL_CHAT_ID)
          .gte('created_at', oneDayAgo.toISOString())
          .order('created_at', { ascending: true });
          
        if (error) throw error;
        
        if (data) {
          // Fetch profile information for each message
          const messagesWithProfiles: MessageWithProfile[] = [];
          
          for (const message of data) {
            try {
              const { data: profileData } = await supabase
                .from('profiles')
                .select('username, avatar_url')
                .eq('id', message.user_id)
                .single();
                
              messagesWithProfiles.push({
                ...message,
                profile: profileData ? {
                  username: profileData.username,
                  avatar_url: profileData.avatar_url
                } : { username: 'Unknown User' }
              });
            } catch (err) {
              // If profile fetch fails, still show the message
              messagesWithProfiles.push({
                ...message,
                profile: { username: 'Unknown User' }
              });
            }
          }
          
          setMessages(messagesWithProfiles);
        }
      } catch (err) {
        console.error('Error fetching messages:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMessages();
    
    // Set up real-time listener for new messages
    const channel = supabase
      .channel(`chat-${GLOBAL_CHAT_ID}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${GLOBAL_CHAT_ID}`,
        },
        async (payload) => {
          // Handle new message
          const newMsg = payload.new as Message;
          
          // Skip if we already have this message
          if (messages.some(m => m.id === newMsg.id)) return;
          
          try {
            // Fetch the sender's profile information
            const { data: profileData } = await supabase
              .from('profiles')
              .select('username, avatar_url')
              .eq('id', newMsg.user_id)
              .single();
              
            setMessages(prev => [...prev, {
              ...newMsg,
              profile: profileData ? {
                username: profileData.username,
                avatar_url: profileData.avatar_url
              } : { username: 'Unknown User' }
            }]);
            
            // Scroll to bottom
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          } catch (err) {
            // If profile fetch fails, still show the message
            setMessages(prev => [...prev, {
              ...newMsg,
              profile: { username: 'Unknown User' }
            }]);
          }
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Format timestamp to a readable time
  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return format(date, 'h:mm a');
    } catch {
      return '';
    }
  };

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Send message handler
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newMessage.trim()) return;
    
    // Create a temporary message to show immediately
    const tempMsg: MessageWithProfile = {
      id: `temp-${Date.now()}`,
      content: newMessage,
      user_id: user.id,
      chat_id: GLOBAL_CHAT_ID,
      created_at: new Date().toISOString(),
      profile: {
        username: user.email?.split('@')[0] || 'You',
        avatar_url: undefined
      }
    };
    
    // Add to UI immediately for better UX
    setMessages(prev => [...prev, tempMsg]);
    setNewMessage('');
    
    // Then send to database
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          content: newMessage,
          chat_id: GLOBAL_CHAT_ID,
          user_id: user.id,
        });
        
      if (error) {
        console.error('Failed to send message:', error);
        // Remove the temporary message if there was an error
        setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
        toast.error('Failed to send message');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      // Remove the temporary message if there was an error
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
      toast.error('Failed to send message');
    }
  };

  return (
    <div className="flex flex-col h-[350px]">
      <div className="flex-1 overflow-y-auto mb-4 pr-2 custom-scrollbar">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-pulse flex space-x-4">
              <div className="rounded-full bg-slate-600 h-10 w-10"></div>
              <div className="flex-1 space-y-6 py-1">
                <div className="h-2 bg-slate-600 rounded"></div>
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="h-2 bg-slate-600 rounded col-span-2"></div>
                    <div className="h-2 bg-slate-600 rounded col-span-1"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : messages.length > 0 ? (
          <div className="space-y-4">
            {messages.map((message, index) => {
              const isCurrentUser = message.user_id === user?.id;
              const prevMessage = index > 0 ? messages[index - 1] : null;
              const nextMessage = index < messages.length - 1 ? messages[index + 1] : null;
              
              // Determine if we should show avatar (first message or different sender)
              const showAvatar = !prevMessage || prevMessage.user_id !== message.user_id;
              
              // Determine if we should show time (last message or different sender next)
              const showTime = !nextMessage || nextMessage.user_id !== message.user_id;
              
              return (
                <div 
                  key={message.id} 
                  className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} items-end gap-2`}
                >
                  {!isCurrentUser && showAvatar && (
                    <Avatar className="h-8 w-8 mt-1">
                      <AvatarImage 
                        src={message.profile?.avatar_url || getAvatarUrl({
                          id: message.user_id,
                          username: message.profile?.username
                        })} 
                      />
                      <AvatarFallback className="bg-[#3a516b] text-slate-100">
                        {message.profile?.username ? getInitials(message.profile.username) : <User className="h-4 w-4" />}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div className="flex flex-col">
                    {showAvatar && !isCurrentUser && (
                      <span className="text-xs font-medium text-slate-400 ml-1 mb-1">
                        {message.profile?.username || 'Unknown User'}
                      </span>
                    )}
                    
                    <div className={`px-3 py-2 rounded-lg ${isCurrentUser 
                      ? 'bg-[#2c3e50] text-slate-100 rounded-tr-none' 
                      : 'bg-[#1f2937] text-slate-100 rounded-tl-none'}`}
                    > 
                      {message.content}
                    </div>
                    
                    {showTime && (
                      <span className={`text-xs text-slate-500 mt-1 ${isCurrentUser ? 'text-right' : 'text-left'}`}>
                        {formatTimestamp(message.created_at)}
                      </span>
                    )}
                  </div>
                  
                  {isCurrentUser && showAvatar && (
                    <Avatar className="h-8 w-8 mt-1">
                      <AvatarImage 
                        src={getAvatarUrl({
                          id: user.id,
                          username: user.email?.split('@')[0]
                        })} 
                      />
                      <AvatarFallback className="bg-[#3a516b] text-slate-100">
                        {user.email ? getInitials(user.email.split('@')[0]) : <User className="h-4 w-4" />}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-slate-400">
              <p>No messages yet</p>
              <p className="text-sm">Be the first to send a message!</p>
            </div>
          </div>
        )}
      </div>
      
      <form 
        onSubmit={sendMessage} 
        className="flex items-center gap-2"
      >
        <Input 
          value={newMessage} 
          onChange={e => setNewMessage(e.target.value)} 
          placeholder="Type a message..." 
          className="flex-1 bg-[#1e293b] border-[#374151] text-slate-100 placeholder:text-slate-500 focus-visible:ring-slate-400"
        />
        <Button 
          type="submit" 
          size="icon" 
          disabled={!newMessage.trim()} 
          className="bg-[#2c3e50] hover:bg-[#3a516b] text-slate-100 h-10 w-10 rounded-full"
        >
          <Send className="h-5 w-5" />
        </Button>
      </form>
    </div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [teamCount, setTeamCount] = useState<number>(0);
  const [upcomingMatchCount, setUpcomingMatchCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);

  // Fetch dashboard data
  useEffect(() => {
    if (!profile) return;

    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        // Fetch teams data
        const teamsData = await getTeams();
        setTeamCount(teamsData.length || 0);
        
        // Fetch matches data
        const matchesData = await getMatches();
        const upcoming = matchesData.filter(match => 
          match.status === 'upcoming' || match.status === 'scheduled'
        );
        setUpcomingMatchCount(upcoming.length);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [profile]);
  
  // Toggle chat drawer
  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  const welcomeMessage = profile?.username 
    ? `Welcome back, ${profile.username}!` 
    : 'Welcome to Nexus Arena!';

  // Feature cards to show on the dashboard
  const featureCards = [
    {
      title: 'Find Players',
      description: 'Discover players with similar skill levels and schedules.',
      icon: <Users className="h-6 w-6 text-purple-500" />,
      action: () => navigate('/discover'),
      buttonText: 'Explore',
      bgGradient: 'from-purple-500/20 to-pink-500/20',
    },
    {
      title: 'Team Management',
      description: 'Create and manage your gaming teams.',
      icon: <Users className="h-6 w-6 text-indigo-500" />,
      action: () => navigate('/teams'),
      buttonText: 'Manage Teams',
      bgGradient: 'from-indigo-500/20 to-blue-500/20',
    },
    {
      title: 'Upcoming Matches',
      description: 'Schedule and view your upcoming gaming sessions.',
      icon: <Calendar className="h-6 w-6 text-pink-500" />,
      action: () => navigate('/matches'),
      buttonText: 'View Schedule',
      bgGradient: 'from-pink-500/20 to-orange-500/20',
    },
    {
      title: 'Team Chat',
      description: 'Chat with teammates and coordinate your strategies.',
      icon: <MessageSquare className="h-6 w-6 text-green-500" />,
      action: () => navigate('/chat'),
      buttonText: 'Open Chat',
      bgGradient: 'from-green-500/20 to-teal-500/20',
    }
  ];

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-12 w-12 animate-spin text-purple-500" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-100 mb-2">
              {welcomeMessage}
            </h1>
            <p className="text-base text-slate-400">Your gaming hub for finding teammates and dominating the competition.</p>
          </div>
          <div className="mt-4 md:mt-0">
            <Button 
              onClick={toggleChat} 
              className="bg-[#2c3e50] hover:bg-[#3a516b] text-slate-100 flex items-center gap-2"
            >
              <MessageCircle className="h-5 w-5" />
              Global Chat
            </Button>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <Card className="bg-[#1f2937] border border-[#374151] rounded-lg shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-slate-300">Your Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-100">
                {profile?.skill_level ? profile.skill_level : 'Incomplete'}
              </div>
              <p className="text-xs text-slate-400 mt-1">Skill Level</p>
            </CardContent>
            <CardFooter>
              <Button variant="ghost" size="sm" className="text-[#6ab0f3] hover:bg-[#1e293b] hover:text-[#8cc2f5]" onClick={() => navigate('/profile')}>
                Complete Profile →
              </Button>
            </CardFooter>
          </Card>
          <Card className="bg-[#1f2937] border border-[#374151] rounded-lg shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-slate-300">Teams</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-100">{teamCount}</div>
              <p className="text-xs text-slate-400 mt-1">Active Teams</p>
            </CardContent>
            <CardFooter>
              <Button variant="ghost" size="sm" className="text-[#6ab0f3] hover:bg-[#1e293b] hover:text-[#8cc2f5]" onClick={() => navigate('/teams')}>
                Create Team →
              </Button>
            </CardFooter>
          </Card>
          <Card className="bg-[#1f2937] border border-[#374151] rounded-lg shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-slate-300">Matches</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-100">{upcomingMatchCount}</div>
              <p className="text-xs text-slate-400 mt-1">Upcoming Matches</p>
            </CardContent>
            <CardFooter>
              <Button variant="ghost" size="sm" className="text-[#6ab0f3] hover:bg-[#1e293b] hover:text-[#8cc2f5]" onClick={() => navigate('/matches')}>
                Schedule Match →
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          {featureCards.map((card, index) => (
            <Card key={index} className="bg-[#1e293b] border border-[#374151] rounded-lg shadow hover:shadow-md transition-all hover:translate-y-[-2px]">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="text-[#6ab0f3]">{card.icon}</div>
                  <CardTitle className="text-lg text-slate-200">{card.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-slate-400">
                  {card.description}
                </CardDescription>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={card.action} 
                  className="w-full bg-[#2c3e50] hover:bg-[#3a516b] text-slate-100 rounded-md border border-[#435a74]"
                >
                  {card.buttonText}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Global Chat Widget - now part of the dashboard, styled to match theme */}
        <div className="mt-10 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-slate-200">Global Chat</h2>
          <div className="bg-[#1e293b] border border-[#374151] rounded-lg shadow p-6">
            <GlobalChatWidget />
          </div>
        </div>

      </div>

      {/* Chat Drawer */}
      <ChatDrawer 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)}
        title="Global Chat"
        chatId="d1e2f3a4-b5c6-7d8e-9f0a-1b2c3d4e5f6a"
      />
    </MainLayout>
  );
};

export default Dashboard;
