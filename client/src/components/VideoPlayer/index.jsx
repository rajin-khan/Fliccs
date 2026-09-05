import { useRef, useState, useEffect, useCallback } from 'react';
import ReactPlayer from 'react-player';
import { FaFolderOpen, FaFilm, FaSatelliteDish, FaExclamationTriangle, FaExchangeAlt } from 'react-icons/fa';
import useVideoSync from './useVideoSync';
import useWebRTC from '../../hooks/useWebRTC';
import { calculateFileHash } from '../../utils/fileHash.js';
import PlayerControls from './PlayerControls';

function VideoPlayer({
    socket,
    sessionId,
    sessionMode,
    isHost,
    participants,
    selfId,
    isFullscreen,
    onToggleFullscreen,
}) {
    // Get host nickname for display
    const hostParticipant = participants[0];
    const hostName = hostParticipant?.nickname || 'Host';
    const playerRef = useRef(null);
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


    const handleDuration = (duration) => {
        setPlayerState(prev => ({ ...prev, duration }));
    };

    // --- Effects ---

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

        // Auto-play for host in stream mode to enable captureStream
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
            case 'matched': return <span className="text-[9px] font-bold bg-green-500/10 text-green-400 px-1.5 py-0.5 rounded-full border border-green-500/20 uppercase tracking-wider">Match</span>;
            case 'mismatched': return <span className="text-[9px] font-bold bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded-full border border-red-500/20 uppercase tracking-wider">Mismatch</span>;
            case 'pending': return <span className="text-[9px] text-yellow-400 font-bold tracking-widest">•••</span>;
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

    // Compact file chip shown once a video is loaded (all breakpoints)
    const fileChip = showFileInput && localVideoURL && (
        <div className={`absolute top-16 left-1/2 -translate-x-1/2 z-20 max-w-[calc(100%-1.5rem)] transition-all duration-300 ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}`}>
            <div className="flex items-center gap-3 bg-black/60 backdrop-blur-md border border-white/10 pl-4 pr-1.5 py-1.5 rounded-full shadow-lg">
                <FaFilm className="text-brand-primary/80 text-xs shrink-0" />
                <div className="flex flex-col items-start min-w-0">
                    <span className="text-[11px] font-semibold text-white max-w-[140px] sm:max-w-[240px] truncate leading-tight" title={fileName}>
                        {fileName}
                    </span>
                    <div className="flex items-center gap-1.5 leading-tight">
                        {sessionMode === 'sync' ? (
                            <>
                                {getStatusBadge()}
                                <span className="text-[9px] text-gray-500 font-mono">
                                    {fileHash ? `#${fileHash.slice(0, 8)}` : 'hashing...'}
                                </span>
                            </>
                        ) : (
                            <span className="text-[9px] text-brand-primary/80 font-bold uppercase tracking-widest">Broadcasting</span>
                        )}
                    </div>
                </div>
                <label className="shrink-0 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-full cursor-pointer transition-colors">
                    <FaExchangeAlt className="text-[9px]" />
                    <span className="hidden sm:inline">Change</span>
                    <input type="file" accept="video/*" onChange={handleFileChange} aria-label="Select video file" className="sr-only" />
                </label>
            </div>
        </div>
    );

    const errorToast = (errorMessage || webRTCError) && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 w-[calc(100%-2rem)] max-w-md">
            <div className="flex items-center justify-center gap-2 text-red-300 text-xs sm:text-sm font-medium bg-red-950/70 border border-red-500/30 rounded-2xl px-4 py-3 shadow-lg backdrop-blur-md text-center">
                <FaExclamationTriangle className="shrink-0" />
                <span>{webRTCError || errorMessage}</span>
            </div>
        </div>
    );

    const loadingOverlay = !isPlayerReady && !webRTCError && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="w-10 h-10 border-2 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin mb-3"></div>
            <span className="text-xs font-medium text-white/50 tracking-widest uppercase">Loading video...</span>
        </div>
    );

    // Empty-state dropzone (sync: everyone, stream: host)
    const dropzone = (
        <div className="w-full max-w-sm px-6 relative z-10 animate-fade-in-up text-center">
            <label className="group/drop block cursor-pointer">
                <div className="flex flex-col items-center gap-4 p-8 sm:p-10 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] hover:border-brand-primary/50 hover:bg-brand-primary/5 transition-all duration-300">
                    <div className="w-16 h-16 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center group-hover/drop:scale-110 transition-transform duration-300 shadow-[0_0_40px_-10px_rgba(100,53,172,0.4)]">
                        {sessionMode === 'stream'
                            ? <FaSatelliteDish className="text-2xl text-brand-primary" />
                            : <FaFolderOpen className="text-2xl text-brand-primary" />}
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-xl text-white font-medium tracking-tight group-hover/drop:text-brand-primary transition-colors">
                            {sessionMode === 'stream' ? 'Start your stream' : 'Select a video'}
                        </h3>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            {sessionMode === 'stream'
                                ? 'Pick a local file to broadcast live to everyone in the room.'
                                : 'Pick a local file to sync playback with the room.'}
                        </p>
                    </div>
                    <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-brand-primary text-white text-xs font-semibold uppercase tracking-wider group-hover/drop:bg-brand-primary/80 transition-colors">
                        Browse files
                    </span>
                </div>
                <input type="file" accept="video/*" onChange={handleFileChange} aria-label="Select video file" className="sr-only" key={`${sessionMode}-${fileName}`} />
            </label>
        </div>
    );

    return (
        <div className="relative w-full h-full bg-black text-white font-barlow flex items-center justify-center overflow-hidden">
            {/* Ambient glow behind empty states */}
            {!showPlayerContainer && (
                <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-brand-primary/[0.06] blur-[100px] rounded-full" />
                </div>
            )}

            {errorToast}

            {showPlayerContainer ? (
                showGuestStream ? (
                    <>
                        <video
                            ref={guestVideoRef}
                            autoPlay
                            playsInline
                            muted={isGuestMuted}
                            className="w-full h-full object-contain bg-black"
                        />

                        {loadingOverlay}

                        <div
                            className={`absolute inset-0 z-10 flex flex-col justify-end transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 cursor-none'}`}
                            onMouseMove={resetControlsTimer}
                            onMouseEnter={resetControlsTimer}
                            onClick={resetControlsTimer}
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
                                    isHost={false}
                                    sessionMode="stream"
                                    isFullscreen={isFullscreen}
                                    onToggleFullscreen={onToggleFullscreen}
                                    isLiveStream={true}
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
                            controls={false}
                        />

                        {loadingOverlay}
                        {fileChip}

                        {/* Controls overlay */}
                        <div
                            className={`absolute inset-0 z-10 flex flex-col justify-end transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 cursor-none'}`}
                            onMouseMove={resetControlsTimer}
                            onMouseEnter={resetControlsTimer}
                            onClick={resetControlsTimer}
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
                                    onSeekMouseDown={() => {
                                        handleSeekMouseDown();
                                        resetControlsTimer(); // Keep controls visible while seeking
                                    }}
                                    onSeekMouseUp={handleSeekMouseUp}
                                    onSkipForward={handleSkipForward}
                                    onSkipBackward={handleSkipBackward}
                                    isHost={isHost}
                                    sessionMode={sessionMode}
                                    isFullscreen={isFullscreen}
                                    onToggleFullscreen={onToggleFullscreen}
                                />
                            </div>
                        </div>
                    </>
                ) : (
                    !webRTCError && sessionMode === 'stream' && !isHost ? (
                        <div className="flex flex-col items-center gap-6 p-8 relative z-10">
                            <div className="w-16 h-16 rounded-full border-2 border-brand-primary/20 border-t-brand-primary animate-spin"></div>
                            <div className="text-center space-y-1.5">
                                <p className="text-white text-lg font-medium tracking-wide">Connecting to {hostName}...</p>
                                <p className="text-brand-primary/60 text-xs uppercase tracking-widest">Waiting for the host stream</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-4 text-gray-400 relative z-10">
                            <div className="w-10 h-10 border-2 border-white/10 border-t-white/50 rounded-full animate-spin"></div>
                            <p className="text-sm tracking-wide">Initializing player...</p>
                        </div>
                    )
                )
            ) : (
                <>
                    {showFileInput && !localVideoURL && dropzone}
                    {!showFileInput && (
                        <div className="flex flex-col items-center gap-4 text-gray-400 relative z-10">
                            <div className="w-10 h-10 border-2 border-white/10 border-t-white/50 rounded-full animate-spin"></div>
                            <p className="text-sm tracking-wide">Waiting for the session...</p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default VideoPlayer;
