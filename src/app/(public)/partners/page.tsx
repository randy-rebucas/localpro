"use client";

import { StaticPageLayout } from "@/components/static-page-layout";
import { HeroSection } from "@/components/static-hero";
import { Button } from "@/components/ui/button";
import { 
  Globe, 
  Award, 
  CheckCircle,
  ArrowRight,
  Users,
  TrendingUp,
  Zap,
  Heart,
  Building2,
  GraduationCap,
  Landmark,
  Handshake,
  MapPin,
  Calendar,
  Target,
  BookOpen,
  Briefcase,
  Clock
} from "lucide-react";

export default function Partners() {
  const partners = [
    {
      name: "TES Training Solutions",
      category: "Education Partner",
      logo: "TES",
      description: "Leading provider of professional training and certification programs",
      benefits: ["Industry certifications", "Expert instructors", "Flexible learning paths"],
      tier: "Platinum"
    },
    {
      name: "Maya",
      category: "Payment Partner",
      logo: "PM",
      description: "Secure payment processing and financial services",
      benefits: ["Secure transactions", "Multiple payment methods", "Real-time processing"],
      tier: "Gold"
    },
    {
      name: "Hardware Plus",
      category: "Supply Partner",
      logo: "HP",
      description: "Premium tools and equipment for professional services",
      benefits: ["Quality products", "Bulk discounts", "Fast delivery"],
      tier: "Gold"
    },
    {
      name: "CleanPro Solutions",
      category: "Service Partner",
      logo: "CP",
      description: "Specialized cleaning supplies and equipment",
      benefits: ["Professional grade", "Eco-friendly options", "Expert support"],
      tier: "Silver"
    },
    {
      name: "TechFlow Systems",
      category: "Technology Partner",
      logo: "TF",
      description: "Advanced software solutions for service management",
      benefits: ["Integration support", "Custom solutions", "24/7 support"],
      tier: "Silver"
    },
    {
      name: "GreenEarth Supplies",
      category: "Supply Partner",
      logo: "GE",
      description: "Sustainable and eco-friendly cleaning products",
      benefits: ["Eco-friendly", "Cost effective", "Certified organic"],
      tier: "Bronze"
    }
  ];

  const partnershipTiers = [
    {
      name: "Platinum",
      color: "from-slate-400 to-slate-600",
      requirements: "Strategic partnership with significant mutual benefit",
      benefits: [
        "Co-branded marketing campaigns",
        "Dedicated account manager",
        "Priority support",
        "Custom integration solutions",
        "Revenue sharing opportunities"
      ]
    },
    {
      name: "Gold",
      color: "from-amber-400 to-amber-600",
      requirements: "Major partnership with substantial integration",
      benefits: [
        "Joint marketing initiatives",
        "API integration support",
        "Priority technical support",
        "Co-marketing materials",
        "Referral programs"
      ]
    },
    {
      name: "Silver",
      color: "from-slate-300 to-slate-500",
      requirements: "Standard partnership with mutual benefits",
      benefits: [
        "Standard integration support",
        "Marketing collaboration",
        "Technical documentation",
        "Community access",
        "Newsletter inclusion"
      ]
    },
    {
      name: "Bronze",
      color: "from-orange-400 to-orange-600",
      requirements: "Basic partnership with platform access",
      benefits: [
        "Platform listing",
        "Basic support",
        "Resource library access",
        "Community participation",
        "Newsletter updates"
      ]
    }
  ];

  const benefits = [
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Increased Revenue",
      description: "Access to our 10,000+ professional user base and growing marketplace",
      color: "from-emerald-500 to-teal-600"
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: "Market Expansion",
      description: "Reach new markets and customer segments through our platform",
      color: "from-blue-500 to-indigo-600"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Customer Acquisition",
      description: "Connect with qualified leads and potential customers",
      color: "from-purple-500 to-pink-600"
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Technology Integration",
      description: "Seamless integration with our platform and APIs",
      color: "from-amber-500 to-orange-600"
    },
    {
      icon: <Award className="w-6 h-6" />,
      title: "Brand Recognition",
      description: "Enhanced visibility and credibility through partnership",
      color: "from-rose-500 to-red-600"
    },
    {
      icon: <Heart className="w-6 h-6" />,
      title: "Mutual Growth",
      description: "Collaborative approach to growing both businesses together",
      color: "from-cyan-500 to-blue-600"
    }
  ];

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Platinum': return 'bg-slate-500/10 text-slate-300 border-slate-500/20';
      case 'Gold': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Silver': return 'bg-slate-400/10 text-slate-400 border-slate-400/20';
      case 'Bronze': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <StaticPageLayout>
      {/* Hero Section */}
      <HeroSection 
        title="Partner with LocalPro"
        subtitle="Join our ecosystem of trusted partners and grow your business together"
        highlightText="LocalPro"
        badge="Partnership Program"
      >
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" variant="default" className="bg-emerald-500 text-white hover:bg-emerald-600 font-bold px-8 py-6 text-lg rounded-full shadow-2xl shadow-emerald-500/30 group">
            Become a Partner
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
          <Button size="lg" variant="ghost" className="text-white hover:bg-slate-800/50 hover:text-white font-bold px-8 py-6 text-lg rounded-full border border-slate-600">
            View Partnership Tiers
          </Button>
        </div>
      </HeroSection>

      {/* Partnership Benefits */}
      <section className="py-20 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Why Partner with Us?
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Unlock new opportunities and grow your business with our platform
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => (
              <div key={index} className="group p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50 hover:border-emerald-500/30 transition-all text-center">
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-r ${benefit.color} text-white mb-4 shadow-lg`}>
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-emerald-400 transition-colors">
                  {benefit.title}
                </h3>
                <p className="text-slate-400 text-sm">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Active Partners Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6">
              <Handshake className="w-4 h-4 text-emerald-400 mr-2" />
              <span className="text-sm font-medium text-emerald-400">Active Partnerships</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Our Active Partners
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Building stronger communities through strategic partnerships with government and educational institutions
            </p>
          </div>

          {/* LGU-ORMOC Featured Partner */}
          <div className="mb-12">
            <div className="relative p-8 rounded-3xl bg-gradient-to-br from-emerald-900/40 to-teal-900/40 border border-emerald-500/30 overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl"></div>
              
              <div className="relative grid lg:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
                      <Landmark className="w-10 h-10" />
                    </div>
                    <div>
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 mb-2">
                        Official Government Partner
                      </span>
                      <h3 className="text-2xl font-bold text-white">LGU-Ormoc City</h3>
                      <p className="text-emerald-400 font-medium">Local Government Unit Partnership</p>
                    </div>
                  </div>
                  
                  <p className="text-slate-300 mb-6 leading-relaxed">
                    LocalPro has established an official partnership with the Local Government Unit of Ormoc City 
                    to support local service providers and strengthen the city&apos;s digital economy. This collaboration 
                    aims to empower Ormocanon entrepreneurs and skilled workers through technology-enabled opportunities.
                  </p>

                  <div className="grid sm:grid-cols-2 gap-4 mb-6">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">Location</p>
                        <p className="text-slate-400 text-sm">Ormoc City, Leyte</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">Partnership Status</p>
                        <p className="text-slate-400 text-sm">Active since 2025</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-white mb-4">Partnership Objectives</h4>
                  <div className="space-y-3">
                    {[
                      { icon: <Users className="w-4 h-4" />, text: "Support local service providers and skilled workers" },
                      { icon: <Target className="w-4 h-4" />, text: "Promote digital transformation for local businesses" },
                      { icon: <Briefcase className="w-4 h-4" />, text: "Create employment and livelihood opportunities" },
                      { icon: <TrendingUp className="w-4 h-4" />, text: "Boost the local economy through technology" },
                      { icon: <Award className="w-4 h-4" />, text: "Provide training and certification programs" },
                      { icon: <Globe className="w-4 h-4" />, text: "Connect Ormoc services to wider markets" }
                    ].map((item, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 flex-shrink-0">
                          {item.icon}
                        </div>
                        <span className="text-slate-300 text-sm">{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Ongoing Partnerships - TESDA & EVSU-ORMOC */}
          <div className="mb-8">
            <div className="flex items-center justify-center space-x-2 mb-8">
              <Clock className="w-5 h-5 text-amber-400" />
              <h3 className="text-xl font-semibold text-white">Ongoing Partnership Discussions</h3>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* OTESDC Partnership */}
              <div className="relative p-6 rounded-2xl bg-slate-800/50 border border-amber-500/30 overflow-hidden group hover:border-amber-500/50 transition-all">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl"></div>
                
                <div className="relative">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                      <GraduationCap className="w-8 h-8" />
                    </div>
                    <div>
                      <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30 mb-1">
                        In Progress
                      </span>
                      <h4 className="text-xl font-bold text-white">OTESDC</h4>
                      <p className="text-amber-400 text-sm font-medium">Technical Education Partner</p>
                    </div>
                  </div>
                  
                  <p className="text-slate-400 text-sm mb-4 leading-relaxed">
                    Technical Education and Skills Development Center - We are working to establish a partnership 
                    with OTESDC to provide accredited training programs and certifications for service providers on our platform.
                  </p>

                  <div className="space-y-2 mb-4">
                    <p className="text-white font-medium text-sm">Proposed Collaboration Areas:</p>
                    <ul className="space-y-2">
                      {[
                        "Skills assessment and certification integration",
                        "OTESDC-accredited training programs",
                        "National Certificate (NC) verification",
                        "Scholarship programs for service providers"
                      ].map((item, index) => (
                        <li key={index} className="flex items-start text-sm text-slate-400">
                          <CheckCircle className="w-4 h-4 mr-2 text-amber-400 mt-0.5 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex items-center text-amber-400 text-sm">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>Expected completion: Q1 2025</span>
                  </div>
                </div>
              </div>

              {/* EVSU-ORMOC Partnership */}
              <div className="relative p-6 rounded-2xl bg-slate-800/50 border border-blue-500/30 overflow-hidden group hover:border-blue-500/50 transition-all">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl"></div>
                
                <div className="relative">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                      <Building2 className="w-8 h-8" />
                    </div>
                    <div>
                      <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30 mb-1">
                        In Progress
                      </span>
                      <h4 className="text-xl font-bold text-white">EVSU-ORMOC</h4>
                      <p className="text-blue-400 text-sm font-medium">Academic Institution Partner</p>
                    </div>
                  </div>
                  
                  <p className="text-slate-400 text-sm mb-4 leading-relaxed">
                    Eastern Visayas State University - We are in discussions with EVSU-ORMOC to create internship opportunities, 
                    research collaborations, and graduate employment pathways through our platform.
                  </p>

                  <div className="space-y-2 mb-4">
                    <p className="text-white font-medium text-sm">Proposed Collaboration Areas:</p>
                    <ul className="space-y-2">
                      {[
                        "Student internship and OJT programs",
                        "Research collaboration opportunities",
                        "Graduate employment pipeline",
                        "Technology and entrepreneurship workshops"
                      ].map((item, index) => (
                        <li key={index} className="flex items-start text-sm text-slate-400">
                          <CheckCircle className="w-4 h-4 mr-2 text-blue-400 mt-0.5 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex items-center text-blue-400 text-sm">
                    <BookOpen className="w-4 h-4 mr-2" />
                    <span>Academic Year 2025 Integration Target</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Partnership Tiers */}
      <section className="py-20 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Partnership Tiers
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Choose the partnership level that fits your business needs
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {partnershipTiers.map((tier, index) => (
              <div key={index} className="p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50 hover:border-emerald-500/30 transition-all">
                <div className={`w-16 h-16 bg-gradient-to-r ${tier.color} rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl shadow-lg`}>
                  {tier.name.charAt(0)}
                </div>
                <h3 className="text-xl font-semibold text-white mb-2 text-center">
                  {tier.name}
                </h3>
                <p className="text-sm text-slate-400 mb-4 text-center">
                  {tier.requirements}
                </p>
                <ul className="space-y-2">
                  {tier.benefits.map((benefit, benefitIndex) => (
                    <li key={benefitIndex} className="flex items-start text-sm text-slate-400">
                      <CheckCircle className="w-4 h-4 mr-2 text-emerald-400 mt-0.5 flex-shrink-0" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Current Partners */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Our Trusted Partners
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Industry leaders who trust us with their business growth
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {partners.map((partner, index) => (
              <div key={index} className="p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50 hover:border-emerald-500/30 transition-all">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {partner.logo}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {partner.name}
                    </h3>
                    <p className="text-sm text-emerald-400">
                      {partner.category}
                    </p>
                  </div>
                </div>
                <p className="text-slate-400 mb-4 text-sm">
                  {partner.description}
                </p>
                <div className="mb-4">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getTierColor(partner.tier)}`}>
                    {partner.tier} Partner
                  </span>
                </div>
                <ul className="space-y-1">
                  {partner.benefits.map((benefit, benefitIndex) => (
                    <li key={benefitIndex} className="flex items-center text-xs text-slate-400">
                      <CheckCircle className="w-3 h-3 mr-2 text-emerald-400" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How to Partner */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              How to Become a Partner
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Simple steps to join our partner ecosystem
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: "1", title: "Apply", desc: "Submit your partnership application with company details and goals", color: "from-blue-500 to-indigo-600" },
              { step: "2", title: "Review", desc: "Our team reviews your application and determines the best partnership tier", color: "from-emerald-500 to-teal-600" },
              { step: "3", title: "Launch", desc: "Complete integration and launch your partnership with full support", color: "from-purple-500 to-pink-600" }
            ].map((item, index) => (
              <div key={index} className="text-center p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50">
                <div className={`w-14 h-14 bg-gradient-to-r ${item.color} rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                  <span className="text-2xl font-bold text-white">{item.step}</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-slate-400 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600"></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.05)_1px,transparent_1px)] bg-[size:48px_48px]"></div>
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to Partner with Us?
          </h2>
          <p className="text-lg text-emerald-100 max-w-2xl mx-auto mb-10">
            Join our growing ecosystem of partners and unlock new opportunities for your business.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white !text-emerald-600 hover:bg-white/90 font-bold px-8 py-6 text-lg rounded-full shadow-2xl group">
              Start Partnership Application
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button size="lg" variant="ghost" className="text-white hover:bg-white/20 hover:text-white font-bold px-8 py-6 text-lg rounded-full border border-white/30">
              Download Partnership Guide
            </Button>
          </div>
        </div>
      </section>
    </StaticPageLayout>
  );
}
