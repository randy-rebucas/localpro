import { StaticPageLayout } from "@/components/static-page-layout";
import { HeroSection } from "@/components/static-hero";
import { 
  Globe, 
  Award, 
  CheckCircle,
  ArrowRight,
  Users,
  TrendingUp,
  Zap,
  Heart
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
      name: "PayMaya",
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
      color: "from-gray-400 to-gray-600",
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
      color: "from-yellow-400 to-yellow-600",
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
      color: "from-gray-300 to-gray-500",
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
      icon: <TrendingUp className="w-8 h-8 text-green-500" />,
      title: "Increased Revenue",
      description: "Access to our 10,000+ professional user base and growing marketplace"
    },
    {
      icon: <Globe className="w-8 h-8 text-blue-500" />,
      title: "Market Expansion",
      description: "Reach new markets and customer segments through our platform"
    },
    {
      icon: <Users className="w-8 h-8 text-purple-500" />,
      title: "Customer Acquisition",
      description: "Connect with qualified leads and potential customers"
    },
    {
      icon: <Zap className="w-8 h-8 text-yellow-500" />,
      title: "Technology Integration",
      description: "Seamless integration with our platform and APIs"
    },
    {
      icon: <Award className="w-8 h-8 text-orange-500" />,
      title: "Brand Recognition",
      description: "Enhanced visibility and credibility through partnership"
    },
    {
      icon: <Heart className="w-8 h-8 text-red-500" />,
      title: "Mutual Growth",
      description: "Collaborative approach to growing both businesses together"
    }
  ];

  return (
    <StaticPageLayout>
      {/* Hero Section */}
      <HeroSection 
        title="Partner with LocalPro"
        subtitle="Join our ecosystem of trusted partners and grow your business together"
        highlightText="LocalPro"
        gradientFrom="from-orange-600"
        gradientTo="to-red-600"
      >
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-semibold py-3 px-8 rounded-xl transition-colors">
            Become a Partner
          </button>
          <button className="bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-8 rounded-xl transition-colors border border-white/20">
            View Partnership Tiers
          </button>
        </div>
      </HeroSection>

      {/* Partnership Benefits */}
      <section className="py-16 bg-white dark:bg-slate-800">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                Why Partner with Us?
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-300">
                Unlock new opportunities and grow your business with our platform
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {benefits.map((benefit, index) => (
                <div key={index} className="bg-slate-50 dark:bg-slate-700 rounded-xl p-6 text-center hover:shadow-lg transition-shadow">
                  <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    {benefit.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
                    {benefit.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300">
                    {benefit.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Partnership Tiers */}
      <section className="py-16 bg-slate-50 dark:bg-slate-900">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                Partnership Tiers
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-300">
                Choose the partnership level that fits your business needs
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {partnershipTiers.map((tier, index) => (
                <div key={index} className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                  <div className={`w-16 h-16 bg-gradient-to-r ${tier.color} rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-lg`}>
                    {tier.name.charAt(0)}
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2 text-center">
                    {tier.name}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 text-center">
                    {tier.requirements}
                  </p>
                  <ul className="space-y-2">
                    {tier.benefits.map((benefit, benefitIndex) => (
                      <li key={benefitIndex} className="flex items-start text-sm text-slate-600 dark:text-slate-300">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-500 mt-0.5" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Current Partners */}
      <section className="py-16 bg-white dark:bg-slate-800">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                Our Trusted Partners
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-300">
                Industry leaders who trust us with their business growth
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {partners.map((partner, index) => (
                <div key={index} className="bg-slate-50 dark:bg-slate-700 rounded-xl p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {partner.logo}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                        {partner.name}
                      </h3>
                      <p className="text-sm text-blue-600 dark:text-blue-400">
                        {partner.category}
                      </p>
                    </div>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 mb-4 text-sm">
                    {partner.description}
                  </p>
                  <div className="mb-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      partner.tier === 'Platinum' ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' :
                      partner.tier === 'Gold' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200' :
                      partner.tier === 'Silver' ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' :
                      'bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-200'
                    }`}>
                      {partner.tier} Partner
                    </span>
                  </div>
                  <ul className="space-y-1">
                    {partner.benefits.map((benefit, benefitIndex) => (
                      <li key={benefitIndex} className="flex items-center text-xs text-slate-600 dark:text-slate-300">
                        <CheckCircle className="w-3 h-3 mr-2 text-green-500" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How to Partner */}
      <section className="py-16 bg-slate-50 dark:bg-slate-900">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                How to Become a Partner
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-300">
                Simple steps to join our partner ecosystem
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">1</span>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Apply</h3>
                <p className="text-slate-600 dark:text-slate-300 text-sm">
                  Submit your partnership application with company details and goals
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">2</span>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Review</h3>
                <p className="text-slate-600 dark:text-slate-300 text-sm">
                  Our team reviews your application and determines the best partnership tier
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">3</span>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Launch</h3>
                <p className="text-slate-600 dark:text-slate-300 text-sm">
                  Complete integration and launch your partnership with full support
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-emerald-600 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Partner with Us?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Join our growing ecosystem of partners and unlock new opportunities for your business.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-semibold py-3 px-8 rounded-xl transition-colors flex items-center justify-center">
                Start Partnership Application
                <ArrowRight className="w-5 h-5 ml-2" />
              </button>
              <button className="bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-8 rounded-xl transition-colors border border-white/20">
                Download Partnership Guide
              </button>
            </div>
          </div>
        </div>
      </section>
    </StaticPageLayout>
  );
}
