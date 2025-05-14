
import React from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const location = useLocation();
  
  // Define which routes should have the footer
  // Static pages like home, about, contact, etc. should have the footer
  // Dynamic pages like dashboard, chat, teams, etc. should not have the footer
  const shouldShowFooter = () => {
    const dynamicRoutes = ['/dashboard', '/chat', '/discover', '/teams', '/matches', '/profile'];
    return !dynamicRoutes.some(route => location.pathname.startsWith(route));
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      <main className="flex-grow">
        {children}
      </main>
      {shouldShowFooter() && <Footer />}
    </div>
  );
};

export default MainLayout;
