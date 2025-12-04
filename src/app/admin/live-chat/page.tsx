"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { 
  MessageCircle, 
  Search, 
  RefreshCw, 
  Send,
  BarChart3,
  Clock,
  Star,
  User,
  ChevronRight,
  ChevronDown,
  X,
  FileText,
  CheckCircle,
  XCircle,
  Archive,
  AlertCircle,
  Loader2,
  Download,
  Image as ImageIcon,
  File,
  ExternalLink,
} from "lucide-react";
import { Loading } from "@/components/ui/loading";
import { AdminErrorState } from "@/components/admin/admin-error-state";
import { makeClientAuthenticatedRequestWithEndpointSafe } from "@/lib/client-api-utils";
import { API_ENDPOINTS } from "@/lib/api";
import { liveChatWS } from "@/components/live-chat/live-chat-api";
import * as DemoBridge from "@/components/live-chat/demo-bridge";
import type { ChatAttachment } from "@/components/live-chat";

// Types
interface ChatSession {
  sessionId: string;
  user: {
    name: string;
    email: string;
    metadata?: {
      userAgent?: string;
      ipAddress?: string;
      pageUrl?: string;
    };
  };
  status: "pending" | "active" | "closed" | "archived";
  priority: "low" | "medium" | "high" | "urgent";
  department?: string;
  assignedAgent?: {
    _id: string;
    firstName: string;
    lastName: string;
    email?: string;
  };
  agentName?: string;
  lastMessage?: {
    content: string;
    type: string;
    timestamp: string;
  };
  messageCount: number;
  unreadCount: number;
  rating?: {
    score: number;
    feedback?: string;
    ratedAt: string;
  };
  tags?: string[];
  notes?: Array<{
    content: string;
    addedBy: { firstName: string; lastName: string };
    addedAt: string;
  }>;
  createdAt: string;
  endedAt?: string;
}

interface ChatMessage {
  _id: string;
  sessionId?: string;
  type: "user" | "agent" | "system";
  content: string;
  agentName?: string;
  agentId?: string;
  attachments?: ChatAttachment[];
  createdAt: string;
  isRead?: boolean;
}

interface Analytics {
  period: { start: string; end: string };
  overview: {
    totalSessions: number;
    avgMessages: number;
    closedSessions: number;
    avgRating: number;
  };
  responseTime: {
    avgResponseTime: number;
    minResponseTime: number;
    maxResponseTime: number;
  };
  sessionsByDay: Array<{ _id: string; count: number }>;
  topAgents: Array<{ _id: string; sessionsHandled: number; avgRating: number }>;
}

// Status config
const statusConfig = {
  pending: { color: "bg-yellow-100 text-yellow-800", icon: Clock, label: "Pending" },
  active: { color: "bg-green-100 text-green-800", icon: CheckCircle, label: "Active" },
  closed: { color: "bg-gray-100 text-gray-800", icon: XCircle, label: "Closed" },
  archived: { color: "bg-slate-100 text-slate-800", icon: Archive, label: "Archived" },
};

const priorityConfig = {
  low: { color: "bg-blue-100 text-blue-800", label: "Low" },
  medium: { color: "bg-yellow-100 text-yellow-800", label: "Medium" },
  high: { color: "bg-orange-100 text-orange-800", label: "High" },
  urgent: { color: "bg-red-100 text-red-800", label: "Urgent" },
};

// Utility functions
function formatTimeAgo(timestamp: string) {
  const now = new Date();
  const time = new Date(timestamp);
  const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
  return `${Math.floor(diffInMinutes / 1440)}d ago`;
}

