import { useState, useEffect, useRef } from 'react';
import CreateSession from './Session/Create';
import JoinSession from './Session/Join';
import SiteHeader from './Layout/SiteHeader';
import { Link } from 'react-router-dom';

import PremiumModal from './Premium/PremiumModal';

// Helper for smooth height transitions
const SmoothHeightWrapper = ({ children }) => {
    const contentRef = useRef(null);
    const [height, setHeight] = useState('auto');

    useEffect(() => {
        if (!contentRef.current) return;
        const resizeObserver = new ResizeObserver((entries) => {
            for (let entry of entries) {
                setHeight(entry.contentRect.height);
            }
        });
        resizeObserver.observe(contentRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    return (
        <div
            style={{ height }}
            className="transition-[height] duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]"
        >
            <div ref={contentRef}>{children}</div>
        </div>
    );
};

export default function RoomEntry({ mode, setMode, socket, isConnected, onSessionStart }) {
    const [showPremium, setShowPremium] = useState(false);

    return (
        <div className="min-h-[100dvh] bg-brand-bg w-full flex flex-col font-barlow overflow-x-hidden relative selection:bg-brand-primary selection:text-white">
            {/* Background Visuals */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-brand-primary/20 blur-[120px] rounded-full mix-blend-screen pointer-events-none animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-brand-accent/20 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />

            <SiteHeader />

            <a href="#landing-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-white focus:text-black focus:px-4 focus:py-2">Skip to content</a>
            <main id="landing-content" className="flex-1 flex flex-col items-center justify-center px-6 pb-32 pt-28 relative z-10 w-full max-w-6xl mx-auto md:py-28">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full items-center">

                    {/* Left Column: Hero Text */}
                    <div className="text-center lg:text-left space-y-5 max-w-2xl mx-auto lg:mx-0">
                        <div>
                            <span className="inline-block py-2 px-5 rounded-full bg-white/5 border border-white/10 text-xs md:text-sm font-bold tracking-[0.25em] text-brand-primary uppercase mb-6 animate-fade-in-up shadow-lg shadow-brand-primary/10">
                                Real time. Real fast.
                            </span>
                            <h1 className="text-6xl md:text-8xl font-medium text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-white/40 leading-[0.9] tracking-tight">
                                SYNC <br /> TOGETHER.
                            </h1>
                        </div>

                        <p className="text-lg md:text-xl text-gray-400 font-light max-w-md mx-auto lg:mx-0 leading-relaxed">
                            Watch local videos together with friends. Sync playback or stream from one host. <br />
                            <span className="text-brand-primary font-normal">Live chat. Private rooms. No account needed.</span>
                        </p>

                        {/* Mode Switcher - Sliding Pill Style */}
                        <div className="relative inline-flex p-1 bg-[#0a0a0a] border border-white/10 rounded-full mt-6 shadow-inner overflow-hidden">
                            {/* Sliding Background Pill */}
                            <div
                                className={`absolute top-1 bottom-1 left-1 w-28 rounded-full bg-gradient-to-r from-purple-100 via-white to-purple-100 bg-[length:200%_auto] animate-shine shadow-[0_0_20px_rgba(168,85,247,0.4)] transform transition-transform duration-300 cubic-bezier(0.34, 1.56, 0.64, 1) ${mode === 'create' ? 'translate-x-0' : 'translate-x-[112px]'}`}
                            />

                            {/* Buttons */}
                            <button
                                onClick={() => setMode('create')}
                                aria-pressed={mode === 'create'}
                                className={`relative z-10 w-28 py-3 rounded-full text-sm tracking-widest font-medium transition-colors duration-300 shrink-0 ${mode === 'create' ? 'text-black font-bold' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                HOST
                            </button>
                            <button
                                onClick={() => setMode('join')}
                                aria-pressed={mode === 'join'}
                                className={`relative z-10 w-28 py-3 rounded-full text-sm tracking-widest font-medium transition-colors duration-300 shrink-0 ${mode === 'join' ? 'text-black font-bold' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                JOIN
                            </button>
                        </div>

                    </div>

                    {/* Right Column: Active Card */}
                    <div className="relative w-full max-w-md mx-auto perspective-1000">
                        <div className="absolute inset-0 bg-brand-primary/20 blur-[60px] rounded-full -z-10" />

                        <div className="bg-[#080808]/95 border border-white/10 rounded-[2rem] shadow-2xl ring-1 ring-white/5 transition-all duration-500 hover:shadow-brand-primary/20 overflow-hidden">
                            <SmoothHeightWrapper>
                                {mode === 'create' ? (
                                    <div key="create" className="p-6 sm:p-8 animate-fade-in-fast">
                                        <h2 className="text-2xl text-white mb-6 font-light">Start a session</h2>
                                        <CreateSession socket={socket} isConnected={isConnected} onSessionStart={onSessionStart} />
                                    </div>
                                ) : (
                                    <div key="join" className="p-6 sm:p-8 animate-fade-in-fast">
                                        <h2 className="text-2xl text-white mb-6 font-light">Join a stream</h2>
                                        <JoinSession socket={socket} isConnected={isConnected} onSessionStart={onSessionStart} />
                                    </div>
                                )}
                            </SmoothHeightWrapper>
                        </div>

                        <div className="mt-6 flex justify-center items-center gap-6">
                            <Link to="/" className="text-sm text-white/40 hover:text-white uppercase tracking-widest transition-colors font-bold">
                                About Fliccs
                            </Link>
                            <span className="text-white/10 text-xs">•</span>
                            <button onClick={() => setShowPremium(true)} className="text-sm uppercase tracking-widest font-bold bg-gradient-to-r from-brand-primary via-brand-yellow to-brand-primary bg-[length:200%_auto] text-transparent bg-clip-text animate-shine hover:opacity-80 transition-opacity">
                                Get Premium
                            </button>
                        </div>

                    </div>
                </div>
            </main>

            <PremiumModal isOpen={showPremium} onClose={() => setShowPremium(false)} />
        </div>
    );
}
