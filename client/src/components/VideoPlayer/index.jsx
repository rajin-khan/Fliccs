import React, { useRef, useState, useEffect, useCallback } from 'react';
import ReactPlayer from 'react-player';
import useVideoSync from './useVideoSync';
import useWebRTC from '../../hooks/useWebRTC';
import { calculateFileHash } from '../../utils/fileHash.js';
import PlayerControls from './PlayerControls';
import BrandLogo from '../BrandLogo';

function VideoPlayer({
    socket,
    sessionId,
    sessionMode,
    isHost,
    participants,
    selfId
}) {
    // Get host nickname for display
    const hostParticipant = participants.find(p => participants.indexOf(p) === 0);
    const hostName = hostParticipant?.nickname || 'Host';
    const playerRef = useRef(null);
    const playerWrapperRef = useRef(null);
    const videoElementRef = useRef(null);
    const guestVideoRef = useRef(null);
    const seekingRef = useRef(false);
    const isUserControllingRef = useRef(false);

    // State for the player's UI and functionality
    const [playerState, setPlayerState] = useState({
        isPlaying: false,
        volume: 0.8,
        isMuted: false,
        playedSeconds: 0,
        loadedSeconds: 0,
        duration: 0,
    });
    const [isFullscreen, setIsFullscreen] = useState(false);

    // State for file handling
    const [localVideoURL, setLocalVideoURL] = useState(null);
    const [fileName, setFileName] = useState('');
    const [fileHash, setFileHash] = useState(null);
    const [fileStatus, setFileStatus] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [isPlayerReady, setIsPlayerReady] = useState(false);

    // State specifically for guests to handle browser autoplay policies
    const [isGuestMuted, setIsGuestMuted] = useState(true);
    const [showControls, setShowControls] = useState(true);
    const controlsTimeoutRef = useRef(null);

    // Custom Hooks
    const { remoteStream, startStreaming, stopStreaming, isStreamingActive, webRTCError } = useWebRTC({
        socket, sessionId, isHost, sessionMode, participants, selfId,
        localStreamSourceElement: videoElementRef.current
    });

    const { syncLock, emitSyncAction } = useVideoSync({
        socket, sessionId, playerRef, sessionMode
    });

    // --- Player Control Handlers ---

    const handlePlayPause = useCallback(() => {
        if (syncLock.current) return;
        isUserControllingRef.current = true;
        setPlayerState(prev => {
            const newIsPlaying = !prev.isPlaying;
            if (sessionMode === 'sync') {
                emitSyncAction(newIsPlaying ? 'play' : 'pause', playerRef.current?.getCurrentTime());
            }
            return { ...prev, isPlaying: newIsPlaying };
        });
        // Reset flag after a short delay to allow ReactPlayer to process the change
        setTimeout(() => {
            isUserControllingRef.current = false;
        }, 100);
    }, [sessionMode, syncLock, emitSyncAction]);

    const handleVolumeChange = (newVolume) => {
        setPlayerState(prev => ({ ...prev, volume: newVolume, isMuted: newVolume === 0 }));
    };

    const handleMuteToggle = () => {
        setPlayerState(prev => ({ ...prev, isMuted: !prev.isMuted }));
    };

    const handleSeek = (seconds) => {
        if (sessionMode === 'sync' || isHost) {
            setPlayerState(prev => ({ ...prev, playedSeconds: seconds }));
            playerRef.current.seekTo(seconds, 'seconds');
        }
    };

    const handleSeekMouseDown = () => {
        if (sessionMode === 'sync' || isHost) {
            seekingRef.current = true;
        }
    };

    const handleSeekMouseUp = () => {
        if (sessionMode === 'sync' || isHost) {
            seekingRef.current = false;
            if (sessionMode === 'sync') {
                emitSyncAction('seek', playerState.playedSeconds);
            }
        }
    };

    const handleSkipForward = useCallback(() => {
        if (syncLock.current) return;
        setPlayerState(prev => {
            const newTime = Math.min(prev.playedSeconds + 10, prev.duration || 0);
            if (playerRef.current) {
                playerRef.current.seekTo(newTime, 'seconds');
            }
            if (sessionMode === 'sync') {
                emitSyncAction('seek', newTime);
            }
            return { ...prev, playedSeconds: newTime };
        });
    }, [sessionMode, syncLock, emitSyncAction]);

    const handleSkipBackward = useCallback(() => {
        if (syncLock.current) return;
        setPlayerState(prev => {
            const newTime = Math.max(prev.playedSeconds - 10, 0);
            if (playerRef.current) {
                playerRef.current.seekTo(newTime, 'seconds');
            }
            if (sessionMode === 'sync') {
                emitSyncAction('seek', newTime);
            }
            return { ...prev, playedSeconds: newTime };
        });
    }, [sessionMode, syncLock, emitSyncAction]);

    const handleProgress = (state) => {
        if (!seekingRef.current) {
            setPlayerState(prev => ({ ...prev, playedSeconds: state.playedSeconds, loadedSeconds: state.loadedSeconds }));
        }
    };

    // Auto-hide controls after 5 seconds of inactivity
    const resetControlsTimer = useCallback(() => {
        setShowControls(true);
        if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current);
        }
        controlsTimeoutRef.current = setTimeout(() => {
            setShowControls(false);
        }, 5000);
    }, []);

    useEffect(() => {
        // Auto-hide controls after 5 seconds in all modes
        resetControlsTimer();

        return () => {
            if (controlsTimeoutRef.current) {
                clearTimeout(controlsTimeoutRef.current);
            }
        };
    }, [resetControlsTimer]);

    // Reset timer on mouse movement or interaction
    const handlePlayerInteraction = useCallback(() => {
        resetControlsTimer();
    }, [resetControlsTimer]);

    const handleDuration = (duration) => {
        setPlayerState(prev => ({ ...prev, duration }));
    };

    const handleToggleFullscreen = () => {
        if (!playerWrapperRef.current) return;
        if (!document.fullscreenElement) {
            playerWrapperRef.current.requestFullscreen().catch(err => {
                console.error(`Failed to enter fullscreen: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    };

    // --- Effects ---

    useEffect(() => {
        const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', onFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
    }, []);

    useEffect(() => {
        if (sessionMode !== 'sync' || !socket) return;
        const handleFileStatus = ({ status }) => {
            if (status === 'matched') { setFileStatus('matched'); setErrorMessage(''); }
            else if (status === 'mismatched') { setFileStatus('mismatched'); setErrorMessage("File does not match the host's file."); }
        };
        socket.on('sync:fileStatus', handleFileStatus);
        return () => { socket.off('sync:fileStatus', handleFileStatus); };
    }, [socket, sessionMode]);

    useEffect(() => {
        if (!isHost) return;
        let startStreamTimeoutId = null;
        if (sessionMode === 'stream' && isPlayerReady && localVideoURL && videoElementRef.current && !isStreamingActive) {
            startStreamTimeoutId = setTimeout(() => { startStreaming(); }, 200);
        } else if (sessionMode === 'sync' && isStreamingActive) {
            stopStreaming();
        }
        return () => { if (startStreamTimeoutId) { clearTimeout(startStreamTimeoutId); } }
    }, [sessionMode, isHost, isPlayerReady, localVideoURL, startStreaming, stopStreaming, isStreamingActive]);

    const handleFileChange = useCallback(async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Reset all relevant states
        setLocalVideoURL(null);
        setIsPlayerReady(false);
        setFileName('');
        setFileHash(null);
        setFileStatus(null);
        setErrorMessage('');
        setPlayerState(prev => ({ ...prev, isPlaying: false, playedSeconds: 0, loadedSeconds: 0, duration: 0 }));

        // ** FIX: Auto-play for host in stream mode to enable captureStream **
        if (isHost && sessionMode === 'stream') {
            setPlayerState(prev => ({ ...prev, isPlaying: true }));
        }

        setFileName(file.name);
        setTimeout(() => {
            const url = URL.createObjectURL(file);
            setLocalVideoURL(url);
            if (sessionMode === 'sync') {
                setFileStatus('pending');
                calculateFileHash(file).then(hash => {
                    setFileHash(hash);
                    if (socket?.connected) { socket.emit('sync:fileSelected', { sessionId, hash }); }
                }).catch(err => {
                    console.error("Error hashing file:", err);
                    setErrorMessage("Error processing file.");
                    setFileStatus(null);
                });
            }
        }, 50);
    }, [socket, sessionId, sessionMode, isHost]);

    const handlePlayerReady = useCallback((playerInstance) => {
        setIsPlayerReady(true);
        try {
            if (playerInstance?.getInternalPlayer) {
                const internalPlayer = playerInstance.getInternalPlayer();
                if (internalPlayer && internalPlayer instanceof HTMLMediaElement) {
                    videoElementRef.current = internalPlayer;
                    if (typeof internalPlayer.setAttribute === 'function') {
                        internalPlayer.setAttribute('playsinline', 'true');
                    }
                } else { videoElementRef.current = null; }
            } else { videoElementRef.current = null; }
        } catch (error) {
            console.error("[VideoPlayer] Error in onReady handler:", error);
            setIsPlayerReady(false);
            videoElementRef.current = null;
        }
    }, []);

    // Guest stream arrived — don't leave the LOADING overlay up if onReady is slow/missing
    useEffect(() => {
        if (!isHost && remoteStream) {
            setIsPlayerReady(true);
        }
    }, [isHost, remoteStream]);

    // Bind WebRTC MediaStream with a native <video> — ReactPlayer often never fires onReady for streams
    useEffect(() => {
        const el = guestVideoRef.current;
        if (!el || !remoteStream || isHost) return;

        el.srcObject = remoteStream;
        el.muted = isGuestMuted;
        const tryPlay = () => {
            el.play().catch((err) => {
                console.warn('[VideoPlayer] Guest autoplay failed:', err?.message || err);
            });
        };
        tryPlay();

        const onPlaying = () => setIsPlayerReady(true);
        el.addEventListener('playing', onPlaying);
        el.addEventListener('loadedmetadata', onPlaying);

        return () => {
            el.removeEventListener('playing', onPlaying);
            el.removeEventListener('loadedmetadata', onPlaying);
            if (el.srcObject === remoteStream) {
                el.srcObject = null;
            }
        };
    }, [remoteStream, isHost]);

    useEffect(() => {
        const el = guestVideoRef.current;
        if (el) el.muted = isGuestMuted;
    }, [isGuestMuted]);

    useEffect(() => {
        const el = guestVideoRef.current;
        if (!el || isHost || !remoteStream) return;
        el.volume = playerState.volume;
    }, [playerState.volume, isHost, remoteStream]);

    const handlePlayerError = useCallback((error, data) => {
        console.error("[VideoPlayer] ReactPlayer Error:", error, data);
        let specificError = error?.message || JSON.stringify(error);
        if (typeof error === 'object' && error !== null && 'type' in error) { specificError = `Type: ${error.type}`; }
        setErrorMessage(`Video playback error: ${specificError}`);
        setIsPlayerReady(false);
        if (isHost && isStreamingActive) { stopStreaming(); }
    }, [isHost, isStreamingActive, stopStreaming]);

    const getStatusBadge = () => {
        if (sessionMode !== 'sync') return null;
        switch (fileStatus) {
            case 'matched': return <span className="text-[10px] bg-green-500/10 text-green-400 px-1.5 py-0.5 rounded border border-green-500/20">MATCH</span>;
            case 'mismatched': return <span className="text-[10px] bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded border border-red-500/20">MISMATCH</span>;
            case 'pending': return <span className="text-[10px] text-yellow-400">•••</span>;
            default: return null;
        }
    };

    // --- Render Logic ---
    const showFileInput = sessionMode === 'sync' || (sessionMode === 'stream' && isHost);
    // Guests should use remoteStream as soon as it arrives — don't wait for sessionMode
    // to flip to 'stream' (that update can lag behind WebRTC ontrack).
    const isGuestLiveStream = !isHost && !!remoteStream;
    const videoSource = isGuestLiveStream ? remoteStream : localVideoURL;
    const showPlayerContainer =
        (sessionMode === 'sync' && localVideoURL) ||
        (sessionMode === 'stream' && isHost && localVideoURL) ||
        (sessionMode === 'stream' && !isHost) ||
        isGuestLiveStream;
    const showReactPlayer = videoSource !== null && !isGuestLiveStream;
    const showGuestStream = isGuestLiveStream;

    return (
        <div className="w-full h-full flex flex-col items-center justify-center font-barlow text-white px-2">
            {/* Desktop File Input (Above Player) */}
            {showFileInput && (
                <div className="hidden lg:block w-full max-w-2xl mb-6 z-30 animate-fade-in-up">
                    <div className="bg-[#0a0a0a]/90 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative group hover:border-brand-primary/30 transition-all duration-300">
                        <div className="absolute inset-0 bg-brand-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                        {!fileName ? (
                            <div className="p-1">
                                <label className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-white/10 hover:border-brand-primary/50 hover:bg-white/5 cursor-pointer transition-all duration-300 group/drop">
                                    <div className="w-10 h-10 shrink-0 rounded-lg bg-brand-primary/10 flex items-center justify-center group-hover/drop:scale-110 transition-transform duration-300 shadow-[0_0_15px_-5px_rgba(100,53,172,0.3)]">
                                        <span className="text-xl filter drop-shadow-lg">📂</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-white font-bold text-sm tracking-tight group-hover/drop:text-brand-primary transition-colors">Select Video File</h3>
                                        <p className="text-gray-400 text-[10px] truncate">Tap to browse local files</p>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 group-hover/drop:bg-brand-primary group-hover/drop:text-white transition-all">
                                        <span className="text-xs">➜</span>
                                    </div>
                                    <input type="file" accept="video/*" onChange={handleFileChange} className="hidden" key={`${sessionMode}-${fileName}`} />
                                </label>
                            </div>
                        ) : (
                            <div className="p-4 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-brand-primary/20 flex items-center justify-center text-2xl shrink-0">
                                    🎬
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-white font-medium truncate" title={fileName}>{fileName}</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        {sessionMode === 'sync' && getStatusBadge()}
                                        {sessionMode === 'sync' && (
                                            <p className="text-[10px] text-gray-500 font-mono">
                                                {fileHash ? `#${fileHash.slice(0, 8)}` : 'Hash Pending...'}
                                            </p>
                                        )}
                                        {sessionMode === 'stream' && (
                                            <p className="text-[10px] text-brand-primary/70 uppercase tracking-wider">Broadcasting</p>
                                        )}
                                    </div>
                                </div>
                                <label className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-white cursor-pointer transition-colors shrink-0">
                                    Change
                                    <input type="file" accept="video/*" onChange={handleFileChange} className="hidden" />
                                </label>
                            </div>
                        )}

                        {/* Error Message Footer */}
                        {sessionMode === 'sync' && fileStatus === 'mismatched' && (
                            <div className="bg-red-500/10 border-t border-red-500/20 px-4 py-2 text-xs text-red-300 text-center font-medium flex items-center justify-center gap-2">
                                <span>⚠️</span> {errorMessage}
                            </div>
                        )}
                    </div>
                </div>
            )}
            {(errorMessage || webRTCError) && (
                <div className="w-full max-w-md my-4 text-center text-red-300 text-sm font-medium bg-red-950/50 border border-red-500/30 rounded-xl p-4 shadow-lg backdrop-blur-sm">
                    <p>⚠️ {webRTCError || errorMessage}</p>
                </div>
            )}

            <div ref={playerWrapperRef} className={`relative bg-black flex items-center justify-center group overflow-hidden transition-all duration-300 ${isFullscreen ? 'w-full h-full rounded-none' : 'w-full max-w-6xl aspect-video rounded-[2.5rem] border border-white/10 shadow-[0_0_80px_-20px_rgba(0,0,0,0.8)] ring-1 ring-white/5'}`}>
                {/* Ambient Player Glow */}
                <div className="absolute inset-0 bg-brand-primary/5 pointer-events-none opacity-50" />

                {showPlayerContainer ? (
                    showGuestStream ? (
                        <>
                            <video
                                ref={guestVideoRef}
                                autoPlay
                                playsInline
                                muted={isGuestMuted}
                                className="w-full h-full object-contain bg-black"
                                style={{ borderRadius: isFullscreen ? '0px' : '2.5rem' }}
                            />

                            {!isPlayerReady && !webRTCError && (
                                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm rounded-[2.5rem]">
                                    <div className="w-10 h-10 border-2 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin mb-3"></div>
                                    <span className="text-xs font-medium text-white/50 tracking-wider">LOADING VIDEO...</span>
                                </div>
                            )}

                            <div className={`absolute top-6 left-6 z-20 transition-all duration-300 ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>
                                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 border border-green-500/20 backdrop-blur-md shadow-sm">
                                    <div className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                    </div>
                                    <span className="text-[10px] font-medium text-white/90 tracking-widest uppercase">
                                        LIVE <span className="mx-1 text-white/20">|</span> {hostName}
                                    </span>
                                </div>
                            </div>

                            <div className={`absolute top-6 right-6 z-20 transition-all duration-300 ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>
                                <div className="bg-black/60 backdrop-blur-md border border-brand-primary/30 rounded-full px-3 py-1.5 shadow-lg flex items-center justify-center">
                                    <BrandLogo size="sm" />
                                </div>
                            </div>

                            <div
                                className={`absolute inset-0 z-10 flex flex-col justify-end transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 cursor-none'}`}
                                onMouseMove={handlePlayerInteraction}
                                onMouseEnter={handlePlayerInteraction}
                                onClick={handlePlayerInteraction}
                            >
                                <div className={`${showControls ? 'pointer-events-auto' : 'pointer-events-none'}`}>
                                    <PlayerControls
                                        isPlaying={true}
                                        onPlayPause={() => {
                                            const el = guestVideoRef.current;
                                            if (!el) return;
                                            if (el.paused) el.play().catch(() => {});
                                            else el.pause();
                                        }}
                                        volume={playerState.volume}
                                        onVolumeChange={handleVolumeChange}
                                        isMuted={isGuestMuted}
                                        onMuteToggle={() => setIsGuestMuted(!isGuestMuted)}
                                        playedSeconds={0}
                                        loadedSeconds={0}
                                        duration={0}
                                        onSeek={() => {}}
                                        onSeekMouseDown={() => {}}
                                        onSeekMouseUp={() => {}}
                                        onSkipForward={() => {}}
                                        onSkipBackward={() => {}}
                                        isHost={false}
                                        sessionMode="stream"
                                        isFullscreen={isFullscreen}
                                        onToggleFullscreen={handleToggleFullscreen}
                                    />
                                </div>
                            </div>
                        </>
                    ) : showReactPlayer ? (
                        <>
                            <ReactPlayer
                                ref={playerRef}
                                url={videoSource}
                                width="100%"
                                height="100%"
                                playing={sessionMode === 'stream' && !isHost ? true : playerState.isPlaying}
                                volume={playerState.volume}
                                muted={sessionMode === 'stream' && !isHost ? isGuestMuted : playerState.isMuted}
                                onReady={handlePlayerReady}
                                onError={handlePlayerError}
                                onPlay={() => {
                                    if (!isUserControllingRef.current && !syncLock.current) {
                                        setPlayerState(p => ({ ...p, isPlaying: true }));
                                    }
                                }}
                                onPause={() => {
                                    if (!isUserControllingRef.current && !syncLock.current) {
                                        setPlayerState(p => ({ ...p, isPlaying: false }));
                                    }
                                }}
                                onProgress={handleProgress}
                                onDuration={handleDuration}
                                playsInline={true}
                                config={{ file: { attributes: { playsInline: true } } }}
                                style={{ borderRadius: isFullscreen ? '0px' : '2.5rem', overflow: 'hidden' }}
                                controls={false}
                            />

                            {/* Loading Overlay */}
                            {!isPlayerReady && !webRTCError && (
                                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm rounded-[2.5rem]">
                                    <div className="w-10 h-10 border-2 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin mb-3"></div>
                                    <span className="text-xs font-medium text-white/50 tracking-wider">LOADING VIDEO...</span>
                                </div>
                            )}

                            {/* File Info Overlay (Active) - Mobile Only */}
                            {showFileInput && localVideoURL && (
                                <div className={`lg:hidden absolute top-20 left-1/2 transform -translate-x-1/2 z-30 transition-all duration-300 ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>
                                    <div className="flex items-center gap-3 bg-black/60 backdrop-blur-md border border-white/10 pr-2 pl-4 py-1.5 rounded-full shadow-lg">
                                        <div className="flex flex-col items-start min-w-0">
                                            <span className="text-[10px] font-bold text-white max-w-[120px] truncate">{fileName}</span>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[9px] text-gray-400 font-mono">
                                                    {sessionMode === 'sync'
                                                        ? (fileHash ? `#${fileHash.slice(0, 8)}` : '...')
                                                        : 'LIVE'}
                                                </span>
                                                {sessionMode === 'sync' && fileStatus === 'mismatched' && (
                                                    <span className="text-[8px] bg-red-500/20 text-red-400 px-1 rounded border border-red-500/20">MISMATCH</span>
                                                )}
                                            </div>
                                        </div>
                                        <label className="shrink-0 text-[10px] bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-full cursor-pointer transition-colors border border-white/5">
                                            Change
                                            <input type="file" accept="video/*" onChange={handleFileChange} className="hidden" />
                                        </label>
                                    </div>
                                </div>
                            )}

                            {/* Stream Guest Overlay */}
                            {sessionMode === 'stream' && !isHost && (
                                <div className={`absolute top-6 left-6 z-20 transition-all duration-300 ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>
                                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 border border-green-500/20 backdrop-blur-md shadow-sm">
                                        <div className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                        </div>
                                        <span className="text-[10px] font-medium text-white/90 tracking-widest uppercase">
                                            LIVE <span className="mx-1 text-white/20">|</span> {hostName}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Logo Overlay */}
                            <div className={`absolute top-6 right-6 z-20 transition-all duration-300 ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>
                                <div className="bg-black/60 backdrop-blur-md border border-brand-primary/30 rounded-full px-3 py-1.5 shadow-lg flex items-center justify-center">
                                    <BrandLogo size="sm" />
                                </div>
                            </div>

                            {/* Controls Overlay */}
                            <div
                                className={`absolute inset-0 z-10 flex flex-col justify-end transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 cursor-none'}`}
                                onMouseMove={handlePlayerInteraction}
                                onMouseEnter={handlePlayerInteraction}
                                onClick={handlePlayerInteraction}
                            >
                                <div className={`${showControls ? 'pointer-events-auto' : 'pointer-events-none'}`}>
                                    <PlayerControls
                                        isPlaying={playerState.isPlaying}
                                        onPlayPause={handlePlayPause}
                                        volume={playerState.volume}
                                        onVolumeChange={handleVolumeChange}
                                        isMuted={sessionMode === 'stream' && !isHost ? isGuestMuted : playerState.isMuted}
                                        onMuteToggle={sessionMode === 'stream' && !isHost ? () => setIsGuestMuted(!isGuestMuted) : handleMuteToggle}
                                        playedSeconds={playerState.playedSeconds}
                                        loadedSeconds={playerState.loadedSeconds}
                                        duration={playerState.duration}
                                        onSeek={handleSeek}
                                        onSeekMouseDown={(e) => {
                                            handleSeekMouseDown();
                                            resetControlsTimer(); // Keep controls visible while seeking
                                        }}
                                        onSeekMouseUp={handleSeekMouseUp}
                                        onSkipForward={handleSkipForward}
                                        onSkipBackward={handleSkipBackward}
                                        isHost={isHost}
                                        sessionMode={sessionMode}
                                        isFullscreen={isFullscreen}
                                        onToggleFullscreen={handleToggleFullscreen}
                                    />
                                </div>
                            </div>
                        </>
                    ) : (
                        !webRTCError && sessionMode === 'stream' && !isHost ? (
                            <div className="flex flex-col items-center gap-6 p-8 animate-pulse">
                                <div className="w-20 h-20 rounded-full border-2 border-brand-primary/20 border-t-brand-primary animate-spin"></div>
                                <div className="text-center space-y-2">
                                    <p className="text-white text-lg font-medium tracking-wide">Establishing Connection...</p>
                                    <p className="text-brand-primary/60 text-sm uppercase tracking-widest">Waiting for host stream</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-4 text-gray-400">
                                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                                    <span className="text-2xl">⏳</span>
                                </div>
                                <p className="text-sm">Initializing Player...</p>
                            </div>
                        )
                    )
                ) : (
                    <>
                        {showFileInput && !localVideoURL && (
                            <div className="w-full max-w-sm px-4 relative z-10 animate-fade-in-up lg:hidden">
                                <div className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl group hover:border-brand-primary/30 transition-all duration-300">
                                    <div className="p-1">
                                        <label className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-white/10 hover:border-brand-primary/50 hover:bg-white/5 cursor-pointer transition-all duration-300 group/drop">
                                            <div className="w-10 h-10 shrink-0 rounded-lg bg-brand-primary/10 flex items-center justify-center group-hover/drop:scale-110 transition-transform duration-300 shadow-[0_0_15px_-5px_rgba(100,53,172,0.3)]">
                                                <span className="text-xl filter drop-shadow-lg">📂</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-white font-bold text-sm tracking-tight group-hover/drop:text-brand-primary transition-colors">Select Video File</h3>
                                                <p className="text-gray-400 text-[10px] truncate">Tap to browse local files</p>
                                            </div>
                                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 group-hover/drop:bg-brand-primary group-hover/drop:text-white transition-all">
                                                <span className="text-xs">➜</span>
                                            </div>
                                            <input type="file" accept="video/*" onChange={handleFileChange} className="hidden" />
                                        </label>
                                    </div>
                                </div>
                                <div className="mt-4 text-center">
                                    <p className="text-gray-500 text-[10px] max-w-[200px] mx-auto leading-relaxed">
                                        {sessionMode === 'stream' ? 'Select a file to start broadcasting.' : 'Choose a file to sync with the room.'}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Desktop Empty State Placeholder (Select Video Instruction) */}
                        {sessionMode === 'sync' && !localVideoURL && (
                            <div className="hidden lg:flex flex-col items-center gap-5 p-8 text-center max-w-sm">
                                <div className="w-24 h-24 rounded-[2rem] bg-brand-primary/5 flex items-center justify-center border border-brand-primary/20 shadow-[0_0_40px_-10px_rgba(100,53,172,0.3)]">
                                    <span className="text-5xl opacity-80">🎬</span>
                                </div>
                                <h3 className="text-2xl text-white font-medium">Select Video</h3>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    Choose a local video file above to sync playback with others.
                                </p>
                            </div>
                        )}
                        {sessionMode === 'stream' && isHost && !localVideoURL && (
                            <div className="hidden lg:flex flex-col items-center gap-5 p-8 text-center max-w-sm">
                                <div className="w-24 h-24 rounded-[2rem] bg-brand-primary/5 flex items-center justify-center border border-brand-primary/20 shadow-[0_0_40px_-10px_rgba(100,53,172,0.3)]">
                                    <span className="text-5xl opacity-80">📡</span>
                                </div>
                                <h3 className="text-2xl text-white font-medium">Start Stream</h3>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    Select a video file above to broadcast directly to your guests.
                                </p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div >
    );
}

export default VideoPlayer;