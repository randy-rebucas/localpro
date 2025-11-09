"use client";

import React, { useEffect } from "react";
import { SessionProvider } from "@/contexts/session-context";
import { useSession } from "@/hooks/useAuth";
import { getApiToken } from "@/lib/auth-utils";
import { useRouter } from "next/navigation";
import { Loader2, Shield, ArrowRight, Sparkles, Zap, Users, TrendingUp, Star, CheckCircle2, Rocket } from "lucide-react";

function HomeContent() {
  const { data: session, status } = useSession();
  const apiToken = getApiToken();
  const router = useRouter();

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated' && !apiToken) {
      router.push('/auth');
    }
  }, [status, apiToken, router]);

  // Show loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-blue-50">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-green-600 to-green-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Shield className="text-white w-10 h-10" />
          </div>
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="w-5 h-5 animate-spin text-green-600" />
            <p className="text-gray-600 font-medium">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // If not authenticated, show nothing (redirect will happen)
  if (status === 'unauthenticated' && !apiToken) {
    return null;
  }

  // Show cover page if authenticated
  const isAuthenticated = (status === 'authenticated' && (session || apiToken)) || apiToken;
  
  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 relative overflow-hidden">
        {/* Enhanced background decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-200 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-blob animation-delay-4000"></div>
          {/* Additional floating particles */}
          <div className="absolute top-20 left-10 w-2 h-2 bg-green-400 rounded-full opacity-60 animate-pulse"></div>
          <div className="absolute top-40 right-20 w-3 h-3 bg-blue-400 rounded-full opacity-50 animate-pulse animation-delay-1000"></div>
          <div className="absolute bottom-32 left-1/4 w-2 h-2 bg-purple-400 rounded-full opacity-60 animate-pulse animation-delay-2000"></div>
        </div>

        {/* Main content */}
        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
          <div className="max-w-5xl w-full text-center space-y-10">
            {/* Enhanced Logo/Icon with animation */}
            <div className="flex justify-center mb-8 animate-fade-in-up">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-blue-400 rounded-3xl blur-2xl opacity-50 animate-pulse"></div>
                <div className="relative w-28 h-28 bg-gradient-to-br from-green-600 via-green-500 to-blue-600 rounded-3xl flex items-center justify-center shadow-2xl transform hover:scale-110 hover:rotate-3 transition-all duration-500">
                  <Shield className="text-white w-14 h-14" />
                </div>
              </div>
            </div>

            {/* Enhanced Main heading with staggered animation */}
            <div className="space-y-4 animate-fade-in-up animation-delay-200">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 leading-tight">
                <span className="inline-block animate-slide-in-left">Welcome</span>
                <span className="inline-block mx-2 animate-slide-in-left animation-delay-300">to</span>
              </h1>
              <div className="relative inline-block">
                <span className="block text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-extrabold bg-gradient-to-r from-green-600 via-blue-500 to-green-600 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                  LocalPro
                </span>
                <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-green-400 via-blue-400 to-green-400 rounded-full opacity-50"></div>
              </div>
            </div>

            {/* Enhanced Subheading */}
            <p className="text-xl sm:text-2xl lg:text-3xl text-gray-700 max-w-3xl mx-auto leading-relaxed font-medium animate-fade-in-up animation-delay-400">
              Your all-in-one platform for{" "}
              <span className="text-green-600 font-semibold">professional services</span>,{" "}
              <span className="text-blue-600 font-semibold">supplies</span>,{" "}
              <span className="text-purple-600 font-semibold">education</span>, and more
            </p>

            {/* Enhanced Feature highlights with better hover effects */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-16 mb-8">
              <div className="group bg-white/90 backdrop-blur-md rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-white/50 animate-fade-in-up animation-delay-500">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-5 mx-auto group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg">
                  <Sparkles className="text-white w-8 h-8" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2 text-lg group-hover:text-green-600 transition-colors">Services</h3>
                <p className="text-sm text-gray-600 leading-relaxed">Discover trusted professionals for all your needs</p>
                <div className="mt-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight className="w-4 h-4 text-green-600 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
              <div className="group bg-white/90 backdrop-blur-md rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-white/50 animate-fade-in-up animation-delay-600">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-5 mx-auto group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg">
                  <Zap className="text-white w-8 h-8" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2 text-lg group-hover:text-blue-600 transition-colors">Marketplace</h3>
                <p className="text-sm text-gray-600 leading-relaxed">Browse, compare, and book with ease</p>
                <div className="mt-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight className="w-4 h-4 text-blue-600 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
              <div className="group bg-white/90 backdrop-blur-md rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-white/50 animate-fade-in-up animation-delay-700">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-5 mx-auto group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg">
                  <Users className="text-white w-8 h-8" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2 text-lg group-hover:text-purple-600 transition-colors">Community</h3>
                <p className="text-sm text-gray-600 leading-relaxed">Connect, network, and grow together</p>
                <div className="mt-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight className="w-4 h-4 text-purple-600 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
              <div className="group bg-white/90 backdrop-blur-md rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-white/50 animate-fade-in-up animation-delay-800">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mb-5 mx-auto group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg">
                  <TrendingUp className="text-white w-8 h-8" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2 text-lg group-hover:text-orange-600 transition-colors">Analytics</h3>
                <p className="text-sm text-gray-600 leading-relaxed">Track performance and optimize results</p>
                <div className="mt-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight className="w-4 h-4 text-orange-600 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>

            {/* Enhanced CTA Button */}
            <div className="mt-16 animate-fade-in-up animation-delay-900">
              <button
                onClick={() => router.push('/dashboard')}
                className="group relative inline-flex items-center justify-center px-10 py-5 text-lg font-bold text-white bg-gradient-to-r from-green-600 via-blue-500 to-green-600 rounded-2xl shadow-2xl hover:shadow-green-500/50 transform hover:scale-110 transition-all duration-500 overflow-hidden bg-[length:200%_auto] hover:bg-[position:right_center]"
              >
                <span className="relative z-10 flex items-center">
                  <Rocket className="mr-3 w-6 h-6 group-hover:rotate-12 transition-transform duration-500" />
                  Launch Dashboard
                  <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-green-700 via-blue-600 to-green-700 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>
              </button>
            </div>

            {/* Enhanced Welcome message */}
            {session?.user && (
              <div className="mt-8 animate-fade-in-up animation-delay-1000">
                <div className="inline-flex items-center space-x-3 bg-white/80 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg border border-white/50">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <p className="text-gray-700 font-semibold">
                    Welcome back, <span className="text-green-600">{session.user.firstName || session.user.name || 'User'}</span>!
                  </p>
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Fallback loading state
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-blue-50">
      <div className="text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-green-600 to-green-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
          <Shield className="text-white w-10 h-10" />
        </div>
        <div className="flex items-center justify-center space-x-2">
          <Loader2 className="w-5 h-5 animate-spin text-green-600" />
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <SessionProvider>
      <HomeContent />
    </SessionProvider>
  );
}
