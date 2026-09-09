import { useEffect, useRef, useState } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import PlayerControls from './VideoPlayer/PlayerControls';

import { cartoons } from '../data/cartoons';

export default function CartoonPlayer({ active, onClose }) {
    const video = useRef(null);
    const currentIndex = useRef(Math.floor(Math.random() * cartoons.length));
    const previousIndices = useRef([]);
    const [index, setIndex] = useState(currentIndex.current);
    const [playing, setPlaying] = useState(false);
    const [muted, setMuted] = useState(true);
    const [volume, setVolume] = useState(1);
    const [time, setTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [loaded, setLoaded] = useState(0);
    const [status, setStatus] = useState('Loading cartoon…');
    const cartoon = cartoons[index];
    useEffect(() => {
        if (active) video.current.play().catch(error => { if (error.name !== 'AbortError') setStatus('Press play to start.'); });
        else video.current.pause();
    }, [active]);
    useEffect(() => {
        if (status !== 'Loading cartoon…') return;
        const timeout = setTimeout(() => setStatus('This copy is taking a while. Try the next film.'), 12000);
        return () => clearTimeout(timeout);
    }, [status, index]);
    function change(delta) {
        let nextIndex;
        if (delta > 0) {
            do nextIndex = Math.floor(Math.random() * cartoons.length);
            while (nextIndex === currentIndex.current && cartoons.length > 1);
            previousIndices.current = [...previousIndices.current, currentIndex.current].slice(-3);
        } else {
            nextIndex = previousIndices.current.pop();
            if (nextIndex === undefined) return;
        }
        currentIndex.current = nextIndex;
        video.current.pause();
        setIndex(nextIndex);
        setTime(0); setDuration(0); setLoaded(0); setPlaying(false); setStatus('Loading cartoon…');
    }
    function play() {
        video.current.play().catch(error => { if (error.name !== 'AbortError') setStatus('Press play to start.'); });
    }
    function seek(seconds) {
        if (Number.isFinite(video.current.duration)) video.current.currentTime = Math.max(0, Math.min(seconds, video.current.duration));
    }
    return <section className="cartoon-player" aria-label="Classic cartoon player">
        <video key={cartoon.item + cartoon.file} ref={video} src={`https://archive.org/download/${cartoon.item}/${encodeURIComponent(cartoon.file)}`}
            playsInline autoPlay={active} muted={muted} preload="auto" onCanPlay={() => { setStatus(''); }}
            onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => change(1)}
            onLoadedMetadata={event => { event.currentTarget.volume = volume; setDuration(event.currentTarget.duration); if (active) play(); }}
            onTimeUpdate={event => { setTime(event.currentTarget.currentTime); if (event.currentTarget.readyState >= 3) setStatus(''); }}
            onProgress={event => { const ranges = event.currentTarget.buffered; if (ranges.length) setLoaded(ranges.end(ranges.length - 1)); }}
            onWaiting={() => setStatus('Loading cartoon…')} onPlaying={() => setStatus('')}
            onError={() => setStatus('This archive copy is unavailable. Try the next cartoon.')} />
        {status && <div className="cartoon-status" role="status"><p>{status}</p>{status !== 'Loading cartoon…' && <button onClick={() => status === 'Press play to start.' ? play() : change(1)}>{status === 'Press play to start.' ? 'Play film' : 'Next film'}</button>}</div>}
        <div className="cartoon-caption"><h2>{cartoon.title}</h2><a href={`https://archive.org/details/${cartoon.item}`} target="_blank" rel="noreferrer">{cartoon.year ? `${cartoon.year} · ` : ''}Internet Archive</a></div>
        <div className="cartoon-navigation">
            <button onClick={() => change(-1)} aria-label="Previous cartoon"><FaChevronLeft /></button>
            <button onClick={() => change(1)} aria-label="Next cartoon"><FaChevronRight /></button>
        </div>
        <PlayerControls isPlaying={playing} onPlayPause={() => playing ? video.current.pause() : play()}
            volume={volume} onVolumeChange={value => { setVolume(value); video.current.volume = value; setMuted(false); }}
            isMuted={muted} onMuteToggle={() => setMuted(value => !value)} playedSeconds={time} loadedSeconds={loaded} duration={duration}
            onSeek={seek} onSkipForward={() => seek(time + 10)} onSkipBackward={() => seek(time - 10)}
            isHost sessionMode="sync" isFullscreen onToggleFullscreen={onClose} />
    </section>;
}
