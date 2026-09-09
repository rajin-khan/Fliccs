import { useEffect, useRef, useState } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import PlayerControls from './VideoPlayer/PlayerControls';

// Original-release catalogue; Archive sources are linked for provenance.
const cartoons = [
    {
        "title": "Plane Crazy",
        "year": 1928,
        "item": "plane-crazy_1928",
        "file": "plane-crazy_1928.ia.mp4"
    },
    {
        "title": "The Gallopin’ Gaucho",
        "year": 1928,
        "item": "TheGallopinGaucho",
        "file": "The Gallopin' Gaucho.mp4"
    },
    {
        "title": "Steamboat Willie",
        "year": 1928,
        "item": "steamboat-willie_1928",
        "file": "steamboat-willie_1928.ia.mp4"
    },
    {
        "title": "The Barn Dance",
        "year": 1929,
        "item": "TheBarnDance",
        "file": "The Barn Dance.mp4"
    },
    {
        "title": "The Opry House",
        "year": 1929,
        "item": "the-opry-house-1929_202412",
        "file": "The Opry House (1929).mp4"
    },
    {
        "title": "When the Cat’s Away",
        "year": 1929,
        "item": "when-the-cats-away-1929",
        "file": "When The Cat's Away (1929).mp4"
    },
    {
        "title": "The Barnyard Battle",
        "year": 1929,
        "item": "the-barnyard-battle-1929",
        "file": "The Barnyard Battle (1929).mp4"
    },
    {
        "title": "The Plow Boy",
        "year": 1929,
        "item": "the-plowboy_1929",
        "file": "the-plowboy_1929.ia.mp4"
    },
    {
        "title": "The Karnival Kid",
        "year": 1929,
        "item": "the-karnival-kid-1929",
        "file": "The Karnival Kid (1929).mp4"
    },
    {
        "title": "Mickey’s Follies",
        "year": 1929,
        "item": "mickeys-follies_1929",
        "file": "mickeys-follies_1929.ia.mp4"
    },
    {
        "title": "Mickey’s Choo-Choo",
        "year": 1929,
        "item": "mickeys-choo-choo-1929",
        "file": "Mickey's Choo-Choo (1929).mp4"
    },
    {
        "title": "The Jazz Fool",
        "year": 1929,
        "item": "the-jazz-fool-1929",
        "file": "The Jazz Fool 1929.mp4"
    },
    {
        "title": "Jungle Rhythm",
        "year": 1929,
        "item": "jungle-rhythm-1929",
        "file": "Jungle Rhythm (1929).mp4"
    },
    {
        "title": "The Haunted House",
        "year": 1929,
        "item": "the-haunted-house-1929",
        "file": "The Haunted House (1929).mp4"
    },
    {
        "title": "Wild Waves",
        "year": 1929,
        "item": "wild-waves-1929",
        "file": "Wild Waves (1929)(1).ia.mp4"
    },
    {
        "title": "Fiddling Around",
        "year": 1930,
        "item": "fiddling-around-aka-just-mickey_1930",
        "file": "fiddling-around-aka-just-mickey_1930.ia.mp4"
    },
    {
        "title": "The Barnyard Concert",
        "year": 1930,
        "item": "the-barnyard-concert_1930",
        "file": "the-barnyard-concert_1930.ia.mp4"
    },
    {
        "title": "The Cactus Kid",
        "year": 1930,
        "item": "the-cactus-kid_1930",
        "file": "the-cactus-kid_1930.ia.mp4"
    },
    {
        "title": "The Fire Fighters",
        "year": 1930,
        "item": "the-fire-fighters-1930",
        "file": "The Fire Fighters (1930).ia.mp4"
    },
    {
        "title": "The Shindig",
        "year": 1930,
        "item": "the-shindig_1930",
        "file": "the-shindig_1930.ia.mp4"
    },
    {
        "title": "The Chain Gang",
        "year": 1930,
        "item": "the-chain-gang_1930",
        "file": "the-chain-gang_1930.ia.mp4"
    },
    {
        "title": "The Gorilla Mystery",
        "year": 1930,
        "item": "the-gorilla-mystery_1930",
        "file": "the-gorilla-mystery_1930.ia.mp4"
    },
    {
        "title": "The Picnic",
        "year": 1930,
        "item": "the-picnic_1930",
        "file": "the-picnic_1930.ia.mp4"
    },
    {
        "title": "Pioneer Days",
        "year": 1930,
        "item": "pioneer-days_1930",
        "file": "pioneer-days_1930.ia.mp4"
    },
    {
        "title": "The Skeleton Dance",
        "year": 1929,
        "item": "the-skeleton-dance_1929",
        "file": "the-skeleton-dance_1929.ia.mp4"
    },
    {
        "title": "El Terrible Toreador",
        "year": 1929,
        "item": "el-terrible-toeador-1929",
        "file": "El Terrible Toeador (1929).mp4"
    },
    {
        "title": "Springtime",
        "year": 1929,
        "item": "waltdisney-springtime-1929",
        "file": "03 - Springtime (1929).ia.mp4"
    },
    {
        "title": "Hell’s Bells",
        "year": 1929,
        "item": "hells-bells-1929",
        "file": "Hell's Bells (1929).mp4"
    },
    {
        "title": "Summer",
        "year": 1930,
        "item": "summer_1930",
        "file": "summer_1930.ia.mp4"
    },
    {
        "title": "Autumn",
        "year": 1930,
        "item": "autumn_1930",
        "file": "autumn_1930.ia.mp4"
    },
    {
        "title": "Cannibal Capers",
        "year": 1930,
        "item": "cannibal-capers_1930",
        "file": "cannibal-capers_1930.ia.mp4"
    },
    {
        "title": "Frolicking Fish",
        "year": 1930,
        "item": "frolicking-fish_1930",
        "file": "frolicking-fish_1930.ia.mp4"
    },
    {
        "title": "Arctic Antics",
        "year": 1930,
        "item": "ArcticAntics",
        "file": "Arctic Antics.mp4"
    },
    {
        "title": "Midnight in a Toy Shop",
        "year": 1930,
        "item": "midnight-in-a-toy-shop_1930",
        "file": "midnight-in-a-toy-shop_1930.ia.mp4"
    },
    {
        "title": "Night",
        "year": 1930,
        "item": "night_1930",
        "file": "night_1930.ia.mp4"
    },
    {
        "title": "Monkey Melodies",
        "year": 1930,
        "item": "monkey-melodies_1930",
        "file": "monkey-melodies_1930.ia.mp4"
    },
    {
        "title": "Winter",
        "year": 1930,
        "item": "Winter_915",
        "file": "SillySymphony-14-Winter1930.mp4"
    },
    {
        "title": "Playful Pan",
        "year": 1930,
        "item": "playful-pan_1930",
        "file": "playful-pan_1930.ia.mp4"
    }
];

