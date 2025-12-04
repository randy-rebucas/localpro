"use client";

import { StaticPageLayout } from "@/components/static-page-layout";
import { HeroSection } from "@/components/static-hero";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  MessageCircle, 
  Calendar, 
  Star, 
  Award,
  Search,
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

  const stats = [
    { value: "2,847", label: "Active Members", icon: <Users className="w-6 h-6" /> },
    { value: "1,234", label: "Discussions", icon: <MessageCircle className="w-6 h-6" /> },
    { value: "45", label: "Events This Month", icon: <Calendar className="w-6 h-6" /> },
    { value: "156", label: "Expert Contributors", icon: <Award className="w-6 h-6" /> }
  ];

  return (
    <StaticPageLayout>
      {/* Hero Section */}
      <HeroSection 
        title="LocalPro Community"
        subtitle="Connect, learn, and grow with fellow professionals in our vibrant community"
        highlightText="Community"
        badge="Join the Conversation"
      >
        <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-xl mx-auto">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search discussions..."
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
        </div>
      </HeroSection>

      {/* Community Stats */}
      <section className="py-12 bg-slate-900/50 border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div key={index} className="text-center p-6 bg-slate-800/30 rounded-2xl border border-slate-700/50">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-emerald-500/10 text-emerald-400 mb-4">
                  {stat.icon}
                </div>
                <div className="text-3xl font-bold text-white mb-2">{stat.value}</div>
                <div className="text-sm text-slate-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Categories */}
            <div className="mb-8">
              <div className="flex flex-wrap gap-2">
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

            {/* Create Discussion Button */}
            <div className="mb-6">
              <Button className="bg-emerald-500 text-white hover:bg-emerald-600 font-semibold rounded-xl shadow-lg shadow-emerald-500/30">
                <Plus className="w-5 h-5 mr-2" />
                Start New Discussion
              </Button>
            </div>

            {/* Discussions List */}
            <div className="space-y-4">
              {discussions.map((discussion) => (
                <div
                  key={discussion.id}
                  className={`rounded-2xl bg-slate-800/30 border hover:border-emerald-500/30 transition-all p-6 ${
                    discussion.isPinned ? "border-amber-500/50" : "border-slate-700/50"
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                      {discussion.authorAvatar}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-lg font-semibold text-white hover:text-emerald-400 transition-colors cursor-pointer">
                            {discussion.title}
                          </h3>
                          {discussion.isPinned && (
                            <span className="bg-amber-500/10 text-amber-400 px-2 py-1 rounded-full text-xs font-medium border border-amber-500/20">
                              Pinned
                            </span>
                          )}
                        </div>
                        <div className="flex items-center text-slate-500 text-sm">
                          <Clock className="w-4 h-4 mr-1" />
                          {discussion.lastActivity}
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 mb-3">
                        <span className="text-sm text-slate-400">
                          by {discussion.author}
                        </span>
                        <span className="bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-full text-xs font-medium border border-emerald-500/20">
                          {discussion.category}
                        </span>
                      </div>
                      <div className="flex items-center space-x-6 text-sm text-slate-500">
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
                              className="bg-slate-700/50 text-slate-400 px-2 py-1 rounded-full text-xs"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center space-x-2">
                          <button className="p-2 text-slate-500 hover:text-rose-400 transition-colors">
                            <Heart className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-slate-500 hover:text-blue-400 transition-colors">
                            <Share2 className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-slate-500 hover:text-amber-400 transition-colors">
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
            <div className="rounded-2xl bg-slate-800/30 border border-slate-700/50 p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-emerald-400" />
                Upcoming Events
              </h3>
              <div className="space-y-4">
                {events.map((event) => (
                  <div key={event.id} className="border-l-2 border-emerald-500 pl-4">
                    <h4 className="font-medium text-white mb-1">
                      {event.title}
                    </h4>
                    <div className="text-sm text-slate-400 space-y-1">
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
                    <span className="inline-block mt-2 bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-full text-xs font-medium border border-emerald-500/20">
                      {event.type}
                    </span>
                  </div>
                ))}
              </div>
              <Button className="w-full mt-4 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white border border-emerald-500/30 rounded-xl">
                View All Events
              </Button>
            </div>

            {/* Top Contributors */}
            <div className="rounded-2xl bg-slate-800/30 border border-slate-700/50 p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Award className="w-5 h-5 mr-2 text-amber-400" />
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
                    <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {contributor.avatar}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-white text-sm">
                        {contributor.name}
                      </div>
                      <div className="text-slate-500 text-xs">
                        {contributor.points} points
                      </div>
                    </div>
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  </div>
                ))}
              </div>
            </div>

            {/* Community Guidelines */}
            <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Shield className="w-5 h-5 mr-2 text-emerald-400" />
                Community Guidelines
              </h3>
              <ul className="space-y-2 text-sm text-slate-300">
                <li className="flex items-start">
                  <Zap className="w-4 h-4 mr-2 mt-0.5 text-emerald-400" />
                  Be respectful and professional
                </li>
                <li className="flex items-start">
                  <Zap className="w-4 h-4 mr-2 mt-0.5 text-emerald-400" />
                  Share knowledge and help others
                </li>
                <li className="flex items-start">
                  <Zap className="w-4 h-4 mr-2 mt-0.5 text-emerald-400" />
                  Keep discussions relevant
                </li>
                <li className="flex items-start">
                  <Zap className="w-4 h-4 mr-2 mt-0.5 text-emerald-400" />
                  Report inappropriate content
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </StaticPageLayout>
  );
}
