import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { DynamicHomeInteractive } from "@/components/dynamic-home-interactive";
import { 
  CheckCircle, 
  Users, 
  Star, 
  Shield, 
  Home as HomeIcon,
  MessageCircle,
  Store,
  Package,
  GraduationCap,
  CreditCard,
  Car,
  Megaphone,
  Calendar,
  Ticket,
  Wallet,
  User,
  ArrowRight,
  Award,
  Globe,
  Lock,
  Clock,
  Target,
  Heart,
  ChevronRight,
  Sparkles,
  Rocket,
  Crown,
  Diamond
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Modern Navigation Header */}
      <header className="fixed top-0 left-0 right-0 z-50">
        <nav className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50 shadow-lg" role="navigation" aria-label="Main navigation">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Logo size={30} withText={true}/>
              <div className="hidden md:flex items-center space-x-8">
                <Link href="/marketplace" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-emerald-400 transition-colors font-medium group">
                  Marketplace
                  <div className="h-0.5 bg-blue-600 scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
                </Link>
                <Link href="/academy" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-emerald-400 transition-colors font-medium group">
                  Academy
                  <div className="h-0.5 bg-blue-600 scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
                </Link>
                <Link href="/rentals" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-emerald-400 transition-colors font-medium group">
                  Rentals
                  <div className="h-0.5 bg-blue-600 scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
                </Link>
                <Link href="/supplies" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-emerald-400 transition-colors font-medium group">
                  Supplies
                  <div className="h-0.5 bg-blue-600 scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
                </Link>
              </div>
              <div className="flex items-center space-x-4">
                <Link
                  href="/auth"
                  className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-emerald-400 transition-colors font-medium"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth"
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-2.5 px-6 rounded-xl transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 flex items-center group"
                >
                  Get Started
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </nav>
      </header>

      {/* Modern Hero Section */}
      <main className="pt-20">
        <section className="min-h-screen flex items-center relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900" aria-labelledby="hero-heading">
          {/* Enhanced Background Pattern */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-transparent to-emerald-600/5"></div>
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.1),transparent_50%)]"></div>
            <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_80%,rgba(16,185,129,0.1),transparent_50%)]"></div>
            <div className="absolute top-1/2 left-1/2 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.05),transparent_70%)]"></div>
          </div>
          
          {/* Enhanced Floating Elements */}
          <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-blue-600/20 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-40 h-40 bg-gradient-to-br from-emerald-400/20 to-emerald-600/20 rounded-full blur-xl animate-pulse" style={{animationDelay: '1s'}}></div>
          <div className="absolute top-1/2 left-10 w-24 h-24 bg-gradient-to-br from-purple-400/20 to-purple-600/20 rounded-full blur-xl animate-pulse" style={{animationDelay: '2s'}}></div>
          <div className="absolute top-1/3 right-1/4 w-20 h-20 bg-gradient-to-br from-pink-400/20 to-pink-600/20 rounded-full blur-xl animate-pulse" style={{animationDelay: '3s'}}></div>
          
          {/* Enhanced Grid Overlay */}
          <div className="absolute inset-0 opacity-[0.03]">
            <div className="w-full h-full" style={{
              backgroundImage: `linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)`,
              backgroundSize: '60px 60px'
            }}></div>
          </div>
        
        <div className="container mx-auto px-4 py-20 lg:py-32 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left Column - Enhanced Content */}
            <div className="text-center lg:text-left space-y-8">
              {/* Enhanced Badge */}
              <div className="inline-flex items-center bg-gradient-to-r from-emerald-500/10 to-blue-500/10 backdrop-blur-sm text-slate-700 dark:text-slate-300 px-6 py-3 rounded-full text-sm font-medium mb-6 shadow-lg border border-emerald-200/50 dark:border-emerald-700/50 hover:shadow-xl transition-all duration-300 group">
                <Sparkles className="w-4 h-4 text-emerald-500 mr-3 group-hover:animate-spin"></Sparkles>
                <span>Trusted by 10,000+ professionals worldwide</span>
                <div className="w-2 h-2 bg-emerald-500 rounded-full ml-3 animate-pulse"></div>
              </div>
              
              {/* Enhanced Typography */}
              <h1 id="hero-heading" className="text-5xl md:text-7xl lg:text-8xl font-black text-slate-900 dark:text-white leading-[0.9] tracking-tight">
                Transform Your{" "}
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-emerald-600 bg-clip-text text-transparent animate-gradient">
                  Professional
                </span>{" "}
                Journey
              </h1>
              
              <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 leading-relaxed font-light max-w-2xl">
                The ultimate Super App ecosystem that connects marketplace services, supplies, academy training, 
                finance solutions, rentals, advertising, and facility care - all in one powerful platform.
              </p>
              
              {/* Enhanced CTA */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <DynamicHomeInteractive variant="hero" />
              </div>

              {/* Enhanced Trust Indicators */}
              <div className="flex flex-wrap justify-center lg:justify-start items-center gap-4 pt-8">
                <div className="flex items-center bg-gradient-to-r from-emerald-500/10 to-emerald-600/10 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border border-emerald-200/50 dark:border-emerald-700/50 hover:shadow-xl transition-all duration-300 group">
                  <Shield className="w-4 h-4 text-emerald-500 mr-3 group-hover:animate-pulse"></Shield>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Bank-Level Security</span>
                </div>
                <div className="flex items-center bg-gradient-to-r from-blue-500/10 to-blue-600/10 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border border-blue-200/50 dark:border-blue-700/50 hover:shadow-xl transition-all duration-300 group">
                  <Users className="w-4 h-4 text-blue-500 mr-3 group-hover:animate-pulse"></Users>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">10K+ Active Users</span>
                </div>
                <div className="flex items-center bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border border-yellow-200/50 dark:border-yellow-700/50 hover:shadow-xl transition-all duration-300 group">
                  <Star className="w-4 h-4 text-yellow-500 mr-3 group-hover:animate-pulse"></Star>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">4.9/5 Rating</span>
                </div>
              </div>
            </div>

            {/* Right Column - Enhanced Mobile Mockup */}
            <div className="relative flex justify-center lg:justify-end">
              {/* Enhanced Mobile Device Frame */}
              <div className="relative w-80 h-[600px] bg-gradient-to-b from-slate-800 to-slate-900 rounded-[3rem] p-3 shadow-2xl hover:shadow-3xl transition-all duration-500 group transform hover:scale-105">
                {/* Device Screen */}
                <div className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden relative">
                  {/* Enhanced Status Bar */}
                  <div className="flex justify-between items-center px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white text-sm font-medium">
                    <span className="font-mono">9:58</span>
                    <div className="flex items-center space-x-1">
                      <div className="w-4 h-2 bg-white/30 rounded-sm"></div>
                      <div className="w-4 h-2 bg-white/30 rounded-sm"></div>
                      <div className="w-6 h-3 bg-white rounded-sm flex items-center justify-center">
                        <span className="text-xs text-emerald-600 font-bold">52</span>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced App Header */}
                  <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-4">
                    <h2 className="text-white text-lg font-semibold text-center">Welcome back!</h2>
                    <p className="text-emerald-100 text-sm text-center mt-1">Ready to grow your business?</p>
                  </div>

                  {/* Enhanced App Branding */}
                  <div className="px-6 py-4 bg-white border-b border-slate-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-lg flex items-center justify-center shadow-lg">
                          <span className="text-white font-bold text-lg">P</span>
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">LocalPro</h3>
                          <p className="text-sm text-slate-500">Super App</p>
                        </div>
                      </div>
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                        <Rocket className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Main Content */}
                  <div className="px-6 py-6 bg-white">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-xl font-bold text-slate-900">Your Dashboard</h4>
                      <div className="flex items-center bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-xs font-medium">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full mr-1 animate-pulse"></div>
                        Live
                      </div>
                    </div>
                    <p className="text-sm text-slate-500 mb-6">Access all your services from one central hub</p>

                    {/* Enhanced Service Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      {/* Marketplace */}
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 group">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center mb-3 shadow-lg group-hover:shadow-xl transition-shadow">
                          <Store className="w-6 h-6 text-white" />
                        </div>
                        <h5 className="font-semibold text-slate-900 text-sm">Marketplace</h5>
                        <p className="text-xs text-slate-500">Buy & sell locally</p>
                        <div className="text-xs text-blue-600 font-medium mt-1">12 new orders</div>
                      </div>

                      {/* Supplies */}
                      <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 group">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mb-3 shadow-lg group-hover:shadow-xl transition-shadow">
                          <Package className="w-6 h-6 text-white" />
                        </div>
                        <h5 className="font-semibold text-slate-900 text-sm">Supplies</h5>
                        <p className="text-xs text-slate-500">Equipment & tools</p>
                        <div className="text-xs text-orange-600 font-medium mt-1">5 items ready</div>
                      </div>

                      {/* Academy */}
                      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 group">
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-full flex items-center justify-center mb-3 shadow-lg group-hover:shadow-xl transition-shadow">
                          <GraduationCap className="w-6 h-6 text-white" />
                        </div>
                        <h5 className="font-semibold text-slate-900 text-sm">Academy</h5>
                        <p className="text-xs text-slate-500">Learn & grow</p>
                        <div className="text-xs text-emerald-600 font-medium mt-1">3 courses</div>
                      </div>

                      {/* Finance */}
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 group">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-700 rounded-full flex items-center justify-center mb-3 shadow-lg group-hover:shadow-xl transition-shadow">
                          <CreditCard className="w-6 h-6 text-white" />
                        </div>
                        <h5 className="font-semibold text-slate-900 text-sm">Finance</h5>
                        <p className="text-xs text-slate-500">Manage money</p>
                        <div className="text-xs text-purple-600 font-medium mt-1">$2,450</div>
                      </div>

                      {/* Rentals */}
                      <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 group">
                        <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mb-3 shadow-lg group-hover:shadow-xl transition-shadow">
                          <Car className="w-6 h-6 text-white" />
                        </div>
                        <h5 className="font-semibold text-slate-900 text-sm">Rentals</h5>
                        <p className="text-xs text-slate-500">Rent equipment</p>
                        <div className="text-xs text-red-600 font-medium mt-1">2 active</div>
                      </div>

                      {/* Ads */}
                      <div className="bg-gradient-to-br from-teal-50 to-teal-100 border border-teal-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 group">
                        <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center mb-3 shadow-lg group-hover:shadow-xl transition-shadow">
                          <Megaphone className="w-6 h-6 text-white" />
                        </div>
                        <h5 className="font-semibold text-slate-900 text-sm">Ads</h5>
                        <p className="text-xs text-slate-500">Promote business</p>
                        <div className="text-xs text-teal-600 font-medium mt-1">1 campaign</div>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Bottom Navigation */}
                  <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3">
                    <div className="flex justify-around items-center">
                      <div className="flex flex-col items-center group">
                        <HomeIcon className="w-6 h-6 text-emerald-600 mb-1 group-hover:scale-110 transition-transform" />
                        <span className="text-xs text-emerald-600 font-medium">Home</span>
                      </div>
                      <div className="flex flex-col items-center group">
                        <Calendar className="w-6 h-6 text-slate-500 mb-1 group-hover:scale-110 transition-transform" />
                        <span className="text-xs text-slate-500">Schedule</span>
                      </div>
                      <div className="flex flex-col items-center group">
                        <Ticket className="w-6 h-6 text-slate-500 mb-1 group-hover:scale-110 transition-transform" />
                        <span className="text-xs text-slate-500">Booking</span>
                      </div>
                      <div className="flex flex-col items-center group">
                        <Wallet className="w-6 h-6 text-slate-500 mb-1 group-hover:scale-110 transition-transform" />
                        <span className="text-xs text-slate-500">Wallet</span>
                      </div>
                      <div className="flex flex-col items-center group">
                        <User className="w-6 h-6 text-slate-500 mb-1 group-hover:scale-110 transition-transform" />
                        <span className="text-xs text-slate-500">Profile</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Floating Elements around Mobile */}
              <div className="absolute -top-4 -right-4 w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full animate-bounce shadow-lg" style={{animationDelay: '0.5s'}}></div>
              <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full animate-bounce shadow-lg" style={{animationDelay: '1s'}}></div>
              <div className="absolute top-1/2 -right-8 w-4 h-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full animate-bounce shadow-lg" style={{animationDelay: '1.5s'}}></div>
              <div className="absolute top-1/4 -left-6 w-3 h-3 bg-gradient-to-br from-pink-500 to-pink-600 rounded-full animate-bounce shadow-lg" style={{animationDelay: '2s'}}></div>
            </div>
          </div>
        </div>
        </section>
      </main>

      {/* Features Showcase Section */}
      <section className="py-24 bg-gradient-to-br from-white via-slate-50 to-blue-50 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="w-full h-full" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='20' cy='20' r='1'/%3E%3C/g%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat'
          }}></div>
        </div>
        
        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-16">
            <div className="inline-flex items-center bg-gradient-to-r from-blue-500/10 to-emerald-500/10 backdrop-blur-sm text-slate-700 dark:text-slate-300 px-6 py-3 rounded-full text-sm font-medium mb-6 shadow-lg border border-blue-200/50 dark:border-blue-700/50">
              <Crown className="w-4 h-4 text-yellow-500 mr-3"></Crown>
              <span>Premium Features</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">
              Everything You Need to{" "}
              <span className="bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">Succeed</span>
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              Discover the powerful features that make LocalPro the ultimate Super App for professionals
            </p>
          </div>

          {/* Feature Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {/* Marketplace Feature */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-xl border border-slate-200 dark:border-slate-700 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:shadow-xl transition-shadow">
                <Store className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Smart Marketplace</h3>
              <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                Connect with local service providers and customers. Find cleaning, plumbing, electrical, and moving services instantly.
              </p>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mr-2" />
                  Instant service matching
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mr-2" />
                  Secure payment processing
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mr-2" />
                  Real-time tracking
                </li>
              </ul>
            </div>

            {/* Academy Feature */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-xl border border-slate-200 dark:border-slate-700 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:shadow-xl transition-shadow">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Professional Academy</h3>
              <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                Partner with TES to offer comprehensive training courses and certifications for professional development.
              </p>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mr-2" />
                  Industry certifications
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mr-2" />
                  Expert instructors
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mr-2" />
                  Flexible learning paths
                </li>
              </ul>
            </div>

            {/* Finance Feature */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-xl border border-slate-200 dark:border-slate-700 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:shadow-xl transition-shadow">
                <CreditCard className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Financial Solutions</h3>
              <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                Access salary advances, micro-loans, and financial tools to grow your business with our fintech partners.
              </p>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mr-2" />
                  Quick loan approval
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mr-2" />
                  Flexible repayment
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mr-2" />
                  Financial planning tools
                </li>
              </ul>
            </div>

            {/* Supplies Feature */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-xl border border-slate-200 dark:border-slate-700 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:shadow-xl transition-shadow">
                <Package className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Smart Supplies</h3>
              <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                Get cleaning supplies, tools, and equipment delivered right to your doorstep with subscription options.
              </p>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mr-2" />
                  Automated reordering
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mr-2" />
                  Quality guaranteed
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mr-2" />
                  Bulk discounts
                </li>
              </ul>
            </div>

            {/* Rentals Feature */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-xl border border-slate-200 dark:border-slate-700 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:shadow-xl transition-shadow">
                <Car className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Equipment Rentals</h3>
              <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                Rent tools, vehicles, and equipment for your projects with flexible terms and competitive rates.
              </p>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mr-2" />
                  Wide selection
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mr-2" />
                  Insurance included
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mr-2" />
                  Delivery available
                </li>
              </ul>
            </div>

            {/* Ads Feature */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-xl border border-slate-200 dark:border-slate-700 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group">
              <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:shadow-xl transition-shadow">
                <Megaphone className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Targeted Advertising</h3>
              <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                Promote your business to hardware stores, suppliers, and training schools with precision targeting.
              </p>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mr-2" />
                  Local audience targeting
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mr-2" />
                  Performance analytics
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mr-2" />
                  Budget control
                </li>
              </ul>
            </div>
          </div>

          {/* Feature Highlights */}
          <div className="bg-gradient-to-r from-blue-600 to-emerald-600 rounded-3xl p-8 md:p-12 text-white">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">Bank-Level Security</h3>
                <p className="text-blue-100">Your data and transactions are protected with enterprise-grade security</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">24/7 Support</h3>
                <p className="text-blue-100">Round-the-clock customer support to help you succeed</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">Proven Results</h3>
                <p className="text-blue-100">Join thousands of professionals who&apos;ve grown their business</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-gradient-to-br from-slate-50 via-white to-emerald-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="w-full h-full" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat'
          }}></div>
        </div>
        
        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-16">
            <div className="inline-flex items-center bg-gradient-to-r from-emerald-500/10 to-blue-500/10 backdrop-blur-sm text-slate-700 dark:text-slate-300 px-6 py-3 rounded-full text-sm font-medium mb-6 shadow-lg border border-emerald-200/50 dark:border-emerald-700/50">
              <Heart className="w-4 h-4 text-red-500 mr-3"></Heart>
              <span>Customer Stories</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">
              Loved by{" "}
              <span className="bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">Professionals</span>{" "}
              Worldwide
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              See how LocalPro has transformed businesses and careers across the globe
            </p>
          </div>

          {/* Testimonials Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {/* Testimonial 1 */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-xl border border-slate-200 dark:border-slate-700 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  M
                </div>
                <div className="ml-4">
                  <h4 className="font-bold text-slate-900 dark:text-white">Maria Rodriguez</h4>
                  <p className="text-sm text-slate-500">Cleaning Services Owner</p>
                </div>
              </div>
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                &quot;LocalPro transformed my cleaning business. The marketplace feature helped me find 3x more clients, and the academy courses improved my skills significantly. Revenue increased by 150% in just 6 months!&quot;
              </p>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-xl border border-slate-200 dark:border-slate-700 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  J
                </div>
                <div className="ml-4">
                  <h4 className="font-bold text-slate-900 dark:text-white">James Chen</h4>
                  <p className="text-sm text-slate-500">Electrician</p>
                </div>
              </div>
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                &quot;The financial solutions feature was a game-changer. I got a micro-loan to buy new equipment, and the rental service helped me access specialized tools. My business is now more efficient and profitable.&quot;
              </p>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-xl border border-slate-200 dark:border-slate-700 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  S
                </div>
                <div className="ml-4">
                  <h4 className="font-bold text-slate-900 dark:text-white">Sarah Johnson</h4>
                  <p className="text-sm text-slate-500">Facility Manager</p>
                </div>
              </div>
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                &quot;LocalPro&apos;s facility care subscriptions saved us 40% on maintenance costs. The automated supply ordering and professional training programs have made our operations so much smoother.&quot;
              </p>
            </div>
          </div>

          {/* Stats Section */}
          <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-800 rounded-3xl p-8 md:p-12 text-white relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="w-full h-full" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='20' cy='20' r='1'/%3E%3C/g%3E%3C/svg%3E")`,
                backgroundRepeat: 'repeat'
              }}></div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 relative">
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-white mb-2">10K+</div>
                <div className="text-blue-100 font-medium">Active Professionals</div>
              </div>
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-white mb-2">50K+</div>
                <div className="text-blue-100 font-medium">Services Completed</div>
              </div>
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-white mb-2">8</div>
                <div className="text-blue-100 font-medium">Integrated Platforms</div>
              </div>
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-white mb-2">4.9★</div>
                <div className="text-blue-100 font-medium">Average Rating</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced CTA Section */}
      <section className="py-24 bg-gradient-to-br from-slate-50 via-white to-emerald-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-40">
          <div className="w-full h-full bg-gradient-to-br from-slate-100/20 to-blue-100/20"></div>
        </div>
        
        {/* Floating Action Elements */}
        <div className="absolute top-10 left-20 w-16 h-16 bg-blue-200/20 rounded-full animate-bounce" style={{animationDelay: '0s', animationDuration: '3s'}}></div>
        <div className="absolute bottom-20 right-20 w-20 h-20 bg-emerald-200/20 rounded-full animate-bounce" style={{animationDelay: '1.5s', animationDuration: '4s'}}></div>
        <div className="absolute top-1/2 left-10 w-12 h-12 bg-blue-300/20 rounded-full animate-bounce" style={{animationDelay: '2.5s', animationDuration: '3.5s'}}></div>
        
        <div className="container mx-auto px-4 text-center relative">
          <div className="max-w-4xl mx-auto">
            {/* Urgency Badge */}
            <div className="inline-flex items-center bg-gradient-to-r from-red-500/10 to-orange-500/10 backdrop-blur-sm text-slate-700 dark:text-slate-300 px-6 py-3 rounded-full text-sm font-medium mb-6 shadow-lg border border-red-200/50 dark:border-red-700/50 animate-pulse">
              <Diamond className="w-4 h-4 text-red-500 mr-3"></Diamond>
              <span>Limited Time: Free Premium Trial</span>
            </div>
            
            <h2 className="text-4xl md:text-6xl font-bold text-slate-900 dark:text-white mb-6 animate-fade-in">
              Ready to Transform Your{" "}
              <span className="bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">Business?</span>
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 font-medium animate-fade-in">
              Join 10,000+ professionals who&apos;ve already revolutionized their careers with LocalPro Super App. 
              Get instant access to all 8 integrated platforms and start growing today.
            </p>
            
            {/* Benefits List */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="flex items-center justify-center bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-slate-200/50 dark:border-slate-700/50">
                <CheckCircle className="w-6 h-6 text-emerald-500 mr-3" />
                <span className="font-medium text-slate-700 dark:text-slate-300">Free 30-day trial</span>
              </div>
              <div className="flex items-center justify-center bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-slate-200/50 dark:border-slate-700/50">
                <CheckCircle className="w-6 h-6 text-emerald-500 mr-3" />
                <span className="font-medium text-slate-700 dark:text-slate-300">No setup fees</span>
              </div>
              <div className="flex items-center justify-center bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-slate-200/50 dark:border-slate-700/50">
                <CheckCircle className="w-6 h-6 text-emerald-500 mr-3" />
                <span className="font-medium text-slate-700 dark:text-slate-300">Cancel anytime</span>
              </div>
            </div>
            
            <div className="animate-fade-in">
              <DynamicHomeInteractive variant="cta" />
            </div>
            
            {/* Trust Indicators */}
            <div className="mt-12 flex flex-wrap justify-center items-center gap-6 text-sm text-slate-500 dark:text-slate-400">
              <div className="flex items-center">
                <Lock className="w-4 h-4 mr-2" />
                <span>SSL Secured</span>
              </div>
              <div className="flex items-center">
                <Shield className="w-4 h-4 mr-2" />
                <span>GDPR Compliant</span>
              </div>
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-2" />
                <span>10K+ Happy Users</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modern Footer */}
      <footer className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 text-white py-20 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-60">
          <div className="w-full h-full bg-gradient-to-br from-white/3 to-blue-100/3"></div>
        </div>
        
        {/* Floating Elements */}
        <div className="absolute top-10 left-20 w-32 h-32 bg-white/5 rounded-full animate-pulse" style={{animationDelay: '0s'}}></div>
        <div className="absolute bottom-20 right-20 w-24 h-24 bg-blue-200/10 rounded-full animate-pulse" style={{animationDelay: '2s'}}></div>
        
        <div className="container mx-auto px-4 relative">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {/* Brand Section */}
            <div className="lg:col-span-1">
              <Logo withText={true} size={32} className="text-white mb-6" />
              <p className="text-slate-300 mb-6 font-medium leading-relaxed">
                The ultimate Super App platform featuring marketplace services, supplies, academy training, 
                finance solutions, rentals, advertising, facility care, and premium subscriptions.
              </p>
              <div className="flex space-x-4">
                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer">
                  <Globe className="w-5 h-5 text-white" />
                </div>
                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer">
                  <Users className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
            
            {/* Platform Links */}
            <div>
              <h3 className="text-lg font-semibold mb-6 text-white">Platform</h3>
              <ul className="space-y-4 text-slate-300">
                <li>
                  <Link href="/marketplace" className="hover:text-emerald-400 transition-colors font-medium flex items-center group">
                    <Store className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                    Marketplace
                  </Link>
                </li>
                <li>
                  <Link href="/academy" className="hover:text-emerald-400 transition-colors font-medium flex items-center group">
                    <GraduationCap className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                    Academy
                  </Link>
                </li>
                <li>
                  <Link href="/rentals" className="hover:text-emerald-400 transition-colors font-medium flex items-center group">
                    <Car className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                    Rentals
                  </Link>
                </li>
                <li>
                  <Link href="/supplies" className="hover:text-emerald-400 transition-colors font-medium flex items-center group">
                    <Package className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                    Supplies
                  </Link>
                </li>
                <li>
                  <Link href="/finance" className="hover:text-emerald-400 transition-colors font-medium flex items-center group">
                    <CreditCard className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                    Finance
                  </Link>
                </li>
              </ul>
            </div>
            
            {/* Support Links */}
            <div>
              <h3 className="text-lg font-semibold mb-6 text-white">Support</h3>
              <ul className="space-y-4 text-slate-300">
                <li>
                  <Link href="/help-center" className="hover:text-emerald-400 transition-colors font-medium flex items-center group">
                    <ChevronRight className="w-4 h-4 mr-2 group-hover:translate-x-1 transition-transform" />
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-emerald-400 transition-colors font-medium flex items-center group">
                    <ChevronRight className="w-4 h-4 mr-2 group-hover:translate-x-1 transition-transform" />
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-emerald-400 transition-colors font-medium flex items-center group">
                    <ChevronRight className="w-4 h-4 mr-2 group-hover:translate-x-1 transition-transform" />
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-emerald-400 transition-colors font-medium flex items-center group">
                    <ChevronRight className="w-4 h-4 mr-2 group-hover:translate-x-1 transition-transform" />
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/security" className="hover:text-emerald-400 transition-colors font-medium flex items-center group">
                    <ChevronRight className="w-4 h-4 mr-2 group-hover:translate-x-1 transition-transform" />
                    Security
                  </Link>
                </li>
              </ul>
            </div>
            
            {/* Connect Links */}
            <div>
              <h3 className="text-lg font-semibold mb-6 text-white">Connect</h3>
              <ul className="space-y-4 text-slate-300">
                <li>
                  <Link href="/blog" className="hover:text-emerald-400 transition-colors font-medium flex items-center group">
                    <ChevronRight className="w-4 h-4 mr-2 group-hover:translate-x-1 transition-transform" />
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="/community" className="hover:text-emerald-400 transition-colors font-medium flex items-center group">
                    <ChevronRight className="w-4 h-4 mr-2 group-hover:translate-x-1 transition-transform" />
                    Community
                  </Link>
                </li>
                <li>
                  <Link href="/careers" className="hover:text-emerald-400 transition-colors font-medium flex items-center group">
                    <ChevronRight className="w-4 h-4 mr-2 group-hover:translate-x-1 transition-transform" />
                    Careers
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="hover:text-emerald-400 transition-colors font-medium flex items-center group">
                    <ChevronRight className="w-4 h-4 mr-2 group-hover:translate-x-1 transition-transform" />
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/partners" className="hover:text-emerald-400 transition-colors font-medium flex items-center group">
                    <ChevronRight className="w-4 h-4 mr-2 group-hover:translate-x-1 transition-transform" />
                    Partners
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          
          {/* Newsletter Signup */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 mb-12 border border-white/20">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-4">Stay Updated</h3>
              <p className="text-slate-300 mb-6">Get the latest updates, tips, and exclusive offers delivered to your inbox.</p>
              <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                <input 
                  type="email" 
                  placeholder="Enter your email" 
                  className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
                />
                <button className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center">
                  Subscribe
                  <ArrowRight className="ml-2 w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          
          {/* Bottom Bar */}
          <div className="border-t border-slate-700 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-slate-400 font-medium mb-4 md:mb-0">
                &copy; 2024 LocalPro. All rights reserved.
              </p>
              <div className="flex items-center space-x-6 text-sm text-slate-400">
                <div className="flex items-center">
                  <Shield className="w-4 h-4 mr-2" />
                  <span>Secure & Trusted</span>
                </div>
                <div className="flex items-center">
                  <Globe className="w-4 h-4 mr-2" />
                  <span>Global Platform</span>
                </div>
                <div className="flex items-center">
                  <Award className="w-4 h-4 mr-2" />
                  <span>Industry Leader</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
