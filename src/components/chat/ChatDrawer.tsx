import React, { useState, useEffect, useRef } from 'react';
import { X, Send, User, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Message } from '@/hooks/use-chats';
import { getAvatarUrl } from '@/utils/avatar';
import { toast } from 'sonner';

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  chatId: string;
  title?: string;
}

interface MessageWithProfile extends Message {
  profile?: {
    username: string;
    avatar_url?: string;
  };
}

const ChatDrawer: React.FC<ChatDrawerProps> = ({ isOpen, onClose, chatId, title = 'Global Chat' }) => {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<MessageWithProfile[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);
  
  // Fetch messages for the chat
  useEffect(() => {
    if (!isOpen || !chatId) return;
    
    const fetchMessages = async () => {
      setIsLoading(true);
      try {
        // Get messages from the last 24 hours
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('chat_id', chatId)
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
        toast.error('Failed to load messages');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMessages();
    
    // Set up real-time listener for new messages
    const channel = supabase
      .channel(`chat-${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
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
  }, [isOpen, chatId]);

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
    if (!user || !newMessage.trim() || !chatId) return;
    
    // Create a temporary message to show immediately
    const tempMsg: MessageWithProfile = {
      id: `temp-${Date.now()}`,
      content: newMessage,
      user_id: user.id,
      chat_id: chatId,
      created_at: new Date().toISOString(),
      profile: {
        username: profile?.username || user.email?.split('@')[0] || 'You',
        avatar_url: profile?.avatar_url
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
          chat_id: chatId,
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[400px] bg-[#111827] border-l border-[#374151] shadow-xl z-50 flex flex-col transition-transform duration-300 ease-in-out transform"
         style={{ transform: isOpen ? 'translateX(0)' : 'translateX(100%)' }}>
      {/* Header */}
      <div className="p-4 border-b border-[#374151] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-[#6ab0f3]" />
          <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onClose}
          className="text-slate-400 hover:text-slate-100 hover:bg-[#1e293b]"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
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
                        src={profile?.avatar_url || getAvatarUrl({
                          id: user.id,
                          username: profile?.username
                        })} 
                      />
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
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-slate-400">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No messages yet</p>
              <p className="text-sm">Be the first to send a message!</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Message Input */}
      <form 
        onSubmit={sendMessage} 
        className="p-4 border-t border-[#374151] flex items-center gap-2"
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

export default ChatDrawer;
