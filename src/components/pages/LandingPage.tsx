import React from 'react';
import {
  ArrowRight,
  BookOpen,
  Feather,
  Sparkles,
  Users,
  Compass,
  Heart,
  MessageSquare,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';
import { HeroScene3D } from '../canvas/HeroScene3D';
import { BRANDING } from '../../config/branding';
import { PageRoute } from '../../types';

interface LandingPageProps {
  onNavigate: (route: PageRoute) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const scrollToFeatures = () => {
    const el = document.getElementById('platform-features');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative min-h-screen bg-ambient-mesh overflow-hidden">
      {/* 3D Hero Canvas Background */}
      <HeroScene3D interactive={true} />

      {/* Hero Section */}
      <section className="relative z-10 min-h-[92vh] flex flex-col items-center justify-center text-center px-4 sm:px-6 pt-12 pb-20 max-w-5xl mx-auto">
        {/* Subtle community badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-panel border border-cyan-500/30 text-cyan-300 text-xs font-mono-code mb-8 shadow-lg shadow-cyan-500/10 animate-in fade-in slide-in-from-top-4 duration-700">
          <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin" style={{ animationDuration: '6s' }} />
          <span>A Social Sanctuary for Deep Thought & Literature</span>
        </div>

        {/* Website Name */}
        <h2 className="font-brand text-sm sm:text-base tracking-[0.3em] uppercase text-cyan-400 font-semibold mb-4">
          {BRANDING.name}
        </h2>

        {/* Hero Headline */}
        <h1 className="font-editorial text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white max-w-4xl leading-[1.1] mb-6">
          Every Voice Has a Story.{' '}
          <span className="text-gradient-cyan block sm:inline">
            Every Story Deserves to Be Heard.
          </span>
        </h1>

        {/* Supporting description */}
        <p className="text-base sm:text-xl text-slate-300 max-w-2xl font-light leading-relaxed mb-10">
          {BRANDING.description}
        </p>

        {/* Main CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <button
            onClick={() => onNavigate({ type: 'auth', mode: 'register' })}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-400 via-cyan-300 to-amber-300 text-slate-950 font-bold text-base shadow-xl shadow-cyan-400/25 hover:shadow-cyan-400/40 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 group"
          >
            <span>GET STARTED</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={scrollToFeatures}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl glass-panel text-slate-200 font-semibold text-base hover:text-white hover:bg-white/10 hover:border-cyan-400/30 transition-all flex items-center justify-center gap-2"
          >
            <span>LEARN MORE</span>
            <ChevronDown className="w-4 h-4 text-cyan-400" />
          </button>
        </div>

        {/* Stats Strip */}
        <div className="mt-16 sm:mt-20 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 w-full max-w-3xl">
          {[
            { label: 'Long-Form Focus', val: '100% Unrushed' },
            { label: 'Curated Categories', val: '8+ Editorial Niches' },
            { label: 'Interactive Social', val: 'Likes & Discussions' },
            { label: 'Modern Privacy', val: 'Zero Algorithm Noise' },
          ].map((item, idx) => (
            <div
              key={idx}
              className="glass-panel p-4 rounded-2xl border border-white/5 text-center"
            >
              <div className="text-xs text-slate-400 font-mono-code mb-1">{item.label}</div>
              <div className="text-sm sm:text-base font-bold text-white tracking-wide">
                {item.val}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Platform Features Section */}
      <section
        id="platform-features"
        className="relative z-10 py-24 px-4 sm:px-6 max-w-6xl mx-auto border-t border-white/10"
      >
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs uppercase font-mono-code tracking-widest text-cyan-400">
            The Experience
          </span>
          <h2 className="font-editorial text-3xl sm:text-4xl font-bold text-white mt-2 mb-4">
            Where Instagram’s Social Chemistry Meets The Atlantic’s Editorial Depth
          </h2>
          <p className="text-slate-400 text-sm sm:text-base">
            Engineered for readers who appreciate nuanced perspective and writers eager to share their craft.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {/* Feature 1 */}
          <div className="glass-panel p-8 rounded-3xl border border-white/10 hover:border-cyan-400/40 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center text-cyan-300 mb-6 group-hover:scale-110 transition-transform">
              <Feather className="w-6 h-6" />
            </div>
            <h3 className="font-editorial text-xl font-bold text-white mb-3">
              Distraction-Free Editorial Studio
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Format typography with markdown or rich tools, embed cover photography, structure headings, and save drafts until your piece is pristine.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="glass-panel p-8 rounded-3xl border border-white/10 hover:border-amber-400/40 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center text-amber-300 mb-6 group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="font-editorial text-xl font-bold text-white mb-3">
              Social Community & Audiences
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Build your personal readership. Follow fellow essayists, discuss themes in threaded comments, like articles, and curate personal bookmarks.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="glass-panel p-8 rounded-3xl border border-white/10 hover:border-cyan-400/40 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center text-cyan-300 mb-6 group-hover:scale-110 transition-transform">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="font-editorial text-xl font-bold text-white mb-3">
              Digital Magazine Aesthetics
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Every story renders like an upscale physical periodical with comfortable line-height, estimated reading times, and dynamic progress tracking.
            </p>
          </div>
        </div>

        {/* Bottom CTA Card */}
        <div className="mt-16 rounded-3xl glass-card-gold p-8 sm:p-12 text-center relative overflow-hidden">
          <div className="relative z-10 max-w-2xl mx-auto">
            <h3 className="font-editorial text-2xl sm:text-3xl font-bold text-white mb-4">
              Ready to Share Your First Story?
            </h3>
            <p className="text-slate-300 text-sm sm:text-base mb-8">
              Join Soumil’s Blog today. Publish without gatekeepers, discover captivating authors, and cultivate your voice.
            </p>
            <button
              onClick={() => onNavigate({ type: 'auth', mode: 'register' })}
              className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-300 via-amber-200 to-cyan-300 text-slate-950 font-bold text-sm shadow-xl hover:scale-105 active:scale-95 transition-all"
            >
              Create Your Free Account
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-8 px-4 border-t border-white/5 text-center text-xs text-slate-500 font-mono-code">
        <p>
          © {BRANDING.year} {BRANDING.name}. Created with passion for thoughtful prose and human connection.
        </p>
      </footer>
    </div>
  );
};
