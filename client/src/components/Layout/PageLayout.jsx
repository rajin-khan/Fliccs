import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import BrandLogo from '../BrandLogo';

export default function PageLayout({ children, title, description, surface = true }) {
    const navigate = useNavigate();

    return (
        <div className="min-h-[100dvh] bg-[#05050a] w-full flex flex-col font-barlow overflow-x-hidden relative selection:bg-brand-primary selection:text-white">
            <div className="fixed inset-0 pointer-events-none" aria-hidden="true">
                <div className="absolute -top-48 -left-40 w-[34rem] h-[34rem] rounded-full bg-brand-primary/[0.12] blur-[140px]" />
                <div className="absolute -bottom-64 -right-48 w-[38rem] h-[38rem] rounded-full bg-brand-accent/[0.10] blur-[150px]" />
                <div className="absolute inset-0 opacity-[0.16] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08)_0.6px,transparent_0.7px)] bg-[length:18px_18px]" />
            </div>

            <a
                href="#page-content"
                className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-xs focus:font-semibold focus:uppercase focus:tracking-wider focus:text-black"
            >
                Skip to content
            </a>

            <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#05050a]/85 backdrop-blur-xl supports-[backdrop-filter]:bg-[#05050a]/70">
                <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:h-20 sm:px-6 lg:px-8">
                    <button
                        type="button"
                        onClick={() => navigate('/')}
                        className="group inline-flex min-h-10 items-center gap-3 rounded-full pr-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                        aria-label="Back to Fliccs home"
                    >
                        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-[10px] text-white/60 transition group-hover:border-brand-primary/50 group-hover:bg-brand-primary/10 group-hover:text-white">
                            <FaArrowLeft />
                        </span>
                        <BrandLogo size="sm" className="opacity-90 transition-opacity group-hover:opacity-100" />
                        <span className="hidden text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35 transition-colors group-hover:text-white/70 sm:inline">
                            Back home
                        </span>
                    </button>
                    <span className="max-w-[45vw] truncate text-[10px] font-semibold uppercase tracking-[0.2em] text-white/25">
                        {title}
                    </span>
                </div>
            </header>

            <main id="page-content" className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-4 pb-16 pt-9 sm:px-6 sm:pb-24 sm:pt-14 lg:px-8">
                {title && (
                    <div className="mb-8 max-w-3xl animate-fade-in-up sm:mb-12">
                        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-primary/80">Fliccs / Information</p>
                        <h1 className="text-4xl font-medium leading-none tracking-[-0.035em] text-white sm:text-6xl">
                            {title}
                        </h1>
                        {description && (
                            <p className="mt-5 max-w-2xl text-base font-light leading-relaxed text-white/45 sm:text-lg">
                                {description}
                            </p>
                        )}
                    </div>
                )}

                {surface ? (
                    <article className="relative animate-fade-in-up rounded-2xl border border-white/[0.08] bg-[#09090d]/90 px-5 py-6 shadow-[0_28px_90px_-50px_rgba(100,53,172,0.55)] sm:rounded-3xl sm:p-10 lg:p-12">
                        <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                        {children}
                    </article>
                ) : (
                    <div className="animate-fade-in-up">{children}</div>
                )}
            </main>

            <footer className="relative z-10 border-t border-white/[0.05]">
                <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-6 text-[9px] font-medium uppercase tracking-[0.18em] text-white/25 sm:px-6 sm:text-[10px] lg:px-8">
                    <span>Fliccs &bull; 2026</span>
                    <button type="button" onClick={() => navigate('/')} className="transition-colors hover:text-white/60">
                        Return home
                    </button>
                </div>
            </footer>
        </div>
    );
}
