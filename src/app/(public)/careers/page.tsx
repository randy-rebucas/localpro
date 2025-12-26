"use client";

import { StaticPageLayout } from "@/components/static-page-layout";
import { HeroSection } from "@/components/static-hero";
import { Button } from "@/components/ui/button";
import { 
  MapPin, 
  Clock, 
  Briefcase, 
  GraduationCap, 
  Heart,
  ArrowRight,
  CheckCircle,
  Award,
  Coffee,
  Laptop,
  Wallet,
  Search
} from "lucide-react";

export default function Careers() {
  const jobOpenings = [
    {
      id: 1,
      title: "Senior Full Stack Developer",
      department: "Engineering",
      location: "Remote",
      type: "Full-time",
      salary: "₱100,000 - ₱150,000",
      posted: "2 days ago",
      description: "Join our engineering team to build the next generation of professional services platform.",
      requirements: ["5+ years experience", "React/Next.js", "Node.js", "TypeScript"],
      benefits: ["Health insurance", "SSS/PhilHealth", "Flexible hours", "Remote work"],
      color: "from-primary to-indigo-600"
    },
    {
      id: 2,
      title: "Product Manager",
      department: "Product",
      location: "Metro Manila",
      type: "Full-time",
      salary: "₱120,000 - ₱180,000",
      posted: "1 week ago",
      description: "Lead product strategy and roadmap for our marketplace platform.",
      requirements: ["3+ years PM experience", "B2B SaaS experience", "Analytics skills", "Leadership"],
      benefits: ["Health insurance", "Stock options", "Unlimited PTO", "Learning budget"],
      color: "from-emerald-500 to-teal-600"
    },
    {
      id: 3,
      title: "UX/UI Designer",
      department: "Design",
      location: "Cebu City",
      type: "Full-time",
      salary: "₱80,000 - ₱120,000",
      posted: "3 days ago",
      description: "Create beautiful and intuitive user experiences for our mobile and web applications.",
      requirements: ["3+ years design experience", "Figma", "User research", "Mobile design"],
      benefits: ["Health insurance", "Design tools", "Conference budget", "Flexible schedule"],
      color: "from-purple-500 to-pink-600"
    },
    {
      id: 4,
      title: "Customer Success Manager",
      department: "Customer Success",
      location: "Remote",
      type: "Full-time",
      salary: "₱60,000 - ₱90,000",
      posted: "5 days ago",
      description: "Help our customers succeed and grow their businesses on our platform.",
      requirements: ["2+ years CS experience", "Communication skills", "Problem solving", "CRM experience"],
      benefits: ["Health insurance", "Commission", "Career development", "Team events"],
      color: "from-amber-500 to-orange-600"
    },
    {
      id: 5,
      title: "Marketing Specialist",
      department: "Marketing",
      location: "Davao City",
      type: "Full-time",
      salary: "₱50,000 - ₱75,000",
      posted: "1 week ago",
      description: "Drive growth through digital marketing campaigns and content creation.",
      requirements: ["2+ years marketing experience", "Social media", "Content creation", "Analytics"],
      benefits: ["Health insurance", "Marketing budget", "Professional development", "Creative freedom"],
      color: "from-rose-500 to-red-600"
    },
    {
      id: 6,
      title: "Data Analyst",
      department: "Analytics",
      location: "Remote",
      type: "Full-time",
      salary: "₱70,000 - ₱100,000",
      posted: "4 days ago",
      description: "Analyze user behavior and platform metrics to drive data-driven decisions.",
      requirements: ["2+ years analytics experience", "SQL", "Python/R", "Statistics"],
      benefits: ["Health insurance", "Learning budget", "Remote work", "Data tools"],
      color: "from-cyan-500 to-primary"
    }
  ];

  const departments = [
    "All Departments",
    "Engineering",
    "Product",
    "Design",
    "Marketing",
    "Sales",
    "Customer Success",
    "Operations",
    "Analytics"
  ];

  const benefits = [
    {
      icon: <Heart className="w-6 h-6" />,
      title: "Health & Wellness",
      description: "Comprehensive health, dental, and vision insurance for you and your family",
      color: "from-rose-500 to-red-600"
    },
    {
      icon: <Wallet className="w-6 h-6" />,
      title: "Competitive Salary",
      description: "Market-competitive compensation with regular performance reviews and raises",
      color: "from-emerald-500 to-teal-600"
    },
    {
      icon: <Coffee className="w-6 h-6" />,
      title: "Flexible Work",
      description: "Remote work options, flexible hours, and unlimited PTO policy",
      color: "from-amber-500 to-orange-600"
    },
    {
      icon: <GraduationCap className="w-6 h-6" />,
      title: "Learning & Development",
      description: "Annual learning budget, conference attendance, and professional development",
      color: "from-primary to-indigo-600"
    },
    {
      icon: <Laptop className="w-6 h-6" />,
      title: "Modern Tools",
      description: "Latest hardware, software, and tools to help you do your best work",
      color: "from-purple-500 to-pink-600"
    },
    {
      icon: <Award className="w-6 h-6" />,
      title: "Career Growth",
      description: "Clear career paths, mentorship programs, and opportunities for advancement",
      color: "from-cyan-500 to-primary"
    }
  ];

  return (
    <StaticPageLayout>
      {/* Hero Section */}
      <HeroSection 
        title="Join Our Team"
        subtitle="Build the future of professional services with a passionate team of innovators"
        highlightText="Team"
        badge="We're Hiring"
      >
        <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-xl mx-auto">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-300 w-5 h-5" />
            <input
              type="text"
              placeholder="Search jobs..."
              className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-slate-700 border-2 border-slate-400 text-white placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-lg shadow-emerald-500/10 transition-all hover:border-emerald-500/50 hover:bg-slate-600"
            />
          </div>
        </div>
      </HeroSection>

      {/* Company Culture */}
      <section className="py-20 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Why Work at LocalPro?
            </h2>
            <p className="text-lg text-slate-400 max-w-3xl mx-auto">
              We&apos;re building something special - a platform that empowers professionals worldwide. 
              Join us in creating meaningful impact while growing your career.
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

      {/* Job Openings */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-10">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Open Positions
              </h2>
              <p className="text-slate-400">
                {jobOpenings.length} positions available across {new Set(jobOpenings.map(job => job.department)).size} departments
              </p>
            </div>
          </div>

          {/* Department Filter */}
          <div className="flex flex-wrap gap-2 mb-8">
            {departments.map((department, index) => (
              <button
                key={index}
                className={`px-4 py-2.5 rounded-full text-sm font-semibold transition-all ${
                  index === 0
                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 border border-emerald-400/30"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-600"
                }`}
              >
                {department}
              </button>
            ))}
          </div>

          <div className="space-y-6">
            {jobOpenings.map((job) => (
              <div key={job.id} className="rounded-2xl bg-slate-800/30 border border-slate-700/50 hover:border-emerald-500/30 transition-all p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <h3 className="text-xl font-semibold text-white">
                        {job.title}
                      </h3>
                      <span className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-sm font-medium border border-emerald-500/20">
                        {job.department}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400 mb-3">
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        {job.location}
                      </div>
                      <div className="flex items-center">
                        <Briefcase className="w-4 h-4 mr-1" />
                        {job.type}
                      </div>
                      <div className="flex items-center">
                        <Wallet className="w-4 h-4 mr-1" />
                        {job.salary}
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {job.posted}
                      </div>
                    </div>
                    <p className="text-slate-400 mb-4">
                      {job.description}
                    </p>
                  </div>
                  <div className="mt-4 lg:mt-0 lg:ml-6">
                    <Button className="bg-emerald-500 text-white hover:bg-emerald-600 font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-emerald-500/30 border border-emerald-400/20">
                      Apply Now
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-700/50">
                  <div>
                    <h4 className="font-semibold text-white mb-3">Requirements</h4>
                    <ul className="space-y-2">
                      {job.requirements.map((req, index) => (
                        <li key={index} className="flex items-center text-sm text-slate-400">
                          <CheckCircle className="w-4 h-4 mr-2 text-emerald-400" />
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-3">Benefits</h4>
                    <ul className="space-y-2">
                      {job.benefits.map((benefit, index) => (
                        <li key={index} className="flex items-center text-sm text-slate-400">
                          <CheckCircle className="w-4 h-4 mr-2 text-emerald-400" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Application Process */}
      <section className="py-20 bg-slate-900/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Our Hiring Process
            </h2>
            <p className="text-lg text-slate-400">
              We&apos;ve designed a transparent and efficient process to find the best talent
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { step: "1", title: "Apply", desc: "Submit your application with resume and cover letter", color: "from-primary to-indigo-600" },
              { step: "2", title: "Screen", desc: "Initial phone/video screening with HR team", color: "from-emerald-500 to-teal-600" },
              { step: "3", title: "Interview", desc: "Technical and cultural fit interviews with team", color: "from-purple-500 to-pink-600" },
              { step: "4", title: "Decision", desc: "Final decision and offer within 1-2 weeks", color: "from-amber-500 to-orange-600" }
            ].map((item, index) => (
              <div key={index} className="text-center">
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
            Ready to Join Our Mission?
          </h2>
          <p className="text-lg text-emerald-100 max-w-2xl mx-auto mb-10">
            Don&apos;t see the perfect role? We&apos;re always looking for exceptional talent. 
            Send us your resume and let&apos;s start a conversation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white !text-emerald-700 hover:bg-emerald-50 font-bold px-8 py-6 text-lg rounded-full shadow-2xl shadow-black/20">
              View All Jobs
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button size="lg" variant="ghost" className="text-white hover:bg-white/10 hover:text-white font-bold px-8 py-6 text-lg rounded-full border border-white/30">
              General Application
            </Button>
          </div>
        </div>
      </section>
    </StaticPageLayout>
  );
}
