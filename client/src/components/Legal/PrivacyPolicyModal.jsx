// client/src/components/Legal/PrivacyPolicyModal.jsx
import React, { useEffect, useState } from 'react';
import { FaShieldAlt } from 'react-icons/fa';

function PrivacyPolicyModal({ show, onClose }) {
    const [isRendered, setIsRendered] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (show) {
            setIsRendered(true);
            setTimeout(() => setIsVisible(true), 50);
        } else {
            setIsVisible(false);
            const timer = setTimeout(() => setIsRendered(false), 300);
            return () => clearTimeout(timer);
        }
    }, [show]);

    // Standardize escape key handling
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };

        if (show) {
            document.addEventListener('keydown', handleEsc);
        }

        return () => document.removeEventListener('keydown', handleEsc);
    }, [show, onClose]);

    if (!isRendered) return null;

    return (
        <div
            className={`fixed inset-0 z-50 bg-black/90 flex items-center justify-center font-barlow transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
            onClick={onClose}
        >
            <div
                className={`bg-[#0a0a0a] border border-white/10 text-white p-8 rounded-3xl shadow-2xl w-full max-w-xl mx-auto relative overflow-hidden transform transition-all duration-300 cubic-bezier(0.34, 1.56, 0.64, 1) ${isVisible ? 'scale-100 translate-y-0 opacity-100' : 'scale-95 translate-y-8 opacity-0'}`}
                onClick={e => e.stopPropagation()}
            >

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 text-white/30 hover:text-white text-2xl transition-all duration-300 transform hover:scale-110 hover:rotate-90 origin-center z-10"
                >
                    &times;
                </button>

                <h2 className="text-xl font-medium mb-8 text-brand-primary tracking-wide flex items-center gap-3">
                    <FaShieldAlt className="text-2xl opacity-80" />
                    <span className="text-2xl">Privacy Policy</span>
                </h2>

                <div className="space-y-5 text-sm text-gray-400 font-light max-h-[65vh] overflow-y-auto pr-2 leading-relaxed custom-scrollbar">
                    <p>
                        Fliccs does not collect, store, or share any personal data. All activity happens <span className="text-white font-normal">peer-to-peer</span> and is session-based. No video files are uploaded to any server.
                    </p>
                    <p>
                        Your nickname and messages are temporarily stored in your browser memory for the duration of the session and are cleared when you leave.
                    </p>
                    <p>
                        By using Fliccs, you acknowledge that the platform is designed for private, ephemeral video sessions with friends, and you are fully responsible for the content you stream.
                    </p>
                    <p className="text-xs text-gray-500 pt-4 border-t border-white/5">
                        We use no cookies, trackers, or analytics. You are fully in control of your privacy.
                    </p>
                </div>

                <div className="mt-8 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-8 py-3 rounded-full bg-white text-black font-medium hover:bg-gray-200 transition-colors duration-300 text-sm tracking-wide transform hover:scale-105 active:scale-95"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

export default PrivacyPolicyModal;