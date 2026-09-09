import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import BrandLogo from './BrandLogo';
import CartoonPlayer from './CartoonPlayer';

function TicketFace() {
    return <span className="intro-ticket ticket-face">
        <span className="ticket-top"><span>Fliccs picture club</span><span>Est. 2025</span></span>
        <img src="/fliccs-icon.png" alt="" width="96" height="96" />
        <span className="ticket-title">Saved you<br />a seat.</span>
        <span className="ticket-stub"><span>Click for a film.<br />We picked a good one.</span><span className="ticket-mark">fliccs</span></span>
    </span>;
}

export default function LandingTicket() {
    const trigger = useRef(null);
    const slot = useRef(null);
    const dialog = useRef(null);
    const card = useRef(null);
    const frame = useRef(null);
    const flight = useRef(null);
    const closing = useRef(false);
    const shades = useRef([]);
    const idle = useRef(null);
    const [controlsVisible, setControlsVisible] = useState(true);
    const [origin, setOrigin] = useState(null);
    const [playing, setPlaying] = useState(false);

    useEffect(() => () => { cancelAnimationFrame(frame.current); clearTimeout(idle.current); }, []);

    function revealControls() {
        setControlsVisible(true);
        clearTimeout(idle.current);
        idle.current = setTimeout(() => setControlsVisible(false), 2500);
    }

    useEffect(() => {
        if (!origin) return;
        const back = () => close(true);
        window.addEventListener('popstate', back);
        return () => window.removeEventListener('popstate', back);
    }, [origin]);

    useEffect(() => {
        if (playing) revealControls();
    }, [playing]);

    useLayoutEffect(() => {
        if (!origin) return;
        const modal = dialog.current;
        const previousOverflow = document.body.style.overflow;
        const previousPadding = document.body.style.paddingRight;
        document.body.style.paddingRight = `${window.innerWidth - document.documentElement.clientWidth}px`;
        document.body.style.overflow = 'hidden';
        modal.showModal();
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const scale = Math.max(window.innerWidth / origin.height, window.innerHeight / origin.width) * 1.6;
        const dx = window.innerWidth / 2 - origin.left - origin.width / 2;
        const dy = window.innerHeight / 2 - origin.top - origin.height / 2;
        const animation = card.current.animate(reduced ? [
            { opacity: 1 }, { opacity: 0 },
        ] : [
            { transform: origin.transform, offset: 0 },
            { transform: `perspective(1200px) translate(${dx}px, ${dy}px) rotateY(180deg) rotateZ(90deg) scale(1.08)`, offset: .58 },
            { transform: `perspective(1200px) translate(${dx}px, ${dy}px) rotateY(180deg) rotateZ(90deg) scale(${scale})`, offset: 1 },
        ], { duration: reduced ? 180 : 1700, easing: 'cubic-bezier(.65, 0, .2, 1)', fill: 'forwards' });
        shades.current = [...card.current.querySelectorAll('.ticket-face, .ticket-back')].map(face => face.animate([
            { filter: 'brightness(1)', offset: 0 },
            { filter: 'brightness(.8)', offset: .35 },
            { filter: 'brightness(0)', offset: .8 },
            { filter: 'brightness(0)', offset: 1 },
        ], { duration: reduced ? 180 : 1700, easing: 'cubic-bezier(.65, 0, .2, 1)', fill: 'forwards' }));
        flight.current = animation;
        closing.current = false;
        let cancelled = false;
        animation.finished.then(() => { if (!cancelled && !closing.current) setPlaying(true); }).catch(() => {});
        return () => {
            cancelled = true;
            flight.current = null;
            animation.cancel();
            shades.current.forEach(shade => shade.cancel());
            modal.close();
            document.body.style.overflow = previousOverflow;
            document.body.style.paddingRight = previousPadding;
        };
    }, [origin]);

    function resetTilt() {
        if (origin) return;
        cancelAnimationFrame(frame.current);
        trigger.current?.style.removeProperty('--tilt-x');
        trigger.current?.style.removeProperty('--tilt-y');
        trigger.current?.style.removeProperty('--glint-x');
    }

    function tilt(event) {
        if (origin) return;
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

    async function close(fromHistory = false) {
        const animation = flight.current;
        if (!animation || closing.current) return;
        if (!fromHistory && window.history.state?.fliccsPreview) {
            window.history.back();
        }
        closing.current = true;
        setPlaying(false);
        animation.reverse();
        shades.current.forEach(shade => shade.reverse());
        try {
            await animation.finished;
            setOrigin(null);
            trigger.current.firstElementChild.getAnimations().forEach(animation => animation.play());
        } catch { /* Unmount cancels the flight. */ }
    }

    function open() {
        window.history.pushState({ ...window.history.state, fliccsPreview: true }, '');
        cancelAnimationFrame(frame.current);
        const element = trigger.current;
        const floating = element.firstElementChild;
        floating.getAnimations().forEach(animation => animation.pause());
        const transform = getComputedStyle(element).transform;
        const floatTransform = getComputedStyle(floating).transform;
        const rect = slot.current.getBoundingClientRect();
        setOrigin({ left: rect.left, top: rect.top, width: element.offsetWidth, height: element.offsetHeight, transform, floatTransform, glint: getComputedStyle(element).getPropertyValue('--glint-x') });
    }

    return <>
        <div ref={slot} className="ticket-slot">
        <button ref={trigger} className="ticket-trigger" aria-label="Pick up your ticket and play the Fliccs preview" aria-haspopup="dialog"
            style={{ visibility: origin ? 'hidden' : undefined, transform: origin?.transform, transition: origin ? 'none' : undefined }} onPointerMove={tilt} onPointerLeave={resetTilt} onBlur={resetTilt}
            onClick={open}>
            <span className="ticket-float" style={origin ? { animationPlayState: 'paused', transform: origin.floatTransform } : undefined}><TicketFace /></span>
        </button>
        </div>
        <dialog ref={dialog} className={`ticket-cinema${playing ? ' is-playing' : ''}${controlsVisible ? ' controls-visible' : ''}`} onPointerMove={revealControls} onPointerDown={revealControls} onKeyDown={revealControls} aria-label="Fliccs preview" onCancel={event => { event.preventDefault(); close(); }}>
            {origin && <>
                <div ref={card} className="ticket-flight" aria-hidden="true" style={{ left: origin.left, top: origin.top, width: origin.width, height: origin.height, '--glint-x': origin.glint }}>
                    <div className="ticket-flight-float" style={{ transform: origin.floatTransform }}><TicketFace /><span className="ticket-back" /></div>
                </div>
                <div className="cinema-logo"><BrandLogo size="md" /></div>
                <button className="cinema-close" onClick={() => close()} aria-label="Close preview" autoFocus><FaTimes aria-hidden="true" /></button>
                <CartoonPlayer active={playing} onClose={() => close()} />
            </>}
        </dialog>
    </>;
}
