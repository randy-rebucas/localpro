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
      icon: <Lock className="w-8 h-8 text-blue-500" />,
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
      icon: <Users className="w-8 h-8 text-green-500" />,
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
      icon: <Database className="w-8 h-8 text-purple-500" />,
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
      icon: <Award className="w-8 h-8 text-yellow-500" />,
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Hero Section */}
      <HeroSection 
        title="Security & Trust"
        subtitle="Your security is our top priority. Learn about our comprehensive security measures and best practices."
        highlightText="Security"
        gradientFrom="from-red-600"
        gradientTo="to-pink-600"
      >
        <div className="flex items-center justify-center space-x-4 text-red-200">
          <Calendar className="w-5 h-5" />
          <span>Last updated: {lastUpdated}</span>
        </div>
      </HeroSection>

      {/* Security Overview */}
      <section className="py-16 bg-white dark:bg-slate-800">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-8 mb-8">
              <div className="flex items-start space-x-4">
                <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400 mt-1" />
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                    Our Security Commitment
                  </h2>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
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
      <section className="py-16 bg-slate-50 dark:bg-slate-900">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                Security Features
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-300">
                Comprehensive security measures to protect your data
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {securityFeatures.map((feature, index) => (
                <div key={index} className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-lg">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                        {feature.title}
                      </h3>
                    </div>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 mb-6">
                    {feature.description}
                  </p>
                  <ul className="space-y-2">
                    {feature.details.map((detail, detailIndex) => (
                      <li key={detailIndex} className="flex items-start space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
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
      <section className="py-16 bg-white dark:bg-slate-800">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                Security Measures
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-300">
                Detailed breakdown of our security controls
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {securityMeasures.map((category, index) => (
                <div key={index} className="bg-slate-50 dark:bg-slate-700 rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                    {category.category}
                  </h3>
                  <ul className="space-y-3">
                    {category.measures.map((measure, measureIndex) => (
                      <li key={measureIndex} className="flex items-start space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
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
      <section className="py-16 bg-slate-50 dark:bg-slate-900">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                Compliance & Certifications
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-300">
                We maintain industry certifications and regulatory compliance
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {complianceStandards.map((standard, index) => (
                <div key={index} className="bg-white dark:bg-slate-800 rounded-xl p-6 text-center shadow-lg">
                  <div className="flex justify-center mb-4">
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
      <section className="py-16 bg-white dark:bg-slate-800">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                Security Best Practices
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-300">
                Help us keep your account secure with these tips
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {securityTips.map((tip, index) => (
                <div key={index} className="bg-slate-50 dark:bg-slate-700 rounded-xl p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400">
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
      <section className="py-16 bg-slate-50 dark:bg-slate-900">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                Incident Response
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-300">
                How we handle security incidents and breaches
              </p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Zap className="w-8 h-8 text-red-600 dark:text-red-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    Detection
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 text-sm">
                    24/7 monitoring and automated threat detection
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    Response
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 text-sm">
                    Immediate containment and investigation
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
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
      <section className="py-16 bg-white dark:bg-slate-800">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                Report Security Issues
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-300">
                Help us maintain security by reporting vulnerabilities
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700 rounded-xl p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <Mail className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    Security Email
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300">
                    security@localpro.com
                  </p>
                </div>
                <div className="text-center">
                  <Phone className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    Security Hotline
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300">
                    +1 (555) 123-4567
                  </p>
                </div>
                <div className="text-center">
                  <FileText className="w-8 h-8 text-purple-600 dark:text-purple-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    Bug Bounty
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300">
                    Submit vulnerability reports
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
