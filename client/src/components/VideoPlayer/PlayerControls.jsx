import { FaPlay, FaPause, FaExpand, FaCompress } from 'react-icons/fa';
import { HiVolumeUp, HiVolumeOff } from 'react-icons/hi';
import { MdReplay10, MdForward10 } from 'react-icons/md';

// Helper function to format time from seconds into MM:SS or HH:MM:SS
const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds === Infinity) {
        return '00:00';
    }
    const date = new Date(seconds * 1000);
    const hh = date.getUTCHours();
    const mm = date.getUTCMinutes();
    const ss = date.getUTCSeconds().toString().padStart(2, '0');
    if (hh) {
        return `${hh}:${mm.toString().padStart(2, '0')}:${ss}`;
    }
    return `${mm}:${ss}`;
};

function PlayerControls({
    isPlaying,
    onPlayPause,
    volume,
    onVolumeChange,
    isMuted,
    onMuteToggle,
    playedSeconds,
    loadedSeconds,
    duration,
    onSeek,
    onSeekMouseUp,
    onSeekMouseDown,
    onSkipForward,
    onSkipBackward,
    isHost,
    sessionMode,
    isFullscreen,
    onToggleFullscreen,
    isLiveStream = false,
}) {
    // Playback controls (play/pause, seek) are interactive for sync mode or the host
    const showMainControls = sessionMode === 'sync' || isHost;
    const showTimeline = !isLiveStream;

    const playedPercentage = duration > 0 ? (playedSeconds / duration) * 100 : 0;
    const loadedPercentage = duration > 0 ? (loadedSeconds / duration) * 100 : 0;

    return (
        <div className="absolute inset-0 flex flex-col justify-end p-0 pointer-events-none">
            {/* Gradient scrim */}
            <div className="absolute bottom-0 left-0 right-0 h-40 sm:h-48 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none" />

            {/* Controls */}
            <div className="pointer-events-auto w-full px-3 sm:px-6 pb-3 sm:pb-5 relative z-10 flex flex-col gap-1 sm:gap-2">

                {/* Seek bar */}
                {showTimeline && (
                    <div className="relative h-2 w-full flex items-center cursor-pointer group/seek py-3 sm:py-4">
                        <input
                            type="range"
                            min={0}
                            max={0.999999}
                            step="any"
                            value={duration > 0 ? playedSeconds / duration : 0}
                            onMouseDown={onSeekMouseDown}
                            onChange={(e) => onSeek(parseFloat(e.target.value) * duration)}
                            onMouseUp={onSeekMouseUp}
                            aria-label="Seek"
                            className={`absolute inset-0 w-full h-full opacity-0 z-30 cursor-pointer ${!showMainControls ? 'cursor-not-allowed' : ''}`}
                            disabled={!showMainControls}
                        />

                        {/* Track */}
                        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden relative group-hover/seek:h-1.5 transition-all duration-200">
                            <div
                                className="absolute top-0 left-0 h-full bg-white/20 transition-all duration-300"
                                style={{ width: `${loadedPercentage}%` }}
                            />
                            <div
                                className="absolute top-0 left-0 h-full bg-gradient-to-r from-brand-primary/60 to-brand-primary shadow-[0_0_20px_rgba(100,53,172,0.5)] transition-all duration-100"
                                style={{ width: `${playedPercentage}%` }}
                            />
                        </div>

                        {/* Scrubber knob */}
                        <div
                            className="absolute h-3.5 w-3.5 bg-white rounded-full shadow-lg border-2 border-brand-primary pointer-events-none transition-transform duration-100 opacity-0 group-hover/seek:opacity-100 scale-0 group-hover/seek:scale-100"
                            style={{ left: `${playedPercentage}%`, transform: 'translateX(-50%)' }}
                        />
                    </div>
                )}

                {/* Buttons row */}
                <div className="flex items-center justify-between gap-2">

                    {/* Left: playback */}
                    <div className="flex items-center gap-3 sm:gap-6 min-w-0">
                        {showMainControls && (
                            <div className="flex items-center gap-3 sm:gap-4">
                                <button
                                    onClick={onSkipBackward}
                                    className="text-white/80 hover:text-white transition-all transform hover:-rotate-12 active:scale-90"
                                    title="-10s"
                                    aria-label="Skip back 10 seconds"
                                >
                                    <MdReplay10 className="text-2xl sm:text-[28px]" />
                                </button>

                                <button
                                    onClick={onPlayPause}
                                    aria-label={isPlaying ? 'Pause' : 'Play'}
                                    className="text-white hover:text-brand-primary transition-all transform hover:scale-110 active:scale-95"
                                >
                                    {isPlaying
                                        ? <FaPause className="text-2xl sm:text-[30px]" />
                                        : <FaPlay className="text-2xl sm:text-[30px]" />}
                                </button>

                                <button
                                    onClick={onSkipForward}
                                    className="text-white/80 hover:text-white transition-all transform hover:rotate-12 active:scale-90"
                                    title="+10s"
                                    aria-label="Skip forward 10 seconds"
                                >
                                    <MdForward10 className="text-2xl sm:text-[28px]" />
                                </button>
                            </div>
                        )}

                        {/* Volume */}
                        <div className="flex items-center gap-2 group/volume">
                            <button
                                onClick={onMuteToggle}
                                aria-label={isMuted || volume === 0 ? 'Unmute' : 'Mute'}
                                className="text-white/80 hover:text-white transition-colors active:scale-90"
                            >
                                {isMuted || volume === 0
                                    ? <HiVolumeOff className="text-xl sm:text-2xl" />
                                    : <HiVolumeUp className="text-xl sm:text-2xl" />}
                            </button>
                            {/* Slider: hover-expand on pointer devices, hidden on small touch screens */}
                            <div className="hidden sm:flex w-0 overflow-hidden group-hover/volume:w-28 focus-within:w-28 transition-all duration-300 ease-out items-center pl-1">
                                <input
                                    type="range"
                                    min={0}
                                    max={1}
                                    step={0.01}
                                    value={isMuted ? 0 : volume}
                                    onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                                    aria-label="Volume"
                                    className="w-24 h-1 bg-white/20 rounded-full appearance-none cursor-pointer accent-brand-primary"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right: time + fullscreen */}
                    <div className="flex items-center gap-3 sm:gap-6 shrink-0">
                        {showTimeline ? (
                            <div className="text-xs sm:text-sm font-medium tracking-wide font-barlow tabular-nums">
                                <span className="text-white">{formatTime(playedSeconds)}</span>
                                <span className="text-white/40 mx-1.5 sm:mx-2">|</span>
                                <span className="text-white/60">{formatTime(duration)}</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-semibold uppercase tracking-widest text-white/70">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                                Live
                            </div>
                        )}

                        <button
                            onClick={onToggleFullscreen}
                            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                            className="text-white/80 hover:text-white transition-transform hover:scale-110 active:scale-95"
                        >
                            {isFullscreen
                                ? <FaCompress className="text-lg sm:text-[22px]" />
                                : <FaExpand className="text-lg sm:text-[22px]" />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PlayerControls;
