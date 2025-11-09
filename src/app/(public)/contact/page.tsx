import Link from "next/link";
import { StaticPageLayout } from "@/components/static-page-layout";
import { HeroSection } from "@/components/static-hero";
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
  const contactMethods = [
    {
      icon: <MessageCircle className="w-6 h-6 text-[#1A5276]" />,
      title: "Live Chat",
      description: "Get instant help from our support team",
      contact: "Available 24/7",
      responseTime: "Usually within minutes",
      action: "Start Chat"
    },
    {
      icon: <Mail className="w-6 h-6 text-[#34A853]" />,
      title: "Email Support",
      description: "Send us a detailed message",
      contact: "support@localpro.com",
      responseTime: "Within 24 hours",
      action: "Send Email"
    },
    {
      icon: <Phone className="w-6 h-6 text-[#1A5276]" />,
      title: "Phone Support",
      description: "Speak directly with our team",
      contact: "+1 (555) 123-4567",
      responseTime: "Mon-Fri 9AM-6PM PST",
      action: "Call Now"
    }
  ];

  const offices = [
    {
      city: "San Francisco",
      address: "123 Market Street, Suite 100",
      cityState: "San Francisco, CA 94105",
      phone: "+1 (555) 123-4567",
      email: "sf@localpro.com",
      hours: "Mon-Fri 9AM-6PM PST",
      image: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
    },
    {
      city: "New York",
      address: "456 Broadway, Floor 15",
      cityState: "New York, NY 10013",
      phone: "+1 (555) 234-5678",
      email: "ny@localpro.com",
      hours: "Mon-Fri 9AM-6PM EST",
      image: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
    },
    {
      city: "Austin",
      address: "789 Congress Ave, Suite 200",
      cityState: "Austin, TX 78701",
      phone: "+1 (555) 345-6789",
      email: "austin@localpro.com",
      hours: "Mon-Fri 9AM-6PM CST",
      image: "https://images.unsplash.com/photo-1519904981063-b0cf448d479e?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
    }
  ];

  const departments = [
    {
      name: "General Inquiries",
      email: "hello@localpro.com",
      description: "General questions about our platform and services"
    },
    {
      name: "Technical Support",
      email: "support@localpro.com",
      description: "Technical issues, bugs, and platform problems"
    },
    {
      name: "Partnership",
      email: "partners@localpro.com",
      description: "Partnership opportunities and business development"
    },
    {
      name: "Media & Press",
      email: "press@localpro.com",
      description: "Media inquiries, press releases, and interviews"
    },
    {
      name: "Legal",
      email: "legal@localpro.com",
      description: "Legal matters, compliance, and policy questions"
    },
    {
      name: "Careers",
      email: "careers@localpro.com",
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
        gradientFrom="from-[#1A5276]"
        gradientTo="to-[#34A853]"
      />

      {/* Contact Methods */}
      <section className="py-8 bg-white dark:bg-slate-800">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                Get in Touch
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-300">
                Choose the best way to reach us
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {contactMethods.map((method, index) => (
                <div key={index} className="bg-slate-50 dark:bg-slate-700 rounded-lg p-6 text-center hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center mx-auto mb-4 shadow-md">
                    {method.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    {method.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 mb-3 text-sm">
                    {method.description}
                  </p>
                  <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400 mb-4">
                    <div className="font-medium text-slate-700 dark:text-slate-300">
                      {method.contact}
                    </div>
                    <div className="flex items-center justify-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {method.responseTime}
                    </div>
                  </div>
                  <button className="w-full bg-gradient-to-r from-[#1A5276] to-[#34A853] hover:from-[#1A5276]/90 hover:to-[#34A853]/90 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm">
                    {method.action}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-8 bg-slate-50 dark:bg-slate-900">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                Send us a Message
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-300">
                Fill out the form below and we&apos;ll get back to you as soon as possible
              </p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                      placeholder="Enter your first name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                      placeholder="Enter your last name"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    placeholder="Enter your email address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Subject *
                  </label>
                  <select className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
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
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Message *
                  </label>
                  <textarea
                    required
                    rows={6}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    placeholder="Tell us how we can help you..."
                  ></textarea>
                </div>
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="newsletter"
                    className="mt-1 w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="newsletter" className="text-sm text-slate-600 dark:text-slate-300">
                    I&apos;d like to receive updates about LocalPro&apos;s new features and services
                  </label>
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-lg transition-colors flex items-center justify-center"
                >
                  <Send className="w-5 h-5 mr-2" />
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Office Locations */}
      <section className="py-12 bg-white dark:bg-slate-800">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                Our Offices
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-300">
                Visit us at one of our locations worldwide
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {offices.map((office, index) => (
                <div key={index} className="bg-slate-50 dark:bg-slate-700 rounded-xl p-6 hover:shadow-lg transition-shadow relative overflow-hidden">
                  <div 
                    className="absolute top-0 right-0 w-32 h-32 opacity-10"
                    style={{
                      backgroundImage: `url('${office.image}')`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  />
                  <div className="relative z-10">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                        <Building className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                        {office.city}
                      </h3>
                    </div>
                    <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                      <div className="flex items-start space-x-3">
                        <MapPin className="w-4 h-4 mt-1 text-slate-400" />
                        <div>
                          <div>{office.address}</div>
                          <div>{office.cityState}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Phone className="w-4 h-4 text-slate-400" />
                        <span>{office.phone}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Mail className="w-4 h-4 text-slate-400" />
                        <span>{office.email}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span>{office.hours}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Departments */}
      <section className="py-12 bg-slate-50 dark:bg-slate-900">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                Contact by Department
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-300">
                Reach out to the right team for your specific needs
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {departments.map((dept, index) => (
                <div key={index} className="bg-white dark:bg-slate-800 rounded-xl p-6 hover:shadow-lg transition-shadow">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    {dept.name}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 text-sm mb-4">
                    {dept.description}
                  </p>
                  <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 font-medium">
                    <Mail className="w-4 h-4" />
                    <span className="text-sm">{dept.email}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Quick Links */}
      <section className="py-8 bg-white dark:bg-slate-800">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
              Quick Help
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300 mb-6">
              Find answers to common questions before reaching out
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Link
                href="/help-center"
                className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4 hover:shadow-lg transition-shadow group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#1A5276] to-[#34A853] rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white group-hover:text-[#34A853] transition-colors">
                      Help Center
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300 text-sm">
                      Browse our comprehensive help articles
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#34A853] transition-colors" />
                </div>
              </Link>
              <Link
                href="/community"
                className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4 hover:shadow-lg transition-shadow group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#34A853] to-[#1A5276] rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white group-hover:text-[#34A853] transition-colors">
                      Community Forum
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300 text-sm">
                      Connect with other users and experts
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#34A853] transition-colors" />
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </StaticPageLayout>
  );
}
