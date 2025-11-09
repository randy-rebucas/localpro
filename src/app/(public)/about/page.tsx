"use client";

import Link from "next/link";
import Image from "next/image";
import { StaticPageLayout } from "@/components/static-page-layout";
import { HeroSection } from "@/components/static-hero";
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
  const teamMembers = [
    {
      name: "Sarah Johnson",
      role: "CEO & Co-Founder",
      image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      bio: "Former McKinsey consultant with 15+ years in professional services",
      linkedin: "#"
    },
    {
      name: "Michael Chen",
      role: "CTO & Co-Founder",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      bio: "Ex-Google engineer passionate about building scalable platforms",
      linkedin: "#"
    },
    {
      name: "Emily Rodriguez",
      role: "Head of Product",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      bio: "Product leader with expertise in marketplace and fintech solutions",
      linkedin: "#"
    },
    {
      name: "David Kim",
      role: "Head of Engineering",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      bio: "Full-stack architect with 10+ years building enterprise applications",
      linkedin: "#"
    },
    {
      name: "Lisa Wang",
      role: "Head of Marketing",
      image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      bio: "Growth marketing expert with track record of scaling B2B platforms",
      linkedin: "#"
    },
    {
      name: "James Wilson",
      role: "Head of Operations",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      bio: "Operations specialist focused on scaling and process optimization",
      linkedin: "#"
    }
  ];

  const milestones = [
    {
      year: "2020",
      title: "Company Founded",
      description: "LocalPro was founded with a vision to revolutionize professional services"
    },
    {
      year: "2021",
      title: "First 1,000 Users",
      description: "Reached our first major milestone with 1,000 active professionals"
    },
    {
      year: "2022",
      title: "Series A Funding",
      description: "Raised $10M in Series A funding to accelerate growth"
    },
    {
      year: "2023",
      title: "Platform Expansion",
      description: "Launched Academy, Finance, and Supplies modules"
    },
    {
      year: "2024",
      title: "Global Expansion",
      description: "Expanded to 5 countries with 10,000+ active users"
    }
  ];

  const values = [
    {
      icon: <Heart className="w-6 h-6 text-[#1A5276]" />,
      title: "Customer First",
      description: "Every decision we make is guided by what's best for our users and their success"
    },
    {
      icon: <Zap className="w-6 h-6 text-[#34A853]" />,
      title: "Innovation",
      description: "We constantly push boundaries to create cutting-edge solutions for professionals"
    },
    {
      icon: <Shield className="w-6 h-6 text-[#1A5276]" />,
      title: "Trust & Security",
      description: "We maintain the highest standards of security and transparency in everything we do"
    },
    {
      icon: <Handshake className="w-6 h-6 text-[#34A853]" />,
      title: "Collaboration",
      description: "We believe in the power of working together to achieve extraordinary results"
    },
    {
      icon: <Globe className="w-6 h-6 text-[#1A5276]" />,
      title: "Global Impact",
      description: "We're building solutions that empower professionals worldwide"
    },
    {
      icon: <Rocket className="w-6 h-6 text-[#34A853]" />,
      title: "Growth",
      description: "We're committed to continuous learning and helping our team and users grow"
    }
  ];

  const stats = [
    { number: "10,000+", label: "Active Professionals", icon: <Users className="w-8 h-8" /> },
    { number: "50,000+", label: "Services Completed", icon: <Briefcase className="w-8 h-8" /> },
    { number: "5", label: "Countries", icon: <Globe className="w-8 h-8" /> },
    { number: "4.9★", label: "Average Rating", icon: <Star className="w-8 h-8" /> }
  ];

  return (
    <StaticPageLayout>
      {/* Hero Section */}
      <HeroSection 
        title="About LocalPro"
        subtitle="Empowering professionals worldwide through innovative technology and meaningful connections"
        highlightText="LocalPro"
        gradientFrom="from-[#1A5276]"
        gradientTo="to-[#34A853]"
      />

      {/* Mission & Vision */}
      <section className="py-8 bg-white dark:bg-slate-800">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                  Our Mission
                </h2>
                <p className="text-lg text-slate-600 dark:text-slate-300 mb-4">
                  To revolutionize the professional services industry by creating a comprehensive platform 
                  that connects service providers with customers, provides education and training, and 
                  offers financial solutions to help professionals grow their businesses.
                </p>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-[#34A853] mt-1" />
                    <p className="text-slate-600 dark:text-slate-300">
                      Connect professionals with customers through our smart marketplace
                    </p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-[#34A853] mt-1" />
                    <p className="text-slate-600 dark:text-slate-300">
                      Provide world-class education and training through our Academy
                    </p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-[#34A853] mt-1" />
                    <p className="text-slate-600 dark:text-slate-300">
                      Offer financial solutions to help professionals scale their businesses
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-[#1A5276]/10 to-[#34A853]/10 rounded-xl p-6">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                  Our Vision
                </h3>
                <p className="text-slate-600 dark:text-slate-300">
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
      <section className="py-8 bg-slate-50 dark:bg-slate-900">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                Our Impact in Numbers
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-300">
                The results speak for themselves
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#1A5276] to-[#34A853] rounded-lg flex items-center justify-center mx-auto mb-3 text-white">
                    {stat.icon}
                  </div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                    {stat.number}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-8 bg-white dark:bg-slate-800">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                Our Core Values
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-300">
                The principles that guide everything we do
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {values.map((value, index) => (
                <div key={index} className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4 text-center hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center mx-auto mb-3 shadow-md">
                    {value.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    {value.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {value.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-8 bg-slate-50 dark:bg-slate-900">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                Meet Our Team
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-300">
                The passionate people behind LocalPro&apos;s success
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teamMembers.map((member, index) => (
                <div key={index} className="bg-white dark:bg-slate-800 rounded-lg p-4 text-center hover:shadow-lg transition-shadow">
                  <div className="w-16 h-16 rounded-full mx-auto mb-3 overflow-hidden border-2 border-[#1A5276]">
                    <Image 
                      src={member.image} 
                      alt={member.name}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                    {member.name}
                  </h3>
                  <p className="text-[#34A853] font-medium mb-2">
                    {member.role}
                  </p>
                  <p className="text-slate-600 dark:text-slate-300 text-xs mb-3">
                    {member.bio}
                  </p>
                  <a
                    href={member.linkedin}
                    className="text-[#1A5276] hover:text-[#34A853] transition-colors text-sm"
                  >
                    LinkedIn
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-8 bg-white dark:bg-slate-800">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                Our Journey
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-300">
                Key milestones in our company&apos;s growth
              </p>
            </div>
            <div className="space-y-6">
              {milestones.map((milestone, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#1A5276] to-[#34A853] rounded-lg flex items-center justify-center text-white font-bold text-sm">
                      {milestone.year}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                      {milestone.title}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300 text-sm">
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
      <section className="py-8 bg-gradient-to-r from-[#1A5276] to-[#34A853] text-white">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">
              Ready to Join Our Mission?
            </h2>
            <p className="text-lg text-white/90 mb-6">
              Whether you&apos;re a professional looking to grow your business or a customer 
              seeking quality services, we&apos;re here to help you succeed.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/marketplace"
                className="bg-white hover:bg-white/90 text-[#1A5276] font-medium py-2 px-6 rounded-lg transition-colors flex items-center justify-center"
              >
                Explore Marketplace
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
              <Link
                href="/contact"
                className="bg-white/10 hover:bg-white/20 text-white font-medium py-2 px-6 rounded-lg transition-colors border border-white/20"
              >
                Get in Touch
              </Link>
            </div>
          </div>
        </div>
      </section>
    </StaticPageLayout>
  );
}
