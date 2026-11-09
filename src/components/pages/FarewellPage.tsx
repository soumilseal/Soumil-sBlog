import React from 'react';
import { Feather, Sparkles, ArrowRight, Home, LogIn } from 'lucide-react';
import { HeroScene3D } from '../canvas/HeroScene3D';
import { BRANDING } from '../../config/branding';
import { PageRoute } from '../../types';

interface FarewellPageProps {
  onNavigate: (route: PageRoute) => void;
}

export const FarewellPage: React.FC<FarewellPageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-ambient-mesh flex items-center justify-center p-4 relative overflow-hidden text-center">
      {/* 3D Falling Light Scene */}
      <HeroScene3D interactive={false} />

      <div className="relative z-10 max-w-lg mx-auto glass-panel p-8 sm:p-12 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-2xl animate-in zoom-in-95 duration-500">
        <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 mx-auto flex items-center justify-center text-cyan-300 mb-6 shadow-xl shadow-cyan-500/20">
          <Feather className="w-8 h-8 text-amber-300" />
        </div>

        <span className="text-xs uppercase font-mono-code tracking-[0.25em] text-cyan-400 font-semibold block mb-2">
          {BRANDING.name}
        </span>

        <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-white mb-4 leading-tight">
          Thank You for Being Part of Our Community.
        </h1>

        <p className="text-slate-300 text-sm sm:text-base font-light leading-relaxed mb-8">
          Every story makes this place a little more special. We hope to see you again soon.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => onNavigate({ type: 'landing' })}
            className="w-full sm:w-auto px-6 py-3 rounded-xl glass-panel text-xs font-semibold text-slate-200 hover:text-white hover:border-cyan-400/30 flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4 text-cyan-400" />
            <span>Return Home</span>
          </button>

          <button
            onClick={() => onNavigate({ type: 'auth', mode: 'login' })}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-amber-300 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-400/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            <span>Login Again</span>
          </button>
        </div>
      </div>
    </div>
  );
};
