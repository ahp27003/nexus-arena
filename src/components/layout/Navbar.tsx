
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Bell, MessageCircle, User, LogOut, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useNotifications } from '@/hooks/use-notifications';

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  const { user, profile, isAuthenticated, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if the current page is the chat page
  const isChat = location.pathname === '/chat';

  const handleLogout = () => {
    logout();
  };

  // If we're on the chat page, don't show the navbar
  if (isChat) {
    return null;
  }

  // Define nav items - remove duplicate Chat entry
  const navItems = [
    { name: 'Dashboard', path: '/dashboard', isProtected: true },
    { name: 'Discover', path: '/discover', isProtected: true },
    { name: 'Teams', path: '/teams', isProtected: true },
    { name: 'Matches', path: '/matches', isProtected: true },
    { name: 'Chat', path: '/chat', isProtected: true, icon: <MessageCircle className="h-4 w-4 mr-1" /> },
  ];

  const getInitials = (name: string) => {
    return name?.charAt(0).toUpperCase() || 'U';
  };

  const mobileMenu = (
    <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col bg-background w-[300px]">
        <SheetHeader className="mb-4">
          <SheetTitle className="text-left">Menu</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-2">
          {isAuthenticated && navItems.filter(item => item.isProtected).map((item, index) => (
            <Button 
              key={index} 
              variant="ghost" 
              className="justify-start text-lg"
              onClick={() => {
                navigate(item.path);
                setIsMobileMenuOpen(false);
              }}
            >
              {item.icon && item.icon}
              {item.name}
            </Button>
          ))}
          <Separator className="my-2" />
          {!isAuthenticated && (
            <Button 
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 text-white"
              onClick={() => {
                navigate('/login');
                setIsMobileMenuOpen(false);
              }}
            >
              Login
            </Button>
          )}
          {isAuthenticated && (
            <Button 
              variant="ghost" 
              className="justify-start text-lg text-red-500"
              onClick={() => {
                handleLogout();
                setIsMobileMenuOpen(false);
              }}
            >
              <LogOut className="h-5 w-5 mr-2" />
              Logout
            </Button>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );

  return (
    <nav className="sticky top-0 z-50 w-full backdrop-blur-md bg-background/80 border-b border-border px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to={isAuthenticated ? "/dashboard" : "/"} className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-indigo-600 animate-pulse-neon" />
          <span className="font-bold text-xl tracking-tight text-white">Nexus<span className="text-purple-400">Arena</span></span>
        </Link>

        <div className="flex items-center gap-1 md:gap-3">
          {isAuthenticated && !isMobile && (
            <div className="hidden md:flex items-center space-x-4 mr-4">
              {navItems.filter(item => item.isProtected).map((item, index) => (
                <Link 
                  key={index} 
                  to={item.path} 
                  className="text-sm text-white/90 hover:text-white transition-colors flex items-center"
                >
                  {item.icon && item.icon}
                  {item.name}
                </Link>
              ))}
            </div>
          )}

          {isAuthenticated ? (
            <>
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
                          onClick={() => markAsRead(notification.id)}
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

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                        {profile?.username ? getInitials(profile.username) : 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    {profile?.username || 'My Account'}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-500" onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {isMobile && mobileMenu}
            </>
          ) : (
            <>
              <Button
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 text-white hidden md:flex"
                onClick={() => navigate('/login')}
              >
                Login
              </Button>
              {isMobile && mobileMenu}
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
