import { Link } from 'react-router-dom';
import { FaComments, FaLink, FaExpand } from 'react-icons/fa';
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
                        <p className="intro-pill">Real time. Real fast.</p>
                        <h1 id="intro-title">WATCH<br />TOGETHER.</h1>
                        <p className="intro-description">Your videos. Your friends. One room.</p>
                        <Link to="/" className="intro-button">START WATCHING</Link>
                        <p className="intro-note">Live chat. Private rooms. No account needed.</p>
                    </div>
                    <div className="intro-ticket" aria-hidden="true">
                        <div className="ticket-top"><span>Fliccs picture club</span><span>Est. 2025</span></div>
                        <img src="/fliccs-icon.png" alt="" width="96" height="96" />
                        <p>Saved you<br />a seat.</p>
                        <div className="ticket-stub"><span>Bring a film.<br />Bring your people.</span><span className="ticket-mark">fliccs</span></div>
                    </div>
                </section>

                <section id="how-it-works" className="intro-modes" aria-labelledby="modes-title">
                    <h2 id="modes-title" className="sr-only">Inside a Fliccs room</h2>
                    <div className="intro-mode-grid">
                        <article>
                            <h3>SYNC</h3>
                            <p>Same file on every device. Play, pause, and seek together.</p>
                        </article>
                        <article>
                            <h3>STREAM</h3>
                            <p>You play the video. Your friends watch in their browsers.</p>
                        </article>
                    </div>
                    <div className="intro-room-preview">
                        <div className="intro-chat-example">
                            <h3><FaComments aria-hidden="true" /> ROOM CHAT <span>Preview</span></h3>
                            <div className="intro-message">
                                <img src="https://api.dicebear.com/9.x/avataaars-neutral/svg?seed=fliccs-sam" alt="" width="32" height="32" loading="lazy" />
                                <div><span>Sam</span><p>wait, this is the good part</p></div>
                            </div>
                            <div className="intro-message intro-message-self">
                                <p>turning it up</p>
                                <img src="https://api.dicebear.com/9.x/avataaars-neutral/svg?seed=fliccs-alex" alt="" width="32" height="32" loading="lazy" />
                            </div>
                        </div>
                        <div className="intro-room-details">
                            <p><FaLink aria-hidden="true" /><span>Share a link. They're in.</span></p>
                            <p><FaExpand aria-hidden="true" /><span>Go fullscreen. Keep the chat.</span></p>
                        </div>
                    </div>
                </section>
            </main>
            <footer className="intro-footer">
                <span className="font-medium bg-gradient-to-r from-purple-400/60 via-gray-400 to-purple-400/60 bg-[length:200%_auto] text-transparent bg-clip-text animate-shine">Fliccs &bull; 2026</span>
                <nav aria-label="Information">
                    <Link to="/privacy">Privacy</Link>
                    <Link to="/terms-and-conditions">Terms</Link>
                    <Link to="/refund">Refunds</Link>
                    <a href="https://rajinkhan.com" target="_blank" rel="noopener noreferrer" className="intro-signature font-la-belle-aurore bg-gradient-to-r from-gray-400 via-white to-gray-400 bg-[length:200%_auto] text-transparent bg-clip-text animate-shine">Rajin Khan</a>
                </nav>
            </footer>
        </div>
    );
}
