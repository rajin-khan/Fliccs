import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import StreamRoom from './components/StreamRoom.jsx';
import Landing from './components/Landing.jsx';
import { useSocket } from './hooks/useSocket';
import TermsModal from './components/Legal/TermsModal.jsx';
import PrivacyPolicyModal from './components/Legal/PrivacyPolicyModal.jsx';
import AutoJoinModal from './components/Session/AutoJoinModal.jsx';
import PremiumModal from './components/Premium/PremiumModal.jsx';

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
    const [showTerms, setShowTerms] = useState(false);
    const [showPrivacy, setShowPrivacy] = useState(false);
    const [showPremium, setShowPremium] = useState(false);
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

    // Global Error Display (Toast style)
    const ErrorToast = ({ message }) => (
        message ? (
            <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-[100] animate-fade-in-up">
                <div className="bg-red-500/10 backdrop-blur-md border border-red-500/50 text-red-100 px-6 py-3 rounded-full shadow-2xl flex items-center gap-3">
                    <span>⚠️</span>
                    <span className="text-sm font-medium">{message}</span>
                    <button onClick={() => setAppError(null)} className="ml-2 opacity-50 hover:opacity-100">×</button>
                </div>
            </div>
        ) : null
    );

    return (
        <>
            <ErrorToast message={appError} />

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
                        onSessionStart={(pwd) => setSessionPassword(pwd)}
                    />

                    {/* Footer Links - Absolute position on Landing */}
                    <footer className="fixed bottom-4 w-full text-center pointer-events-none z-50">
                        <div className="pointer-events-auto inline-flex gap-4 md:gap-6 text-[10px] md:text-xs text-white/40 uppercase tracking-widest font-medium bg-[#050505] px-4 md:px-8 py-3 rounded-full border border-white/10 shadow-lg font-barlow items-center flex-wrap justify-center">
                            <span className="font-medium bg-gradient-to-r from-purple-400/60 via-gray-400 to-purple-400/60 bg-[length:200%_auto] text-transparent bg-clip-text animate-shine">Fliccs &bull; 2026</span>
                            <a href="/pricing" className="hover:text-white transition-colors">Pricing</a>
                            <a href="/terms-and-conditions" className="hover:text-white transition-colors">Terms</a>
                            <a href="/privacy" className="hover:text-white transition-colors">Privacy</a>
                            <a href="/refund" className="hover:text-white transition-colors">Refund</a>
                            <a href="https://rajinkhan.com" target="_blank" rel="noopener noreferrer" className="font-la-belle-aurore text-[0.95rem] md:text-[1.05rem] leading-[1.4] px-0.5 bg-gradient-to-r from-gray-400 via-white to-gray-400 bg-[length:200%_auto] text-transparent bg-clip-text animate-shine hover:opacity-80 transition-opacity">Rajin Khan</a>
                        </div>
                    </footer>
                </>
            )}

            <TermsModal isOpen={showTerms} onClose={() => setShowTerms(false)} />
            <PrivacyPolicyModal show={showPrivacy} onClose={() => setShowPrivacy(false)} />
            <PremiumModal isOpen={showPremium} onClose={() => setShowPremium(false)} />

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