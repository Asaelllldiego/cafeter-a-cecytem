import React from 'react';
import { Outlet } from 'react-router-dom';
import { CartProvider } from '@/lib/CartContext';
import Sidebar from '@/components/Sidebar';
import MobileHeader from '@/components/MobileHeader';
import MobileCartBar from '@/components/MobileCartBar';
import AgentChat from '@/components/AgentChat';
import OrderAlerts from '@/components/OrderAlerts';
import { useIsMobile } from '@/hooks/use-mobile';

export default function Layout() {
  const isMobile = useIsMobile();
  return (
    <CartProvider>
      <div className="min-h-screen bg-background">
        {isMobile && <MobileHeader />}
        {!isMobile && <Sidebar />}
        <main className={!isMobile ? 'lg:ml-[240px]' : ''}>
          <Outlet />
        </main>
        {isMobile && <MobileCartBar />}
        <OrderAlerts />
        <AgentChat />
      </div>
    </CartProvider>
  );
}