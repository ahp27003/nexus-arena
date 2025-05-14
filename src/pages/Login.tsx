
import React from 'react';
import { motion } from 'framer-motion';
import { AuthTabs } from '@/components/auth/AuthForms';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const Login = () => {
  const { isAuthenticated } = useAuth();
  
  if (isAuthenticated) {
    return <Navigate to="/discover" />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute bg-gradient-radial from-purple-600/20 to-transparent opacity-30 h-[500px] w-[500px] -top-[250px] -left-[250px] blur-3xl"></div>
        <div className="absolute bg-gradient-radial from-pink-600/20 to-transparent opacity-30 h-[600px] w-[600px] -bottom-[350px] -right-[300px] blur-3xl"></div>
      </div>
      
      <div className="flex-grow flex items-center justify-center px-4 py-12 relative z-10">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <motion.div 
                className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-indigo-600"
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              />
            </div>
            <motion.h1 
              className="text-3xl font-bold tracking-tight"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              Welcome to <span className="text-gradient">Nexus Arena</span>
            </motion.h1>
            <motion.p 
              className="mt-2 text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Sign in to connect with teammates and dominate the competition.
            </motion.p>
          </div>
          
          <motion.div
            className="glass-card p-6 rounded-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <AuthTabs />
          </motion.div>
        </div>
      </div>
      
      <footer className="py-6 px-4 text-center text-sm text-muted-foreground">
        <p>&copy; 2025 Nexus Arena. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Login;
