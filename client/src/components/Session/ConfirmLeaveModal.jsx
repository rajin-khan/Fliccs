// client/src/components/Session/ConfirmLeaveModal.jsx
import React from 'react';
import { createPortal } from 'react-dom';

function ConfirmLeaveModal({ isOpen, onConfirm, onCancel }) {
    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 px-4 animate-fade-in">
            <div
                className="animate-fade-in-up bg-[#0a0a12] border border-white/10 rounded-2xl p-8 w-full max-w-sm text-center text-white font-barlow relative overflow-hidden shadow-2xl"
            >
                {/* Ambient Red Glow for Danger Context */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-[60px] rounded-full pointer-events-none" />

                <h2 className="text-xl font-medium mb-3 tracking-tight">Leave Session?</h2>
                <p className="text-sm text-gray-400 font-light mb-8 leading-relaxed">
                    Are you sure you want to leave this session? <br />
                    <span className="text-white/30 text-xs">If you're the host, this ends the session.</span>
                </p>

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
                    <button
                        onClick={onCancel}
                        className="px-6 py-2.5 rounded-full text-gray-400 hover:text-white transition-colors text-sm font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-8 py-2.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all duration-300 text-sm font-medium shadow-lg shadow-red-900/10"
                    >
                        Confirm Leave
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}

export default ConfirmLeaveModal;