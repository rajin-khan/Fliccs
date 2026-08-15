import React from 'react';
import PageLayout from '../components/Layout/PageLayout';

export default function TermsPage() {
    return (
        <PageLayout title="Terms of Service" description="The plain-language rules for using Fliccs and its services.">
            <div className="policy-content">
                <div className="policy-intro">
                    <p className="policy-kicker">Last updated: January 2026</p>
                    <p className="policy-lead">
                        Welcome to Fliccs. By accessing or using our website and services, you agree to be bound by these Terms of Service and all applicable laws and regulations.
                    </p>
                </div>

                <section>
                    <h3 className="text-2xl text-white font-medium mb-6 flex items-center gap-3">
                        <span className="text-brand-primary/50">01.</span> Use License
                    </h3>
                    <p>
                        Permission is granted to temporarily view the materials (information or software) on Fliccs's website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title.
                    </p>
                </section>

                <section>
                    <h3 className="text-2xl text-white font-medium mb-6 flex items-center gap-3">
                        <span className="text-brand-primary/50">02.</span> User Responsibilities
                    </h3>
                    <p>
                        You are responsible for your use of the service and for any content you provide, including compliance with applicable laws, rules, and regulations. You should only use content that you have the right to use. We maintain the right to terminate services for users found violating these terms.
                    </p>
                </section>

                <section>
                    <h3 className="text-2xl text-white font-medium mb-6 flex items-center gap-3">
                        <span className="text-brand-primary/50">03.</span> Disclaimer
                    </h3>
                    <p>
                        The materials on Fliccs's website are provided on an 'as is' basis. Fliccs makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property.
                    </p>
                </section>

                <section>
                    <h3 className="text-2xl text-white font-medium mb-6 flex items-center gap-3">
                        <span className="text-brand-primary/50">04.</span> Limitations
                    </h3>
                    <p>
                        In no event shall Fliccs or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Fliccs's website.
                    </p>
                </section>

                <section>
                    <h3 className="text-2xl text-white font-medium mb-6 flex items-center gap-3">
                        <span className="text-brand-primary/50">05.</span> Proprietor
                    </h3>
                    <p>
                        Fliccs is owned and operated by <a href="https://rajinkhan.com/about" target="_blank" rel="noopener noreferrer" className="text-white hover:text-brand-primary transition-colors border-b border-white/30 hover:border-brand-primary">Adib Ar Rahman Khan (also known as{' '}
                            <span className="font-la-belle-aurore policy-signature">
                                Rajin Khan
                            </span>
                        )</a>.
                    </p>
                </section>
            </div>
        </PageLayout>
    );
}
