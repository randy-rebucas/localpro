import { StaticPageLayout } from "@/components/static-page-layout";
import { HeroSection } from "@/components/static-hero";
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
  DollarSign,
  Search,
  Filter
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
      benefits: ["Health insurance", "SSS/PhilHealth", "Flexible hours", "Remote work"]
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
      benefits: ["Health insurance", "Stock options", "Unlimited PTO", "Learning budget"]
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
      benefits: ["Health insurance", "Design tools", "Conference budget", "Flexible schedule"]
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
      benefits: ["Health insurance", "Commission", "Career development", "Team events"]
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
      benefits: ["Health insurance", "Marketing budget", "Professional development", "Creative freedom"]
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
      benefits: ["Health insurance", "Learning budget", "Remote work", "Data tools"]
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
      icon: <Heart className="w-8 h-8 text-red-500" />,
      title: "Health & Wellness",
      description: "Comprehensive health, dental, and vision insurance for you and your family"
    },
    {
      icon: <DollarSign className="w-8 h-8 text-green-500" />,
      title: "Competitive Salary",
      description: "Market-competitive compensation with regular performance reviews and raises"
    },
    {
      icon: <Coffee className="w-8 h-8 text-yellow-500" />,
      title: "Flexible Work",
      description: "Remote work options, flexible hours, and unlimited PTO policy"
    },
    {
      icon: <GraduationCap className="w-8 h-8 text-blue-500" />,
      title: "Learning & Development",
      description: "Annual learning budget, conference attendance, and professional development opportunities"
    },
    {
      icon: <Laptop className="w-8 h-8 text-purple-500" />,
      title: "Modern Tools",
      description: "Latest hardware, software, and tools to help you do your best work"
    },
    {
      icon: <Award className="w-8 h-8 text-orange-500" />,
      title: "Career Growth",
      description: "Clear career paths, mentorship programs, and opportunities for advancement"
    }
  ];

  return (
    <StaticPageLayout>
      {/* Hero Section */}
      <HeroSection 
        title="Join Our Team"
        subtitle="Build the future of professional services with a passionate team of innovators"
        highlightText="Team"
        gradientFrom="from-purple-600"
        gradientTo="to-pink-600"
      >
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search jobs..."
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-yellow-300 focus:border-transparent"
            />
          </div>
          <button className="bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center">
            <Filter className="w-5 h-5 mr-2" />
            Filter
          </button>
        </div>
      </HeroSection>

      {/* Company Culture */}
      <section className="py-16 bg-white dark:bg-slate-800">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-6">
                Why Work at LocalPro?
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
                We&apos;re building something special - a platform that empowers professionals worldwide. 
                Join us in creating meaningful impact while growing your career.
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

      {/* Job Openings */}
      <section className="py-16 bg-slate-50 dark:bg-slate-900">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                  Open Positions
                </h2>
                <p className="text-slate-600 dark:text-slate-300">
                  {jobOpenings.length} positions available across {new Set(jobOpenings.map(job => job.department)).size} departments
                </p>
              </div>
              <div className="mt-4 md:mt-0">
                <div className="flex flex-wrap gap-2">
                  {departments.map((department, index) => (
                    <button
                      key={index}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        index === 0
                          ? "bg-blue-600 text-white"
                          : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-100 dark:hover:bg-slate-700"
                      }`}
                    >
                      {department}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {jobOpenings.map((job) => (
                <div key={job.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                          {job.title}
                        </h3>
                        <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm font-medium">
                          {job.department}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-400 mb-3">
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          {job.location}
                        </div>
                        <div className="flex items-center">
                          <Briefcase className="w-4 h-4 mr-1" />
                          {job.type}
                        </div>
                        <div className="flex items-center">
                          <DollarSign className="w-4 h-4 mr-1" />
                          {job.salary}
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {job.posted}
                        </div>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 mb-4">
                        {job.description}
                      </p>
                    </div>
                    <div className="mt-4 lg:mt-0 lg:ml-6">
                      <button className="w-full lg:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors flex items-center justify-center">
                        Apply Now
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white mb-3">Requirements</h4>
                      <ul className="space-y-1">
                        {job.requirements.map((req, index) => (
                          <li key={index} className="flex items-center text-sm text-slate-600 dark:text-slate-300">
                            <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                            {req}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white mb-3">Benefits</h4>
                      <ul className="space-y-1">
                        {job.benefits.map((benefit, index) => (
                          <li key={index} className="flex items-center text-sm text-slate-600 dark:text-slate-300">
                            <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
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
        </div>
      </section>

      {/* Application Process */}
      <section className="py-16 bg-white dark:bg-slate-800">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">
                Our Hiring Process
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-300">
                We&apos;ve designed a transparent and efficient process to find the best talent
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">1</span>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Apply</h3>
                <p className="text-slate-600 dark:text-slate-300 text-sm">
                  Submit your application with resume and cover letter
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">2</span>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Screen</h3>
                <p className="text-slate-600 dark:text-slate-300 text-sm">
                  Initial phone/video screening with HR team
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">3</span>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Interview</h3>
                <p className="text-slate-600 dark:text-slate-300 text-sm">
                  Technical and cultural fit interviews with team
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">4</span>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Decision</h3>
                <p className="text-slate-600 dark:text-slate-300 text-sm">
                  Final decision and offer within 1-2 weeks
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
              Ready to Join Our Mission?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Don&apos;t see the perfect role? We&apos;re always looking for exceptional talent. 
              Send us your resume and let&apos;s start a conversation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-semibold py-3 px-8 rounded-xl transition-colors">
                View All Jobs
              </button>
              <button className="bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-8 rounded-xl transition-colors border border-white/20">
                General Application
              </button>
            </div>
          </div>
        </div>
      </section>
    </StaticPageLayout>
  );
}
