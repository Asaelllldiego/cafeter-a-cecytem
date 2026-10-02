import React from 'react';
import { Link } from 'react-router-dom';
import { UtensilsCrossed, Search, ShieldCheck, HelpCircle, User } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

export default function MobileHeader() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-hair">
      <div className="flex items-center justify-between px-4 h-14">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid place-items-center w-8 h-8 rounded-xl bg-brand text-white">
            <UtensilsCrossed className="w-4 h-4" />
          </div>
          <div>
            <p className="font-display font-700 text-[15px] leading-none text-ink">CECYTEM</p>
            <p className="text-[10px] text-mutedink">Cafetería</p>
          </div>
        </Link>
        <div className="flex items-center gap-1">
          {isAdmin && (
            <Link to="/admin" className="grid place-items-center w-10 h-10 rounded-full hover:bg-muted text-brand relative">
              <ShieldCheck className="w-5 h-5" />
            </Link>
          )}
          <Link to="/faq" className="grid place-items-center w-10 h-10 rounded-full hover:bg-muted text-ink">
            <HelpCircle className="w-5 h-5" />
          </Link>
          <Link to="/perfil" className="grid place-items-center w-10 h-10 rounded-full hover:bg-muted text-ink">
            <User className="w-5 h-5" />
          </Link>
          <button className="grid place-items-center w-10 h-10 rounded-full hover:bg-muted text-ink">
            <Search className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}