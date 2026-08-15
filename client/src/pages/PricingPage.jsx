import React from 'react';
import PageLayout from '../components/Layout/PageLayout';
import { FaCheck, FaTimes } from 'react-icons/fa';

export default function PricingPage() {

    const plans = [
        {
            id: 'free',
            name: 'Starter',
            price: '$0',
            period: 'forever',
            billed: 'Always free',
            features: [
                { name: 'Sync Mode', included: true },
                { name: 'Up to 4 Participants', included: true },
                { name: 'Stream Mode', included: false },
                { name: 'Voice Channels', included: false },
                { name: 'No Ads', included: false },
            ],
            cta: 'Current Plan',
            active: false,
            theme: 'gray'
        },
        {
            id: 'monthly',
            name: 'Premium Monthly',
            price: '$4.99',
            period: '/mo',
            billed: 'Billed monthly',
            features: [
                { name: 'Sync Mode', included: true },
                { name: 'Up to 10 Participants', included: true },
                { name: 'Stream Mode', included: true },
                { name: 'Voice Channels', included: true },
                { name: 'No Ads', included: true },
            ],
            cta: 'Select Monthly',
            active: true,
            theme: 'silver'
        },
        {
            id: 'yearly',
            name: 'Premium Yearly',
            price: '$2.92',
            period: '/mo',
            billed: '$34.99 billed yearly',
            features: [
                { name: 'Sync Mode', included: true },
                { name: 'Up to 10 Participants', included: true },
                { name: 'Stream Mode', included: true },
                { name: 'Voice Channels', included: true },
                { name: 'No Ads', included: true },
            ],
            cta: 'Select Yearly',
            active: true,
            theme: 'gold',
            recommended: true
        }
    ];

    return (
        <PageLayout
            title="Choose Your Tier."
            description="Watch together for free, or unlock larger rooms and premium streaming features."
            surface={false}
        >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
                {plans.map((plan) => (
                    <div
                        key={plan.id}
                        className={`relative p-8 rounded-[2rem] border transition-all duration-500 group flex flex-col h-full ${plan.theme === 'gold'
                            ? 'bg-[#0F0F0F] border-brand-yellow/30 hover:border-brand-yellow/50 shadow-[0_0_50px_-10px_rgba(253,224,71,0.1)] z-10'
                            : plan.theme === 'silver'
                                ? 'bg-[#0a0a0a] border-purple-500/30 hover:border-brand-yellow/30 shadow-[0_0_30px_-10px_rgba(168,85,247,0.15)]'
                                : 'bg-[#050505] border-white/5 opacity-80 hover:opacity-100'
                            }`}
                    >
                        {plan.theme === 'silver' && (
                            <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-purple-500/10 via-transparent to-brand-yellow/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                        )}

                        {plan.theme === 'gold' && (
                            <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-tr from-brand-yellow/5 via-white/5 to-brand-yellow/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none animate-pulse-slow" />
                        )}

                        {plan.recommended && (
                            <div className="absolute -top-5 left-0 right-0 mx-auto w-max bg-gradient-to-r from-brand-yellow via-amber-200 to-brand-yellow text-black text-[10px] font-black px-6 py-2 rounded-full uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(253,224,71,0.4)] flex items-center gap-2 animate-shimmer bg-[length:200%_auto]">
                                Best Value
                            </div>
                        )}

                        <div className="mb-8 text-center lg:text-left relative z-10">
                            <h3 className={`text-xs font-bold uppercase tracking-[0.2em] mb-4 ${plan.theme === 'gold'
                                ? 'text-transparent bg-clip-text bg-gradient-to-r from-brand-yellow via-white to-brand-yellow bg-[length:200%_auto] animate-shine'
                                : plan.theme === 'silver'
                                    ? 'text-transparent bg-clip-text bg-gradient-to-r from-brand-primary via-brand-yellow to-brand-primary bg-[length:200%_auto] animate-shine'
                                    : 'text-gray-500'
                                }`}>
                                {plan.name}
                            </h3>
                            <div className="flex items-baseline justify-center lg:justify-start gap-1">
                                <span className={`text-5xl font-semibold tracking-tighter ${plan.theme === 'gold'
                                    ? 'text-transparent bg-clip-text bg-gradient-to-r from-brand-yellow via-white to-brand-yellow bg-[length:200%_auto] animate-shine'
                                    : plan.theme === 'silver'
                                        ? 'text-transparent bg-clip-text bg-gradient-to-r from-brand-primary via-brand-yellow to-brand-primary bg-[length:200%_auto] animate-shine'
                                        : 'text-white'
                                    }`}>
                                    {plan.price}
                                </span>
                                <span className="text-sm text-gray-500 font-medium">{plan.period}</span>
                            </div>
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-2 font-medium">{plan.billed}</p>
                        </div>

                        {/* Divider */}
                        <div className={`h-px w-full mb-8 ${plan.theme === 'gold' ? 'bg-gradient-to-r from-transparent via-brand-yellow/20 to-transparent' : 'bg-white/5'
                            }`} />

                        <ul className="space-y-4 mb-10 flex-1 relative z-10">
                            {plan.features.map((feature) => (
                                <li key={feature.name} className="flex items-center gap-3 text-sm group/item">
                                    {feature.included ? (
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0 ${plan.theme === 'gold'
                                            ? 'bg-brand-yellow/10 text-brand-yellow'
                                            : 'bg-white/10 text-white'
                                            }`}>
                                            <FaCheck />
                                        </div>
                                    ) : (
                                        <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center text-white/10 text-[10px] shrink-0">
                                            <FaTimes />
                                        </div>
                                    )}
                                    <span className={`font-medium transition-colors ${feature.included
                                        ? plan.theme === 'gold' ? 'text-gray-200' : 'text-gray-400'
                                        : 'text-gray-800'
                                        }`}>
                                        {feature.name}
                                    </span>
                                </li>
                            ))}
                        </ul>

                        <div className="mt-auto relative z-10">
                            <button
                                disabled={!plan.active}
                                className={`w-full py-4 rounded-xl font-bold uppercase tracking-[0.2em] text-[10px] transition-all duration-300 ${plan.theme === 'gold'
                                    ? 'bg-brand-yellow text-black hover:bg-white shadow-[0_0_30px_-5px_rgba(253,224,71,0.3)] hover:shadow-[0_0_50px_-5px_rgba(253,224,71,0.5)]'
                                    : plan.active
                                        ? 'bg-white text-black hover:bg-gray-200'
                                        : 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5'
                                    }`}
                            >
                                {plan.cta}
                            </button>
                            {plan.active && (
                                <p className="text-center text-[9px] text-gray-600 mt-4 uppercase tracking-widest">
                                    Secure payment processing
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </PageLayout>
    );
}
