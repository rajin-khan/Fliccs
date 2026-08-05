// client/src/components/Legal/TermsModal.jsx
import React, { useEffect, useState } from 'react';
import { FaFileContract } from 'react-icons/fa';

function TermsModal({ isOpen, onClose }) {
    const [isRendered, setIsRendered] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsRendered(true);
            setTimeout(() => setIsVisible(true), 50);
        } else {
            setIsVisible(false);
            const timer = setTimeout(() => setIsRendered(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

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
        <div
            className={`fixed inset-0 z-50 bg-black/90 flex items-center justify-center font-barlow transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
            onClick={onClose}
        >
            <div
                className={`bg-[#0a0a0a] border border-white/10 text-white p-8 rounded-3xl shadow-2xl w-full max-w-xl mx-auto relative overflow-hidden transform transition-all duration-300 cubic-bezier(0.34, 1.56, 0.64, 1) ${isVisible ? 'scale-100 translate-y-0 opacity-100' : 'scale-95 translate-y-8 opacity-0'}`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 text-white/30 hover:text-white text-2xl transition-all duration-300 transform hover:scale-110 hover:rotate-90 origin-center z-10"
                >
                    &times;
                </button>

                <h2 className="text-xl font-medium mb-8 text-brand-primary tracking-wide flex items-center gap-3">
                    <FaFileContract className="text-2xl opacity-80" />
                    <span className="text-2xl">Terms of Service</span>
                </h2>

                <div className="text-sm text-gray-400 font-light space-y-4 max-h-[65vh] overflow-y-auto pr-2 leading-relaxed custom-scrollbar">
                    <p>
                        By using Fliccs, you acknowledge and agree to the following terms:
                    </p>
                    <ul className="list-disc pl-5 space-y-3 marker:text-brand-primary">
                        <li>
                            Fliccs is intended for personal use and collaborative media syncing only.
                        </li>
                        <li>
                            Users are solely responsible for the content they stream or share using this application.
                        </li>
                        <li>
                            Fliccs does not host or distribute any copyrighted media.
                        </li>
                        <li>
                            Fliccs does not store any video content.
                        </li>
                        <li>
                            Any misuse of this application for illegal streaming or distribution is <span className="text-red-400 font-normal">STRICTLY PROHIBITED</span>.
                        </li>
                        <li>
                            Misuse or abuse of the platform WILL result in access restrictions.
                        </li>
                        <li>
                            These terms may be updated periodically without notice.
                        </li>
                        <li>
                            We are NOT liable for any DMCA violations, user behavior, or third-party copyright infringement.
                        </li>
                        <li>
                            Fliccs is provided as-is, without warranties. The developer assumes no responsibility for any misuse of this platform.
                        </li>
                    </ul>
                    <p className="text-xs text-gray-500 pt-4 border-t border-white/5">
                        By continuing to use Fliccs, you automatically accept these terms.
                    </p>
                </div>

                <div className="mt-8 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-8 py-3 rounded-full bg-white text-black font-medium hover:bg-gray-200 transition-colors duration-300 text-sm tracking-wide transform hover:scale-105 active:scale-95"
                    >
                        Accept & Close
                    </button>
                </div>
            </div>
        </div>
    );
}

export default TermsModal;
