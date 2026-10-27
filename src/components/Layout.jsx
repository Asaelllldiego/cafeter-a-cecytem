import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CartProvider } from '@/lib/CartContext';
import Sidebar from '@/components/Sidebar';
import MobileHeader from '@/components/MobileHeader';
import MobileCartBar from '@/components/MobileCartBar';
import BottomNav from '@/components/BottomNav';
import AgentChat from '@/components/AgentChat';
import OrderAlerts from '@/components/OrderAlerts';
import OrderReadyNotice from '@/components/OrderReadyNotice';
import { useIsMobile } from '@/hooks/use-mobile';

export default function Layout() {
  const isMobile = useIsMobile();
  const location = useLocation();
  return (
    <CartProvider>
      <div className="min-h-screen bg-background">
        {isMobile && <MobileHeader />}
        {!isMobile && <Sidebar />}
        <main
          className={!isMobile ? 'lg:ml-[240px]' : 'pb-[68px]'}
          style={isMobile ? {
            paddingTop: 'calc(3.5rem + env(safe-area-inset-top))',
            paddingBottom: 'calc(68px + env(safe-area-inset-bottom))'
          } : undefined}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname + (location.state?._t ? `#${location.state._t}` : '')}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
        {isMobile && <BottomNav />}
        {isMobile && <MobileCartBar />}
        <OrderAlerts />
        <OrderReadyNotice />
        <AgentChat />
      </div>
    </CartProvider>
  );
}