import { useEffect, useRef, useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import BrandLogo from './BrandLogo';

function TicketFace() {
    return <span className="intro-ticket ticket-face">
        <span className="ticket-top"><span>Fliccs picture club</span><span>Est. 2025</span></span>
        <img src="/fliccs-icon.png" alt="" width="96" height="96" />
        <span className="ticket-title">Saved you<br />a seat.</span>
        <span className="ticket-stub"><span>Bring a film.<br />Bring your people.</span><span className="ticket-mark">fliccs</span></span>
    </span>;
}

export default function LandingTicket() {
    const trigger = useRef(null);
    const dialog = useRef(null);
    const card = useRef(null);
    const frame = useRef(null);
    const flight = useRef(null);
    const closing = useRef(false);
    const [origin, setOrigin] = useState(null);
    const [playing, setPlaying] = useState(false);

    useEffect(() => () => cancelAnimationFrame(frame.current), []);

    useEffect(() => {
        if (!origin) return;
        const modal = dialog.current;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        modal.showModal();
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const scale = Math.max(window.innerWidth / origin.height, window.innerHeight / origin.width) * 1.6;
        const dx = window.innerWidth / 2 - origin.left - origin.width / 2;
        const dy = window.innerHeight / 2 - origin.top - origin.height / 2;
        const animation = card.current.animate(reduced ? [
            { opacity: 1 }, { opacity: 0 },
        ] : [
            { transform: 'perspective(1200px) translate(0, 0) rotateY(0deg) rotateZ(2deg) scale(1)', offset: 0 },
            { transform: `perspective(1200px) translate(${dx}px, ${dy}px) rotateY(180deg) rotateZ(90deg) scale(1.08)`, offset: .58 },
            { transform: `perspective(1200px) translate(${dx}px, ${dy}px) rotateY(180deg) rotateZ(90deg) scale(${scale})`, offset: 1 },
        ], { duration: reduced ? 180 : 1700, easing: 'cubic-bezier(.65, 0, .2, 1)', fill: 'forwards' });
        flight.current = animation;
        closing.current = false;
        let cancelled = false;
        animation.finished.then(() => { if (!cancelled && !closing.current) setPlaying(true); }).catch(() => {});
        return () => {
            cancelled = true;
            flight.current = null;
            animation.cancel();
            modal.close();
            document.body.style.overflow = previousOverflow;
        };
    }, [origin]);

    function resetTilt() {
        cancelAnimationFrame(frame.current);
        trigger.current?.style.removeProperty('--tilt-x');
        trigger.current?.style.removeProperty('--tilt-y');
        trigger.current?.style.removeProperty('--glint-x');
    }

    function tilt(event) {
        if (event.pointerType === 'touch' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const { clientX, clientY, currentTarget } = event;
        cancelAnimationFrame(frame.current);
        frame.current = requestAnimationFrame(() => {
            const rect = currentTarget.getBoundingClientRect();
            const x = (clientX - rect.left) / rect.width - .5;
            const y = (clientY - rect.top) / rect.height - .5;
            currentTarget.style.setProperty('--tilt-x', `${-y * 13}deg`);
            currentTarget.style.setProperty('--tilt-y', `${x * 15}deg`);
            currentTarget.style.setProperty('--glint-x', `${(x + .5) * 100}%`);
        });
    }

    async function close() {
        const animation = flight.current;
        if (!animation || closing.current) return;
        closing.current = true;
        setPlaying(false);
        animation.reverse();
        try {
            await animation.finished;
            setOrigin(null);
        } catch { /* Unmount cancels the flight. */ }
    }

    return <>
        <button ref={trigger} className="ticket-trigger" aria-label="Pick up your ticket and play the Fliccs preview" aria-haspopup="dialog"
            style={{ visibility: origin ? 'hidden' : undefined }} onPointerMove={tilt} onPointerLeave={resetTilt} onBlur={resetTilt}
            onClick={() => { setOrigin(trigger.current.getBoundingClientRect()); resetTilt(); }}>
            <span className="ticket-float"><TicketFace /></span>
        </button>
        <dialog ref={dialog} className={`ticket-cinema${playing ? ' is-playing' : ''}`} aria-label="Fliccs preview" onCancel={event => { event.preventDefault(); close(); }}>
            {origin && <>
                <div ref={card} className="ticket-flight" aria-hidden="true" style={{ left: origin.left, top: origin.top, width: origin.width, height: origin.height }}>
                    <TicketFace /><span className="ticket-back" />
                </div>
                <div className="cinema-logo"><BrandLogo size="md" /></div>
                <button className="cinema-close" onClick={close} aria-label="Close preview" autoFocus><FaTimes aria-hidden="true" /></button>
                {playing && <div className="cinema-film" role="img" aria-label="Animated purple light sculpture">
                    <div className="cinema-sculpture">{Array.from({ length: 7 }, (_, i) => <span key={i} style={{ '--ring': i }} />)}</div>
                </div>}
            </>}
        </dialog>
    </>;
}
