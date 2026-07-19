"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signInWithPopup, signInWithEmailLink, sendSignInLinkToEmail, isSignInWithEmailLink } from 'firebase/auth';
import { auth, googleProvider, githubProvider } from '@/lib/firebase';

export default function LoginPage() {
    const [isDark, setIsDark] = useState(false);
    const [emailViewOpen, setEmailViewOpen] = useState(false);
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState({ type: '', message: '' });
    const router = useRouter();

    useEffect(() => {
        // Theme init
        const e = localStorage.getItem('theme');
        if ('system' === e || (!e && true)) {
            const t = '(prefers-color-scheme: dark)', m = window.matchMedia(t);
            if (m.media !== t || m.matches) { 
                document.documentElement.classList.add('dark');
                setIsDark(true);
            } else { 
                document.documentElement.classList.remove('dark');
                setIsDark(false);
            }
        } else if (e === 'dark') { 
            document.documentElement.classList.add('dark');
            setIsDark(true);
        } else {
            document.documentElement.classList.remove('dark');
            setIsDark(false);
        }
    }, []);

    useEffect(() => {
        // Debug check to ensure env vars are loaded
        if (!auth.app.options.apiKey) {
            console.error("FIREBASE API KEY IS MISSING! Check your .env.local and restart the server.");
            setStatus({ type: 'error', message: 'Firebase configuration is missing. Check console.' });
        }

        // Handle Email Link Sign-in return
        if (isSignInWithEmailLink(auth, window.location.href)) {
            let emailForSignIn = window.localStorage.getItem('emailForSignIn');
            if (!emailForSignIn) {
                emailForSignIn = window.prompt('Please provide your email for confirmation');
            }
            if (emailForSignIn) {
                signInWithEmailLink(auth, emailForSignIn, window.location.href)
                    .then(() => {
                        window.localStorage.removeItem('emailForSignIn');
                        router.push('/dashboard');
                    })
                    .catch((error) => {
                        setStatus({ type: 'error', message: 'Error signing in with email link.' });
                        console.error(error);
                    });
            }
        }
    }, [router]);

    const handleGoogleSignIn = async () => {
        try {
            setStatus({ type: '', message: 'Opening Google login...' });
            await signInWithPopup(auth, googleProvider);
            router.push('/dashboard');
        } catch (error: any) {
            console.error('Google sign in error:', error);
            setStatus({ type: 'error', message: error.message });
        }
    };

    const handleGithubSignIn = async () => {
        try {
            setStatus({ type: '', message: 'Opening GitHub login...' });
            await signInWithPopup(auth, githubProvider);
            router.push('/dashboard');
        } catch (error: any) {
            console.error('GitHub sign in error:', error);
            setStatus({ type: 'error', message: error.message });
        }
    };

    const handleEmailLinkSignIn = async () => {
        if (!email) return;
        setStatus({ type: '', message: '' });
        
        const actionCodeSettings = {
            url: window.location.origin + '/login',
            handleCodeInApp: true,
        };

        try {
            await sendSignInLinkToEmail(auth, email, actionCodeSettings);
            window.localStorage.setItem('emailForSignIn', email);
            setStatus({ type: 'success', message: 'Check your email for the magic link!' });
        } catch (error: any) {
            console.error('Email link error:', error);
            setStatus({ type: 'error', message: error.message });
        }
    };

    const toggleTheme = () => {
        const nextIsDark = !isDark;
        if (nextIsDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        setIsDark(nextIsDark);
        localStorage.setItem('theme', nextIsDark ? 'dark' : 'light');
    };

    return (
        <div className="bg-white antialiased dark:bg-black selection:bg-selection/10 selection:text-selection dark:selection:bg-selection/10 dark:selection:text-selection min-h-screen">
            {/* Theme Toggle Button */}
            <button 
                onClick={toggleTheme}
                className="fixed top-4 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-white/90 shadow-lg backdrop-blur-xl transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900/90 dark:hover:bg-neutral-800"
            >
                {/* Sun Icon (Visible in Light Mode) */}
                <svg className={`${isDark ? 'hidden' : 'block'} h-5 w-5 text-yellow-500`} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.592-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z"></path>
                </svg>
                {/* Moon Icon (Visible in Dark Mode) */}
                <svg className={`${isDark ? 'block' : 'hidden'} h-5 w-5 text-neutral-700 dark:text-neutral-300`} fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" clipRule="evenodd"></path>
                </svg>
            </button>

            <div className="flex min-h-screen flex-col">
                <main className="flex-1">
                    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-neutral-100 dark:bg-gradient-to-br dark:from-black dark:via-neutral-950 dark:to-black">
                        <div className="theme-zinc w-full" style={{ radius: '0.5rem' } as any}>
                            <div className="flex min-h-full w-full items-center justify-center">
                                <div className="relative w-full overflow-hidden">
                                    
                                    {/* Premium Dark Mode Light Ray (Top Left) */}
                                    <div className="pointer-events-none absolute top-0 left-0 z-30 hidden h-screen w-screen overflow-hidden dark:block">
                                        <div className="absolute top-0 left-0 w-[80vw] h-[80vh] -translate-x-1/4 -translate-y-1/4 rounded-full bg-[radial-gradient(ellipse_at_center,_rgba(59,130,246,0.15),_transparent_60%)] blur-3xl"></div>
                                        <div className="absolute top-0 left-0 h-[150vh] w-[30vw] bg-gradient-to-b from-indigo-600/20 via-blue-600/5 to-transparent blur-3xl transform -rotate-12 origin-top-left"></div>
                                    </div>

                                    {/* Original Background Beams */}
                                    <div className="pointer-events-none absolute top-0 left-0 z-40 h-screen w-screen">
                                        <div style={{ transform: 'translateY(-350px) rotate(-45deg)', width: '560px', height: '1380px', background: 'radial-gradient(68.54% 68.72% at 55.02% 31.46%, hsla(210, 100%, 85%, .08) 0, hsla(210, 100%, 55%, .02) 50%, hsla(210, 100%, 45%, 0) 80%)' }} className="absolute top-0 left-0"></div>
                                        <div style={{ transform: 'rotate(-45deg) translate(5%, -50%)', transformOrigin: 'top left', width: '240px', height: '1380px', background: 'radial-gradient(50% 50% at 50% 50%, hsla(210, 100%, 85%, .06) 0, hsla(210, 100%, 55%, .02) 80%, transparent 100%)' }} className="absolute top-0 left-0"></div>
                                        <div style={{ position: 'absolute', borderRadius: '20px', transform: 'rotate(-45deg) translate(-180%, -70%)', transformOrigin: 'top left', top: 0, left: 0, width: '240px', height: '1380px', background: 'radial-gradient(50% 50% at 50% 50%, hsla(210, 100%, 85%, .04) 0, hsla(210, 100%, 45%, .02) 80%, transparent 100%)' }} className="absolute top-0 left-0"></div>
                                    </div>

                                    {/* Login Form */}
                                    <form className="mx-auto flex h-screen max-w-lg flex-col items-center justify-center" onSubmit={(e) => e.preventDefault()}>
                                        <Link className="relative z-20 mr-4 flex items-center space-x-2 px-2 py-1 text-sm font-normal text-black" href="/">
                                            {/* Interact AI Logo */}
                                            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M12 2C6.477 2 2 6.477 2 12C2 14.0671 2.62278 15.9912 3.68832 17.5902L2.5 21.5L6.64793 20.4651C8.19202 21.4325 10.0306 22 12 22C17.523 22 22 17.523 22 12C22 6.477 17.523 2 12 2Z" fill="url(#paint0_linear)"/>
                                                <path d="M7 10.5C7 9.67157 7.67157 9 8.5 9H15.5C16.3284 9 17 9.67157 17 10.5V13.5C17 14.3284 16.3284 15 15.5 15H13.5L11 17V15H8.5C7.67157 15 7 14.3284 7 13.5V10.5Z" fill="white"/>
                                                <circle cx="10" cy="12" r="0.8" fill="url(#paint0_linear)"/>
                                                <circle cx="12" cy="12" r="0.8" fill="url(#paint0_linear)"/>
                                                <circle cx="14" cy="12" r="0.8" fill="url(#paint0_linear)"/>
                                                <defs>
                                                    <linearGradient id="paint0_linear" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                                                        <stop stopColor="#8B5CF6"/>
                                                        <stop offset="1" stopColor="#3B82F6"/>
                                                    </linearGradient>
                                                </defs>
                                            </svg>
                                            <span className="font-medium text-black dark:text-white">Interact AI</span>
                                        </Link>
                                        <h1 className="my-4 text-xl font-bold text-neutral-800 md:text-4xl dark:text-neutral-100">Sign in to your account</h1>
                                        
                                        <div className="flex w-full flex-col gap-4 sm:flex-row relative z-20">
                                            {/* GitHub Login */}
                                            <button 
                                                type="button" 
                                                onClick={handleGithubSignIn}
                                                className="flex flex-1 items-center justify-center space-x-2 rounded-md border border-neutral-200 bg-gray-100 px-4 py-3 text-neutral-700 shadow-[0px_1.5px_0px_0px_rgba(0,0,0,0.05)_inset] transition duration-200 hover:bg-gray-100/80 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-300 dark:shadow-[0px_1.5px_0px_0px_rgba(255,255,255,0.05)_inset]">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-neutral-700 dark:text-neutral-300">
                                                    <path d="M5.315 2.1c.791 -.113 1.9 .145 3.333 .966l.272 .161l.16 .1l.397 -.083a13.3 13.3 0 0 1 4.59 -.08l.456 .08l.396 .083l.161 -.1c1.385 -.84 2.487 -1.17 3.322 -1.148l.164 .008l.147 .017l.076 .014l.05 .011l.144 .047a1 1 0 0 1 .53 .514a5.2 5.2 0 0 1 .397 2.91l-.047 .267l-.046 .196l.123 .163c.574 .795 .93 1.728 1.03 2.707l.023 .295l.007 .272c0 3.855 -1.659 5.883 -4.644 6.68l-.245 .061l-.132 .029l.014 .161l.008 .157l.004 .365l-.002 .213l-.003 3.834a1 1 0 0 1 -.883 .993l-.117 .007h-6a1 1 0 0 1 -.993 -.883l-.007 -.117v-.734c-1.818 .26 -3.03 -.424 -4.11 -1.878l-.535 -.766c-.28 -.396 -.455 -.579 -.589 -.644l-.048 -.019a1 1 0 0 1 .564 -1.918c.642 .188 1.074 .568 1.57 1.239l.538 .769c.76 1.079 1.36 1.459 2.609 1.191l.001 -.678l-.018 -.168a5.03 5.03 0 0 1 -.021 -.824l.017 -.185l.019 -.12l-.108 -.024c-2.976 -.71 -4.703 -2.573 -4.875 -6.139l-.01 -.31l-.004 -.292a5.6 5.6 0 0 1 .908 -3.051l.152 -.222l.122 -.163l-.045 -.196a5.2 5.2 0 0 1 .145 -2.642l.1 -.282l.106 -.253a1 1 0 0 1 .529 -.514l.144 -.047l.154 -.03z" fill="currentColor" strokeWidth="0"></path>
                                                </svg>
                                                <span className="text-sm">Login with GitHub</span>
                                            </button>
                                            {/* Google Login */}
                                            <button 
                                                type="button" 
                                                onClick={handleGoogleSignIn}
                                                className="flex flex-1 items-center justify-center space-x-2 rounded-md border border-neutral-200 bg-gray-100 px-4 py-3 text-neutral-700 shadow-[0px_1.5px_0px_0px_rgba(0,0,0,0.05)_inset] transition duration-200 hover:bg-gray-100/80 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-300 dark:shadow-[0px_1.5px_0px_0px_rgba(255,255,255,0.05)_inset]">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-neutral-700 dark:text-neutral-300">
                                                    <path d="M12 2a9.96 9.96 0 0 1 6.29 2.226a1 1 0 0 1 .04 1.52l-1.51 1.362a1 1 0 0 1 -1.265 .06a6 6 0 1 0 2.103 6.836l.001 -.004h-3.66a1 1 0 0 1 -.992 -.883l-.007 -.117v-2a1 1 0 0 1 1 -1h6.945a1 1 0 0 1 .994 .89c.04 .367 .061 .737 .061 1.11c0 5.523 -4.477 10 -10 10s-10 -4.477 -10 -10s4.477 -10 10 -10z" fill="currentColor" strokeWidth="0"></path>
                                                </svg>
                                                <span className="text-sm">Login with Google</span>
                                            </button>
                                        </div>
                                        
                                        <div className="my-6 h-px w-full bg-neutral-100 dark:bg-neutral-800 relative z-20"></div>
                                        
                                        {/* Email Interaction Container */}
                                        <div className="relative h-24 w-full z-20">
                                            {/* Initial Button */}
                                            <button 
                                                id="email-trigger-btn" 
                                                type="button" 
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    setEmailViewOpen(true);
                                                }}
                                                className={`group/btn absolute inset-x-0 top-0 z-10 w-full rounded-lg bg-black px-4 py-3 text-white transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] dark:bg-white dark:text-black ${emailViewOpen ? 'opacity-0 translate-y-16 scale-90 pointer-events-none blur-sm' : 'opacity-100 translate-y-0 scale-100 blur-0'}`}
                                            >
                                                <div className="absolute inset-0 h-full w-full transform opacity-0 transition duration-200 group-hover/btn:opacity-100">
                                                    <div className="absolute -top-px -left-px h-4 w-4 rounded-tl-lg border-t-2 border-l-2 border-black bg-transparent transition-all duration-200 group-hover/btn:-top-4 group-hover/btn:-left-4 dark:border-white"></div>
                                                    <div className="absolute -top-px -right-px h-4 w-4 rounded-tr-lg border-t-2 border-r-2 border-black bg-transparent transition-all duration-200 group-hover/btn:-top-4 group-hover/btn:-right-4 dark:border-white"></div>
                                                    <div className="absolute -bottom-px -left-px h-4 w-4 rounded-bl-lg border-b-2 border-l-2 border-black bg-transparent transition-all duration-200 group-hover/btn:-bottom-4 group-hover/btn:-left-4 dark:border-white"></div>
                                                    <div className="absolute -right-px -bottom-px h-4 w-4 rounded-br-lg border-r-2 border-b-2 border-black bg-transparent transition-all duration-200 group-hover/btn:-right-4 group-hover/btn:-bottom-4 dark:border-white"></div>
                                                </div>
                                                <span className="text-sm">Continue with Email</span>
                                            </button>

                                            {/* Email Input View */}
                                            <div 
                                                id="email-input-view" 
                                                className={`absolute inset-x-0 top-0 z-20 flex flex-col gap-3 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${emailViewOpen ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto blur-0' : 'opacity-0 translate-y-8 scale-95 pointer-events-none blur-sm'}`}
                                            >
                                                <input 
                                                    type="email" 
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    placeholder="you@example.com" 
                                                    className="shadow-input block h-11 w-full rounded-lg border border-neutral-200 bg-white px-4 py-1.5 pl-4 text-black placeholder:text-gray-400 focus:ring-2 focus:ring-neutral-400 focus:outline-none sm:text-sm sm:leading-6 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white" 
                                                />
                                                
                                                <button 
                                                    type="button" 
                                                    onClick={handleEmailLinkSignIn}
                                                    className="group/btn relative w-full rounded-lg bg-black px-4 py-3 text-white dark:bg-white dark:text-black">
                                                    <div className="absolute inset-0 h-full w-full transform opacity-0 transition duration-200 group-hover/btn:opacity-100">
                                                        <div className="absolute -top-px -left-px h-4 w-4 rounded-tl-lg border-t-2 border-l-2 border-black bg-transparent transition-all duration-200 group-hover/btn:-top-4 group-hover/btn:-left-4 dark:border-white"></div>
                                                        <div className="absolute -top-px -right-px h-4 w-4 rounded-tr-lg border-t-2 border-r-2 border-black bg-transparent transition-all duration-200 group-hover/btn:-top-4 group-hover/btn:-right-4 dark:border-white"></div>
                                                        <div className="absolute -bottom-px -left-px h-4 w-4 rounded-bl-lg border-b-2 border-l-2 border-black bg-transparent transition-all duration-200 group-hover/btn:-bottom-4 group-hover/btn:-left-4 dark:border-white"></div>
                                                        <div className="absolute -right-px -bottom-px h-4 w-4 rounded-br-lg border-r-2 border-b-2 border-black bg-transparent transition-all duration-200 group-hover/btn:-right-4 group-hover/btn:-bottom-4 dark:border-white"></div>
                                                    </div>
                                                    <span className="text-sm">Send magic link</span>
                                                </button>
                                                
                                                {status.message && (
                                                    <p className={`text-xs text-center mt-1 ${status.type === 'error' ? 'text-red-500' : 'text-green-500'}`}>
                                                        {status.message}
                                                    </p>
                                                )}

                                                <button 
                                                    id="back-btn" 
                                                    type="button" 
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        setEmailViewOpen(false);
                                                    }}
                                                    className="text-xs text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors mt-1"
                                                >
                                                    &larr; Back to all options
                                                </button>
                                            </div>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
