import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import VideoPlayer from './VideoPlayer';
import Chat from './Chat';
import Participants from './Session/Participants';
import SessionInfo from './Session/Info';
import ConfirmLeaveModal from './Session/ConfirmLeaveModal';
import BrandLogo from './BrandLogo';
import { FaComments, FaUsers, FaArrowLeft, FaTimes } from 'react-icons/fa';

/*
 * Room layout model
 * -----------------
 * The room root owns fullscreen (so chat + participants stay available inside it).
 *
 * Desktop (lg+):  [ stage flex-1 ][ docked panel 340-380px ]
 * Mobile (<lg):   stage (16:9, capped) stacked above the panel; hiding the panel
 *                 gives a full-bleed theater view.
 * Fullscreen:     stage fills everything; the panel becomes a floating glass
 *                 drawer on the right, toggled from the top bar.
 *
 * z-scale: 10 player controls, 20 player badges, 30 top bar, 40 panel overlay, 50 modal.
 */
function StreamRoom({ socket, sessionId, sessionPassword, participants: participantsProp, initialParticipants, onLeave }) {
    const [participants, setParticipants] = useState(initialParticipants || participantsProp || []);
    const [sessionMode, setSessionMode] = useState('sync');
    const [messages, setMessages] = useState([]);
    const [showLeaveModal, setShowLeaveModal] = useState(false);

    // Panel state
    const [panelOpen, setPanelOpen] = useState(true);
    const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'people'
    const [unreadCount, setUnreadCount] = useState(0);

    // Refs mirroring panel state so socket handlers see current values
    const panelOpenRef = useRef(panelOpen);
    const activeTabRef = useRef(activeTab);
    panelOpenRef.current = panelOpen;
    activeTabRef.current = activeTab;

    // Room-level fullscreen
    const roomRef = useRef(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Top bar auto-hide (fullscreen only)
    const [barVisible, setBarVisible] = useState(true);
    const barTimerRef = useRef(null);

    const selfId = socket?.id;
    const hostId = useMemo(() => participants[0]?.id, [participants]);
    const isHost = useMemo(() => selfId === hostId, [selfId, hostId]);

    // --- Session data wiring (unchanged behavior) ---
    useEffect(() => {
        if (!socket) return;
        const handleParticipantsUpdate = ({ participants: updatedParticipants, mode: updatedMode }) => {
            setParticipants(updatedParticipants || []);
            setSessionMode(updatedMode || 'sync');
        };
        socket.on('session:participants', handleParticipantsUpdate);
        if (socket && sessionId) socket.emit('session:request_participants');
        return () => {
            socket.off('session:participants', handleParticipantsUpdate);
        };
    }, [socket, sessionId]);

    useEffect(() => {
        if (!socket) return;
        const handleMessage = (msg) => {
            setMessages((prev) => [...prev, msg]);
            if (msg.senderId !== socket.id && (!panelOpenRef.current || activeTabRef.current !== 'chat')) {
                setUnreadCount((n) => Math.min(n + 1, 99));
            }
        };
        socket.on('chat:message', handleMessage);
        return () => {
            socket.off('chat:message', handleMessage);
        };
    }, [socket]);

    useEffect(() => {
        const handleUnload = () => {
            if (socket?.connected) {
                socket.emit('session:leave');
            }
        };
        window.addEventListener('beforeunload', handleUnload);
        return () => window.removeEventListener('beforeunload', handleUnload);
    }, [socket]);

    // --- Fullscreen ---
    useEffect(() => {
        const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', onFsChange);
        return () => document.removeEventListener('fullscreenchange', onFsChange);
    }, []);

    const toggleFullscreen = useCallback(() => {
        if (!roomRef.current) return;
        if (!document.fullscreenElement) {
            roomRef.current.requestFullscreen().catch((err) => {
                console.error(`Failed to enter fullscreen: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    }, []);

    // Auto-hide the top bar in fullscreen after inactivity
    const pokeBar = useCallback(() => {
        setBarVisible(true);
        if (barTimerRef.current) clearTimeout(barTimerRef.current);
        barTimerRef.current = setTimeout(() => setBarVisible(false), 4000);
    }, []);

    useEffect(() => {
        if (!isFullscreen) {
            setBarVisible(true);
            if (barTimerRef.current) clearTimeout(barTimerRef.current);
            return;
        }
        pokeBar();
        return () => {
            if (barTimerRef.current) clearTimeout(barTimerRef.current);
        };
    }, [isFullscreen, pokeBar]);

    // --- Panel controls ---
    const openTab = useCallback((tab) => {
        if (panelOpen && activeTab === tab) {
            setPanelOpen(false);
            return;
        }
        setActiveTab(tab);
        setPanelOpen(true);
        if (tab === 'chat') setUnreadCount(0);
    }, [panelOpen, activeTab]);

    const switchTab = useCallback((tab) => {
        setActiveTab(tab);
        if (tab === 'chat') setUnreadCount(0);
    }, []);

    // --- Chat send (unchanged behavior) ---
    const sendMessage = (text) => {
        const trimmed = text.trim();
        if (!trimmed || !socket || !sessionId) return;
        const selfUser = participants.find((p) => p.id === selfId);
        const nickname = selfUser?.nickname || 'Me';
        const msg = {
            id: `${selfId}-${Date.now()}`, senderId: selfId, nickname, text: trimmed, timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, msg]);
        socket.emit('chat:message', { sessionId, message: msg });
    };

    const handleConfirmLeave = () => {
        setShowLeaveModal(false);
        if (socket) {
            socket.emit('session:leave');
        }
        onLeave();
    };

    if (!socket || !sessionId || !selfId) {
        return (
            <div className="w-full h-[100dvh] flex items-center justify-center bg-brand-bg font-barlow">
                <div className="flex items-center gap-3 text-white/60">
                    <div className="w-5 h-5 border-2 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin" />
                    <span className="text-sm tracking-wide">Connecting to session...</span>
                </div>
            </div>
        );
    }

    const showDockedPanel = panelOpen && !isFullscreen;
    const showOverlayPanel = panelOpen && isFullscreen;

    const panelBody = (
        <>
            {/* Tab header */}
            <div className="shrink-0 flex items-center border-b border-white/5 bg-white/[0.02]">
                <div className="flex-1 flex">
                    <button
                        onClick={() => switchTab('chat')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-[11px] font-semibold uppercase tracking-[0.15em] transition-colors border-b-2 ${activeTab === 'chat'
                            ? 'text-white border-brand-primary bg-brand-primary/5'
                            : 'text-white/40 border-transparent hover:text-white/70'}`}
                    >
                        <FaComments className="text-xs" />
                        Chat
                        {unreadCount > 0 && activeTab !== 'chat' && (
                            <span className="min-w-[16px] h-4 px-1 rounded-full bg-brand-primary text-white text-[9px] font-bold flex items-center justify-center">
                                {unreadCount}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => switchTab('people')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-[11px] font-semibold uppercase tracking-[0.15em] transition-colors border-b-2 ${activeTab === 'people'
                            ? 'text-white border-brand-primary bg-brand-primary/5'
                            : 'text-white/40 border-transparent hover:text-white/70'}`}
                    >
                        <FaUsers className="text-xs" />
                        People
                        <span className={`text-[10px] font-bold ${activeTab === 'people' ? 'text-brand-primary' : 'text-white/30'}`}>
                            {participants.length}
                        </span>
                    </button>
                </div>
                <button
                    onClick={() => setPanelOpen(false)}
                    title="Hide panel"
                    className="px-4 py-3.5 text-white/30 hover:text-white transition-colors"
                >
                    <FaTimes className="text-xs" />
                </button>
            </div>

            {/* Tab content */}
            <div className="flex-1 min-h-0 flex flex-col">
                {activeTab === 'people' ? (
                    <Participants
                        participants={participants}
                        hostId={hostId}
                        selfId={selfId}
                        sessionId={sessionId}
                        sessionPassword={sessionPassword}
                    />
                ) : (
                    <Chat socket={socket} sessionId={sessionId} messages={messages} sendMessage={sendMessage} />
                )}
            </div>
        </>
    );

    return (
        <>
            <div
                ref={roomRef}
                onMouseMove={isFullscreen ? pokeBar : undefined}
                onTouchStart={isFullscreen ? pokeBar : undefined}
                className={`relative w-full h-[100dvh] bg-brand-bg font-barlow text-white overflow-hidden ${isFullscreen ? 'p-0' : 'p-0 sm:p-3 lg:p-5'}`}
            >
                {/* Ambient background */}
                {!isFullscreen && (
                    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
                        <div className="absolute top-[-15%] left-[-10%] w-[45%] h-[45%] bg-brand-primary/10 blur-[120px] rounded-full" />
                        <div className="absolute bottom-[-15%] right-[-10%] w-[45%] h-[45%] bg-brand-accent/10 blur-[120px] rounded-full" />
                    </div>
                )}

                <div className={`relative flex h-full w-full mx-auto ${isFullscreen ? 'flex-col' : 'flex-col lg:flex-row gap-0 sm:gap-3 lg:gap-4 max-w-[1800px]'}`}>

                    {/* ===== Stage ===== */}
                    <div
                        className={`relative bg-black overflow-hidden min-h-0 ${isFullscreen
                            ? 'flex-1 w-full rounded-none'
                            : `w-full border border-white/10 rounded-none sm:rounded-2xl lg:flex-1 lg:h-full shadow-[0_0_80px_-30px_rgba(100,53,172,0.4)] ${panelOpen ? 'aspect-video max-h-[46dvh] lg:aspect-auto lg:max-h-none' : 'flex-1'}`}`}
                    >
                        {/* Top bar */}
                        <div
                            className={`absolute top-0 left-0 right-0 z-30 flex items-center justify-between gap-2 px-3 sm:px-4 py-3 transition-all duration-300 ${barVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}`}
                        >
                            <div className="absolute inset-0 bg-gradient-to-b from-black/70 to-transparent pointer-events-none" />

                            {/* Left: leave + brand */}
                            <div className="relative flex items-center gap-2 sm:gap-3 min-w-0">
                                <button
                                    onClick={() => setShowLeaveModal(true)}
                                    className="flex items-center gap-2 bg-black/40 backdrop-blur-md border border-white/10 text-[11px] font-semibold tracking-wider text-red-400 hover:text-red-300 hover:border-red-500/30 px-3 sm:px-4 py-2 rounded-full uppercase transition-all active:scale-[0.97] group"
                                >
                                    <FaArrowLeft className="text-[10px] group-hover:-translate-x-0.5 transition-transform" />
                                    <span className="hidden sm:inline">Leave</span>
                                </button>
                                <div className="hidden md:block">
                                    <BrandLogo size="sm" />
                                </div>
                            </div>

                            {/* Right: mode + panel toggles */}
                            <div className="relative flex items-center gap-2">
                                <SessionInfo socket={socket} sessionMode={sessionMode} isHost={isHost} />

                                <div className="w-px h-5 bg-white/10 mx-0.5 hidden sm:block" />

                                <button
                                    onClick={() => openTab('people')}
                                    title="People"
                                    className={`relative flex items-center gap-1.5 h-9 px-3 rounded-full border backdrop-blur-md transition-all active:scale-[0.97] ${panelOpen && activeTab === 'people'
                                        ? 'bg-brand-primary/20 border-brand-primary/40 text-white'
                                        : 'bg-black/40 border-white/10 text-white/60 hover:text-white hover:bg-white/10'}`}
                                >
                                    <FaUsers className="text-xs" />
                                    <span className="text-[11px] font-bold">{participants.length}</span>
                                </button>

                                <button
                                    onClick={() => openTab('chat')}
                                    title="Chat"
                                    className={`relative flex items-center justify-center h-9 w-9 rounded-full border backdrop-blur-md transition-all active:scale-[0.97] ${panelOpen && activeTab === 'chat'
                                        ? 'bg-brand-primary/20 border-brand-primary/40 text-white'
                                        : 'bg-black/40 border-white/10 text-white/60 hover:text-white hover:bg-white/10'}`}
                                >
                                    <FaComments className="text-xs" />
                                    {unreadCount > 0 && (
                                        <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-brand-primary text-white text-[9px] font-bold flex items-center justify-center border border-black">
                                            {unreadCount}
                                        </span>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Player */}
                        <VideoPlayer
                            socket={socket}
                            sessionId={sessionId}
                            sessionMode={sessionMode}
                            isHost={isHost}
                            participants={participants}
                            selfId={selfId}
                            isFullscreen={isFullscreen}
                            onToggleFullscreen={toggleFullscreen}
                        />
                    </div>

                    {/* ===== Docked panel (desktop column / mobile lower section) ===== */}
                    {showDockedPanel && (
                        <aside className="flex flex-col flex-1 min-h-0 w-full bg-[#05050d] border-t border-white/10 sm:border sm:rounded-2xl lg:flex-none lg:w-[340px] xl:w-[380px] lg:h-full overflow-hidden">
                            {panelBody}
                        </aside>
                    )}
                </div>

                {/* ===== Fullscreen overlay panel ===== */}
                {showOverlayPanel && (
                    <aside className="absolute z-40 right-2 sm:right-4 top-2 sm:top-4 bottom-2 sm:bottom-4 w-[min(92vw,380px)] flex flex-col rounded-2xl border border-white/10 bg-[#05050d]/90 backdrop-blur-xl shadow-2xl overflow-hidden animate-fade-in">
                        {panelBody}
                    </aside>
                )}
            </div>

            <ConfirmLeaveModal
                isOpen={showLeaveModal}
                onCancel={() => setShowLeaveModal(false)}
                onConfirm={handleConfirmLeave}
            />
        </>
    );
}

export default StreamRoom;
