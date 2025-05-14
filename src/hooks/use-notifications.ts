
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'request' | 'chat' | 'team' | 'match' | 'system';
  read: boolean;
  created_at: string;
  reference_id?: string;
  reference_type?: string;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  // Fetch notifications
  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (data) {
          setNotifications(data as Notification[]);
          setUnreadCount(data.filter(n => !n.read).length);
        }
      } catch (error: any) {
        console.error('Error fetching notifications:', error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();

    // Set up subscription for real-time notifications
    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications(current => [newNotification, ...current]);
          setUnreadCount(count => count + 1);
          
          // Show toast for new notification
          toast(newNotification.title, {
            description: newNotification.message,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Mark notification as read
  const markAsRead = async (id: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);

      if (error) throw error;

      setNotifications(current => 
        current.map(n => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount(count => Math.max(0, count - 1));
      
      return true;
    } catch (error: any) {
      console.error('Error marking notification as read:', error.message);
      return false;
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    if (!user || unreadCount === 0) return false;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) throw error;

      setNotifications(current => 
        current.map(n => ({ ...n, read: true }))
      );
      setUnreadCount(0);
      
      return true;
    } catch (error: any) {
      console.error('Error marking all notifications as read:', error.message);
      return false;
    }
  };

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead
  };
}
