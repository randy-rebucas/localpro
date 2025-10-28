import { StaticPageLayout } from "@/components/static-page-layout";
import { HeroSection } from "@/components/static-hero";
import { 
  Shield, 
  Eye, 
  Lock, 
  Database, 
  Users, 
  Globe,
  FileText,
  CheckCircle,
  Calendar,
  Mail,
  Phone
} from "lucide-react";

export default function PrivacyPolicy() {
  const lastUpdated = "January 15, 2024";

  const sections = [
    {
      title: "Information We Collect",
      icon: <Database className="w-6 h-6" />,
      content: [
        "Personal information (name, email, phone number, address)",
        "Profile information (business details, service categories, certifications)",
        "Payment information (processed securely through third-party providers)",
        "Usage data (how you interact with our platform)",
        "Device information (IP address, browser type, operating system)",
        "Location data (with your permission for location-based services)"
      ]
    },
    {
      title: "How We Use Your Information",
      icon: <Users className="w-6 h-6" />,
      content: [
        "Provide and improve our services",
        "Process transactions and payments",
        "Communicate with you about your account and services",
        "Send you important updates and notifications",
        "Personalize your experience on our platform",
        "Analyze usage patterns to improve our services",
        "Comply with legal obligations"
      ]
    },
    {
      title: "Information Sharing",
      icon: <Globe className="w-6 h-6" />,
      content: [
        "We do not sell your personal information to third parties",
        "We may share information with service providers who help us operate our platform",
        "We may share information when required by law or to protect our rights",
        "We may share aggregated, anonymized data for research purposes",
        "We may share information with your consent for specific purposes"
      ]
    },
    {
      title: "Data Security",
      icon: <Lock className="w-6 h-6" />,
      content: [
        "We use industry-standard encryption to protect your data",
        "We implement access controls and authentication measures",
        "We regularly audit our security practices",
        "We train our employees on data protection best practices",
        "We have incident response procedures in place",
        "We use secure data centers and cloud infrastructure"
      ]
    },
    {
      title: "Your Rights",
      icon: <CheckCircle className="w-6 h-6" />,
      content: [
        "Access your personal information",
        "Correct inaccurate information",
        "Delete your account and data",
        "Export your data",
        "Opt out of marketing communications",
        "Withdraw consent for data processing",
        "File a complaint with supervisory authorities"
      ]
    },
    {
      title: "Cookies and Tracking",
      icon: <Eye className="w-6 h-6" />,
      content: [
        "We use cookies to improve your experience",
        "We use analytics cookies to understand usage patterns",
        "We use marketing cookies to show relevant ads",
        "You can control cookie settings in your browser",
        "Some features may not work if cookies are disabled",
        "We provide clear information about our cookie usage"
      ]
    }
  ];

  const dataTypes = [
    {
      category: "Personal Information",
      examples: ["Name", "Email address", "Phone number", "Physical address", "Date of birth"],
      purpose: "Account creation, identity verification, communication"
    },
    {
      category: "Business Information",
      examples: ["Business name", "Service categories", "Certifications", "Insurance details", "Tax information"],
      purpose: "Service provider verification, marketplace listings, compliance"
    },
    {
      category: "Financial Information",
      examples: ["Payment methods", "Transaction history", "Bank account details", "Tax ID", "Financial statements"],
      purpose: "Payment processing, financial services, tax reporting"
    },
    {
      category: "Usage Data",
      examples: ["Page views", "Click patterns", "Search queries", "Time spent", "Feature usage"],
      purpose: "Platform improvement, personalization, analytics"
    },
    {
      category: "Technical Data",
      examples: ["IP address", "Device type", "Browser version", "Operating system", "Location data"],
      purpose: "Security, fraud prevention, service optimization"
    }
  ];

  return (
    <StaticPageLayout>
      {/* Hero Section */}
      <HeroSection 
        title="Privacy Policy"
        subtitle="Your privacy is important to us. Learn how we collect, use, and protect your information."
        highlightText="Privacy"
        gradientFrom="from-slate-600"
        gradientTo="to-gray-600"
      >
        <div className="flex items-center justify-center space-x-4 text-slate-200">
          <Calendar className="w-5 h-5" />
          <span>Last updated: {lastUpdated}</span>
        </div>
      </HeroSection>

      {/* Introduction */}
      <section className="py-16 bg-white dark:bg-slate-800">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-8 mb-8">
              <div className="flex items-start space-x-4">
                <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400 mt-1" />
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                    Our Commitment to Privacy
                  </h2>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    At LocalPro, we are committed to protecting your privacy and ensuring the security of your personal information. 
                    This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our 
                    platform and services. We believe in transparency and giving you control over your data.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="prose prose-lg max-w-none dark:prose-invert">
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                This Privacy Policy applies to all users of LocalPro, including service providers, customers, and visitors to our website. 
                By using our services, you agree to the collection and use of information in accordance with this policy.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 bg-slate-50 dark:bg-slate-900">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="space-y-12">
              {sections.map((section, index) => (
                <div key={index} className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-lg">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400">
                      {section.icon}
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                      {section.title}
                    </h2>
                  </div>
                  <ul className="space-y-3">
                    {section.content.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-start space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                        <span className="text-slate-600 dark:text-slate-300">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Data Types Table */}
      <section className="py-16 bg-white dark:bg-slate-800">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                Data We Collect
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-300">
                Detailed breakdown of the information we collect and why
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full bg-white dark:bg-slate-800 rounded-xl shadow-lg">
                <thead className="bg-slate-50 dark:bg-slate-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-white">
                      Data Category
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-white">
                      Examples
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-white">
                      Purpose
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {dataTypes.map((dataType, index) => (
                    <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-700">
                      <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">
                        {dataType.category}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                        <ul className="list-disc list-inside space-y-1">
                          {dataType.examples.map((example, exampleIndex) => (
                            <li key={exampleIndex}>{example}</li>
                          ))}
                        </ul>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                        {dataType.purpose}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Your Rights */}
      <section className="py-16 bg-slate-50 dark:bg-slate-900">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                Your Privacy Rights
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-300">
                You have control over your personal information
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                  Access & Control
                </h3>
                <ul className="space-y-2 text-slate-600 dark:text-slate-300">
                  <li>• View and download your data</li>
                  <li>• Update your profile information</li>
                  <li>• Change your privacy settings</li>
                  <li>• Manage your communication preferences</li>
                </ul>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                  Data Portability
                </h3>
                <ul className="space-y-2 text-slate-600 dark:text-slate-300">
                  <li>• Export your data in common formats</li>
                  <li>• Transfer your data to other services</li>
                  <li>• Request data deletion</li>
                  <li>• Object to certain data processing</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Information */}
      <section className="py-16 bg-white dark:bg-slate-800">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                Questions About Privacy?
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-300">
                Contact our privacy team for any questions or concerns
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700 rounded-xl p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <Mail className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    Email Us
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300">
                    privacy@localpro.com
                  </p>
                </div>
                <div className="text-center">
                  <Phone className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    Call Us
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300">
                    +1 (555) 123-4567
                  </p>
                </div>
                <div className="text-center">
                  <FileText className="w-8 h-8 text-purple-600 dark:text-purple-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    Data Request
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300">
                    Submit a data request form
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </StaticPageLayout>
  );
}
