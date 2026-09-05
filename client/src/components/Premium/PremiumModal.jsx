// client/src/components/Premium/PremiumModal.jsx
import { useEffect, useState } from 'react';
import { FaCheck, FaTimes, FaGem, FaInfinity, FaServer, FaMicrophone } from 'react-icons/fa';
import BrandLogo from '../BrandLogo';
import premiumImg from '../../assets/promo/premium.png';

export default function PremiumModal({ isOpen, onClose }) {
    const [isRendered, setIsRendered] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsRendered(true);
            // Small delay to ensure browser paints initial state
            setTimeout(() => setIsVisible(true), 50);
        } else {
            setIsVisible(false);
            const timer = setTimeout(() => setIsRendered(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    // Handling Escape key for accessibility
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEsc);
        }

        return () => document.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    if (!isRendered) return null;

    return (
        <div className={`fixed inset-0 z-[200] flex items-center justify-center p-4 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-[#000000]/90 backdrop-blur-sm transition-opacity duration-300"
                onClick={onClose}
            ></div>

            {/* Modal Card - Landscape Layout */}
            <div
                className={`relative w-full max-w-5xl bg-[#080808] border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl transform transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1) ${isVisible ? 'scale-100 translate-y-0 opacity-100' : 'scale-95 translate-y-8 opacity-0'} max-h-[90vh] overflow-y-auto md:overflow-visible`}
                onClick={e => e.stopPropagation()}
            >
                {/* Background Ambient Effects */}
                <div className="absolute top-[-50%] right-[-10%] w-[70%] h-[150%] bg-brand-primary/10 blur-[120px] rounded-full mix-blend-screen pointer-events-none opacity-40" />
                <div className="absolute bottom-[-50%] left-[-10%] w-[60%] h-[150%] bg-brand-yellow/5 blur-[100px] rounded-full mix-blend-screen pointer-events-none opacity-30" />

                <div className="relative z-10 flex flex-col md:flex-row md:min-h-[500px] font-barlow">

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        aria-label="Close premium details"
                        className="absolute top-4 right-4 md:top-6 md:right-6 text-white/30 hover:text-white transition-all duration-300 p-2 z-50 transform hover:scale-110 hover:rotate-90 origin-center"
                    >
                        <FaTimes size={16} />
                    </button>

                    {/* Left Side: Visuals & Hook */}
                    <div className="md:w-5/12 p-6 md:p-12 flex flex-col justify-between relative overflow-hidden border-b md:border-b-0 md:border-r border-white/5 bg-white/[0.02]">
                        <div className="relative z-10">
                            <BrandLogo size="md" alt="Fliccs Premium" className="mb-8" />
                            <h2 className="text-3xl md:text-5xl text-white font-medium tracking-tight mb-4 leading-[0.95] uppercase">
                                Upgrade your <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-yellow via-amber-200 to-brand-yellow font-bold">Watch Parties.</span>
                            </h2>
                            <p className="text-gray-400 font-light text-sm md:text-base max-w-xs leading-relaxed uppercase tracking-wide">
                                Fliccs is evolving. Secure your spot for the ultimate streaming experience.
                            </p>
                        </div>

                        {/* Bottom Info on Left */}
                        <div className="relative z-10 mt-12 md:mt-0 space-y-4">
                            <div className="p-4 rounded-xl bg-gradient-to-br from-brand-yellow/10 to-transparent border border-brand-yellow/10 backdrop-blur-sm">
                                <h4 className="text-brand-yellow text-xs font-bold uppercase tracking-widest mb-1 flex items-center gap-2">
                                    <FaGem /> Early Supporter Perk
                                </h4>
                                <p className="text-gray-300 text-xs md:text-sm font-light uppercase tracking-wide">
                                    Want a <b>Lifetime Premium Account</b>? Reach out directly to the developer now for early access perks.
                                </p>
                            </div>
                        </div>

                        {/* Subtle grid pattern overlay for texture */}
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay pointer-events-none"></div>
                    </div>

                    {/* Right Side: Features & CTA */}
                    <div className="md:w-7/12 p-6 md:p-12 flex flex-col justify-center relative overflow-hidden">

                        {/* Blurred Gold Background Asset - Increased blur to 40px */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40 mix-blend-screen scale-110 translate-x-8">
                            <img src={premiumImg} alt="" className="w-full h-auto object-cover blur-[40px]" />
                        </div>

                        {/* Gradient Overlay for Text Readability */}
                        <div className="absolute inset-0 bg-gradient-to-r from-[#080808]/80 via-[#080808]/40 to-transparent pointer-events-none" />

                        <div className="relative z-10 space-y-3 mb-8">
                            <FeatureRow
                                icon={<FaInfinity />}
                                title="Unlimited Participants"
                                desc="Host massive watch parties without any room caps."
                            />
                            <FeatureRow
                                icon={<FaServer />}
                                title="Stream Mode Moves to Premium"
                                desc="Broadcasting your local files will soon be a Premium feature. Enjoy high-bitrate global nodes."
                            />
                            <FeatureRow
                                icon={<FaMicrophone />}
                                title="Voice Channels"
                                desc="Crystal clear voice chat built right into the room. No external apps needed."
                            />
                            <FeatureRow
                                icon={<FaCheck />}
                                title="Zero Ads"
                                desc="Pure, uninterrupted entertainment for you and your guests."
                            />
                        </div>

                        {/* CTA Section */}
                        <div className="relative z-10 mt-auto">
                            <div className="relative group w-full">
                                {/* Fixed glow - tighter and less spread */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[98%] h-[80%] bg-gradient-to-r from-brand-yellow/40 via-brand-primary/40 to-brand-yellow/40 rounded-full blur-xl opacity-0 group-hover:opacity-40 transition duration-700"></div>

                                <button disabled className="relative w-full py-4 bg-white/5 border border-white/10 text-white/50 font-bold uppercase tracking-[0.2em] rounded-full cursor-not-allowed flex items-center justify-center gap-3">
                                    <span>Coming Soon</span>
                                </button>
                            </div>
                            <p className="mt-4 text-center text-[10px] text-white/30 uppercase tracking-widest font-medium">
                                Expected Launch: August 2026
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function FeatureRow({ icon, title, desc }) {
    return (
        <div className="flex gap-5 text-left group p-4 rounded-xl hover:bg-white/5 transition-colors duration-300">
            <div className="shrink-0 mt-1 w-10 h-10 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-lg text-white/80 transition-all duration-300 group-hover:scale-110 group-hover:bg-white/10 group-hover:text-white">
                {icon}
            </div>
            <div>
                <h3 className="text-white font-medium text-lg mb-1 uppercase tracking-wide">{title}</h3>
                <p className="text-gray-500 text-sm font-light leading-relaxed group-hover:text-gray-400 transition-colors uppercase tracking-wide opacity-80">{desc}</p>
            </div>
        </div>
    );
}
