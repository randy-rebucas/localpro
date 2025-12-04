"use client";

import { StaticPageLayout } from "@/components/static-page-layout";
import { HeroSection } from "@/components/static-hero";
import { Button } from "@/components/ui/button";
import { 
  Globe, 
  Mail, 
  Phone, 
  MapPin, 
  MessageCircle, 
  Users, 
  ArrowRight,
  Download,
  ExternalLink,
  Facebook,
  Linkedin,
  Clock,
  Building,
  Headphones,
  Send
} from "lucide-react";

export default function Connect() {
  const socialLinks = [
    {
      name: "Facebook",
      icon: <Facebook className="w-6 h-6" />,
      url: "https://www.facebook.com/localproasia",
      followers: "25K",
      color: "from-blue-500 to-blue-600"
    },
    {
      name: "LinkedIn",
      icon: <Linkedin className="w-6 h-6" />,
      url: "https://www.linkedin.com/company/localproasia/",
      followers: "15K",
      color: "from-blue-600 to-blue-700"
    }
  ];

  const contactMethods = [
    {
      icon: <MessageCircle className="w-6 h-6" />,
      title: "Live Chat",
      description: "Get instant help from our support team",
      contact: "Available 24/7",
      responseTime: "Usually within minutes",
      action: "Start Chat",
      color: "from-emerald-500 to-teal-600"
    },
    {
      icon: <Mail className="w-6 h-6" />,
      title: "Email Support",
      description: "Send us a detailed message",
      contact: "support@localpro.com",
      responseTime: "Within 24 hours",
      action: "Send Email",
      color: "from-blue-500 to-indigo-600"
    },
    {
      icon: <Phone className="w-6 h-6" />,
      title: "Phone Support",
      description: "Speak directly with our team",
      contact: "+63 (2) 8888-LPRO",
      responseTime: "Mon-Fri 9AM-6PM PHT",
      action: "Call Now",
      color: "from-purple-500 to-pink-600"
    }
  ];

  const offices = [
    {
      city: "Manila",
      address: "123 Ayala Avenue, Makati City",
      cityState: "Metro Manila, Philippines 1226",
      phone: "+63 (2) 8888-5776",
      email: "manila@localpro.com",
      hours: "Mon-Fri 9AM-6PM PHT"
    },
    {
      city: "Cebu",
      address: "IT Park, Lahug",
      cityState: "Cebu City, Philippines 6000",
      phone: "+63 (32) 888-5776",
      email: "cebu@localpro.com",
      hours: "Mon-Fri 9AM-6PM PHT"
    },
    {
      city: "Davao",
      address: "Abreeza Business Park",
      cityState: "Davao City, Philippines 8000",
      phone: "+63 (82) 888-5776",
      email: "davao@localpro.com",
      hours: "Mon-Fri 9AM-6PM PHT"
    }
  ];

  const resources = [
    {
      title: "Download Our App",
      description: "Get the LocalPro mobile app for iOS and Android",
      icon: <Download className="w-6 h-6" />,
      action: "Download Now",
      color: "from-emerald-500 to-teal-600"
    },
    {
      title: "Newsletter Signup",
      description: "Stay updated with our latest news and features",
      icon: <Mail className="w-6 h-6" />,
      action: "Subscribe",
      color: "from-blue-500 to-indigo-600"
    },
    {
      title: "Developer API",
      description: "Access our APIs and developer resources",
      icon: <ExternalLink className="w-6 h-6" />,
      action: "View Docs",
      color: "from-purple-500 to-pink-600"
    },
    {
      title: "Partner Program",
      description: "Join our partner ecosystem and grow together",
      icon: <Users className="w-6 h-6" />,
      action: "Learn More",
      color: "from-amber-500 to-orange-600"
    }
  ];

  const stats = [
    { number: "50K+", label: "Social Followers", icon: <Users className="w-6 h-6" /> },
    { number: "10K+", label: "Active Users", icon: <Globe className="w-6 h-6" /> },
    { number: "24/7", label: "Support Available", icon: <Headphones className="w-6 h-6" /> },
    { number: "3", label: "Office Locations", icon: <Building className="w-6 h-6" /> }
  ];

  return (
    <StaticPageLayout>
      {/* Hero Section */}
      <HeroSection 
        title="Connect with LocalPro"
        subtitle="Stay connected, get support, and join our growing community"
        highlightText="Connect"
        badge="Get in Touch"
      />

      {/* Stats Section */}
      <section className="py-20 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div key={index} className="text-center p-6 bg-slate-800/30 rounded-2xl border border-slate-700/50">
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

      {/* Social Media */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Follow Us on Social Media
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Stay updated with our latest news, tips, and community highlights
            </p>
          </div>
          <div className="flex justify-center gap-6">
            {socialLinks.map((social, index) => (
              <a
                key={index}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group p-8 rounded-2xl bg-slate-800/30 border border-slate-700/50 hover:border-emerald-500/30 transition-all text-center min-w-[200px]"
              >
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-r ${social.color} text-white mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                  {social.icon}
                </div>
                <h3 className="text-xl font-semibold text-white mb-1 group-hover:text-emerald-400 transition-colors">
                  {social.name}
                </h3>
                <p className="text-slate-400">
                  {social.followers} followers
                </p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-20 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Get in Touch
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Multiple ways to reach our team
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {contactMethods.map((method, index) => (
              <div key={index} className="group p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50 hover:border-emerald-500/30 transition-all text-center">
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-r ${method.color} text-white mb-4 shadow-lg`}>
                  {method.icon}
                </div>
                <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-emerald-400 transition-colors">
                  {method.title}
                </h3>
                <p className="text-slate-400 mb-4 text-sm">
                  {method.description}
                </p>
                <div className="space-y-2 text-sm mb-6">
                  <div className="font-medium text-white">
                    {method.contact}
                  </div>
                  <div className="flex items-center justify-center text-slate-500">
                    <Clock className="w-4 h-4 mr-2" />
                    {method.responseTime}
                  </div>
                </div>
                <Button className="w-full bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white border border-emerald-500/30 rounded-xl">
                  {method.action}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Office Locations */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Visit Our Offices
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Meet us in person at one of our locations
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {offices.map((office, index) => (
              <div key={index} className="p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50 hover:border-emerald-500/30 transition-all">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                    <Building className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">
                    {office.city}
                  </h3>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start space-x-3">
                    <MapPin className="w-4 h-4 mt-1 text-slate-500" />
                    <div className="text-slate-300">
                      <div>{office.address}</div>
                      <div>{office.cityState}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone className="w-4 h-4 text-slate-500" />
                    <span className="text-slate-300">{office.phone}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Mail className="w-4 h-4 text-slate-500" />
                    <span className="text-emerald-400">{office.email}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Clock className="w-4 h-4 text-slate-500" />
                    <span className="text-slate-400">{office.hours}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Resources */}
      <section className="py-20 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Additional Resources
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Explore more ways to connect and engage
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {resources.map((resource, index) => (
              <div key={index} className="group p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50 hover:border-emerald-500/30 transition-all text-center cursor-pointer">
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-r ${resource.color} text-white mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                  {resource.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-emerald-400 transition-colors">
                  {resource.title}
                </h3>
                <p className="text-slate-400 text-sm mb-4">
                  {resource.description}
                </p>
                <div className="flex items-center justify-center text-emerald-400 font-medium text-sm">
                  {resource.action}
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600"></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.05)_1px,transparent_1px)] bg-[size:48px_48px]"></div>
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Stay in the Loop
          </h2>
          <p className="text-lg text-emerald-100 mb-10">
            Subscribe to our newsletter for updates, tips, and exclusive content
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-emerald-100 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
            />
            <Button className="bg-white text-emerald-600 hover:bg-white/90 font-bold rounded-xl shadow-2xl">
              <Send className="w-5 h-5 mr-2" />
              Subscribe
            </Button>
          </div>
          <p className="text-emerald-100 text-sm mt-4">
            No spam, unsubscribe at any time
          </p>
        </div>
      </section>
    </StaticPageLayout>
  );
}
