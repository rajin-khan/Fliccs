import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import StreamRoom from './components/StreamRoom.jsx';
import Landing from './components/Landing.jsx';
import { useSocket } from './hooks/useSocket';
import AutoJoinModal from './components/Session/AutoJoinModal.jsx';

// Static Pages
import PricingPage from './pages/PricingPage.jsx';
import TermsPage from './pages/TermsPage.jsx';
import PrivacyPage from './pages/PrivacyPage.jsx';
import RefundPage from './pages/RefundPage.jsx';

function MainApp() {
    const { socket, isConnected } = useSocket();
    const [sessionId, setSessionId] = useState(null);
    const [sessionPassword, setSessionPassword] = useState('');
    const [appError, setAppError] = useState(null);
    const [mode, setMode] = useState('create');
    const [participants, setParticipants] = useState([]);
    const [autoJoinParams, setAutoJoinParams] = useState(null);

    const resetSessionState = () => {
        setSessionId(null);
        setSessionPassword('');
        setParticipants([]);
        setAppError(null);
        setAutoJoinParams(null);
    };

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const joinSessionId = urlParams.get('join');
        const joinPassword = urlParams.get('pass');

        if (joinSessionId && joinPassword && !sessionId) {
            setAutoJoinParams({ sessionId: joinSessionId, password: joinPassword });
        }
    }, [sessionId]);

    useEffect(() => {
        if (!socket) return;

        const handleSessionCreated = ({ sessionId: newSessionId }) => {
            setSessionId(newSessionId);
            setAppError(null);
        };

        const handleSessionJoined = ({ sessionId: joinedSessionId }) => {
            setSessionId(joinedSessionId);
            setAppError(null);
        };

        const handleSessionError = ({ error }) => {
            if (error?.includes('does not match the host')) return;
            // Suppress global error if AutoJoinModal is handling it
            if (autoJoinParams) return;
            setAppError(error || 'Something went wrong while joining the session.');
        };

        const handleHostDisconnected = ({ message }) => {
            setAppError(message || 'The session host disconnected.');
            resetSessionState();
        };

        const handleParticipantUpdate = ({ participants }) => {
            setParticipants(participants);
        };

        socket.on('session:created', handleSessionCreated);
        socket.on('session:joined', handleSessionJoined);
        socket.on('session:error', handleSessionError);
        socket.on('session:host_disconnected', handleHostDisconnected);
        socket.on('session:participants', handleParticipantUpdate);

        return () => {
            socket.off('session:created', handleSessionCreated);
            socket.off('session:joined', handleSessionJoined);
            socket.off('session:error', handleSessionError);
            socket.off('session:host_disconnected', handleHostDisconnected);
            socket.off('session:participants', handleParticipantUpdate);
        };
    }, [socket, autoJoinParams]);

    return (
        <>
            {appError && (
                <div role="alert" className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-2rem)] max-w-lg animate-fade-in-up">
                    <div className="bg-red-950/95 backdrop-blur-md border border-red-500/50 text-red-100 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3">
                        <span className="text-sm font-medium flex-1">{appError}</span>
                        <button aria-label="Dismiss error" onClick={() => setAppError(null)} className="h-8 w-8 shrink-0 opacity-70 hover:opacity-100">×</button>
                    </div>
                </div>
            )}

            {sessionId ? (
                <div className="min-h-screen bg-brand-bg text-white font-barlow flex flex-col items-center justify-center">
                    <StreamRoom
                        socket={socket}
                        sessionId={sessionId}
                        sessionPassword={sessionPassword}
                        participants={participants}
                        onLeave={resetSessionState}
                    />
                </div>
            ) : (
                <>
                    <Landing
                        mode={mode}
                        setMode={setMode}
                        socket={socket}
                        isConnected={isConnected}
                        onSessionStart={setSessionPassword}
                    />

                    {/* Footer island */}
                    <footer className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 w-full px-3 text-center pointer-events-none">
                        <div className="pointer-events-auto inline-flex flex-wrap max-w-full items-center justify-center gap-x-4 gap-y-1 rounded-full border border-white/10 bg-[#050505]/95 px-4 py-2.5 text-[10px] font-medium uppercase tracking-widest text-white/40 shadow-lg backdrop-blur-xl font-barlow md:gap-x-6 md:px-8 md:text-xs">
                            <span className="font-medium bg-gradient-to-r from-purple-400/60 via-gray-400 to-purple-400/60 bg-[length:200%_auto] text-transparent bg-clip-text animate-shine">Fliccs &bull; 2026</span>
                            <a href="/pricing" className="hover:text-white transition-colors">Pricing</a>
                            <a href="/terms-and-conditions" className="hover:text-white transition-colors">Terms</a>
                            <a href="/privacy" className="hover:text-white transition-colors">Privacy</a>
                            <a href="/refund" className="hover:text-white transition-colors">Refund</a>
                            <a href="https://rajinkhan.com" target="_blank" rel="noopener noreferrer" className="font-la-belle-aurore inline-flex h-[1.35em] items-center px-0.5 text-[0.76rem] leading-none normal-case bg-gradient-to-r from-gray-400 via-white to-gray-400 bg-[length:200%_auto] text-transparent bg-clip-text animate-shine hover:opacity-80 transition-opacity md:text-[0.86rem]">Rajin Khan</a>
                        </div>
                    </footer>
                </>
            )}


            {autoJoinParams && !sessionId && (
                <AutoJoinModal
                    sessionId={autoJoinParams.sessionId}
                    password={autoJoinParams.password}
                    socket={socket}
                    isConnected={isConnected}
                    onJoin={(pwd) => {
                        setSessionPassword(pwd);
                        setAutoJoinParams(null);
                        const url = new URL(window.location);
                        url.searchParams.delete('join');
                        url.searchParams.delete('pass');
                        window.history.replaceState({}, '', url);
                    }}
                    onCancel={() => {
                        setAutoJoinParams(null);
                        const url = new URL(window.location);
                        url.searchParams.delete('join');
                        url.searchParams.delete('pass');
                        window.history.replaceState({}, '', url);
                    }}
                />
            )}
        </>
    );
}

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<MainApp />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/terms-and-conditions" element={<TermsPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/refund" element={<RefundPage />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;