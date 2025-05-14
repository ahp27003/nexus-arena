
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNotifications, Notification } from '@/hooks/use-notifications';

export function NotificationsDropdown() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    
    // Navigate based on notification type and reference
    if (notification.type === 'request' && notification.reference_type === 'player_request') {
      navigate('/discover');
    } else if (notification.type === 'team') {
      navigate('/teams');
    } else if (notification.type === 'match') {
      navigate('/matches');
    } else if (notification.type === 'chat') {
      navigate('/chat');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-pink-500 text-white">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="flex justify-between items-center">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => markAllAsRead()}
              className="text-xs text-muted-foreground"
            >
              Mark all as read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-[300px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="py-2 px-2 text-center text-muted-foreground">
              No notifications
            </div>
          ) : (
            notifications.slice(0, 5).map((notification) => (
              <DropdownMenuItem 
                key={notification.id}
                className={`flex flex-col items-start py-2 ${!notification.read ? 'bg-muted/50' : ''}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="font-medium">{notification.title}</div>
                <div className="text-xs text-muted-foreground">{notification.message}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {new Date(notification.created_at).toLocaleString()}
                </div>
              </DropdownMenuItem>
            ))
          )}
        </div>
        {notifications.length > 5 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-center text-sm text-primary"
              onSelect={() => navigate('/notifications')}
            >
              View all notifications
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
