import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Send, User, Menu, Plus, Users, UserPlus } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { format } from 'date-fns';
import MainLayout from '@/components/layout/MainLayout';

// Import types and hooks from use-chats
import { useChats, Chat, Message } from '../hooks/use-chats';

// Just define any additional interfaces we need
interface MessageProfile {
  username: string;
  avatar_url?: string;
}

// We've removed 'global' from our chat types since it's now on dashboard
const CHAT_TYPES = [
  { label: 'Team', value: 'team' },
  { label: 'Direct', value: 'direct' },
] as const;

type ChatType = typeof CHAT_TYPES[number]['value'];

const ChatPage = () => {
  const { user, profile } = useAuth();
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [chatType, setChatType] = useState<ChatType>('team');
  const { chats, isLoading, createTeamChat, createDirectChat } = useChats();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Set default chat when chats or chatType changes
  useEffect(() => {
    const filtered = chats.filter((c) => c.type === chatType);
    if (!selectedChat && filtered.length > 0) {
      setSelectedChat(filtered[0]);
    } else if (selectedChat && selectedChat.type !== chatType) {
      setSelectedChat(filtered[0] || null);
    }
  }, [chats, chatType, selectedChat]);

  // Join chat channel for real-time updates
  useEffect(() => {
    if (!selectedChat) return;

    // Set up real-time listener for new messages
    const channel = supabase
      .channel(`chat-${selectedChat.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${selectedChat.id}`,
        },
        (payload) => {
          // Handle new message
          const newMsg = payload.new as Message;
          
          // Fetch the sender's profile information
          const fetchSender = async () => {
            const { data } = await supabase
              .from('profiles')
              .select('username, avatar_url')
              .eq('id', newMsg.user_id)
              .single();
              
            if (data) {
              setMessages((current) => [...current, {
                ...newMsg,
                profile: {
                  username: data.username,
                  avatar_url: data.avatar_url
                }
              }]);
              scrollToBottom();
            }
          };
          
          fetchSender();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedChat]);

  // Fetch messages for selected chat
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedChat) return;
      
      setLoadingMessages(true);
      
      try {
        // First get all messages
        const { data: messagesData, error: messagesError } = await supabase
          .from('messages')
          .select(`*`)
          .eq('chat_id', selectedChat.id)
          .order('created_at', { ascending: true });

        if (messagesError) throw messagesError;
        
        if (messagesData) {
          // Then fetch profiles for each message
          const messagesWithProfiles = await Promise.all(
            messagesData.map(async (message) => {
              if (!message.user_id) {
                return {
                  ...message,
                  profile: { username: 'Unknown User' }
                };
              }
              
              const { data: profileData } = await supabase
                .from('profiles')
                .select('username, avatar_url')
                .eq('id', message.user_id)
                .single();
                
              return {
                ...message,
                profile: profileData || { username: 'Unknown User' }
              };
            })
          );
          
          setMessages(messagesWithProfiles as Message[]);
          setTimeout(scrollToBottom, 100);
        }
      } catch (error: any) {
        console.error('Error fetching messages:', error.message);
        toast.error('Failed to load messages');
      } finally {
        setLoadingMessages(false);
      }
    };

    if (selectedChat) {
      fetchMessages();
    }
  }, [selectedChat]);

  // Send message
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat || !user) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          content: newMessage,
          chat_id: selectedChat.id,
          user_id: user.id,
        });

      if (error) throw error;

      setNewMessage('');
    } catch (error: any) {
      toast.error(`Failed to send message: ${error.message}`);
    }
  };

  // Format timestamp
  const formatMessageTime = (timestamp: string) => {
    try {
      return format(new Date(timestamp), 'h:mm a');
    } catch (error) {
      return '';
    }
  };

  // Join chat
  const joinChat = async (chatId: string) => {
    if (!user) return;
    
    try {
      // Check if already a participant
      const { data: existingParticipant } = await supabase
        .from('chat_participants')
        .select('id')
        .eq('chat_id', chatId)
        .eq('user_id', user.id)
        .single();
        
      if (!existingParticipant) {
        // Join the chat
        const { error } = await supabase
          .from('chat_participants')
          .insert({
            chat_id: chatId,
            user_id: user.id,
          });
          
        if (error) throw error;
        toast.success('Joined the chat successfully!');
      }
    } catch (error: any) {
      console.error('Error joining chat:', error.message);
      toast.error('Failed to join chat');
    }
  };

  // Select a chat
  const handleSelectChat = async (chat: Chat) => {
    await joinChat(chat.id);
    setSelectedChat(chat);
    
    if (window.innerWidth < 768) {
      setShowSidebar(false);
    }
  };

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  // Create new team or direct chat
  const handleCreateChat = async () => {
    try {
      if (chatType === 'team') {
        navigate('/teams');
      } else {
        toast.info('Select a user from the Discover page to start a chat');
        navigate('/discover');
      }
    } catch (error: any) {
      toast.error(`Failed to create chat: ${error.message}`);
    }
  };

  return (
    <MainLayout>
      <div className="flex flex-col h-[calc(100vh-64px)] bg-[#111827]">
        {/* Chat Header */}
        <div className="bg-[#1f2937] border-b border-[#374151] px-4 py-3 flex justify-between items-center">
          <div className="flex items-center">
            {!showSidebar && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowSidebar(true)} 
                className="mr-2 md:hidden text-slate-300 hover:bg-[#2d3748]"
              >
                <Menu className="h-5 w-5" />
              </Button>
            )}
            <h1 className="text-lg font-semibold text-slate-100">
              {selectedChat ? selectedChat.name : 'Chats'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {selectedChat && (
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <Users className="h-3 w-3" />
                <span>{selectedChat._count?.participants ?? '?'}</span>
              </div>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              className="border-[#374151] bg-[#1e293b] text-slate-300 hover:bg-[#2d3748] hover:text-slate-100"
              onClick={handleCreateChat}
            >
              <UserPlus className="h-4 w-4 mr-1" />
              {chatType === 'team' ? 'Teams' : 'Find Users'}
            </Button>
          </div>
        </div>
        
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          {showSidebar && (
            <div className="w-72 flex flex-col border-r border-[#374151] bg-[#1a202c]">
              {/* Chat Type Tabs */}
              <div className="p-3">
                <Tabs defaultValue={chatType} onValueChange={(value) => setChatType(value as ChatType)}>
                  <TabsList className="grid grid-cols-2 bg-[#1e293b] border border-[#374151]">
                    {CHAT_TYPES.map(tab => (
                      <TabsTrigger 
                        key={tab.value} 
                        value={tab.value}
                        className="data-[state=active]:bg-[#2d3748] data-[state=active]:text-slate-100"
                      >
                        {tab.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>
              
              {/* Chat List */}
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {isLoading ? (
                  <div className="p-3 space-y-3">
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} className="h-14 rounded-md bg-[#2d3748]" />
                    ))}
                  </div>
                ) : chats.filter(c => c.type === chatType).length === 0 ? (
                  <div className="text-center text-slate-400 flex flex-col items-center justify-center h-full p-6">
                    <p>No {chatType} chats found</p>
                    <Button 
                      className="mt-4 bg-[#2c3e50] hover:bg-[#3a516b] text-slate-100 border border-[#435a74]" 
                      onClick={handleCreateChat}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {chatType === 'team' ? 'Go to Teams' : 'Find Users'}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-1 p-2">
                    {chats.filter(c => c.type === chatType).map(chat => (
                      <div
                        key={chat.id}
                        className={`p-3 cursor-pointer rounded-md hover:bg-[#2d3748] ${selectedChat?.id === chat.id ? 'bg-[#2d3748]' : ''}`}
                        onClick={() => handleSelectChat(chat)}
                      >
                        <div className="font-medium flex items-center gap-2 text-slate-200">
                          <span>{chat.name}</span>
                          {chat._count?.participants != null && (
                            <span className="text-xs text-slate-400">({chat._count.participants})</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Messages */}
          <div className="flex flex-col flex-1 overflow-hidden bg-[#111827]">
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar" id="messages-container">
              {loadingMessages ? (
                <div className="space-y-4">
                  {Array(3).fill(0).map((_, i) => (
                    <div key={i} className={`flex items-start gap-3 mb-4 ${i % 2 === 0 ? '' : 'flex-row-reverse'}`}> 
                      <Skeleton className="h-8 w-8 rounded-full bg-[#2d3748]" />
                      <div>
                        <Skeleton className="h-4 w-24 mb-1 bg-[#2d3748]" />
                        <Skeleton className="h-16 w-64 rounded-md bg-[#2d3748]" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : messages.length > 0 ? (
                <div className="space-y-4">
                  {messages.map((message, index) => {
                    const isCurrentUser = message.user_id === user?.id;
                    const showAvatar = index === 0 || messages[index - 1].user_id !== message.user_id;
                    const showTime = index === messages.length - 1 || messages[index + 1]?.user_id !== message.user_id;
                    
                    return (
                      <div
                        key={message.id}
                        className={`flex items-start gap-2 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                      >
                        {!isCurrentUser && showAvatar && (
                          <Avatar className="h-8 w-8 mt-1">
                            <AvatarImage src={message.profile?.avatar_url} />
                            <AvatarFallback className="bg-[#2c3e50] text-slate-100">
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
                              {formatMessageTime(message.created_at)}
                            </span>
                          )}
                        </div>
                        
                        {isCurrentUser && showAvatar && (
                          <Avatar className="h-8 w-8 mt-1">
                            <AvatarImage src={profile?.avatar_url} />
                            <AvatarFallback className="bg-[#3a516b] text-slate-100">
                              {profile?.username ? getInitials(profile.username) : <User className="h-4 w-4" />}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              ) : selectedChat ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-slate-400">
                    <p>No messages yet</p>
                    <p className="text-sm">Be the first to send a message!</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-slate-400">
                    <p>Select a chat to start messaging</p>
                    {chats.length === 0 && (
                      <Button 
                        className="mt-4 bg-[#2c3e50] hover:bg-[#3a516b] text-slate-100"
                        onClick={handleCreateChat}
                      >
                        {chatType === 'team' ? 'Go to Teams' : 'Find Users'}
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {selectedChat && (
              <form 
                onSubmit={sendMessage} 
                className="p-3 border-t border-[#374151] bg-[#1a202c] flex items-center gap-2"
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
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ChatPage;
