import { Link } from 'react-router-dom';
import SiteHeader from '../components/Layout/SiteHeader';
import './landing.css';

export default function LandingPage() {
    return (
        <div className="intro-page">
            <SiteHeader />
            <a href="#intro-content" className="intro-skip">Skip to content</a>
            <main id="intro-content" className="intro-content">
                <section className="intro-hero" aria-labelledby="intro-title">
                    <div>
                        <p className="intro-eyebrow">A watch party, wherever you are.</p>
                        <h1 id="intro-title">Press play.<br /><em>Stay close.</em></h1>
                        <p className="intro-description">For the films you keep quoting. The videos you have to share. And the people you wish were on the sofa.</p>
                        <Link to="/" className="intro-button">Start watching <span aria-hidden="true">↗</span></Link>
                        <p className="intro-note">Right in your browser. No account needed.</p>
                    </div>
                    <div className="intro-ticket" aria-hidden="true">
                        <div className="ticket-top"><span>Fliccs picture club</span><span>Est. 2026</span></div>
                        <img src="/fliccs-icon.png" alt="" width="96" height="96" />
                        <p>Saved you<br />a seat.</p>
                        <div className="ticket-stub"><span>Bring a film.<br />Bring your people.</span><span className="ticket-mark">fliccs</span></div>
                    </div>
                </section>

                <section id="how-it-works" className="intro-modes" aria-labelledby="modes-title">
                    <div className="intro-section-heading">
                        <p className="intro-eyebrow">A little less “3, 2, 1, play.”</p>
                        <h2 id="modes-title">One room. Two ways to watch.</h2>
                        <p>Create a room, send the invite, and pick a local video.<br className="intro-desktop-break" /> Your conversation has a place in the room, too.</p>
                    </div>
                    <div className="intro-mode-grid">
                        <article>
                            <span className="intro-mode-label">You both have the file</span>
                            <h3>Sync.</h3>
                            <p>Everyone opens the same video on their own device. Play, pause, and seek together, with each person watching their local copy.</p>
                        </article>
                        <article>
                            <span className="intro-mode-label">Only you have the file</span>
                            <h3>Stream.</h3>
                            <p>Play a video from your computer and stream it to the room. Your friends join in their browsers, without needing their own copy.</p>
                        </article>
                    </div>
                </section>

                <section className="intro-invitation" aria-labelledby="invitation-title">
                    <h2 id="invitation-title">Make a night of it.</h2>
                    <Link to="/" className="intro-text-link">Open Fliccs <span aria-hidden="true">↗</span></Link>
                </section>
            </main>
            <footer className="intro-footer">
                <span>Fliccs © 2026</span>
                <nav aria-label="Information">
                    <Link to="/privacy">Privacy</Link>
                    <Link to="/terms-and-conditions">Terms</Link>
                    <Link to="/refund">Refunds</Link>
                    <a href="https://rajinkhan.com" target="_blank" rel="noopener noreferrer">Made by Rajin ↗</a>
                </nav>
            </footer>
        </div>
    );
}
