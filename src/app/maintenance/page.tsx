"use client";

import { Logo } from "@/components/ui/logo";
import { Wrench, Clock, Mail, ArrowRight, CheckCircle2 } from "lucide-react";
import { useState } from "react";

export default function MaintenancePage() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleNotifyMe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      // TODO: Implement email notification subscription
      setSubscribed(true);
      setTimeout(() => {
        setEmail("");
        setSubscribed(false);
      }, 5000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden px-4">
      {/* Decorative gradient orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 right-0 w-64 h-64 bg-emerald-600/10 rounded-full blur-2xl pointer-events-none animate-pulse" style={{ animationDelay: '0.5s' }} />
      <div className="absolute bottom-1/4 left-0 w-72 h-72 bg-teal-600/10 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDelay: '1.5s' }} />

      {/* Content */}
      <div className="relative z-10 w-full max-w-3xl">
        {/* Logo Section */}
        <div className="flex flex-col items-center justify-center mb-12">
          <div className="relative mb-6">
            {/* Animated ring around logo */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 rounded-full border-2 border-emerald-500/30 animate-ping" style={{ animationDuration: '2s' }} />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-28 h-28 rounded-full border-2 border-teal-500/20 animate-ping" style={{ animationDuration: '3s', animationDelay: '0.5s' }} />
            </div>
            
            {/* Logo with maintenance icon */}
            <div className="relative bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-full p-6 shadow-2xl shadow-emerald-500/20">
              <div className="flex items-center justify-center space-x-3">
                <Logo size={48} />
                <Wrench className="w-8 h-8 text-emerald-400 animate-bounce" style={{ animationDuration: '2s' }} />
              </div>
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-white text-center mb-4">
            <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              LocalPro
            </span>
          </h1>
          <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-3">
            Under Maintenance
          </h2>
          <p className="text-slate-400 text-center text-lg max-w-2xl">
            We&apos;re working hard to bring you an even better experience. Our team is currently performing scheduled maintenance and upgrades.
          </p>
        </div>

        {/* Status Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl shadow-black/20 mb-8">
          {/* Estimated Time */}
          <div className="flex items-start space-x-4 mb-6">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
              <Clock className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg mb-1">Estimated Downtime</h3>
              <p className="text-slate-400">
                We expect to be back online within the next few hours. Thank you for your patience!
              </p>
            </div>
          </div>

          {/* What's happening */}
          <div className="border-t border-slate-800 pt-6">
            <h3 className="text-white font-semibold text-lg mb-4">What we&apos;re working on:</h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <p className="text-slate-300">Upgrading server infrastructure for better performance</p>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <p className="text-slate-300">Implementing new features and improvements</p>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <p className="text-slate-300">Enhancing security and reliability</p>
              </div>
            </div>
          </div>
        </div>

        {/* Notification Form */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl shadow-black/20">
          <div className="flex items-start space-x-4 mb-6">
            <div className="bg-teal-500/10 border border-teal-500/20 rounded-xl p-3">
              <Mail className="w-6 h-6 text-teal-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-semibold text-lg mb-1">Get Notified</h3>
              <p className="text-slate-400">
                Enter your email and we&apos;ll notify you as soon as we&apos;re back online.
              </p>
            </div>
          </div>

          {!subscribed ? (
            <form onSubmit={handleNotifyMe} className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                required
                className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-base placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              <button
                type="submit"
                className="group relative flex justify-center items-center px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-200"
              >
                Notify Me
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </form>
          ) : (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center space-x-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <p className="text-emerald-400 font-medium">
                Thanks! We&apos;ll notify you when we&apos;re back online.
              </p>
            </div>
          )}
        </div>

        {/* Social Links & Support */}
        <div className="mt-8 text-center">
          <p className="text-slate-400 text-sm mb-4">
            Need urgent assistance? Contact us at{" "}
            <a
              href="mailto:support@localpro.com"
              className="text-emerald-400 hover:text-emerald-300 transition-colors font-medium"
            >
              support@localpro.com
            </a>
          </p>
          <div className="flex items-center justify-center space-x-6">
            <a
              href="https://twitter.com/localpro"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-500 hover:text-emerald-400 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
              </svg>
            </a>
            <a
              href="https://facebook.com/localpro"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-500 hover:text-emerald-400 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
              </svg>
            </a>
            <a
              href="https://linkedin.com/company/localpro"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-500 hover:text-emerald-400 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </a>
          </div>
        </div>

        {/* Developer Bypass Info (only in development) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
            <p className="text-xs text-slate-400 text-center">
              <strong>Developer Access:</strong> Add <code className="bg-slate-700 px-1 rounded">?bypass=true</code> to any URL to bypass maintenance mode
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
