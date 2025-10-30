import Link from "next/link";
import { StaticPageLayout } from "@/components/static-page-layout";
import { HeroSection } from "@/components/static-hero";
import { 
  Calendar, 
  User, 
  Clock, 
  Search,
  Filter,
  ChevronRight,
  BookOpen,
  MessageCircle,
  Share2,
  Heart
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
      image: "https://via.placeholder.com/600x400",
      featured: true,
      likes: 124,
      comments: 23
    },
    {
      id: 2,
      title: "The Future of Professional Training: Academy Integration",
      excerpt: "Learn about our partnership with TES and how we're bringing world-class training to professionals worldwide.",
      author: "Michael Chen",
      date: "2024-01-12",
      readTime: "7 min read",
      category: "Education",
      image: "https://via.placeholder.com/600x400",
      featured: false,
      likes: 89,
      comments: 15
    },
    {
      id: 3,
      title: "Financial Solutions for Small Business Growth",
      excerpt: "Explore how our fintech partnerships help professionals access capital and manage their finances effectively.",
      author: "Emily Rodriguez",
      date: "2024-01-10",
      readTime: "6 min read",
      category: "Finance",
      image: "https://via.placeholder.com/600x400",
      featured: false,
      likes: 156,
      comments: 31
    },
    {
      id: 4,
      title: "Building Trust in the Digital Marketplace",
      excerpt: "How we ensure security and trust in every transaction across our platform.",
      author: "David Kim",
      date: "2024-01-08",
      readTime: "4 min read",
      category: "Security",
      image: "https://via.placeholder.com/600x400",
      featured: false,
      likes: 203,
      comments: 42
    },
    {
      id: 5,
      title: "Success Stories: From Startup to Scale",
      excerpt: "Real stories from professionals who built successful businesses using LocalPro.",
      author: "Lisa Wang",
      date: "2024-01-05",
      readTime: "8 min read",
      category: "Success Stories",
      image: "https://via.placeholder.com/600x400",
      featured: false,
      likes: 178,
      comments: 28
    },
    {
      id: 6,
      title: "The Art of Effective Service Marketing",
      excerpt: "Tips and strategies for promoting your services on our marketplace platform.",
      author: "James Wilson",
      date: "2024-01-03",
      readTime: "5 min read",
      category: "Marketing",
      image: "https://via.placeholder.com/600x400",
      featured: false,
      likes: 95,
      comments: 19
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
      >
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search articles..."
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-yellow-300 focus:border-transparent"
            />
          </div>
          <button className="bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center">
            <Filter className="w-5 h-5 mr-2" />
            Filter
          </button>
        </div>
      </HeroSection>

      {/* Categories */}
      <section className="py-8 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map((category, index) => (
              <button
                key={index}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  index === 0
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-blue-100 dark:hover:bg-slate-600"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Post */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">Featured Article</h2>
            {blogPosts.filter(post => post.featured).map((post) => (
              <article key={post.id} className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-shadow">
                <div className="md:flex">
                  <div className="md:w-1/2">
                    <div className="h-64 md:h-full bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center">
                      <BookOpen className="w-24 h-24 text-white opacity-50" />
                    </div>
                  </div>
                  <div className="md:w-1/2 p-8">
                    <div className="flex items-center space-x-4 mb-4">
                      <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm font-medium">
                        {post.category}
                      </span>
                      <span className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-3 py-1 rounded-full text-sm font-medium">
                        Featured
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                      {post.title}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-4 text-sm text-slate-500 dark:text-slate-400">
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
                        <button className="flex items-center text-slate-500 hover:text-red-500 transition-colors">
                          <Heart className="w-5 h-5 mr-1" />
                          {post.likes}
                        </button>
                        <button className="flex items-center text-slate-500 hover:text-blue-500 transition-colors">
                          <MessageCircle className="w-5 h-5 mr-1" />
                          {post.comments}
                        </button>
                        <button className="flex items-center text-slate-500 hover:text-green-500 transition-colors">
                          <Share2 className="w-5 h-5 mr-1" />
                          Share
                        </button>
                      </div>
                      <Link
                        href={`/blog/${post.id}`}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors flex items-center"
                      >
                        Read More
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="py-16 bg-slate-50 dark:bg-slate-900">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">Latest Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {blogPosts.filter(post => !post.featured).map((post) => (
                <article key={post.id} className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow group">
                  <div className="h-48 bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center">
                    <BookOpen className="w-16 h-16 text-white opacity-50" />
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm font-medium">
                        {post.category}
                      </span>
                      <div className="flex items-center text-slate-500 dark:text-slate-400 text-sm">
                        <Clock className="w-4 h-4 mr-1" />
                        {post.readTime}
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-emerald-400 transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 text-sm text-slate-500 dark:text-slate-400">
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-1" />
                          {post.author}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {new Date(post.date).toLocaleDateString()}
                        </div>
                      </div>
                      <Link
                        href={`/blog/${post.id}`}
                        className="text-blue-600 dark:text-emerald-400 hover:text-blue-700 dark:hover:text-emerald-300 font-medium flex items-center"
                      >
                        Read More
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-emerald-600 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Stay Updated</h2>
            <p className="text-xl text-blue-100 mb-8">
              Get the latest articles, insights, and industry updates delivered to your inbox.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-yellow-300 focus:border-transparent"
              />
              <button className="bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-semibold py-3 px-6 rounded-xl transition-colors">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </section>
    </StaticPageLayout>
  );
}
