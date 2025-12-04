"use client";

import Link from "next/link";
import { StaticPageLayout } from "@/components/static-page-layout";
import { HeroSection } from "@/components/static-hero";
import { Button } from "@/components/ui/button";
import { useLiveChat } from "@/components/live-chat";
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  MessageCircle, 
  Send,
  ArrowRight,
  Users,
  FileText,
  Building
} from "lucide-react";

export default function Contact() {
  const { openChat } = useLiveChat();

  const contactMethods = [
    {
      icon: <MessageCircle className="w-6 h-6" />,
      title: "Live Chat",
      description: "Get instant help from our support team",
      contact: "Available 24/7",
      responseTime: "Usually within minutes",
      action: "Start Chat",
      href: "#chat",
      isLiveChat: true,
      color: "from-emerald-500 to-teal-600"
    },
    {
      icon: <Mail className="w-6 h-6" />,
      title: "Email Support",
      description: "Send us a detailed message",
      contact: "admin@localpro.asia",
      responseTime: "Within 24 hours",
      action: "Send Email",
      href: "mailto:admin@localpro.asia",
      color: "from-blue-500 to-indigo-600"
    },
    {
      icon: <Phone className="w-6 h-6" />,
      title: "Phone Support",
      description: "Speak directly with our team",
      contact: "+63 917 915 7515",
      responseTime: "Mon-Fri 9AM-6PM PHT",
      action: "Call Now",
      href: "tel:+639179157515",
      color: "from-purple-500 to-pink-600"
    }
  ];

  const offices = [
    {
      city: "Baybay City",
      address: "A. Bonifacio St, Zone 2",
      cityState: "Baybay City, Leyte, Philippines",
      phone: "+63 917 915 7515",
      email: "admin@localpro.asia",
      hours: "Mon-Fri 9AM-6PM PHT",
      isOpen: true
    },
    {
      city: "Ormoc City",
      address: "Coming Soon",
      cityState: "Ormoc City, Leyte, Philippines",
      phone: "+63 917 915 7515",
      email: "admin@localpro.asia",
      hours: "Opening Soon",
      isOpen: false
    }
  ];

  const departments = [
    {
      name: "General Inquiries",
      email: "admin@localpro.asia",
      description: "General questions about our platform and services"
    },
    {
      name: "Technical Support",
      email: "support@localpro.asia",
      description: "Technical issues, bugs, and platform problems"
    },
    {
      name: "Partnership",
      email: "partners@localpro.asia",
      description: "Partnership opportunities and business development"
    },
    {
      name: "Media & Press",
      email: "press@localpro.asia",
      description: "Media inquiries, press releases, and interviews"
    },
    {
      name: "Legal",
      email: "legal@localpro.asia",
      description: "Legal matters, compliance, and policy questions"
    },
    {
      name: "Careers",
      email: "careers@localpro.asia",
      description: "Job opportunities and recruitment inquiries"
    }
  ];

  return (
    <StaticPageLayout>
      {/* Hero Section */}
      <HeroSection 
        title="Contact Us"
        subtitle="We're here to help! Get in touch with our team for any questions or support"
        highlightText="Contact"
        badge="Get in Touch"
      />

      {/* Contact Methods */}
      <section className="py-20 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Get in Touch
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Choose the best way to reach us
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
                <div className="space-y-1 text-sm mb-6">
                  <div className="font-medium text-white">
                    {method.contact}
                  </div>
                  <div className="flex items-center justify-center text-slate-500">
                    <Clock className="w-3 h-3 mr-1" />
                    {method.responseTime}
                  </div>
                </div>
                {'isLiveChat' in method && method.isLiveChat ? (
                  <Button 
                    onClick={openChat}
                    className="w-full bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white border border-emerald-500/30 rounded-xl"
                  >
                    {method.action}
                  </Button>
                ) : method.href.startsWith('/') ? (
                  <Link href={method.href} className="block">
                    <Button className="w-full bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white border border-emerald-500/30 rounded-xl">
                      {method.action}
                    </Button>
                  </Link>
                ) : (
                  <a href={method.href} className="block">
                    <Button className="w-full bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white border border-emerald-500/30 rounded-xl">
                      {method.action}
                    </Button>
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Send us a Message
            </h2>
            <p className="text-lg text-slate-400">
              Fill out the form below and we&apos;ll get back to you as soon as possible
            </p>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-3xl blur-2xl"></div>
            <div className="relative bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8">
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-3 bg-slate-700 border-2 border-slate-500 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-white placeholder-slate-400 shadow-lg shadow-emerald-500/10 transition-all hover:border-emerald-500/50 hover:bg-slate-600"
                      placeholder="Enter your first name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-3 bg-slate-700 border-2 border-slate-500 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-white placeholder-slate-400 shadow-lg shadow-emerald-500/10 transition-all hover:border-emerald-500/50 hover:bg-slate-600"
                      placeholder="Enter your last name"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    className="w-full px-4 py-3 bg-slate-700 border-2 border-slate-500 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-white placeholder-slate-400 shadow-lg shadow-emerald-500/10 transition-all hover:border-emerald-500/50 hover:bg-slate-600"
                    placeholder="Enter your email address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Subject *
                  </label>
                  <select className="w-full px-4 py-3 bg-slate-700 border-2 border-slate-500 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-white shadow-lg shadow-emerald-500/10 transition-all hover:border-emerald-500/50 hover:bg-slate-600 cursor-pointer">
                    <option value="">Select a subject</option>
                    <option>General Inquiry</option>
                    <option>Technical Support</option>
                    <option>Partnership</option>
                    <option>Media & Press</option>
                    <option>Legal</option>
                    <option>Careers</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Message *
                  </label>
                  <textarea
                    required
                    rows={6}
                    className="w-full px-4 py-3 bg-slate-700 border-2 border-slate-500 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-white placeholder-slate-400 shadow-lg shadow-emerald-500/10 transition-all hover:border-emerald-500/50 hover:bg-slate-600 resize-none"
                    placeholder="Tell us how we can help you..."
                  ></textarea>
                </div>
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="newsletter"
                    className="mt-1 w-5 h-5 text-emerald-500 bg-slate-600 border-2 border-slate-400 rounded focus:ring-emerald-500 cursor-pointer accent-emerald-500"
                  />
                  <label htmlFor="newsletter" className="text-sm text-slate-400">
                    I&apos;d like to receive updates about LocalPro&apos;s new features and services
                  </label>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-emerald-500 text-white hover:bg-emerald-600 font-bold py-4 rounded-xl shadow-lg shadow-emerald-500/30"
                >
                  <Send className="w-5 h-5 mr-2" />
                  Send Message
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Office Locations */}
      <section className="py-20 bg-slate-900/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Our Offices
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Visit us at our locations in Leyte, Philippines
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {offices.map((office, index) => (
              <div key={index} className={`p-6 rounded-2xl border transition-all relative ${
                office.isOpen 
                  ? 'bg-slate-800/30 border-slate-700/50 hover:border-emerald-500/30' 
                  : 'bg-slate-800/20 border-slate-700/30'
              }`}>
                {!office.isOpen && (
                  <div className="absolute top-4 right-4">
                    <span className="bg-amber-500/10 text-amber-400 px-3 py-1 rounded-full text-xs font-medium border border-amber-500/20">
                      Coming Soon
                    </span>
                  </div>
                )}
                <div className="flex items-center space-x-3 mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    office.isOpen ? 'bg-emerald-500/10' : 'bg-amber-500/10'
                  }`}>
                    <Building className={`w-6 h-6 ${office.isOpen ? 'text-emerald-400' : 'text-amber-400'}`} />
                  </div>
                  <h3 className="text-xl font-semibold text-white">
                    {office.city}
                  </h3>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start space-x-3">
                    <MapPin className="w-4 h-4 mt-1 text-slate-500" />
                    <div className={office.isOpen ? 'text-slate-300' : 'text-slate-500'}>
                      <div>{office.address}</div>
                      <div>{office.cityState}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone className="w-4 h-4 text-slate-500" />
                    <a 
                      href={`tel:${office.phone.replace(/\s/g, '')}`} 
                      className={`hover:underline ${office.isOpen ? 'text-slate-300 hover:text-emerald-400' : 'text-slate-500'}`}
                    >
                      {office.phone}
                    </a>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Mail className="w-4 h-4 text-slate-500" />
                    <a 
                      href={`mailto:${office.email}`} 
                      className={`hover:underline ${office.isOpen ? 'text-emerald-400 hover:text-emerald-300' : 'text-slate-500'}`}
                    >
                      {office.email}
                    </a>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Clock className="w-4 h-4 text-slate-500" />
                    <span className={office.isOpen ? 'text-slate-400' : 'text-amber-400'}>{office.hours}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Departments */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Contact by Department
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Reach out to the right team for your specific needs
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {departments.map((dept, index) => (
              <div key={index} className="p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50 hover:border-emerald-500/30 transition-all group">
                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-emerald-400 transition-colors">
                  {dept.name}
                </h3>
                <p className="text-slate-400 text-sm mb-4">
                  {dept.description}
                </p>
                <a 
                  href={`mailto:${dept.email}`}
                  className="flex items-center space-x-2 text-emerald-400 font-medium hover:text-emerald-300 transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  <span className="text-sm hover:underline">{dept.email}</span>
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Quick Links */}
      <section className="py-20 bg-slate-900/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Quick Help
          </h2>
          <p className="text-lg text-slate-400 mb-10">
            Find answers to common questions before reaching out
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link href="/help-center" className="group">
              <div className="p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50 hover:border-emerald-500/30 transition-all">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left flex-1">
                    <h3 className="text-lg font-semibold text-white group-hover:text-emerald-400 transition-colors">
                      Help Center
                    </h3>
                    <p className="text-slate-400 text-sm">
                      Browse our comprehensive help articles
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </Link>
            <Link href="/community" className="group">
              <div className="p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50 hover:border-emerald-500/30 transition-all">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left flex-1">
                    <h3 className="text-lg font-semibold text-white group-hover:text-emerald-400 transition-colors">
                      Community Forum
                    </h3>
                    <p className="text-slate-400 text-sm">
                      Connect with other users and experts
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>
    </StaticPageLayout>
  );
}