export default function CartoonPlayer() {
    const video = useRef(null);
    const surface = useRef(null);
    const [index, setIndex] = useState(0);
    const [playing, setPlaying] = useState(false);
    const [muted, setMuted] = useState(true);
    const [volume, setVolume] = useState(1);
    const [time, setTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [loaded, setLoaded] = useState(0);
    const [status, setStatus] = useState('Loading cartoon…');
    const [fullscreen, setFullscreen] = useState(false);
    const cartoon = cartoons[index];
    useEffect(() => {
        const update = () => setFullscreen(document.fullscreenElement === surface.current);
        document.addEventListener('fullscreenchange', update);
        return () => document.removeEventListener('fullscreenchange', update);
    }, []);
    function change(delta) {
        video.current.pause();
        setIndex(value => (value + delta + cartoons.length) % cartoons.length);
        setTime(0); setDuration(0); setLoaded(0); setPlaying(false); setStatus('Loading cartoon…');
    }
    function play() {
        video.current.play().catch(() => setStatus('Press play to start.'));
    }
    function seek(seconds) {
        if (Number.isFinite(video.current.duration)) video.current.currentTime = Math.max(0, Math.min(seconds, video.current.duration));
    }
    return <section ref={surface} className="cartoon-player" aria-label="Classic cartoon player">
        <video key={cartoon.item + cartoon.file} ref={video} src={`https://archive.org/download/${cartoon.item}/${encodeURIComponent(cartoon.file)}`}
            playsInline autoPlay muted={muted} preload="metadata" onCanPlay={() => { setStatus(''); }}
            onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => change(1)}
            onLoadedMetadata={event => { event.currentTarget.volume = volume; setDuration(event.currentTarget.duration); play(); }}
            onTimeUpdate={event => setTime(event.currentTarget.currentTime)}
            onProgress={event => { const ranges = event.currentTarget.buffered; if (ranges.length) setLoaded(ranges.end(ranges.length - 1)); }}
            onWaiting={() => setStatus('Loading cartoon…')} onPlaying={() => setStatus('')}
            onError={() => setStatus('This archive copy is unavailable. Try the next cartoon.')} />
        {status && <p className="cartoon-status" role="status">{status}</p>}
        <div className="cartoon-caption"><h2>{cartoon.title}</h2><a href={`https://archive.org/details/${cartoon.item}`} target="_blank" rel="noreferrer">{cartoon.year} · Internet Archive · {index + 1}/{cartoons.length}</a></div>
        <div className="cartoon-navigation">
            <button onClick={() => change(-1)} aria-label="Previous cartoon"><FaChevronLeft /></button>
            <button onClick={() => change(1)} aria-label="Next cartoon"><FaChevronRight /></button>
        </div>
        <PlayerControls isPlaying={playing} onPlayPause={() => playing ? video.current.pause() : play()}
            volume={volume} onVolumeChange={value => { setVolume(value); video.current.volume = value; setMuted(false); }}
            isMuted={muted} onMuteToggle={() => setMuted(value => !value)} playedSeconds={time} loadedSeconds={loaded} duration={duration}
            onSeek={seek} onSkipForward={() => seek(time + 10)} onSkipBackward={() => seek(time - 10)}
            isHost sessionMode="sync" isFullscreen={fullscreen} onToggleFullscreen={async () => {
                try { if (document.fullscreenElement) await document.exitFullscreen(); else await surface.current.requestFullscreen(); }
                catch { setStatus('Fullscreen is unavailable in this browser.'); }
            }} />
    </section>;
}
