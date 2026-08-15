import React from 'react';
import PageLayout from '../components/Layout/PageLayout';

export default function RefundPage() {
    return (
        <PageLayout title="Refund Policy" description="A straightforward refund and cancellation policy for Fliccs Premium.">
            <div className="policy-content">
                <div className="policy-intro">
                    <p className="policy-kicker">Last updated: January 2026</p>
                    <p className="policy-lead">
                        We want you to be happy with Fliccs Premium. If it's not working out, we've got you covered.
                    </p>
                </div>

                <section>
                    <h3 className="text-2xl text-white font-medium mb-6 flex items-center gap-3">
                        <span className="text-brand-primary/50">01.</span> Satisfaction Guarantee
                    </h3>
                    <p>
                        If you are not satisfied with your Fliccs Premium subscription within the first 14 days of your purchase, you may request a full refund. No questions asked.
                    </p>
                </section>

                <section>
                    <h3 className="text-2xl text-white font-medium mb-6 flex items-center gap-3">
                        <span className="text-brand-primary/50">02.</span> Processing Refunds
                    </h3>
                    <p>
                        To request a refund, simply reply to your purchase email or contact support. We process all valid refund requests within 5-7 business days, returning funds to your original payment method.
                    </p>
                </section>

                <section>
                    <h3 className="text-2xl text-white font-medium mb-6 flex items-center gap-3">
                        <span className="text-brand-primary/50">03.</span> Cancellation Policy
                    </h3>
                    <p>
                        You can cancel your subscription at any time via your account settings. Upon cancellation, your premium benefits will continue until the end of your current billing cycle, after which you will revert to the Free tier.
                    </p>
                </section>
            </div>
        </PageLayout>
    );
}