function formatTime(timestamp: string) {
  return new Date(timestamp).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDate(timestamp: string) {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

// Stats Card Component
function StatsCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  color 
}: { 
  title: string; 
  value: string | number; 
  subtitle?: string; 
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) {
  return (
    <div className={`bg-white rounded-lg shadow p-4 border-l-4 ${color}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500">{title}</p>
          <p className="text-xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-lg bg-opacity-20 ${color.replace("border-", "bg-")}`}>
          <Icon className="w-5 h-5 text-gray-600" />
        </div>
      </div>
    </div>
  );
}

// Session Card Component
function SessionCard({
  session,
  isSelected,
  onClick,
}: {
  session: ChatSession;
  isSelected: boolean;
  onClick: () => void;
}) {
  const status = statusConfig[session.status];
  const priority = priorityConfig[session.priority];
  const StatusIcon = status.icon;

  return (
    <div
      onClick={onClick}
      className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
        isSelected
          ? "border-blue-500 bg-blue-50/50 shadow"
          : "border-gray-200 bg-white hover:border-blue-300"
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
            {session.user.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-semibold text-gray-900 truncate">{session.user.name}</h4>
            <p className="text-xs text-gray-500 truncate">{session.user.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {session.unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
              {session.unreadCount}
            </span>
          )}
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </div>
      </div>

      {session.lastMessage && (
        <p className="text-xs text-gray-600 mb-2 line-clamp-2">
          <span className="font-medium">{session.lastMessage.type === "user" ? session.user.name : "Agent"}:</span>{" "}
          {session.lastMessage.content}
        </p>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${status.color}`}>
            <StatusIcon className="w-3 h-3" />
            {status.label}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${priority.color}`}>
            {priority.label}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>{session.messageCount} msgs</span>
          <span>•</span>
          <span>{formatTimeAgo(session.createdAt)}</span>
        </div>
      </div>

      {session.assignedAgent && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <User className="w-3 h-3" />
            <span>
              {session.assignedAgent.firstName} {session.assignedAgent.lastName}
            </span>
          </div>
        </div>
      )}

      {session.rating && (
        <div className="mt-2 flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`w-3 h-3 ${
                star <= session.rating!.score
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Chat Message Component
function ChatMessageBubble({ message, userName }: { message: ChatMessage; userName: string }) {
  const isUser = message.type === "user";
  const isSystem = message.type === "system";

  if (isSystem) {
    return (
      <div className="flex justify-center my-2">
        <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex gap-2 ${isUser ? "flex-row" : "flex-row-reverse"} mb-3`}>
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 ${
          isUser
            ? "bg-gradient-to-br from-emerald-400 to-teal-500"
            : "bg-gradient-to-br from-blue-400 to-indigo-500"
        }`}
      >
        {isUser ? userName.charAt(0).toUpperCase() : message.agentName?.charAt(0) || "A"}
      </div>
      <div className={`max-w-[75%] ${isUser ? "items-start" : "items-end"}`}>
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-medium text-gray-700">
            {isUser ? userName : message.agentName || "Agent"}
          </span>
          <span className="text-xs text-gray-400">{formatTime(message.createdAt)}</span>
        </div>
        <div
          className={`px-3 py-2 rounded-lg ${
            isUser ? "bg-emerald-100 text-gray-800" : "bg-blue-100 text-gray-800"
          }`}
        >
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 space-y-1">
              {message.attachments.map((att) => (
                <a
                  key={att.id}
                  href={att.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-1.5 bg-white/50 rounded text-xs hover:bg-white transition-colors"
                >
                  {att.type.startsWith("image/") ? (
                    <ImageIcon className="w-3 h-3" />
                  ) : (
                    <File className="w-3 h-3" />
                  )}
                  <span className="truncate flex-1">{att.name}</span>
                  <span className="text-gray-400">{formatFileSize(att.size)}</span>
                  <Download className="w-3 h-3" />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Session Detail Panel Component
function SessionDetailPanel({
  session,
  messages,
  onClose,
  onSendReply,
  onUpdateStatus,
  onAddNote,
  isLoading,
  isSending,
}: {
  session: ChatSession;
  messages: ChatMessage[];
  onClose: () => void;
  onSendReply: (content: string) => Promise<void>;
  onUpdateStatus: (status: "active" | "closed" | "archived") => Promise<void>;
  onAddNote: (note: string) => Promise<void>;
  isLoading: boolean;
  isSending: boolean;
}) {
  const [replyContent, setReplyContent] = useState("");
  const [newNote, setNewNote] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const status = statusConfig[session.status];
  const StatusIcon = status.icon;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendReply = async () => {
    if (!replyContent.trim()) return;
    await onSendReply(replyContent);
    setReplyContent("");
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    setIsAddingNote(true);
    await onAddNote(newNote);
    setNewNote("");
    setIsAddingNote(false);
  };

  const canReply = session.status === "active" || session.status === "pending";

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white font-semibold">
              {session.user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{session.user.name}</h3>
              <p className="text-xs text-gray-500">{session.user.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${status.color}`}>
              <StatusIcon className="w-3 h-3" />
              {status.label}
            </span>
            <span className={`text-xs px-2 py-1 rounded-full ${priorityConfig[session.priority].color}`}>
              {priorityConfig[session.priority].label}
            </span>
            {session.department && (
              <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                {session.department}
              </span>
            )}
          </div>

          {/* Status Actions */}
          <div className="flex items-center gap-1">
            {session.status === "pending" && (
              <button
                onClick={() => onUpdateStatus("active")}
                className="text-xs px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
              >
                Accept
              </button>
            )}
            {session.status === "active" && (
              <button
                onClick={() => onUpdateStatus("closed")}
                className="text-xs px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            )}
            {session.status === "closed" && (
              <button
                onClick={() => onUpdateStatus("archived")}
                className="text-xs px-2 py-1 bg-slate-500 text-white rounded hover:bg-slate-600 transition-colors"
              >
                Archive
              </button>
            )}
          </div>
        </div>

        {/* Session Info */}
        <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
          <div className="bg-gray-50 p-2 rounded">
            <span className="text-gray-500">Started</span>
            <p className="font-medium">{formatDate(session.createdAt)}</p>
          </div>
          <div className="bg-gray-50 p-2 rounded">
            <span className="text-gray-500">Messages</span>
            <p className="font-medium">{session.messageCount}</p>
          </div>
          <div className="bg-gray-50 p-2 rounded">
            <span className="text-gray-500">Rating</span>
            <p className="font-medium flex items-center gap-1">
              {session.rating ? (
                <>
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  {session.rating.score}/5
                </>
              ) : (
                "N/A"
              )}
            </p>
          </div>
        </div>

        {/* Customer metadata */}
        {session.user.metadata?.pageUrl && (
          <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
            <ExternalLink className="w-3 h-3" />
            <span className="truncate">{session.user.metadata.pageUrl}</span>
          </div>
        )}
      </div>

      {/* Notes Toggle */}
      <button
        onClick={() => setShowNotes(!showNotes)}
        className="px-4 py-2 border-b border-gray-100 text-xs text-gray-600 hover:bg-gray-50 flex items-center justify-between"
      >
        <span className="flex items-center gap-1">
          <FileText className="w-3 h-3" />
          Internal Notes ({session.notes?.length || 0})
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${showNotes ? "rotate-180" : ""}`} />
      </button>

      {/* Notes Section */}
      {showNotes && (
        <div className="px-4 py-2 border-b border-gray-200 bg-yellow-50/50 max-h-40 overflow-y-auto">
          {session.notes && session.notes.length > 0 ? (
            <div className="space-y-2">
              {session.notes.map((note, index) => (
                <div key={index} className="text-xs bg-white p-2 rounded border border-yellow-200">
                  <p className="text-gray-700">{note.content}</p>
                  <p className="text-gray-400 mt-1">
                    {note.addedBy.firstName} {note.addedBy.lastName} • {formatTimeAgo(note.addedAt)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500">No notes yet</p>
          )}

          {/* Add Note */}
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Add internal note..."
              className="flex-1 text-xs px-2 py-1 border border-gray-200 rounded focus:outline-none focus:border-yellow-400"
            />
            <button
              onClick={handleAddNote}
              disabled={isAddingNote || !newNote.trim()}
              className="text-xs px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50"
            >
              {isAddingNote ? <Loader2 className="w-3 h-3 animate-spin" /> : "Add"}
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <MessageCircle className="w-8 h-8 mb-2" />
            <p className="text-sm">No messages yet</p>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <ChatMessageBubble key={msg._id} message={msg} userName={session.user.name} />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Reply Input */}
      {canReply && (
        <div className="p-3 border-t border-gray-200 bg-white">
          <div className="flex gap-2">
            <input
              type="text"
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendReply()}
              placeholder="Type your reply..."
              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
            />
            <button
              onClick={handleSendReply}
              disabled={isSending || !replyContent.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Chat Ended Message */}
      {!canReply && (
        <div className="p-3 border-t border-gray-200 bg-gray-50 text-center text-sm text-gray-500">
          This chat session is {session.status}
        </div>
      )}
    </div>
  );
}

// Mock data for development/testing when API is unavailable
const MOCK_SESSIONS: ChatSession[] = [
  {
    sessionId: "session-demo-1",
    user: { 
      name: "John Doe", 
      email: "john@example.com",
      metadata: { pageUrl: "https://localpro.com/pricing" }
    },
    status: "pending",
    priority: "high",
    department: "Sales",
    messageCount: 3,
    unreadCount: 2,
    lastMessage: {
      content: "Hi, I need help with pricing for my business",
      type: "user",
      timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
    },
    createdAt: new Date(Date.now() - 10 * 60000).toISOString(),
  },
  {
    sessionId: "session-demo-2",
    user: { 
      name: "Jane Smith", 
      email: "jane@company.com",
      metadata: { pageUrl: "https://localpro.com/support" }
    },
    status: "active",
    priority: "medium",
    department: "Support",
    assignedAgent: { _id: "agent1", firstName: "Support", lastName: "Agent" },
    messageCount: 8,
    unreadCount: 0,
    lastMessage: {
      content: "Thank you for your help!",
      type: "user",
      timestamp: new Date(Date.now() - 2 * 60000).toISOString(),
    },
    createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
    rating: { score: 5, feedback: "Great support!", ratedAt: new Date().toISOString() },
  },
  {
    sessionId: "session-demo-3",
    user: { name: "Bob Wilson", email: "bob@startup.io" },
    status: "closed",
    priority: "low",
    department: "General",
    messageCount: 5,
    unreadCount: 0,
    lastMessage: {
      content: "Issue resolved. Thanks!",
      type: "user",
      timestamp: new Date(Date.now() - 60 * 60000).toISOString(),
    },
    createdAt: new Date(Date.now() - 2 * 60 * 60000).toISOString(),
    endedAt: new Date(Date.now() - 60 * 60000).toISOString(),
    rating: { score: 4, ratedAt: new Date().toISOString() },
  },
];

const MOCK_MESSAGES: ChatMessage[] = [
  {
    _id: "msg-1",
    type: "system",
    content: "Chat session started",
    createdAt: new Date(Date.now() - 10 * 60000).toISOString(),
  },
  {
    _id: "msg-2",
    type: "user",
    content: "Hi, I need help with pricing for my business. Can you tell me about the enterprise plans?",
    createdAt: new Date(Date.now() - 9 * 60000).toISOString(),
  },
  {
    _id: "msg-3",
    type: "agent",
    content: "Hello! I'd be happy to help you with our pricing options. Could you tell me more about your business needs?",
    agentName: "Support Agent",
    createdAt: new Date(Date.now() - 8 * 60000).toISOString(),
  },
  {
    _id: "msg-4",
    type: "user",
    content: "We're a mid-size company with about 50 employees. We need the full feature set.",
    createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
  },
];

const MOCK_ANALYTICS: Analytics = {
  period: { 
    start: new Date(Date.now() - 30 * 24 * 60 * 60000).toISOString(), 
    end: new Date().toISOString() 
  },
  overview: {
    totalSessions: 156,
    avgMessages: 6.4,
    closedSessions: 142,
    avgRating: 4.5,
  },
  responseTime: {
    avgResponseTime: 45000,
    minResponseTime: 15000,
    maxResponseTime: 180000,
  },
  sessionsByDay: Array.from({ length: 14 }, (_, i) => ({
    _id: new Date(Date.now() - (13 - i) * 24 * 60 * 60000).toISOString().split("T")[0],
    count: Math.floor(Math.random() * 15) + 5,
  })),
  topAgents: [
    { _id: "Sarah Johnson", sessionsHandled: 45, avgRating: 4.8 },
    { _id: "Mike Chen", sessionsHandled: 38, avgRating: 4.6 },
    { _id: "Emily Davis", sessionsHandled: 32, avgRating: 4.7 },
  ],
};

const MOCK_STATUS_COUNTS = {
  pending: MOCK_SESSIONS.filter((s) => s.status === "pending").length,
  active: MOCK_SESSIONS.filter((s) => s.status === "active").length,
  closed: MOCK_SESSIONS.filter((s) => s.status === "closed").length,
  archived: MOCK_SESSIONS.filter((s) => s.status === "archived").length,
};

// Main Admin Live Chat Page
export default function AdminLiveChat() {
  // State - initialize with mock data
  const [sessions, setSessions] = useState<ChatSession[]>(MOCK_SESSIONS);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [sessionMessages, setSessionMessages] = useState<ChatMessage[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(MOCK_ANALYTICS);
  const [loading, setLoading] = useState(false); // Start with false since we have mock data
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(new Date());

  // Filters
  const [activeTab, setActiveTab] = useState<"sessions" | "analytics">("sessions");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Pagination info from API response
  const [pagination, setPagination] = useState({
    count: MOCK_SESSIONS.length,
    total: MOCK_SESSIONS.length,
    page: 1,
    pages: 1,
  });

  // Stats counts - initialize with mock data counts
  const [statusCounts, setStatusCounts] = useState(MOCK_STATUS_COUNTS);
  const [useMockData, setUseMockData] = useState(true); // Default to mock mode

  // Reference to mock data constants
  const mockSessions = MOCK_SESSIONS;
  const mockMessages = MOCK_MESSAGES;
  const mockAnalytics = MOCK_ANALYTICS;

  // Fetch sessions using adminLiveChatSessions endpoint
  const fetchSessions = useCallback(async () => {
    try {
      // Build query parameters
      const queryParams: Record<string, string> = {
        page: currentPage.toString(),
        limit: "20",
      };

      if (statusFilter !== "all") {
        queryParams.status = statusFilter;
      }
      if (priorityFilter !== "all") {
        queryParams.priority = priorityFilter;
      }
      if (searchQuery) {
        queryParams.search = searchQuery;
      }

      // Use the adminLiveChatSessions endpoint
      const response = await makeClientAuthenticatedRequestWithEndpointSafe(
        "adminLiveChatSessions",
        {
          method: "GET",
          query: queryParams,
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch sessions`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        // Map API response to our ChatSession type
        const sessionsData = Array.isArray(result.data) ? result.data : [];
        const mappedSessions: ChatSession[] = sessionsData.map((s: Record<string, unknown>) => ({
          ...s,
          status: (s.status as string) as ChatSession["status"],
          priority: (s.priority as string) as ChatSession["priority"],
        }));
        setSessions(mappedSessions);
        setUseMockData(false);
        
        // Update pagination info from response
        setPagination({
          count: result.count || sessionsData.length,
          total: result.total || sessionsData.length,
          page: result.page || currentPage,
          pages: result.pages || 1,
        });
        
        // Update status counts if provided (ensure numbers)
        if (result.statusCounts) {
          setStatusCounts({
            pending: Number(result.statusCounts.pending) || 0,
            active: Number(result.statusCounts.active) || 0,
            closed: Number(result.statusCounts.closed) || 0,
            archived: Number(result.statusCounts.archived) || 0,
          });
        } else {
          // Calculate from data (this is just for the current page, not accurate for totals)
          setStatusCounts({
            pending: sessionsData.filter((s: Record<string, unknown>) => s.status === "pending").length,
            active: sessionsData.filter((s: Record<string, unknown>) => s.status === "active").length,
            closed: sessionsData.filter((s: Record<string, unknown>) => s.status === "closed").length,
            archived: sessionsData.filter((s: Record<string, unknown>) => s.status === "archived").length,
          });
        }
        setError(null);
      } else {
        throw new Error(result.message || "Failed to load sessions");
      }
    } catch (err) {
      console.debug("[Admin LiveChat] API error, using demo mode:", err);
      // Use demo bridge + mock data when API is unavailable
      setUseMockData(true);
      
      // Get real sessions from demo bridge (from frontend customers)
      const demoBridgeSessions = DemoBridge.getSessions();
      const demoChatSessions: ChatSession[] = demoBridgeSessions.map((ds) => ({
        sessionId: ds.sessionId,
        user: ds.user,
        status: ds.status,
        priority: ds.priority,
        lastMessage: ds.messages.length > 0 ? {
          content: ds.messages[ds.messages.length - 1].content,
          type: ds.messages[ds.messages.length - 1].type,
          timestamp: ds.messages[ds.messages.length - 1].createdAt,
        } : undefined,
        messageCount: ds.messages.length,
        unreadCount: ds.messages.filter(m => m.type === 'user').length,
        createdAt: ds.createdAt,
      }));
      
      // Combine demo bridge sessions with mock sessions (demo bridge first)
      const allSessions = [...demoChatSessions, ...mockSessions];
      
      let filteredSessions = [...allSessions];
      if (statusFilter !== "all") {
        filteredSessions = filteredSessions.filter((s) => s.status === statusFilter);
      }
      if (priorityFilter !== "all") {
        filteredSessions = filteredSessions.filter((s) => s.priority === priorityFilter);
      }
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredSessions = filteredSessions.filter(
          (s) =>
            s.user.name.toLowerCase().includes(query) ||
            s.user.email.toLowerCase().includes(query)
        );
      }
      setSessions(filteredSessions);
      setPagination({
        count: filteredSessions.length,
        total: allSessions.length,
        page: 1,
        pages: 1,
      });
      setStatusCounts({
        pending: allSessions.filter((s) => s.status === "pending").length,
        active: allSessions.filter((s) => s.status === "active").length,
        closed: allSessions.filter((s) => s.status === "closed").length,
        archived: allSessions.filter((s) => s.status === "archived").length,
      });
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, statusFilter, priorityFilter, searchQuery]);

  // Fetch analytics using adminLiveChatAnalytics endpoint
  const fetchAnalytics = useCallback(async () => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      const response = await makeClientAuthenticatedRequestWithEndpointSafe(
        "adminLiveChatAnalytics",
        {
          method: "GET",
          query: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch analytics`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        setAnalytics(result.data);
      } else {
        // Use mock analytics when API unavailable
        setAnalytics(mockAnalytics);
      }
    } catch (err) {
      console.debug("[Admin LiveChat] Error fetching analytics, using mock data:", err);
      setAnalytics(mockAnalytics);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch session messages using adminLiveChatSessionById endpoint
  const fetchSessionMessages = useCallback(async (sessionId: string) => {
    setLoadingMessages(true);
    try {
      // Build URL with sessionId
      const endpoint = API_ENDPOINTS.adminLiveChatSessionById.replace("[sessionId]", sessionId);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || ""}${endpoint}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          // Auth headers would be added by auth interceptor in production
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch session details`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        // Map API messages to our ChatMessage type
        const messagesData = result.data.messages || [];
        const mappedMessages: ChatMessage[] = messagesData.map((m: Record<string, unknown>) => ({
          ...m,
          type: (m.type as string) as ChatMessage["type"],
        }));
        setSessionMessages(mappedMessages);
        
        // Update selected session with full details
        if (result.data.session) {
          const sessionData = result.data.session;
          setSelectedSession((prev) =>
            prev?.sessionId === sessionId 
              ? { 
                  ...prev, 
                  ...sessionData,
                  status: (sessionData.status as string) as ChatSession["status"],
                  priority: (sessionData.priority as string) as ChatSession["priority"],
                } 
              : prev
          );
        }
      } else if (useMockData) {
        // Check demo bridge for real messages first
        const demoBridgeMessages = DemoBridge.getMessages(sessionId);
        if (demoBridgeMessages.length > 0) {
          const mappedMessages: ChatMessage[] = demoBridgeMessages.map((m) => ({
            _id: m._id,
            type: m.type,
            content: m.content,
            agentName: m.agentName,
            createdAt: m.createdAt,
            attachments: m.attachments,
          }));
          setSessionMessages(mappedMessages);
        } else {
          // Fall back to mock messages for demo sessions
          setSessionMessages(mockMessages);
        }
      }
    } catch (err) {
      console.debug("[Admin LiveChat] Error fetching messages, using demo bridge:", err);
      // Check demo bridge for real messages
      const demoBridgeMessages = DemoBridge.getMessages(sessionId);
      if (demoBridgeMessages.length > 0) {
        const mappedMessages: ChatMessage[] = demoBridgeMessages.map((m) => ({
          _id: m._id,
          type: m.type,
          content: m.content,
          agentName: m.agentName,
          createdAt: m.createdAt,
          attachments: m.attachments,
        }));
        setSessionMessages(mappedMessages);
      } else if (useMockData) {
        setSessionMessages(mockMessages);
      }
    } finally {
      setLoadingMessages(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useMockData]);

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchSessions(), fetchAnalytics()]);
      setLoading(false);
      setLastUpdated(new Date());
    };
    loadData();
  }, [fetchSessions, fetchAnalytics]);

  // Load messages when session is selected
  useEffect(() => {
    if (selectedSession) {
      fetchSessionMessages(selectedSession.sessionId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSession?.sessionId, fetchSessionMessages]);

  // WebSocket for real-time updates (optional - falls back to manual refresh)
  useEffect(() => {
    // Try to connect as admin for real-time updates
    // If WebSocket is unavailable, the page still works with manual refresh
    try {
      liveChatWS.connect({ admin: true, userId: "admin" });

      const unsubNewSession = liveChatWS.on("new_session", () => {
        fetchSessions();
      });

      const unsubMessage = liveChatWS.on("user_message", (data) => {
        if (selectedSession?.sessionId === data.sessionId) {
          fetchSessionMessages(data.sessionId!);
        }
        fetchSessions();
      });

      return () => {
        unsubNewSession();
        unsubMessage();
        liveChatWS.disconnect();
      };
    } catch {
      // WebSocket not available - admin page works fine with manual refresh
      console.debug('[Admin LiveChat] WebSocket not available - use refresh button for updates');
    }
  }, [selectedSession?.sessionId, fetchSessions, fetchSessionMessages]);

  // Handlers
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchSessions(), fetchAnalytics()]);
    setRefreshing(false);
    setLastUpdated(new Date());
  };

  const handleSelectSession = (session: ChatSession) => {
    setSelectedSession(session);
  };

  const handleSendReply = async (content: string) => {
    if (!selectedSession) return;
    setIsSending(true);
    try {
      // Always send to demo bridge for cross-tab communication
      const demoMessage = DemoBridge.addAgentReply(selectedSession.sessionId, content, "Support Agent");
      
      // Add message locally for immediate UI feedback
      const newMessage: ChatMessage = {
        _id: demoMessage._id,
        type: "agent",
        content,
        agentName: "You",
        createdAt: demoMessage.createdAt,
      };
      setSessionMessages((prev) => [...prev, newMessage]);
      
      if (!useMockData) {
        // Also try to send via API
        try {
          const endpoint = API_ENDPOINTS.adminLiveChatReply.replace("[sessionId]", selectedSession.sessionId);
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || ""}${endpoint}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ content }),
          });
          
          const result = await response.json();
          if (result.success) {
            await fetchSessionMessages(selectedSession.sessionId);
            await fetchSessions();
          }
        } catch (apiErr) {
          console.debug("API unavailable, using demo bridge only:", apiErr);
        }
      }
    } catch (err) {
      console.error("Error sending reply:", err);
    } finally {
      setIsSending(false);
    }
  };

  const handleUpdateStatus = async (status: "active" | "closed" | "archived") => {
    if (!selectedSession) return;
    try {
      if (useMockData) {
        // Mock: Update locally
        setSelectedSession((prev) => (prev ? { ...prev, status } : null));
        setSessions((prev) =>
          prev.map((s) =>
            s.sessionId === selectedSession.sessionId ? { ...s, status } : s
          )
        );
      } else {
        // Use adminLiveChatStatus endpoint
        const endpoint = API_ENDPOINTS.adminLiveChatStatus.replace("[sessionId]", selectedSession.sessionId);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || ""}${endpoint}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ status }),
        });
        
        const result = await response.json();
        if (result.success) {
          setSelectedSession((prev) => (prev ? { ...prev, status } : null));
          await fetchSessions();
        }
      }
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  const handleAddNote = async (note: string) => {
    if (!selectedSession) return;
    try {
      if (useMockData) {
        // Mock: Add note locally
        const newNote = {
          content: note,
          addedBy: { firstName: "You", lastName: "" },
          addedAt: new Date().toISOString(),
        };
        setSelectedSession((prev) =>
          prev
            ? { ...prev, notes: [...(prev.notes || []), newNote] }
            : null
        );
      } else {
        // Use adminLiveChatNotes endpoint
        const endpoint = API_ENDPOINTS.adminLiveChatNotes.replace("[sessionId]", selectedSession.sessionId);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || ""}${endpoint}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ content: note }),
        });
        
        const result = await response.json();
        if (result.success) {
          await fetchSessionMessages(selectedSession.sessionId);
        }
      }
    } catch (err) {
      console.error("Error adding note:", err);
    }
  };

  // Render
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="xl" text="Loading live chat management..." />
      </div>
    );
  }

  if (error) {
    return <AdminErrorState error={error} onRetry={handleRefresh} retryText="Try Again" />;
  }

  // Calculate total with fallbacks to prevent NaN
  const totalSessions = (statusCounts.pending || 0) + (statusCounts.active || 0) + (statusCounts.closed || 0) + (statusCounts.archived || 0);

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MessageCircle className="w-7 h-7 text-emerald-500" />
            Live Chat Management
          </h1>
          <p className="text-gray-600 text-sm">Manage customer chat sessions and support conversations</p>
        </div>
        <div className="mt-2 sm:mt-0 flex items-center space-x-2">
          {lastUpdated && (
            <p className="text-xs text-gray-500">Updated: {lastUpdated.toLocaleTimeString()}</p>
          )}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition-all"
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Mock Data Banner */}
      {useMockData && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800">Demo Mode - Backend Not Connected</p>
            <p className="text-xs text-amber-600">
              Showing mock data for UI preview. Connect your backend API to see real chat sessions.
            </p>
          </div>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatsCard
          title="Total Sessions"
          value={totalSessions || 0}
          subtitle={`${statusCounts.active || 0} active`}
          icon={MessageCircle}
          color="border-blue-500"
        />
        <StatsCard
          title="Pending"
          value={statusCounts.pending || 0}
          subtitle="Awaiting response"
          icon={Clock}
          color="border-yellow-500"
        />
        <StatsCard
          title="Active"
          value={statusCounts.active || 0}
          subtitle="In progress"
          icon={CheckCircle}
          color="border-green-500"
        />
        <StatsCard
          title="Closed"
          value={statusCounts.closed || 0}
          icon={XCircle}
          color="border-gray-500"
        />
        <StatsCard
          title="Avg Rating"
          value={analytics?.overview?.avgRating?.toFixed(1) || "N/A"}
          subtitle="Out of 5"
          icon={Star}
          color="border-yellow-500"
        />
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-4">
            {[
              { id: "sessions", name: "Chat Sessions", icon: MessageCircle, count: totalSessions },
              { id: "analytics", name: "Analytics", icon: BarChart3 },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as "sessions" | "analytics")}
                className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? "border-emerald-500 text-emerald-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.name}</span>
                {tab.count !== undefined && (
                  <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-4">
          {activeTab === "sessions" && (
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Sessions List */}
              <div className={`${selectedSession ? "lg:w-1/2" : "w-full"} space-y-3`}>
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search by name, email, or session ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="active">Active</option>
                      <option value="closed">Closed</option>
                      <option value="archived">Archived</option>
                    </select>
                    <select
                      value={priorityFilter}
                      onChange={(e) => setPriorityFilter(e.target.value)}
                      className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="all">All Priority</option>
                      <option value="urgent">Urgent</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                </div>

                {/* Sessions Grid */}
                {sessions.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm">No chat sessions found</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Chat sessions will appear here when customers start conversations
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 gap-3 max-h-[500px] overflow-y-auto">
                      {sessions.map((session) => (
                        <SessionCard
                          key={session.sessionId}
                          session={session}
                          isSelected={selectedSession?.sessionId === session.sessionId}
                          onClick={() => handleSelectSession(session)}
                        />
                      ))}
                    </div>

                    {/* Pagination */}
                    <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4">
                      <div className="text-sm text-gray-500">
                        Showing <span className="font-medium">{pagination.count}</span> of{" "}
                        <span className="font-medium">{pagination.total}</span> sessions
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage <= 1}
                          className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        <span className="text-sm text-gray-600">
                          Page {pagination.page} of {pagination.pages}
                        </span>
                        <button
                          onClick={() => setCurrentPage((p) => Math.min(pagination.pages, p + 1))}
                          disabled={currentPage >= pagination.pages}
                          className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Session Detail */}
              {selectedSession && (
                <div className="lg:w-1/2 h-[700px]">
                  <SessionDetailPanel
                    session={selectedSession}
                    messages={sessionMessages}
                    onClose={() => setSelectedSession(null)}
                    onSendReply={handleSendReply}
                    onUpdateStatus={handleUpdateStatus}
                    onAddNote={handleAddNote}
                    isLoading={loadingMessages}
                    isSending={isSending}
                  />
                </div>
              )}
            </div>
          )}

          {activeTab === "analytics" && analytics && (
            <div className="space-y-6">
              {/* Overview Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                  <p className="text-xs font-medium text-blue-600">Total Sessions</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {analytics.overview?.totalSessions ?? 0}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
                  <p className="text-xs font-medium text-green-600">Avg Messages</p>
                  <p className="text-2xl font-bold text-green-900">
                    {analytics.overview?.avgMessages?.toFixed(1) ?? "0.0"}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
                  <p className="text-xs font-medium text-purple-600">Closed Sessions</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {analytics.overview?.closedSessions ?? 0}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4">
                  <p className="text-xs font-medium text-yellow-600">Avg Rating</p>
                  <p className="text-2xl font-bold text-yellow-900 flex items-center gap-1">
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    {analytics.overview.avgRating?.toFixed(1) ?? "N/A"}
                  </p>
                </div>
              </div>

              {/* Response Time */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Response Time</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Average</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {((analytics.responseTime?.avgResponseTime ?? 0) / 1000).toFixed(0)}s
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Fastest</p>
                    <p className="text-lg font-semibold text-green-600">
                      {((analytics.responseTime?.minResponseTime ?? 0) / 1000).toFixed(0)}s
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Slowest</p>
                    <p className="text-lg font-semibold text-red-600">
                      {((analytics.responseTime?.maxResponseTime ?? 0) / 1000).toFixed(0)}s
                    </p>
                  </div>
                </div>
              </div>

              {/* Sessions by Day */}
              {analytics.sessionsByDay && analytics.sessionsByDay.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Sessions by Day</h3>
                  <div className="flex items-end gap-1 h-32">
                    {analytics.sessionsByDay.slice(-14).map((day) => {
                      const maxCount = Math.max(...analytics.sessionsByDay.map((d) => d.count));
                      const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
                      return (
                        <div
                          key={day._id}
                          className="flex-1 bg-emerald-400 rounded-t hover:bg-emerald-500 transition-colors"
                          style={{ height: `${Math.max(height, 5)}%` }}
                          title={`${day._id}: ${day.count} sessions`}
                        />
                      );
                    })}
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-gray-500">
                    <span>14 days ago</span>
                    <span>Today</span>
                  </div>
                </div>
              )}

              {/* Top Agents */}
              {analytics.topAgents && analytics.topAgents.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Top Agents</h3>
                  <div className="space-y-2">
                    {analytics.topAgents.slice(0, 5).map((agent, index) => (
                      <div
                        key={agent._id}
                        className="flex items-center justify-between bg-white p-2 rounded border"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-xs font-semibold">
                            {index + 1}
                          </span>
                          <span className="text-sm text-gray-900">{agent._id}</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs">
                          <span className="text-gray-500">{agent.sessionsHandled} sessions</span>
                          <span className="flex items-center gap-1 text-yellow-600">
                            <Star className="w-3 h-3 fill-yellow-400" />
                            {agent.avgRating.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

