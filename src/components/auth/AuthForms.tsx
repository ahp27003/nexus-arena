
import React, { useState } from 'react';
import { Mail, Facebook, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await login(email, password);
      // Navigation is handled in the login function
    } catch (error) {
      // Error is handled in the login function
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="name@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="bg-white/5 border-white/10 focus:border-purple-400 focus-visible:ring-purple-400/20"
          required
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <a href="#" className="text-xs text-purple-400 hover:underline">
            Forgot password?
          </a>
        </div>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="bg-white/5 border-white/10 focus:border-purple-400 focus-visible:ring-purple-400/20"
          required
        />
      </div>
      <Button 
        type="submit" 
        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90" 
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Logging in...
          </>
        ) : (
          'Login'
        )}
      </Button>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10"></div>
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-background px-2 text-white/50">Or continue with</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" className="bg-white/5 border-white/10 hover:bg-white/10">
          <Mail className="mr-2 h-4 w-4" />
          Email
        </Button>
        <Button variant="outline" className="bg-white/5 border-white/10 hover:bg-white/10">
          <Facebook className="mr-2 h-4 w-4" />
          Facebook
        </Button>
      </div>
    </form>
  );
};

export const RegisterForm = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await register(username, email, password);
      // Navigation is handled in the register function
    } catch (error) {
      // Error is handled in the register function
      console.error('Registration error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleRegister} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          type="text"
          placeholder="gamer123"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="bg-white/5 border-white/10 focus:border-purple-400 focus-visible:ring-purple-400/20"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="register-email">Email</Label>
        <Input
          id="register-email"
          type="email"
          placeholder="name@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="bg-white/5 border-white/10 focus:border-purple-400 focus-visible:ring-purple-400/20"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="register-password">Password</Label>
        <Input
          id="register-password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="bg-white/5 border-white/10 focus:border-purple-400 focus-visible:ring-purple-400/20"
          required
        />
      </div>
      
      <Button 
        type="submit" 
        className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:opacity-90" 
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating Account...
          </>
        ) : (
          'Create Account'
        )}
      </Button>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10"></div>
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-background px-2 text-white/50">Or continue with</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" className="bg-white/5 border-white/10 hover:bg-white/10">
          <Mail className="mr-2 h-4 w-4" />
          Email
        </Button>
        <Button variant="outline" className="bg-white/5 border-white/10 hover:bg-white/10">
          <Facebook className="mr-2 h-4 w-4" />
          Facebook
        </Button>
      </div>
    </form>
  );
};

export const AuthTabs = () => {
  return (
    <Tabs defaultValue="login" className="w-full">
      <TabsList className="grid w-full grid-cols-2 bg-white/5">
        <TabsTrigger value="login">Login</TabsTrigger>
        <TabsTrigger value="register">Register</TabsTrigger>
      </TabsList>
      <TabsContent value="login" className="mt-4">
        <LoginForm />
      </TabsContent>
      <TabsContent value="register" className="mt-4">
        <RegisterForm />
      </TabsContent>
    </Tabs>
  );
};
