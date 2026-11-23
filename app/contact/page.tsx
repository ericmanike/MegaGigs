'use client';
import React, { useState, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';

function ContactPage() {
    const [submitting, setSubmitting] = useState(false);
    const [succeeded, setSucceeded] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
    const turnstileRef = useRef<TurnstileInstance>(null);
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

    const { ref, inView } = useInView({
        threshold: 0.2,
        triggerOnce: true
    });

    const { ref: Submit, inView: sinView } = useInView({
        threshold: 0.2,
        triggerOnce: true
    });

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);

        if (siteKey && !turnstileToken) {
            setError("Please complete the security check before sending.");
            return;
        }

        setSubmitting(true);

        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...data, turnstileToken }),
            });

            const result = await response.json();

            if (response.ok && result.success) {
                setSucceeded(true);
            } else {
                setError(result.error || "Submission failed. Please try again later.");
                turnstileRef.current?.reset();
                setTurnstileToken(null);
            }
        } catch (err) {
            setError("Submission failed. Please try again later.");
            turnstileRef.current?.reset();
            setTurnstileToken(null);
        } finally {
            setSubmitting(false);
        }
    };

    if (succeeded) {
        return (
            <div className="bg-inherit min-h-screen flex items-center justify-center p-5">
                <div className="shadow-lg rounded-xl p-8 w-full max-w-lg text-center bg-white border border-blue-100">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Message Sent!</h2>
                    <p className="text-slate-600 mb-6">Thank you for reaching out. We'll get back to you as soon as possible.</p>
                    <button
                        onClick={() => {
                            setSucceeded(false);
                            setTurnstileToken(null);
                            setError(null);
                        }}
                        className="w-full bg-[#191097] text-white font-semibold py-2 rounded-lg hover:bg-[#0b3eb4] transition-all cursor-pointer"
                    >
                        Send Another Message
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-inherit min-h-screen flex items-center justify-center p-5">
            <div className={`shadow-lg rounded-xl p-8 w-full max-w-lg bg-white border border-slate-100 transition-all duration-700 ${inView ? 'opacity-100' : 'opacity-0'}`} ref={ref}>
                <h2 className={`text-2xl font-bold text-blue-600 mb-6 text-center transition-all duration-1000 
          ${inView ? 'opacity-100 translate-y-0' : 'translate-y-4 opacity-0'}`}>
                    Contact MegaGigs
                </h2>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm font-medium text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                        <input
                            id="name"
                            type="text"
                            name="name"
                            required
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                            placeholder="Your Name"
                        />
                    </div>

                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                        <input
                            id="email"
                            type="email"
                            name="email"
                            required
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                            placeholder="your@email.com"
                        />
                    </div>

                    <div>
                        <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-1">Message</label>
                        <textarea
                            id="message"
                            name="message"
                            required
                            rows={4}
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                            placeholder="How can we help you?"
                        />
                    </div>

                    {siteKey && (
                        <div className="flex justify-center my-3 min-h-[65px]">
                            <Turnstile
                                ref={turnstileRef}
                                siteKey={siteKey}
                                onSuccess={(token) => {
                                    setTurnstileToken(token);
                                    setError(null);
                                }}
                                onError={(err) => {
                                    setTurnstileToken(null);
                                    if (String(err) === "110200") {
                                        setError("Turnstile Error 110200: 'localhost' is not in your allowed domains in the Cloudflare Turnstile dashboard.");
                                    } else {
                                        setError(`Security verification failed to load (Error ${err}).`);
                                    }
                                }}
                                onExpire={() => setTurnstileToken(null)}
                            />
                        </div>
                    )}

                    <button
                        ref={Submit}
                        type="submit"
                        disabled={submitting}
                        className={`w-full bg-[#191097] text-white font-semibold py-3 rounded-lg hover:bg-[#0b3eb4] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-500 cursor-pointer
               ${sinView ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
                    >
                        {submitting ? 'Sending...' : 'Send Message'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default ContactPage;

