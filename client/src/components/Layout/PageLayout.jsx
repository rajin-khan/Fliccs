import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import BrandLogo from '../BrandLogo';

export default function PageLayout({ children, title }) {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#050505] w-full flex flex-col font-barlow overflow-x-hidden relative selection:bg-brand-primary selection:text-white">
            {/* Background Visuals - Subtle, Deep */}
            <div className="fixed top-[-20%] left-[-10%] w-[60%] h-[60%] bg-brand-primary/10 rounded-full blur-[100px] pointer-events-none opacity-40 animate-pulse-slow" />
            <div className="fixed bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-brand-accent/10 rounded-full blur-[100px] pointer-events-none opacity-40" />

            {/* Grain Overlay for texture */}
            <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none z-0"></div>

            {/* Header */}
            <header className="fixed top-0 left-0 w-full p-6 flex justify-between items-center z-50">
                <div onClick={() => navigate('/')} className="flex items-center gap-4 cursor-pointer group">
                    <BrandLogo size="md" className="group-hover:opacity-100 transition-opacity opacity-90" />
                    <div className="w-px h-6 bg-white/10 hidden md:block"></div>
                    <span className="text-white/50 text-xs tracking-[0.2em] font-medium uppercase group-hover:text-white transition-colors duration-300">
                        <span className="hidden md:inline">Back to Home</span>
                        <span className="md:hidden">Back</span>
                    </span>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 w-full max-w-5xl mx-auto px-6 pt-28 pb-16 relative z-10 animate-fade-in-up">
                {title && (
                    <div className="mb-8 text-center space-y-3">
                        <h1 className="text-3xl md:text-5xl font-semibold text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/40 tracking-tighter pb-1">
                            {title}
                        </h1>
                        <div className="h-px w-16 bg-gradient-to-r from-transparent via-brand-primary to-transparent mx-auto opacity-50" />
                    </div>
                )}

                <div className="bg-[#0a0a0a] border border-white/10 rounded-[2rem] p-6 md:p-12 shadow-2xl relative overflow-hidden group">
                    {/* Inner Glow */}
                    <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

                    {children}
                </div>
            </main>

            {/* Footer */}
            <footer className="w-full text-center pb-8 z-10 opacity-30 hover:opacity-100 transition-opacity duration-300">
                <p className="text-[10px] text-white/50 uppercase tracking-[0.2em] font-light">
                    &copy; 2026 Fliccs. All rights reserved.
                </p>
            </footer>
        </div>
    );
}
