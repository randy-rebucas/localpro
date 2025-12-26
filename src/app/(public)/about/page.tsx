"use client";

import Link from "next/link";
import { StaticPageLayout } from "@/components/static-page-layout";
import { HeroSection } from "@/components/static-hero";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Heart, 
  Globe, 
  Zap,
  Shield,
  Star,
  CheckCircle,
  ArrowRight,
  Briefcase,
  Handshake,
  Rocket,
} from "lucide-react";

export default function About() {
  const milestones = [
    {
      year: "2025",
      title: "Company Founded",
      description: "LocalPro was founded in Ormoc City with a mission to empower local service providers through technology"
    },
    {
      year: "2025",
      title: "LGU-Ormoc Partnership",
      description: "Established official partnership with LGU-Ormoc City to support local entrepreneurs and skilled workers"
    },
    {
      year: "2025",
      title: "Platform Launch",
      description: "Launched our marketplace platform connecting service providers with customers across Eastern Visayas"
    },
    {
      year: "2025",
      title: "Education Partnerships",
      description: "Initiated partnerships with TESDC and EVSU for training programs and certification integration"
    },
    {
      year: "2026",
      title: "Regional Expansion",
      description: "Planned expansion to cover more regions in the Philippines with enhanced platform features"
    }
  ];

  const values = [
    {
      icon: <Heart className="w-6 h-6" />,
      title: "Customer First",
      description: "Every decision we make is guided by what's best for our users and their success",
      color: "from-rose-500 to-pink-600"
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Innovation",
      description: "We constantly push boundaries to create cutting-edge solutions for professionals",
      color: "from-amber-500 to-orange-600"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Trust & Security",
      description: "We maintain the highest standards of security and transparency in everything we do",
      color: "from-primary to-indigo-600"
    },
    {
      icon: <Handshake className="w-6 h-6" />,
      title: "Collaboration",
      description: "We believe in the power of working together to achieve extraordinary results",
      color: "from-emerald-500 to-teal-600"
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: "Global Impact",
      description: "We're building solutions that empower professionals worldwide",
      color: "from-cyan-500 to-primary"
    },
    {
      icon: <Rocket className="w-6 h-6" />,
      title: "Growth",
      description: "We're committed to continuous learning and helping our team and users grow",
      color: "from-purple-500 to-pink-600"
    }
  ];

  const stats = [
    { number: "500+", label: "Active Professionals", icon: <Users className="w-6 h-6" /> },
    { number: "1,000+", label: "Services Completed", icon: <Briefcase className="w-6 h-6" /> },
    { number: "3", label: "Active Partnerships", icon: <Globe className="w-6 h-6" /> },
    { number: "4.8★", label: "Average Rating", icon: <Star className="w-6 h-6" /> }
  ];

  return (
    <StaticPageLayout>
      {/* Hero Section */}
      <HeroSection 
        title="About LocalPro"
        subtitle="Empowering professionals worldwide through innovative technology and meaningful connections"
        highlightText="LocalPro"
        badge="Our Story"
      >
        <Link href="/contact">
          <Button size="lg" variant="default" className="bg-emerald-500 text-white hover:bg-emerald-600 font-bold px-8 py-6 text-lg rounded-full shadow-2xl shadow-emerald-500/30 group">
            Get in Touch
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </HeroSection>

      {/* Mission & Vision */}
      <section className="py-20 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
                Our Mission
              </h2>
              <p className="text-lg text-slate-400 mb-6 leading-relaxed">
                To revolutionize the professional services industry by creating a comprehensive platform 
                that connects service providers with customers, provides education and training, and 
                offers financial solutions to help professionals grow their businesses.
              </p>
              <div className="space-y-4">
                {[
                  "Connect professionals with customers through our smart marketplace",
                  "Provide world-class education and training through our Academy",
                  "Offer financial solutions to help professionals scale their businesses"
                ].map((item, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center mt-0.5">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                    </div>
                    <p className="text-slate-300">{item}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-3xl blur-2xl"></div>
              <div className="relative bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8">
                <h3 className="text-2xl font-bold text-white mb-4">
                  Our Vision
                </h3>
                <p className="text-slate-300 leading-relaxed">
                  To become the world&apos;s leading Super App for professional services, 
                  empowering millions of professionals to build successful, sustainable 
                  businesses while delivering exceptional value to customers worldwide.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Our Impact in Numbers
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              The results speak for themselves
            </p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div key={index} className="text-center p-6 bg-slate-900/50 rounded-2xl border border-slate-800/50">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-emerald-500/10 text-emerald-400 mb-4">
                  {stat.icon}
                </div>
                <div className="text-3xl font-bold text-white mb-2">{stat.number}</div>
                <div className="text-sm text-slate-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Our Core Values
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              The principles that guide everything we do
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {values.map((value, index) => (
              <div key={index} className="group p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50 hover:border-emerald-500/30 transition-all">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r ${value.color} text-white mb-4 shadow-lg`}>
                  {value.icon}
                </div>
                <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-emerald-400 transition-colors">
                  {value.title}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Our Journey
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Key milestones in our company&apos;s growth
            </p>
          </div>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-emerald-500 to-teal-600"></div>
            
            <div className="space-y-8">
              {milestones.map((milestone, index) => (
                <div key={index} className="relative flex items-start space-x-6 pl-2">
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-emerald-500/30">
                    {milestone.year.slice(-2)}
                  </div>
                  <div className="flex-1 bg-slate-800/30 border border-slate-700/50 rounded-xl p-5 hover:border-emerald-500/30 transition-colors">
                    <div className="text-xs text-emerald-400 font-medium mb-1">{milestone.year}</div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {milestone.title}
                    </h3>
                    <p className="text-slate-400 text-sm">
                      {milestone.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600"></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.05)_1px,transparent_1px)] bg-[size:48px_48px]"></div>
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to Join Our Mission?
          </h2>
          <p className="text-lg text-emerald-100 max-w-2xl mx-auto mb-10">
            Whether you&apos;re a professional looking to grow your business or a customer 
            seeking quality services, we&apos;re here to help you succeed.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/marketplace">
              <Button size="lg" className="bg-white !text-emerald-700 hover:bg-emerald-50 font-bold px-8 py-6 text-lg rounded-full shadow-2xl shadow-black/20 group">
                Explore Marketplace
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="ghost" className="text-white hover:bg-white/10 hover:text-white font-bold px-8 py-6 text-lg rounded-full border border-white/30">
                Get in Touch
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </StaticPageLayout>
  );
}
