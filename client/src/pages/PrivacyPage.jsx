import React from 'react';
import PageLayout from '../components/Layout/PageLayout';

export default function PrivacyPage() {
    return (
        <PageLayout title="Privacy Policy">
            <div className="prose prose-invert prose-lg max-w-none text-gray-400 font-light leading-loose space-y-12">
                <div>
                    <p className="text-sm text-brand-primary font-bold uppercase tracking-widest mb-6">Last updated: January 2026</p>
                    <p className="text-xl text-white/80 font-normal">
                        Your privacy is non-negotiable. Fliccs is built to be ephemeral, meaning we don't store what you don't ask us to.
                    </p>
                </div>

                <section>
                    <h3 className="text-2xl text-white font-medium mb-6 flex items-center gap-3">
                        <span className="text-brand-primary/50">01.</span> Data Collection
                    </h3>
                    <p>
                        We prioritize your privacy. We do not collect personal usage data from our Free tier users. For Premium users, we collect only the information necessary to provide the service (such as email address for authentication and payment processing details through our secure payment provider).
                    </p>
                </section>

                <section>
                    <h3 className="text-2xl text-white font-medium mb-6 flex items-center gap-3">
                        <span className="text-brand-primary/50">02.</span> Use of Data
                    </h3>
                    <p>
                        Any data collected is used solely for the purpose of maintaining your account, processing payments, and ensuring the technical stability of our service. We do not sell your data to third parties. Ever.
                    </p>
                </section>

                <section>
                    <h3 className="text-2xl text-white font-medium mb-6 flex items-center gap-3">
                        <span className="text-brand-primary/50">03.</span> Session Ephermerality
                    </h3>
                    <p>
                        Fliccs sessions are designed to be ephemeral. We do not persistently store chat logs, file metadata, or stream contents after a session has ended. Once a room is destroyed, the data is gone.
                    </p>
                </section>

                <section>
                    <h3 className="text-2xl text-white font-medium mb-6 flex items-center gap-3">
                        <span className="text-brand-primary/50">04.</span> Cookies & Storage
                    </h3>
                    <p>
                        We use essential local storage to maintain your session and preferences. We do not use third-party tracking cookies for advertising purposes.
                    </p>
                </section>
            </div>
        </PageLayout>
    );
}
