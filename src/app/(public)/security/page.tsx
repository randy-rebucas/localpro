"use client";

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
      icon: <Lock className="w-5 h-5" />,
      color: "from-primary to-indigo-600",
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
      icon: <Users className="w-5 h-5" />,
      color: "from-emerald-500 to-teal-600",
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
      icon: <Database className="w-5 h-5" />,
      color: "from-purple-500 to-pink-600",
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
      icon: <Award className="w-5 h-5" />,
      color: "from-amber-500 to-orange-600",
      description: "We maintain industry certifications and comply with relevant regulations",
      details: [
        "SOC 2 Type II certified",
        "Data Privacy Act compliant",
        "NPC registered",
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
      statusColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
    },
    {
      name: "Data Privacy Act",
      description: "Republic Act 10173 compliance",
      status: "Compliant",
      statusColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
    },
    {
      name: "NPC Registration",
      description: "National Privacy Commission registered",
      status: "Registered",
      statusColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
    },
    {
      name: "ISO 27001",
      description: "Information security management system",
      status: "In Progress",
      statusColor: "bg-amber-500/10 text-amber-400 border-amber-500/20"
    }
  ];

  const securityTips = [
    {
      title: "Use Strong Passwords",
      description: "Create unique, complex passwords for your account",
      icon: <Lock className="w-5 h-5" />
    },
    {
      title: "Enable Two-Factor Authentication",
      description: "Add an extra layer of security to your account",
      icon: <Shield className="w-5 h-5" />
    },
    {
      title: "Keep Your Information Updated",
      description: "Regularly update your contact information and preferences",
      icon: <Users className="w-5 h-5" />
    },
    {
      title: "Be Cautious with Links",
      description: "Only click on links from trusted sources",
      icon: <AlertTriangle className="w-5 h-5" />
    },
    {
      title: "Log Out When Done",
      description: "Always log out when using shared devices",
      icon: <Eye className="w-5 h-5" />
    },
    {
      title: "Report Suspicious Activity",
      description: "Contact us immediately if you notice anything unusual",
      icon: <Mail className="w-5 h-5" />
    }
  ];

  return (
    <StaticPageLayout>
      {/* Hero Section */}
      <HeroSection 
        title="Security & Trust"
        subtitle="Your security is our top priority. Learn about our comprehensive security measures and best practices."
        highlightText="Security"
        badge="Enterprise-Grade Protection"
      >
        <div className="flex items-center justify-center space-x-2 text-slate-400">
          <Calendar className="w-5 h-5" />
          <span>Last updated: {lastUpdated}</span>
        </div>
      </HeroSection>

      {/* Security Overview */}
      <section className="py-20 bg-slate-900/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-3xl blur-2xl"></div>
            <div className="relative bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-4">
                    Our Security Commitment
                  </h2>
                  <p className="text-slate-300 leading-relaxed mb-4">
                    At LocalPro, we take security seriously. We implement industry-leading security measures 
                    to protect your data and ensure the integrity of our platform. Our security program is 
                    designed to meet the highest standards and protect against evolving threats.
                  </p>
                  <p className="text-slate-400 leading-relaxed">
                    We continuously invest in security technologies, processes, and training to ensure that 
                    your information remains safe and secure. Our security team works around the clock to 
                    monitor, detect, and respond to potential threats.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security Features */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Security Features
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Comprehensive security measures to protect your data
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {securityFeatures.map((feature, index) => (
              <div key={index} className="p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50">
                <div className="flex items-center space-x-3 mb-4">
                  <div className={`w-12 h-12 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center text-white shadow-lg`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-white">
                    {feature.title}
                  </h3>
                </div>
                <p className="text-slate-400 mb-4 text-sm">
                  {feature.description}
                </p>
                <ul className="space-y-2">
                  {feature.details.map((detail, detailIndex) => (
                    <li key={detailIndex} className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-400 text-sm">{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Measures */}
      <section className="py-20 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Security Measures
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Detailed breakdown of our security controls
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {securityMeasures.map((category, index) => (
              <div key={index} className="p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50">
                <h3 className="text-xl font-semibold text-white mb-4">
                  {category.category}
                </h3>
                <ul className="space-y-2">
                  {category.measures.map((measure, measureIndex) => (
                    <li key={measureIndex} className="flex items-start space-x-2">
                      <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-400 text-sm">{measure}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Compliance */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Compliance & Certifications
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              We maintain industry certifications and regulatory compliance
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {complianceStandards.map((standard, index) => (
              <div key={index} className="p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50 text-center">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Target className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {standard.name}
                </h3>
                <p className="text-slate-400 text-sm mb-4">
                  {standard.description}
                </p>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${standard.statusColor}`}>
                  {standard.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Tips */}
      <section className="py-20 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Security Best Practices
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Help us keep your account secure with these tips
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {securityTips.map((tip, index) => (
              <div key={index} className="group p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50 hover:border-emerald-500/30 transition-all">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400">
                    {tip.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-white group-hover:text-emerald-400 transition-colors">
                    {tip.title}
                  </h3>
                </div>
                <p className="text-slate-400 text-sm">
                  {tip.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Incident Response */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Incident Response
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              How we handle security incidents and breaches
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: <Zap className="w-6 h-6" />, title: "Detection", desc: "24/7 monitoring and automated threat detection", color: "from-primary to-indigo-600" },
              { icon: <AlertTriangle className="w-6 h-6" />, title: "Response", desc: "Immediate containment and investigation", color: "from-amber-500 to-orange-600" },
              { icon: <CheckCircle className="w-6 h-6" />, title: "Recovery", desc: "Rapid recovery and prevention measures", color: "from-emerald-500 to-teal-600" }
            ].map((item, index) => (
              <div key={index} className="p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50 text-center">
                <div className={`w-14 h-14 bg-gradient-to-r ${item.color} rounded-xl flex items-center justify-center mx-auto mb-4 text-white shadow-lg`}>
                  {item.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-slate-400 text-sm">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Security Team */}
      <section className="py-20 bg-slate-900/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Report Security Issues
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Help us maintain security by reporting vulnerabilities
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50 text-center">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Mail className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Security Email
              </h3>
              <p className="text-emerald-400 text-sm">
                security@localpro.com
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50 text-center">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Phone className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Security Hotline
              </h3>
              <p className="text-slate-400 text-sm">
                +63 917 915 7515
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50 text-center">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <FileText className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Bug Bounty
              </h3>
              <p className="text-slate-400 text-sm">
                Submit vulnerability reports
              </p>
            </div>
          </div>
        </div>
      </section>
    </StaticPageLayout>
  );
}
