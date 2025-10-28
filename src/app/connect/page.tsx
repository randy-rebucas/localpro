import { StaticPageLayout } from "@/components/static-page-layout";
import { HeroSection } from "@/components/static-hero";
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
  Instagram,
  Twitter,
  Facebook,
  Linkedin,
  Youtube,
  Github,
  Send,
  Clock,
  Building,
  Headphones
} from "lucide-react";

export default function Connect() {
  const socialLinks = [
    {
      name: "Facebook",
      icon: <Facebook className="w-6 h-6" />,
      url: "https://facebook.com/localpro",
      followers: "25K",
      color: "text-blue-600"
    },
    {
      name: "Twitter",
      icon: <Twitter className="w-6 h-6" />,
      url: "https://twitter.com/localpro",
      followers: "18K",
      color: "text-blue-400"
    },
    {
      name: "Instagram",
      icon: <Instagram className="w-6 h-6" />,
      url: "https://instagram.com/localpro",
      followers: "32K",
      color: "text-pink-500"
    },
    {
      name: "LinkedIn",
      icon: <Linkedin className="w-6 h-6" />,
      url: "https://linkedin.com/company/localpro",
      followers: "15K",
      color: "text-blue-700"
    },
    {
      name: "YouTube",
      icon: <Youtube className="w-6 h-6" />,
      url: "https://youtube.com/localpro",
      followers: "8K",
      color: "text-red-600"
    },
    {
      name: "GitHub",
      icon: <Github className="w-6 h-6" />,
      url: "https://github.com/localpro",
      followers: "2K",
      color: "text-gray-600"
    }
  ];

  const contactMethods = [
    {
      icon: <MessageCircle className="w-8 h-8 text-blue-500" />,
      title: "Live Chat",
      description: "Get instant help from our support team",
      contact: "Available 24/7",
      responseTime: "Usually within minutes",
      action: "Start Chat"
    },
    {
      icon: <Mail className="w-8 h-8 text-green-500" />,
      title: "Email Support",
      description: "Send us a detailed message",
      contact: "support@localpro.com",
      responseTime: "Within 24 hours",
      action: "Send Email"
    },
    {
      icon: <Phone className="w-8 h-8 text-purple-500" />,
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
      hours: "Mon-Fri 9AM-6PM PST"
    },
    {
      city: "New York",
      address: "456 Broadway, Floor 15",
      cityState: "New York, NY 10013",
      phone: "+1 (555) 234-5678",
      email: "ny@localpro.com",
      hours: "Mon-Fri 9AM-6PM EST"
    },
    {
      city: "Austin",
      address: "789 Congress Ave, Suite 200",
      cityState: "Austin, TX 78701",
      phone: "+1 (555) 345-6789",
      email: "austin@localpro.com",
      hours: "Mon-Fri 9AM-6PM CST"
    }
  ];

  const resources = [
    {
      title: "Download Our App",
      description: "Get the LocalPro mobile app for iOS and Android",
      icon: <Download className="w-8 h-8 text-blue-500" />,
      action: "Download Now"
    },
    {
      title: "Newsletter Signup",
      description: "Stay updated with our latest news and features",
      icon: <Mail className="w-8 h-8 text-green-500" />,
      action: "Subscribe"
    },
    {
      title: "Developer API",
      description: "Access our APIs and developer resources",
      icon: <ExternalLink className="w-8 h-8 text-purple-500" />,
      action: "View Docs"
    },
    {
      title: "Partner Program",
      description: "Join our partner ecosystem and grow together",
      icon: <Users className="w-8 h-8 text-orange-500" />,
      action: "Learn More"
    }
  ];

  const stats = [
    { number: "50K+", label: "Social Followers", icon: <Users className="w-8 h-8" /> },
    { number: "10K+", label: "Active Users", icon: <Globe className="w-8 h-8" /> },
    { number: "24/7", label: "Support Available", icon: <Headphones className="w-8 h-8" /> },
    { number: "5", label: "Global Offices", icon: <Building className="w-8 h-8" /> }
  ];

  return (
    <StaticPageLayout>
      {/* Hero Section */}
      <HeroSection 
        title="Connect with LocalPro"
        subtitle="Stay connected, get support, and join our growing community"
        highlightText="Connect"
        gradientFrom="from-cyan-600"
        gradientTo="to-teal-600"
      />

      {/* Stats Section */}
      <section className="py-16 bg-white dark:bg-slate-800">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600 dark:text-blue-400">
                    {stat.icon}
                  </div>
                  <div className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                    {stat.number}
                  </div>
                  <div className="text-slate-600 dark:text-slate-400">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Social Media */}
      <section className="py-16 bg-slate-50 dark:bg-slate-900">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                Follow Us on Social Media
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-300">
                Stay updated with our latest news, tips, and community highlights
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white dark:bg-slate-800 rounded-xl p-6 text-center hover:shadow-lg transition-shadow group"
                >
                  <div className={`w-12 h-12 mx-auto mb-4 ${social.color} group-hover:scale-110 transition-transform`}>
                    {social.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                    {social.name}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {social.followers} followers
                  </p>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-16 bg-white dark:bg-slate-800">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                Get in Touch
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-300">
                Multiple ways to reach our team
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {contactMethods.map((method, index) => (
                <div key={index} className="bg-slate-50 dark:bg-slate-700 rounded-xl p-8 text-center hover:shadow-lg transition-shadow">
                  <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                    {method.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
                    {method.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 mb-4">
                    {method.description}
                  </p>
                  <div className="space-y-2 text-sm text-slate-500 dark:text-slate-400 mb-6">
                    <div className="font-medium text-slate-700 dark:text-slate-300">
                      {method.contact}
                    </div>
                    <div className="flex items-center justify-center">
                      <Clock className="w-4 h-4 mr-2" />
                      {method.responseTime}
                    </div>
                  </div>
                  <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
                    {method.action}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Office Locations */}
      <section className="py-16 bg-slate-50 dark:bg-slate-900">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                Visit Our Offices
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-300">
                Meet us in person at one of our locations
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {offices.map((office, index) => (
                <div key={index} className="bg-white dark:bg-slate-800 rounded-xl p-6 hover:shadow-lg transition-shadow">
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
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Resources */}
      <section className="py-16 bg-white dark:bg-slate-800">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                Additional Resources
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-300">
                Explore more ways to connect and engage
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {resources.map((resource, index) => (
                <div key={index} className="bg-slate-50 dark:bg-slate-700 rounded-xl p-6 text-center hover:shadow-lg transition-shadow group cursor-pointer">
                  <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform">
                    {resource.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-emerald-400 transition-colors">
                    {resource.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 text-sm mb-4">
                    {resource.description}
                  </p>
                  <div className="flex items-center justify-center text-blue-600 dark:text-emerald-400 font-medium group-hover:text-blue-700 dark:group-hover:text-emerald-300 transition-colors">
                    {resource.action}
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Stay in the Loop
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Subscribe to our newsletter for updates, tips, and exclusive content
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-yellow-300 focus:border-transparent"
              />
              <button className="bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center">
                <Send className="w-5 h-5 mr-2" />
                Subscribe
              </button>
            </div>
            <p className="text-blue-200 text-sm mt-4">
              No spam, unsubscribe at any time
            </p>
          </div>
        </div>
      </section>
    </StaticPageLayout>
  );
}
