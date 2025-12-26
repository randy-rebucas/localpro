"use client";

import Link from "next/link";
import { StaticPageLayout } from "@/components/static-page-layout";
import { HeroSection } from "@/components/static-hero";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  User, 
  Clock, 
  Search,
  ChevronRight,
  BookOpen,
  MessageCircle,
  Share2,
  Heart,
  ArrowRight,
  Sparkles
} from "lucide-react";

export default function Blog() {
  const blogPosts = [
    {
      id: 1,
      title: "How LocalPro Transformed the Professional Services Industry",
      excerpt: "Discover how our Super App platform revolutionized the way professionals connect, learn, and grow their businesses.",
      author: "Sarah Johnson",
      date: "2024-01-15",
      readTime: "5 min read",
      category: "Industry Insights",
      featured: true,
      likes: 124,
      comments: 23,
      color: "from-emerald-500 to-teal-600"
    },
    {
      id: 2,
      title: "The Future of Professional Training: Academy Integration",
      excerpt: "Learn about our partnership with TES and how we're bringing world-class training to professionals worldwide.",
      author: "Michael Chen",
      date: "2024-01-12",
      readTime: "7 min read",
      category: "Education",
      featured: false,
      likes: 89,
      comments: 15,
      color: "from-primary to-indigo-600"
    },
    {
      id: 3,
      title: "Financial Solutions for Small Business Growth",
      excerpt: "Explore how our fintech partnerships help professionals access capital and manage their finances effectively.",
      author: "Emily Rodriguez",
      date: "2024-01-10",
      readTime: "6 min read",
      category: "Finance",
      featured: false,
      likes: 156,
      comments: 31,
      color: "from-amber-500 to-orange-600"
    },
    {
      id: 4,
      title: "Building Trust in the Digital Marketplace",
      excerpt: "How we ensure security and trust in every transaction across our platform.",
      author: "David Kim",
      date: "2024-01-08",
      readTime: "4 min read",
      category: "Security",
      featured: false,
      likes: 203,
      comments: 42,
      color: "from-purple-500 to-pink-600"
    },
    {
      id: 5,
      title: "Success Stories: From Startup to Scale",
      excerpt: "Real stories from professionals who built successful businesses using LocalPro.",
      author: "Lisa Wang",
      date: "2024-01-05",
      readTime: "8 min read",
      category: "Success Stories",
      featured: false,
      likes: 178,
      comments: 28,
      color: "from-rose-500 to-red-600"
    },
    {
      id: 6,
      title: "The Art of Effective Service Marketing",
      excerpt: "Tips and strategies for promoting your services on our marketplace platform.",
      author: "James Wilson",
      date: "2024-01-03",
      readTime: "5 min read",
      category: "Marketing",
      featured: false,
      likes: 95,
      comments: 19,
      color: "from-cyan-500 to-primary"
    }
  ];

  const categories = [
    "All Posts",
    "Industry Insights", 
    "Education",
    "Finance",
    "Security",
    "Success Stories",
    "Marketing",
    "Technology"
  ];

  return (
    <StaticPageLayout>
      {/* Hero Section */}
      <HeroSection 
        title="LocalPro Blog"
        subtitle="Insights, stories, and tips from the professional services industry"
        highlightText="Blog"
        badge="Latest Updates"
      >
        <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-xl mx-auto">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-300 w-5 h-5" />
            <input
              type="text"
              placeholder="Search articles..."
              className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-slate-700 border-2 border-slate-400 text-white placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-lg shadow-emerald-500/10 transition-all hover:border-emerald-500/50 hover:bg-slate-600"
            />
          </div>
        </div>
      </HeroSection>

      {/* Categories */}
      <section className="py-8 bg-slate-900/50 border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map((category, index) => (
              <button
                key={index}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  index === 0
                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                    : "bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-700/50"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Post */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center mb-8">
            <Sparkles className="w-5 h-5 text-emerald-400 mr-2" />
            <h2 className="text-2xl font-bold text-white">Featured Article</h2>
          </div>
          {blogPosts.filter(post => post.featured).map((post) => (
            <article key={post.id} className="group relative rounded-2xl bg-slate-800/30 border border-slate-700/50 hover:border-emerald-500/30 overflow-hidden transition-all">
              <div className="md:flex">
                <div className="md:w-1/2">
                  <div className={`h-64 md:h-full bg-gradient-to-br ${post.color} flex items-center justify-center min-h-[300px]`}>
                    <BookOpen className="w-24 h-24 text-white opacity-30" />
                  </div>
                </div>
                <div className="md:w-1/2 p-8">
                  <div className="flex items-center space-x-3 mb-4">
                    <span className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-sm font-medium border border-emerald-500/20">
                      {post.category}
                    </span>
                    <span className="bg-amber-500/10 text-amber-400 px-3 py-1 rounded-full text-sm font-medium border border-amber-500/20">
                      Featured
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-emerald-400 transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-slate-400 mb-6 leading-relaxed">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4 text-sm text-slate-500">
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-2" />
                        {post.author}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        {new Date(post.date).toLocaleDateString()}
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-2" />
                        {post.readTime}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <button className="flex items-center text-slate-500 hover:text-rose-400 transition-colors">
                        <Heart className="w-5 h-5 mr-1" />
                        {post.likes}
                      </button>
                      <button className="flex items-center text-slate-500 hover:text-primary transition-colors">
                        <MessageCircle className="w-5 h-5 mr-1" />
                        {post.comments}
                      </button>
                      <button className="flex items-center text-slate-500 hover:text-emerald-400 transition-colors">
                        <Share2 className="w-5 h-5 mr-1" />
                        Share
                      </button>
                    </div>
                    <Link href={`/blog/${post.id}`}>
                      <Button className="bg-emerald-500 text-white hover:bg-emerald-600 font-semibold rounded-xl shadow-lg shadow-emerald-500/30">
                        Read More
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="py-20 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-white mb-8">Latest Articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogPosts.filter(post => !post.featured).map((post) => (
              <article key={post.id} className="group rounded-2xl bg-slate-800/30 border border-slate-700/50 hover:border-emerald-500/30 overflow-hidden transition-all">
                <div className={`h-48 bg-gradient-to-br ${post.color} flex items-center justify-center`}>
                  <BookOpen className="w-16 h-16 text-white opacity-30" />
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-xs font-medium border border-emerald-500/20">
                      {post.category}
                    </span>
                    <div className="flex items-center text-slate-500 text-sm">
                      <Clock className="w-4 h-4 mr-1" />
                      {post.readTime}
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-3 group-hover:text-emerald-400 transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="text-slate-400 mb-4 text-sm leading-relaxed line-clamp-2">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 text-xs text-slate-500">
                      <div className="flex items-center">
                        <User className="w-3 h-3 mr-1" />
                        {post.author}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {new Date(post.date).toLocaleDateString()}
                      </div>
                    </div>
                    <Link
                      href={`/blog/${post.id}`}
                      className="text-emerald-400 hover:text-emerald-300 font-medium flex items-center text-sm"
                    >
                      Read
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600"></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.05)_1px,transparent_1px)] bg-[size:48px_48px]"></div>
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Stay Updated</h2>
          <p className="text-lg text-emerald-100 mb-10">
            Get the latest articles, insights, and industry updates delivered to your inbox.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 w-full px-4 py-3.5 rounded-xl bg-white/30 border-2 border-white/60 text-white placeholder-white/80 focus:outline-none focus:ring-2 focus:ring-white focus:border-white shadow-lg transition-all hover:border-white hover:bg-white/40"
            />
            <Button className="bg-white !text-emerald-600 hover:bg-white/90 font-bold rounded-xl shadow-2xl px-6 py-3 h-auto">
              Subscribe
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>
    </StaticPageLayout>
  );
}
