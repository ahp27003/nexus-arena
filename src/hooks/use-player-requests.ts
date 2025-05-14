
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface PlayerRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  message: string;
  created_at: string;
  sender?: {
    username: string;
    avatar_url?: string;
  };
  receiver?: {
    username: string;
    avatar_url?: string;
  };
}

export function usePlayerRequests() {
  const [sentRequests, setSentRequests] = useState<PlayerRequest[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<PlayerRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Fetch requests
  useEffect(() => {
    if (!user) return;

    const fetchRequests = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch sent requests
        const { data: sentData, error: sentError } = await supabase
          .from('player_requests')
          .select(`
            *,
            receiver:profiles!player_requests_receiver_id_fkey(username, avatar_url)
          `)
          .eq('sender_id', user.id)
          .order('created_at', { ascending: false });

        if (sentError) throw sentError;
        
        // Fetch received requests
        const { data: receivedData, error: receivedError } = await supabase
          .from('player_requests')
          .select(`
            *,
            sender:profiles!player_requests_sender_id_fkey(username, avatar_url)
          `)
          .eq('receiver_id', user.id)
          .order('created_at', { ascending: false });

        if (receivedError) throw receivedError;
        
        setSentRequests(sentData as PlayerRequest[] || []);
        setReceivedRequests(receivedData as PlayerRequest[] || []);
      } catch (err: any) {
        console.error('Error fetching player requests:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRequests();
    
    // Set up real-time subscription for request updates
    const sentChannel = supabase.channel('sent-requests')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'player_requests',
          filter: `sender_id=eq.${user.id}`,
        },
        () => {
          fetchRequests();
        }
      )
      .subscribe();
      
    const receivedChannel = supabase.channel('received-requests')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'player_requests',
          filter: `receiver_id=eq.${user.id}`,
        },
        () => {
          fetchRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sentChannel);
      supabase.removeChannel(receivedChannel);
    };
  }, [user]);

  // Send a player request
  const sendRequest = async (receiverId: string, message: string) => {
    if (!user) {
      toast.error('You must be logged in to send requests');
      return null;
    }

    try {
      // Check if request already exists
      const { data: existingRequest } = await supabase
        .from('player_requests')
        .select('*')
        .eq('sender_id', user.id)
        .eq('receiver_id', receiverId)
        .maybeSingle();

      if (existingRequest) {
        toast.error('You have already sent a request to this player');
        return null;
      }

      // Create new request
      const { data, error } = await supabase
        .from('player_requests')
        .insert({
          sender_id: user.id,
          receiver_id: receiverId,
          message,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      // Create notification for receiver
      await supabase
        .from('notifications')
        .insert({
          user_id: receiverId,
          title: 'New Player Request',
          message: 'You have received a new player request',
          type: 'request',
          read: false,
          reference_id: data.id,
          reference_type: 'player_request'
        });

      toast.success('Request sent successfully');
      return data as PlayerRequest;
    } catch (err: any) {
      console.error('Error sending player request:', err);
      toast.error(`Failed to send request: ${err.message}`);
      return null;
    }
  };

  // Respond to a player request
  const respondToRequest = async (requestId: string, accept: boolean) => {
    if (!user) {
      toast.error('You must be logged in to respond to requests');
      return false;
    }

    try {
      // Get the request first to check if user is allowed to respond
      const { data: request } = await supabase
        .from('player_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (!request || request.receiver_id !== user.id) {
        toast.error('You are not authorized to respond to this request');
        return false;
      }

      // Update request status
      const status = accept ? 'accepted' : 'rejected';
      const { error } = await supabase
        .from('player_requests')
        .update({ status })
        .eq('id', requestId);

      if (error) throw error;

      // Create notification for sender
      await supabase
        .from('notifications')
        .insert({
          user_id: request.sender_id,
          title: `Request ${status}`,
          message: `Your player request was ${status}`,
          type: 'request',
          read: false,
          reference_id: requestId,
          reference_type: 'player_request'
        });

      toast.success(`Request ${status} successfully`);
      return true;
    } catch (err: any) {
      console.error('Error responding to player request:', err);
      toast.error(`Failed to respond to request: ${err.message}`);
      return false;
    }
  };

  return {
    sentRequests,
    receivedRequests,
    isLoading,
    error,
    sendRequest,
    respondToRequest
  };
}
