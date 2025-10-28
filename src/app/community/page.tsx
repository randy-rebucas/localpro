import { StaticPageLayout } from "@/components/static-page-layout";
import { HeroSection } from "@/components/static-hero";
import { 
  Users, 
  MessageCircle, 
  Calendar, 
  Star, 
  Award,
  Search,
  Filter,
  Plus,
  Heart,
  Share2,
  Flag,
  ThumbsUp,
  Clock,
  Globe,
  Shield,
  Zap,
  Eye
} from "lucide-react";

export default function Community() {
  const discussions = [
    {
      id: 1,
      title: "Best practices for cleaning service pricing",
      author: "Maria Rodriguez",
      authorAvatar: "M",
      category: "Cleaning Services",
      replies: 24,
      likes: 18,
      views: 156,
      lastActivity: "2 hours ago",
      isPinned: true,
      tags: ["pricing", "business", "cleaning"]
    },
    {
      id: 2,
      title: "New equipment recommendations for electricians",
      author: "James Chen",
      authorAvatar: "J",
      category: "Electrical",
      replies: 31,
      likes: 42,
      views: 289,
      lastActivity: "4 hours ago",
      isPinned: false,
      tags: ["equipment", "tools", "electrical"]
    },
    {
      id: 3,
      title: "How to handle difficult customers effectively",
      author: "Sarah Johnson",
      authorAvatar: "S",
      category: "Customer Service",
      replies: 19,
      likes: 27,
      views: 203,
      lastActivity: "6 hours ago",
      isPinned: false,
      tags: ["customer-service", "tips", "communication"]
    },
    {
      id: 4,
      title: "Financial planning for small service businesses",
      author: "David Kim",
      authorAvatar: "D",
      category: "Finance",
      replies: 15,
      likes: 22,
      views: 178,
      lastActivity: "8 hours ago",
      isPinned: false,
      tags: ["finance", "planning", "business"]
    },
    {
      id: 5,
      title: "Marketing strategies that actually work",
      author: "Lisa Wang",
      authorAvatar: "L",
      category: "Marketing",
      replies: 28,
      likes: 35,
      views: 312,
      lastActivity: "1 day ago",
      isPinned: false,
      tags: ["marketing", "strategy", "growth"]
    }
  ];

  const events = [
    {
      id: 1,
      title: "Monthly Professional Meetup",
      date: "2024-02-15",
      time: "6:00 PM",
      location: "Virtual",
      attendees: 45,
      type: "Networking"
    },
    {
      id: 2,
      title: "Cleaning Business Workshop",
      date: "2024-02-20",
      time: "2:00 PM",
      location: "Downtown Conference Center",
      attendees: 23,
      type: "Workshop"
    },
    {
      id: 3,
      title: "Financial Planning Webinar",
      date: "2024-02-25",
      time: "7:00 PM",
      location: "Virtual",
      attendees: 67,
      type: "Webinar"
    }
  ];

  const categories = [
    "All Discussions",
    "Cleaning Services",
    "Electrical",
    "Plumbing",
    "Customer Service",
    "Finance",
    "Marketing",
    "Equipment",
    "General"
  ];

  return (
    <StaticPageLayout>
      {/* Hero Section */}
      <HeroSection 
        title="LocalPro Community"
        subtitle="Connect, learn, and grow with fellow professionals in our vibrant community"
        highlightText="Community"
        gradientFrom="from-emerald-600"
        gradientTo="to-blue-600"
      >
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search discussions..."
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-emerald-200 focus:outline-none focus:ring-2 focus:ring-yellow-300 focus:border-transparent"
            />
          </div>
          <button className="bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center">
            <Filter className="w-5 h-5 mr-2" />
            Filter
          </button>
        </div>
      </HeroSection>

      {/* Community Stats */}
      <section className="py-12 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-3xl font-bold text-slate-900 dark:text-white mb-2">2,847</div>
                <div className="text-slate-600 dark:text-slate-400">Active Members</div>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="text-3xl font-bold text-slate-900 dark:text-white mb-2">1,234</div>
                <div className="text-slate-600 dark:text-slate-400">Discussions</div>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="text-3xl font-bold text-slate-900 dark:text-white mb-2">45</div>
                <div className="text-slate-600 dark:text-slate-400">Events This Month</div>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div className="text-3xl font-bold text-slate-900 dark:text-white mb-2">156</div>
                <div className="text-slate-600 dark:text-slate-400">Expert Contributors</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Categories */}
              <div className="mb-8">
                <div className="flex flex-wrap gap-2">
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

              {/* Create Discussion Button */}
              <div className="mb-6">
                <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors flex items-center">
                  <Plus className="w-5 h-5 mr-2" />
                  Start New Discussion
                </button>
              </div>

              {/* Discussions List */}
              <div className="space-y-4">
                {discussions.map((discussion) => (
                  <div
                    key={discussion.id}
                    className={`bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow ${
                      discussion.isPinned ? "ring-2 ring-yellow-400" : ""
                    }`}
                  >
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {discussion.authorAvatar}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                              {discussion.title}
                            </h3>
                            {discussion.isPinned && (
                              <span className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded-full text-xs font-medium">
                                Pinned
                              </span>
                            )}
                          </div>
                          <div className="flex items-center text-slate-500 dark:text-slate-400 text-sm">
                            <Clock className="w-4 h-4 mr-1" />
                            {discussion.lastActivity}
                          </div>
                        </div>
                        <div className="flex items-center space-x-4 mb-3">
                          <span className="text-sm text-slate-600 dark:text-slate-400">
                            by {discussion.author}
                          </span>
                          <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full text-xs font-medium">
                            {discussion.category}
                          </span>
                        </div>
                        <div className="flex items-center space-x-6 text-sm text-slate-500 dark:text-slate-400">
                          <div className="flex items-center">
                            <MessageCircle className="w-4 h-4 mr-1" />
                            {discussion.replies} replies
                          </div>
                          <div className="flex items-center">
                            <ThumbsUp className="w-4 h-4 mr-1" />
                            {discussion.likes} likes
                          </div>
                          <div className="flex items-center">
                            <Eye className="w-4 h-4 mr-1" />
                            {discussion.views} views
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-4">
                          <div className="flex flex-wrap gap-2">
                            {discussion.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-full text-xs"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                          <div className="flex items-center space-x-2">
                            <button className="p-2 text-slate-500 hover:text-red-500 transition-colors">
                              <Heart className="w-4 h-4" />
                            </button>
                            <button className="p-2 text-slate-500 hover:text-blue-500 transition-colors">
                              <Share2 className="w-4 h-4" />
                            </button>
                            <button className="p-2 text-slate-500 hover:text-orange-500 transition-colors">
                              <Flag className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Upcoming Events */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                  Upcoming Events
                </h3>
                <div className="space-y-4">
                  {events.map((event) => (
                    <div key={event.id} className="border-l-4 border-blue-500 pl-4">
                      <h4 className="font-medium text-slate-900 dark:text-white mb-1">
                        {event.title}
                      </h4>
                      <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2" />
                          {new Date(event.date).toLocaleDateString()} at {event.time}
                        </div>
                        <div className="flex items-center">
                          <Globe className="w-4 h-4 mr-2" />
                          {event.location}
                        </div>
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-2" />
                          {event.attendees} attendees
                        </div>
                      </div>
                      <span className="inline-block mt-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full text-xs font-medium">
                        {event.type}
                      </span>
                    </div>
                  ))}
                </div>
                <button className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
                  View All Events
                </button>
              </div>

              {/* Top Contributors */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center">
                  <Award className="w-5 h-5 mr-2 text-yellow-600" />
                  Top Contributors
                </h3>
                <div className="space-y-3">
                  {[
                    { name: "Maria Rodriguez", points: 2450, avatar: "M" },
                    { name: "James Chen", points: 2180, avatar: "J" },
                    { name: "Sarah Johnson", points: 1950, avatar: "S" },
                    { name: "David Kim", points: 1820, avatar: "D" },
                    { name: "Lisa Wang", points: 1650, avatar: "L" }
                  ].map((contributor, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {contributor.avatar}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-slate-900 dark:text-white text-sm">
                          {contributor.name}
                        </div>
                        <div className="text-slate-500 dark:text-slate-400 text-xs">
                          {contributor.points} points
                        </div>
                      </div>
                      <div className="text-yellow-500">
                        <Star className="w-4 h-4 fill-current" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Community Guidelines */}
              <div className="bg-gradient-to-br from-blue-50 to-emerald-50 dark:from-blue-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-blue-600" />
                  Community Guidelines
                </h3>
                <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  <li className="flex items-start">
                    <Zap className="w-4 h-4 mr-2 mt-0.5 text-blue-500" />
                    Be respectful and professional
                  </li>
                  <li className="flex items-start">
                    <Zap className="w-4 h-4 mr-2 mt-0.5 text-blue-500" />
                    Share knowledge and help others
                  </li>
                  <li className="flex items-start">
                    <Zap className="w-4 h-4 mr-2 mt-0.5 text-blue-500" />
                    Keep discussions relevant
                  </li>
                  <li className="flex items-start">
                    <Zap className="w-4 h-4 mr-2 mt-0.5 text-blue-500" />
                    Report inappropriate content
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StaticPageLayout>
  );
}
