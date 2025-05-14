
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-purple-500 mb-4" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute bg-gradient-radial from-purple-600/20 to-transparent opacity-30 h-[500px] w-[500px] -top-[250px] -left-[250px] blur-3xl"></div>
        <div className="absolute bg-gradient-radial from-pink-600/20 to-transparent opacity-30 h-[600px] w-[600px] -bottom-[350px] -right-[300px] blur-3xl"></div>
      </div>
      
      <header className="relative z-10 p-4 border-b border-white/10">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-indigo-600" />
            <span className="font-bold text-xl tracking-tight">Nexus<span className="text-purple-400">Arena</span></span>
          </div>
          <Button 
            onClick={() => navigate('/login')} 
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90"
          >
            Get Started
          </Button>
        </div>
      </header>
      
      <main className="flex-1 relative z-10">
        <section className="py-20 px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-indigo-500">
            Find Your Perfect Gaming Team
          </h1>
          <p className="text-xl md:text-2xl mb-10 max-w-3xl mx-auto text-white/70">
            Nexus Arena connects gamers with teammates who match their skill level, play style, and schedule.
          </p>
          <Button 
            onClick={() => navigate('/login')} 
            size="lg"
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90"
          >
            Join Now
          </Button>
        </section>
        
        <section className="bg-background/50 py-20 px-4">
          <div className="container mx-auto max-w-5xl">
            <h2 className="text-3xl font-bold mb-12 text-center">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white/5 p-6 rounded-xl border border-white/10 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-purple-400">1</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Create Your Profile</h3>
                <p className="text-white/70">Share your gaming preferences, skill level, and availability</p>
              </div>
              <div className="bg-white/5 p-6 rounded-xl border border-white/10 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-pink-500/20 flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-pink-400">2</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Match with Players</h3>
                <p className="text-white/70">Our algorithm finds players who complement your gaming style</p>
              </div>
              <div className="bg-white/5 p-6 rounded-xl border border-white/10 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-indigo-400">3</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Team Up & Play</h3>
                <p className="text-white/70">Message your new teammates and start playing together</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <footer className="py-8 px-4 border-t border-white/10 text-center text-white/50 relative z-10">
        <p>&copy; 2025 Nexus Arena. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Index;
