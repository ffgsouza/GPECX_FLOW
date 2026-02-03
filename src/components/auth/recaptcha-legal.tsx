
import React from 'react';

export function RecaptchaLegal() {
    return (
        <div className="fixed bottom-0 right-0 p-1 bg-white/50 backdrop-blur-sm text-[10px] text-slate-500 hover:text-slate-800 transition-colors z-[9999]">
            This site is protected by reCAPTCHA and the Google{' '}
            <a href="https://policies.google.com/privacy" className="underline hover:text-blue-600" target="_blank" rel="noreferrer">
                Privacy Policy
            </a>{' '}
            and{' '}
            <a href="https://policies.google.com/terms" className="underline hover:text-blue-600" target="_blank" rel="noreferrer">
                Terms of Service
            </a>{' '}
            apply.
        </div>
    );
}
