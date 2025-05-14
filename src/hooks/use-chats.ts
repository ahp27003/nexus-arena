import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export interface ChatParticipant {
  id: string;
  user_id: string;
  chat_id: string;
  joined_at: string;
  profile?: {
    username: string;
    avatar_url?: string;
  }
}

export interface Message {
  id: string;
  content: string;
  user_id: string;
  chat_id: string;
  created_at: string;
  profile?: {
    username: string;
    avatar_url?: string;
  }
}

export interface Chat {
  type: 'global' | 'team' | 'direct';
  team_id?: string | null;
  id: string;
  name: string;
  created_by: string | null;
  is_private: boolean;
  created_at: string;
  participants?: ChatParticipant[];
  messages?: Message[];
  _count?: {
    participants: number;
  }
}

// Interface for the raw data returned from Supabase
interface RawChatData {
  id: string;
  name: string;
  created_by: string | null;
  is_private: boolean | null;
  created_at: string | null;
  participants?: { count: number }[];
  chat_type?: string; // Database uses chat_type instead of type
  team_id?: string | null;
  description?: string | null;
}

export function useChats() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Fetch all chats
  useEffect(() => {
    if (!user) return;

    const fetchChats = async () => {
      try {
        const { data, error } = await supabase
          .from('chats')
          .select(`
            *,
            participants:chat_participants(count)
          `)
          .order('created_at', { ascending: false }) as { data: RawChatData[] | null, error: any };

        if (error) throw error;

        // Transform the data to match our Chat interface
        if (data) {
          const transformedData: Chat[] = data.map((chat: RawChatData) => {
            // Map chat_type to type for our interface
            // The database uses chat_type but our interface uses type
            let chatType: 'global' | 'team' | 'direct' = 'global';
            
            if (chat.chat_type) {
              // If chat_type field exists, use it
              chatType = chat.chat_type as 'global' | 'team' | 'direct';
            } else if (chat.team_id) {
              // If no chat_type but has team_id, it's a team chat
              chatType = 'team';
            } else {
              // Check if it might be a direct chat by participant count
              const participantCount = chat.participants?.[0]?.count || 0;
              if (participantCount === 2) {
                chatType = 'direct';
              }
              // Otherwise default to global
            }
            
            return {
              id: chat.id,
              name: chat.name,
              created_by: chat.created_by,
              is_private: chat.is_private || false,
              created_at: chat.created_at || new Date().toISOString(),
              type: chatType,
              team_id: chat.team_id ?? null,
              _count: {
                participants: chat.participants?.[0]?.count || 0
              }
            };
          });
          
          setChats(transformedData);
        }
      } catch (err: any) {
        console.error('Error fetching chats:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChats();
    
    // Set up real-time subscription for chat updates
    const channel = supabase
      .channel('public:chats')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chats',
        },
        () => {
          // Refetch chats when any changes occur
          fetchChats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Create a new chat
  const createChat = async (
    name: string,
    type: 'global' | 'team' | 'direct' = 'global',
    isPrivate: boolean = false,
    teamId?: string | null,
    participantIds?: string[]
  ) => {
    if (!user) {
      toast.error('You must be logged in to create a chat');
      return null;
    }

    try {
      // Insert the chat directly
      const { data: chatData, error: chatError } = await supabase
        .from('chats')
        .insert({
          name,
          created_by: user.id,
          is_private: isPrivate,
          chat_type: type,
          team_id: teamId || null
        })
        .select()
        .single() as { data: any, error: any };

      if (chatError) throw chatError;

      if (!chatData) {
        throw new Error('No data returned from chat creation');
      }

      // Add the creator as a participant first
      const { error: participantError } = await supabase
        .from('chat_participants')
        .insert({
          chat_id: chatData.id,
          user_id: user.id
        }) as { error: any };

      if (participantError) throw participantError;

      // Add additional participants if provided
      if (participantIds && participantIds.length > 0) {
        const participantsToAdd = participantIds.map(userId => ({
          chat_id: chatData.id,
          user_id: userId
        }));

        const { error: addParticipantsError } = await supabase
          .from('chat_participants')
          .insert(participantsToAdd) as { error: any };

        if (addParticipantsError) throw addParticipantsError;
      }

      // Return the new chat with proper type
      return {
        id: chatData.id,
        name: chatData.name,
        created_by: chatData.created_by,
        is_private: chatData.is_private || false,
        created_at: chatData.created_at || new Date().toISOString(),
        type,
        team_id: teamId || null
      };
    } catch (err: any) {
      console.error('Error creating chat:', err);
      toast.error(`Failed to create chat: ${err.message}`);
      return null;
    }
  };

  // Join a chat
  const joinChat = async (chatId: string) => {
    if (!user) {
      toast.error('You must be logged in to join a chat');
      return false;
    }

    try {
      // Check if already a participant
      const { data: existingParticipant, error: checkError } = await supabase
        .from('chat_participants')
        .select('id')
        .eq('chat_id', chatId)
        .eq('user_id', user.id)
        .maybeSingle() as { data: any, error: any };

      if (checkError) throw checkError;

      // If already a participant, do nothing
      if (existingParticipant) {
        return true;
      }

      // Add as participant
      const { error: joinError } = await supabase
        .from('chat_participants')
        .insert({
          chat_id: chatId,
          user_id: user.id
        }) as { error: any };

      if (joinError) throw joinError;

      toast.success('Successfully joined chat');
      return true;
    } catch (err: any) {
      toast.error(`Failed to join chat: ${err.message}`);
      return false;
    }
  };

  // Leave a chat
  const leaveChat = async (chatId: string) => {
    if (!user) {
      toast.error('You must be logged in to leave a chat');
      return false;
    }

    try {
      const { error } = await supabase
        .from('chat_participants')
        .delete()
        .eq('chat_id', chatId)
        .eq('user_id', user.id) as { error: any };

      if (error) throw error;

      toast.success('Successfully left chat');
      return true;
    } catch (err: any) {
      toast.error(`Failed to leave chat: ${err.message}`);
      return false;
    }
  };

  // Static global chat object
  const GLOBAL_CHAT: Chat = {
    id: 'global',
    name: 'Global Chat',
    created_by: null,
    is_private: false,
    created_at: '1970-01-01T00:00:00Z',
    type: 'global',
    team_id: null,
    participants: [],
    messages: [],
    _count: { participants: 0 }
  };

  // Always return the static global chat
  const getOrCreateGlobalChat = async () => {
    return GLOBAL_CHAT;
  };

  // Create a team chat for a given team
  const createTeamChat = async (teamName: string, teamId: string, memberIds: string[]) => {
    if (!user) {
      console.error('User not authenticated');
      return null;
    }
    
    try {
      // Check if a team chat already exists for this team
      const existingTeamChat = chats.find(chat => 
        chat.type === 'team' && chat.team_id === teamId
      );
      
      if (existingTeamChat) {
        return existingTeamChat;
      }
      
      // Create a new team chat
      return await createChat(`${teamName} Team Chat`, 'team', false, teamId, memberIds);
    } catch (error) {
      console.error('Error creating team chat:', error);
      throw error;
    }
  };

  // Create a direct chat (1:1)
  const createDirectChat = async (otherUserId: string) => {
    if (!user) {
      console.error('User not authenticated');
      return null;
    }
    
    try {
      // Check if a direct chat already exists with this user
      // Use explicit type annotation to avoid deep instantiation error
      const existingDirectChat = chats.find(chat => {
        if (chat.type !== 'direct') return false;
        
        // Check if this chat has exactly 2 participants
        if (chat._count?.participants !== 2) return false;
        
        // If we have participants array, check if it includes both users
        if (chat.participants) {
          const hasOtherUser = chat.participants.some((p: ChatParticipant) => p.user_id === otherUserId);
          const hasCurrentUser = chat.participants.some((p: ChatParticipant) => p.user_id === user.id);
          return hasOtherUser && hasCurrentUser;
        }
        
        // Otherwise just return false
        return false;
      });
      
      if (existingDirectChat) {
        return existingDirectChat;
      }
      
      // Create a new direct chat
      return await createChat('Direct Chat', 'direct', true, null, [otherUserId]);
    } catch (error) {
      console.error('Error creating direct chat:', error);
      throw error;
    }
  };

  return {
    chats,
    isLoading,
    error,
    createChat,
    getOrCreateGlobalChat,
    createTeamChat,
    createDirectChat,
    joinChat,
    leaveChat
  };
}

export function useChatMessages(chatId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Fetch messages for a chat
  useEffect(() => {
    if (!chatId || !user) return;

    const fetchMessages = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // First get all messages
        const { data: messagesData, error: messagesError } = await supabase
          .from('messages')
          .select(`*`)
          .eq('chat_id', chatId)
          .order('created_at', { ascending: true }) as { data: any[], error: any };

        if (messagesError) throw messagesError;
        
        if (messagesData) {
          // Then manually fetch profiles for each message
          const messagesWithProfiles: Message[] = [];
          
          for (const message of messagesData) {
            if (!message.user_id) {
              messagesWithProfiles.push({
                ...message,
                profile: { username: 'Unknown User', avatar_url: undefined }
              } as Message);
              continue;
            }
            
            try {
              const { data: profileData } = await supabase
                .from('profiles')
                .select('username, avatar_url')
                .eq('id', message.user_id)
                .single() as { data: any, error: any };
                
              messagesWithProfiles.push({
                ...message,
                profile: profileData || { username: 'Unknown User', avatar_url: undefined }
              } as Message);
            } catch (profileError) {
              // If we can't get the profile, still show the message
              messagesWithProfiles.push({
                ...message,
                profile: { username: 'Unknown User', avatar_url: undefined }
              } as Message);
            }
          }
          
          setMessages(messagesWithProfiles);
        }
      } catch (err: any) {
        console.error('Error fetching messages:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();

    // Set up realtime subscription for new messages
    let channel: any = null;
    try {
      channel = supabase
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
            
            // Skip if it's a temporary message we already added
            if (newMsg.id.toString().startsWith('temp-')) return;
            
            // Check if we already have this message (to avoid duplicates)
            if (messages.some(m => m.id === newMsg.id)) return;
            
            try {
              // Fetch the sender's profile information
              const { data } = await supabase
                .from('profiles')
                .select('username, avatar_url')
                .eq('id', newMsg.user_id)
                .single() as { data: any, error: any };
                
              setMessages(prev => [...prev, {
                ...newMsg,
                profile: data ? {
                  username: data.username || 'Unknown User',
                  avatar_url: data.avatar_url
                } : { username: 'Unknown User' }
              }]);
            } catch (profileError) {
              // Still show the message even without profile info
              setMessages(prev => [...prev, {
                ...newMsg,
                profile: { username: 'Unknown User' }
              }]);
            }
          }
        )
        .subscribe();
    } catch (subscriptionError) {
      console.error('Error setting up real-time subscription:', subscriptionError);
    }

    return () => {
      if (channel) {
        try {
          supabase.removeChannel(channel);
        } catch (error) {
          console.warn('Error removing channel:', error);
        }
      }
    };
  }, [chatId, user]);

  // Send a message
  const sendMessage = async (content: string) => {
    if (!chatId || !user) {
      toast.error('You must be in a chat to send messages');
      return null;
    }

    try {
      // Create a temporary message to show immediately
      const tempMessage = {
        id: `temp-${Date.now()}`,
        content,
        chat_id: chatId,
        user_id: user.id,
        created_at: new Date().toISOString(),
        profile: {
          username: user.email?.split('@')[0] || 'You',
          avatar_url: null
        }
      };
      
      // Add to UI immediately for better UX
      setMessages(prev => [...prev, tempMessage as any]);
      
      // Then send to database
      const { data, error } = await supabase
        .from('messages')
        .insert({
          content,
          chat_id: chatId,
          user_id: user.id,
        })
        .select()
        .single() as { data: any, error: any };

      if (error) {
        console.error('Failed to send message:', error);
        // Remove the temporary message if there was an error
        setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
        toast.error(`Failed to send message: ${error.message}`);
        return null;
      }

      return data;
    } catch (err: any) {
      toast.error(`Failed to send message: ${err.message}`);
      return null;
    }
  };

  return {
    messages,
    isLoading,
    error,
    sendMessage
  };
}
