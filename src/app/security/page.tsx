import { StaticPageLayout } from "@/components/static-page-layout";
import { HeroSection } from "@/components/static-hero";
import { 
  Shield, 
  Lock, 
  Eye, 
  CheckCircle, 
  AlertTriangle,
  Calendar,
  Users,
  Database,
  Mail,
  Phone,
  FileText,
  Zap,
  Target,
  Award
} from "lucide-react";

export default function Security() {
  const lastUpdated = "January 15, 2024";

  const securityFeatures = [
    {
      title: "Data Encryption",
      icon: <Lock className="w-6 h-6 text-[#1A5276]" />,
      description: "All data is encrypted in transit and at rest using industry-standard AES-256 encryption",
      details: [
        "End-to-end encryption for sensitive communications",
        "SSL/TLS encryption for all web traffic",
        "Encrypted database storage",
        "Secure key management and rotation"
      ]
    },
    {
      title: "Access Controls",
      icon: <Users className="w-6 h-6 text-[#34A853]" />,
      description: "Multi-layered access controls ensure only authorized personnel can access your data",
      details: [
        "Role-based access control (RBAC)",
        "Multi-factor authentication (MFA)",
        "Regular access reviews and audits",
        "Principle of least privilege"
      ]
    },
    {
      title: "Infrastructure Security",
      icon: <Database className="w-6 h-6 text-[#1A5276]" />,
      description: "Our infrastructure is built with security-first principles and best practices",
      details: [
        "Secure cloud infrastructure (AWS/Azure)",
        "Regular security updates and patches",
        "Intrusion detection and prevention systems",
        "24/7 security monitoring"
      ]
    },
    {
      title: "Compliance & Certifications",
      icon: <Award className="w-6 h-6 text-[#34A853]" />,
      description: "We maintain industry certifications and comply with relevant regulations",
      details: [
        "SOC 2 Type II certified",
        "GDPR compliant",
        "CCPA compliant",
        "Regular third-party security audits"
      ]
    }
  ];

  const securityMeasures = [
    {
      category: "Authentication & Authorization",
      measures: [
        "Multi-factor authentication (MFA) for all accounts",
        "Strong password requirements and policies",
        "Session management and timeout controls",
        "OAuth 2.0 and OpenID Connect integration",
        "Biometric authentication support"
      ]
    },
    {
      category: "Data Protection",
      measures: [
        "AES-256 encryption for data at rest",
        "TLS 1.3 encryption for data in transit",
        "Regular data backups with encryption",
        "Data anonymization and pseudonymization",
        "Secure data deletion and retention policies"
      ]
    },
    {
      category: "Network Security",
      measures: [
        "Firewall protection and network segmentation",
        "DDoS protection and mitigation",
        "Intrusion detection and prevention systems",
        "Regular vulnerability assessments",
        "Secure API endpoints and rate limiting"
      ]
    },
    {
      category: "Monitoring & Incident Response",
      measures: [
        "24/7 security monitoring and alerting",
        "Automated threat detection and response",
        "Security incident response procedures",
        "Regular security training for staff",
        "Penetration testing and red team exercises"
      ]
    }
  ];

  const complianceStandards = [
    {
      name: "SOC 2 Type II",
      description: "Audited controls for security, availability, and confidentiality",
      status: "Certified",
      icon: <CheckCircle className="w-6 h-6 text-green-500" />
    },
    {
      name: "GDPR",
      description: "General Data Protection Regulation compliance",
      status: "Compliant",
      icon: <CheckCircle className="w-6 h-6 text-green-500" />
    },
    {
      name: "CCPA",
      description: "California Consumer Privacy Act compliance",
      status: "Compliant",
      icon: <CheckCircle className="w-6 h-6 text-green-500" />
    },
    {
      name: "ISO 27001",
      description: "Information security management system",
      status: "In Progress",
      icon: <Target className="w-6 h-6 text-yellow-500" />
    }
  ];

  const securityTips = [
    {
      title: "Use Strong Passwords",
      description: "Create unique, complex passwords for your account",
      icon: <Lock className="w-6 h-6" />
    },
    {
      title: "Enable Two-Factor Authentication",
      description: "Add an extra layer of security to your account",
      icon: <Shield className="w-6 h-6" />
    },
    {
      title: "Keep Your Information Updated",
      description: "Regularly update your contact information and preferences",
      icon: <Users className="w-6 h-6" />
    },
    {
      title: "Be Cautious with Links",
      description: "Only click on links from trusted sources",
      icon: <AlertTriangle className="w-6 h-6" />
    },
    {
      title: "Log Out When Done",
      description: "Always log out when using shared devices",
      icon: <Eye className="w-6 h-6" />
    },
    {
      title: "Report Suspicious Activity",
      description: "Contact us immediately if you notice anything unusual",
      icon: <Mail className="w-6 h-6" />
    }
  ];

  return (
    <StaticPageLayout>
      {/* Hero Section */}
      <HeroSection 
        title="Security & Trust"
        subtitle="Your security is our top priority. Learn about our comprehensive security measures and best practices."
        highlightText="Security"
        gradientFrom="from-[#1A5276]"
        gradientTo="to-[#34A853]"
      >
        <div className="flex items-center justify-center space-x-4 text-white/90">
          <Calendar className="w-5 h-5" />
          <span>Last updated: {lastUpdated}</span>
        </div>
      </HeroSection>

      {/* Security Overview */}
      <section className="py-8 bg-white dark:bg-slate-800">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-[#1A5276]/10 to-[#34A853]/10 rounded-lg p-6 mb-6">
              <div className="flex items-start space-x-3">
                <Shield className="w-6 h-6 text-[#1A5276] mt-1" />
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                    Our Security Commitment
                  </h2>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-sm">
                    At LocalPro, we take security seriously. We implement industry-leading security measures 
                    to protect your data and ensure the integrity of our platform. Our security program is 
                    designed to meet the highest standards and protect against evolving threats.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="prose prose-lg max-w-none dark:prose-invert">
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                We continuously invest in security technologies, processes, and training to ensure that 
                your information remains safe and secure. Our security team works around the clock to 
                monitor, detect, and respond to potential threats.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Security Features */}
      <section className="py-8 bg-slate-50 dark:bg-slate-900">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                Security Features
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-300">
                Comprehensive security measures to protect your data
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {securityFeatures.map((feature, index) => (
                <div key={index} className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#1A5276] to-[#34A853] rounded-lg flex items-center justify-center text-white">
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                        {feature.title}
                      </h3>
                    </div>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 mb-3 text-sm">
                    {feature.description}
                  </p>
                  <ul className="space-y-1">
                    {feature.details.map((detail, detailIndex) => (
                      <li key={detailIndex} className="flex items-start space-x-2">
                        <CheckCircle className="w-4 h-4 text-[#34A853] mt-1 flex-shrink-0" />
                        <span className="text-slate-600 dark:text-slate-300 text-sm">{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Security Measures */}
      <section className="py-8 bg-white dark:bg-slate-800">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                Security Measures
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-300">
                Detailed breakdown of our security controls
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {securityMeasures.map((category, index) => (
                <div key={index} className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
                    {category.category}
                  </h3>
                  <ul className="space-y-1">
                    {category.measures.map((measure, measureIndex) => (
                      <li key={measureIndex} className="flex items-start space-x-2">
                        <CheckCircle className="w-4 h-4 text-[#34A853] mt-1 flex-shrink-0" />
                        <span className="text-slate-600 dark:text-slate-300 text-sm">{measure}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Compliance */}
      <section className="py-8 bg-slate-50 dark:bg-slate-900">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                Compliance & Certifications
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-300">
                We maintain industry certifications and regulatory compliance
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {complianceStandards.map((standard, index) => (
                <div key={index} className="bg-white dark:bg-slate-800 rounded-lg p-4 text-center shadow-lg">
                  <div className="flex justify-center mb-3">
                    {standard.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    {standard.name}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 text-sm mb-3">
                    {standard.description}
                  </p>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                    standard.status === 'Certified' || standard.status === 'Compliant' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                  }`}>
                    {standard.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Security Tips */}
      <section className="py-8 bg-white dark:bg-slate-800">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                Security Best Practices
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-300">
                Help us keep your account secure with these tips
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {securityTips.map((tip, index) => (
                <div key={index} className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4 hover:shadow-lg transition-shadow">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#1A5276] to-[#34A853] rounded-lg flex items-center justify-center text-white">
                      {tip.icon}
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                      {tip.title}
                    </h3>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 text-sm">
                    {tip.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Incident Response */}
      <section className="py-8 bg-slate-50 dark:bg-slate-900">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                Incident Response
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-300">
                How we handle security incidents and breaches
              </p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#1A5276] to-[#34A853] rounded-lg flex items-center justify-center mx-auto mb-3 text-white">
                    <Zap className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    Detection
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 text-sm">
                    24/7 monitoring and automated threat detection
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#34A853] to-[#1A5276] rounded-lg flex items-center justify-center mx-auto mb-3 text-white">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    Response
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 text-sm">
                    Immediate containment and investigation
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#1A5276] to-[#34A853] rounded-lg flex items-center justify-center mx-auto mb-3 text-white">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    Recovery
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 text-sm">
                    Rapid recovery and prevention measures
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Security Team */}
      <section className="py-8 bg-white dark:bg-slate-800">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                Report Security Issues
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-300">
                Help us maintain security by reporting vulnerabilities
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <Mail className="w-6 h-6 text-[#1A5276] mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    Security Email
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 text-sm">
                    security@localpro.com
                  </p>
                </div>
                <div className="text-center">
                  <Phone className="w-6 h-6 text-[#34A853] mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    Security Hotline
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 text-sm">
                    +1 (555) 123-4567
                  </p>
                </div>
                <div className="text-center">
                  <FileText className="w-6 h-6 text-[#1A5276] mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    Bug Bounty
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 text-sm">
                    Submit vulnerability reports
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
