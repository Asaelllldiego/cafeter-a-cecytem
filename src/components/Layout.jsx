import React from 'react';
import { Outlet } from 'react-router-dom';
import { CartProvider } from '@/lib/CartContext';
import Sidebar from '@/components/Sidebar';
import MobileHeader from '@/components/MobileHeader';
import MobileCartBar from '@/components/MobileCartBar';
import BottomNav from '@/components/BottomNav';
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
        <main className={!isMobile ? 'lg:ml-[240px]' : 'pb-[68px]'}>
          <Outlet />
        </main>
        {isMobile && <BottomNav />}
        {isMobile && <MobileCartBar />}
        <OrderAlerts />
        <AgentChat />
      </div>
    </CartProvider>
  );
}