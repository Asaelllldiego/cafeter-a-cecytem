import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { UtensilsCrossed, Search, ShieldCheck, HelpCircle, User, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

export default function MobileHeader() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';
  const ROOT_TABS = ['/', '/pedidos', '/promociones', '/perfil', '/admin'];
  const isSubroute = !ROOT_TABS.includes(location.pathname);
  return (
    <header className="sticky top-0 z-30 bg-card border-b border-hair select-none" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="flex items-center justify-between px-4 h-14">
        {isSubroute ? (
          <button onClick={() => navigate(-1)} className="grid place-items-center w-10 h-10 -ml-2 rounded-full hover:bg-muted text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
        ) : (
          <Link to="/" className="flex items-center gap-2">
            <div className="grid place-items-center w-8 h-8 rounded-xl bg-brand text-white">
              <UtensilsCrossed className="w-4 h-4" />
            </div>
            <div>
              <p className="font-display font-700 text-[15px] leading-none text-foreground">CECYTEM</p>
              <p className="text-[10px] text-mutedink">Cafetería</p>
            </div>
          </Link>
        )}
        <div className="flex items-center gap-1">
          {isAdmin && (
            <Link to="/admin" className="grid place-items-center w-10 h-10 rounded-full hover:bg-muted text-brand relative">
              <ShieldCheck className="w-5 h-5" />
            </Link>
          )}
          <Link to="/faq" className="grid place-items-center w-10 h-10 rounded-full hover:bg-muted text-foreground">
            <HelpCircle className="w-5 h-5" />
          </Link>
          <Link to="/perfil" className="grid place-items-center w-10 h-10 rounded-full hover:bg-muted text-foreground">
            <User className="w-5 h-5" />
          </Link>
          <button className="grid place-items-center w-10 h-10 rounded-full hover:bg-muted text-foreground">
            <Search className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}