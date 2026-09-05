import { useState, useEffect, useRef } from 'react';
import { FaRocket, FaUsers, FaShieldAlt } from 'react-icons/fa';
import CreateSession from './Session/Create';
import JoinSession from './Session/Join';
import ServerStatusTimer from './Session/ServerStatusTimer';
import BrandLogo from './BrandLogo';
import visionImg from '../assets/promo/vision.png';

// Modals
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

// --- EDIT THIS MESSAGE TO CHANGE THE DEVELOPER NOTE ---
const DEVELOPER_MESSAGE = "Hope you guys enjoy the UI overhauls. I'm working on more features and improvements <3";
// ----------------------------------------------------

export default function Landing({ mode, setMode, socket, isConnected, onSessionStart }) {
    // About Modal State Logic
    const [showInfo, setShowInfo] = useState(false);
    const [isAboutRendered, setIsAboutRendered] = useState(false);
    const [isAboutVisible, setIsAboutVisible] = useState(false);

    useEffect(() => {
        if (showInfo) {
            setIsAboutRendered(true);
            setTimeout(() => setIsAboutVisible(true), 50);
        } else {
            setIsAboutVisible(false);
            const timer = setTimeout(() => setIsAboutRendered(false), 300);
            return () => clearTimeout(timer);
        }
    }, [showInfo]);

    const [showPremium, setShowPremium] = useState(false);

    return (
        <div className="min-h-[100dvh] bg-brand-bg w-full flex flex-col font-barlow overflow-x-hidden relative selection:bg-brand-primary selection:text-white">
            {/* Background Visuals */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-brand-primary/20 blur-[120px] rounded-full mix-blend-screen pointer-events-none animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-brand-accent/20 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />

            {/* Header */}
            <header className="fixed top-0 left-0 w-full p-6 flex justify-between items-center z-50">
                <div className="flex items-center gap-3">
                    <BrandLogo size="md" />
                    <div className="flex flex-col">
                        <span className="text-white/50 text-[10px] tracking-[0.2em] font-light leading-none">V3.0</span>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                    <div className="text-[10px] font-mono text-white/40 flex items-center gap-2">
                        {isConnected ? (
                            <>
                                <span className="text-emerald-500/80">● ONLINE</span>
                                <span className="hidden md:inline text-white/10">|</span>
                                <span className="hidden md:inline">ID: {socket?.id?.slice(0, 4)}...</span>
                            </>
                        ) : (
                            <span className="text-red-500/80">● OFFLINE</span>
                        )}
                    </div>
                    {/* Server Status Timer integrated into Header */}
                    <div className="hidden md:block opacity-60 scale-90 origin-right">
                        <ServerStatusTimer />
                    </div>
                </div>
            </header>

            <a href="#landing-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-white focus:text-black focus:px-4 focus:py-2">Skip to content</a>
            <main id="landing-content" className="flex-1 flex flex-col items-center justify-center px-6 pb-32 pt-28 relative z-10 w-full max-w-6xl mx-auto md:py-28">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-8 w-full items-center">

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
                            The best way to watch movies with friends. <br />
                            <span className="text-brand-primary font-normal">No uploads. No accounts. Total privacy.</span>
                        </p>

                        {/* Mode Switcher - Pill Style */}
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
                            <button onClick={() => setShowInfo(true)} className="text-sm text-white/40 hover:text-white uppercase tracking-widest transition-colors font-bold">
                                About
                            </button>
                            <span className="text-white/10 text-xs">•</span>
                            <button onClick={() => setShowPremium(true)} className="text-sm uppercase tracking-widest font-bold bg-gradient-to-r from-brand-primary via-brand-yellow to-brand-primary bg-[length:200%_auto] text-transparent bg-clip-text animate-shine hover:opacity-80 transition-opacity">
                                Get Premium
                            </button>
                        </div>

                    </div>
                </div>
            </main>



            {/* Info Modal */}
            {isAboutRendered && (
                <div
                    className={`fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 transition-opacity duration-300 ${isAboutVisible ? 'opacity-100' : 'opacity-0'}`}
                    onClick={() => setShowInfo(false)}
                >
                    <div
                        className={`bg-[#0a0a0a] border border-white/10 p-0 rounded-[2rem] max-w-4xl w-full mx-auto shadow-[0_0_15px_rgba(255,255,255,0.05)] relative overflow-hidden flex flex-col md:flex-row max-h-[85vh] overflow-y-auto md:overflow-visible transform transition-all duration-300 cubic-bezier(0.34, 1.56, 0.64, 1) ${isAboutVisible ? 'scale-100 translate-y-0 opacity-100' : 'scale-95 translate-y-8 opacity-0'}`}
                        onClick={e => e.stopPropagation()}
                    >

                        {/* Left Side: Visuals */}
                        <div className="relative md:w-1/3 bg-black/50 overflow-hidden min-h-[200px] md:min-h-0 shrink-0">
                            <div className="absolute inset-0 bg-brand-primary/20 blur-[60px] opacity-50" />
                            <img src={visionImg} alt="Vision" className="absolute inset-0 w-full h-full object-cover opacity-90 mix-blend-screen hover:scale-105 transition-transform duration-700" />
                            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0a0a0a] to-transparent md:hidden" />
                        </div>

                        {/* Right Side: Content */}
                        <div className="p-6 md:p-12 md:w-2/3 relative flex flex-col">
                            <button
                                onClick={() => setShowInfo(false)}
                                aria-label="Close about details"
                                className="absolute top-4 right-4 md:top-6 md:right-6 text-white/30 hover:text-white text-2xl transition-all duration-300 transform hover:scale-110 hover:rotate-90 origin-center z-20"
                            >
                                &times;
                            </button>

                            <h2 className="text-3xl md:text-5xl text-white font-medium mb-10 tracking-tight">The Vision.</h2>

                            <div className="space-y-4 text-gray-400 font-light leading-relaxed mb-8">
                                <InfoRow
                                    icon={<FaRocket />}
                                    title="Sync Mode"
                                    desc="Everyone picks the same local file. The server keeps everyone perfectly synchronized."
                                />
                                <InfoRow
                                    icon={<FaUsers />}
                                    title="Stream Mode"
                                    desc="The host streams their local file directly to guests via WebRTC. No downloads required."
                                />
                                <InfoRow
                                    icon={<FaShieldAlt />}
                                    title="Privacy First"
                                    desc="Absolutely no user data is stored. No files specific to your session are uploaded. No accounts needed."
                                />
                            </div>

                            <div className="mt-auto pt-6 border-t border-white/5">
                                <div className="relative group p-6 rounded-2xl bg-gradient-to-b from-white/[0.03] to-transparent border border-white/5 hover:border-brand-primary/20 transition-all duration-500">
                                    <div className="absolute inset-0 bg-brand-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />

                                    <div className="relative z-10 flex flex-col gap-4">
                                        <p className="text-sm text-gray-300 font-light leading-relaxed italic opacity-90">
                                            "{DEVELOPER_MESSAGE}"
                                        </p>

                                        <div className="flex items-center gap-3">
                                            <div className="h-px w-6 bg-brand-primary/40" />
                                            <a
                                                href="https://www.rajinkhan.com/projects/fliccs"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-[10px] uppercase tracking-widest text-brand-primary hover:text-white transition-colors font-bold group-hover:translate-x-1 duration-300"
                                            >
                                                Read the full story
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Premium, Terms, Privacy Modals */}
            <PremiumModal isOpen={showPremium} onClose={() => setShowPremium(false)} />
        </div>
    );
}

function InfoRow({ icon, title, desc }) {
    return (
        <div className="flex gap-5 items-start p-4 rounded-2xl hover:bg-white/5 transition-colors duration-300 group">
            <div className="shrink-0 w-12 h-12 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-xl text-white/50 group-hover:text-brand-primary group-hover:bg-white/10 transition-all duration-300">
                {icon}
            </div>
            <div>
                <h3 className="text-white font-medium text-lg mb-1 group-hover:text-brand-primary transition-colors">{title}</h3>
                <p className="text-sm leading-relaxed opacity-60 group-hover:opacity-90 transition-opacity">{desc}</p>
            </div>
        </div>
    );
}