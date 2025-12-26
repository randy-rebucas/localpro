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
  ChevronDown,
  ChevronUp,
  FileText,
  CheckCircle,
  XCircle,
  Archive,
  AlertCircle,
  Loader2,
  Download,
  File,
  ExternalLink,
  Filter,
  Eye,
} from "lucide-react";
import { Loading } from "@/components/ui/loading";
import { Modal } from "@/components/ui/modal";
import { makeClientAuthenticatedRequestWithEndpointSafe } from "@/lib/client-api-utils";
import { liveChatWS } from "@/components/live-chat/live-chat-api";
import * as DemoBridge from "@/components/live-chat/demo-bridge";
import type { ChatAttachment } from "@/components/live-chat";

// Types
interface ChatSession {
  sessionId: string;
  user: {
    name: string;
    email: string;
    metadata?: { userAgent?: string; ipAddress?: string; pageUrl?: string };
  };
  status: "pending" | "active" | "closed" | "archived";
  priority: "low" | "medium" | "high" | "urgent";
  department?: string;
  assignedAgent?: { _id: string; firstName: string; lastName: string; email?: string };
  agentName?: string;
  lastMessage?: { content: string; type: string; timestamp: string };
  messageCount: number;
  unreadCount: number;
  rating?: { score: number; feedback?: string; ratedAt: string };
  tags?: string[];
  notes?: Array<{ content: string; addedBy: { firstName: string; lastName: string }; addedAt: string }>;
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
  overview: { totalSessions: number; avgMessages: number; closedSessions: number; avgRating: number };
  responseTime: { avgResponseTime: number; minResponseTime: number; maxResponseTime: number };
  sessionsByDay: Array<{ _id: string; count: number }>;
  topAgents: Array<{ _id: string; sessionsHandled: number; avgRating: number }>;
}

// Status/Priority configs
const statusConfig = {
  pending: { color: "bg-yellow-100 text-yellow-800", icon: Clock, label: "Pending" },
  active: { color: "bg-accent/10 text-accent", icon: CheckCircle, label: "Active" },
  closed: { color: "bg-gray-100 text-gray-800", icon: XCircle, label: "Closed" },
  archived: { color: "bg-slate-100 text-slate-800", icon: Archive, label: "Archived" },
};

const priorityConfig = {
  low: { color: "bg-primary/10 text-primary" },
  medium: { color: "bg-yellow-100 text-yellow-800" },
  high: { color: "bg-orange-100 text-orange-800" },
  urgent: { color: "bg-red-100 text-red-800" },
};

// Utility functions
function formatTimeAgo(timestamp: string) {
  const now = new Date();
  const time = new Date(timestamp);
  const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
  if (diffInMinutes < 1) return "Now";
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
  return `${Math.floor(diffInMinutes / 1440)}d ago`;
}

function formatTime(timestamp: string) {
  return new Date(timestamp).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

function formatDate(timestamp: string) {
  return new Date(timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

// Chat Message Component
function ChatMessageBubble({ message, userName }: { message: ChatMessage; userName: string }) {
  const isUser = message.type === "user";
  const isSystem = message.type === "system";

  if (isSystem) {
    return (
      <div className="flex justify-center my-1.5">
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{message.content}</span>
      </div>
    );
  }

  const imageAttachments = message.attachments?.filter(att => att.type.startsWith("image/")) || [];
  const fileAttachments = message.attachments?.filter(att => !att.type.startsWith("image/")) || [];

  return (
    <div className={`flex gap-2 ${isUser ? "flex-row" : "flex-row-reverse"} mb-2`}>
      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 ${isUser ? "bg-gradient-to-br from-emerald-400 to-teal-500" : "bg-gradient-to-br from-blue-400 to-indigo-500"}`}>
        {isUser ? userName.charAt(0).toUpperCase() : message.agentName?.charAt(0) || "A"}
      </div>
      <div className={`max-w-[75%] ${isUser ? "items-start" : "items-end"}`}>
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-xs font-medium text-gray-700">{isUser ? userName.split(' ')[0] : message.agentName || "Agent"}</span>
          <span className="text-xs text-gray-400">{formatTime(message.createdAt)}</span>
        </div>
        <div className={`px-2.5 py-1.5 rounded-lg text-xs ${isUser ? "bg-emerald-50 text-gray-800" : "bg-primary/5 text-gray-800"}`}>
          {message.content && <p className="whitespace-pre-wrap">{message.content}</p>}
          {imageAttachments.length > 0 && (
            <div className={`${message.content ? "mt-1.5" : ""} grid gap-1.5 ${imageAttachments.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
              {imageAttachments.map((att) => (
                <a key={att.id} href={att.url} target="_blank" rel="noopener noreferrer" className="group relative block rounded overflow-hidden border border-gray-200 hover:border-primary">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={att.url} alt={att.name} className="w-full h-auto max-h-32 object-cover" loading="lazy" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 bg-white/90 rounded-full p-1.5"><ExternalLink className="w-3 h-3 text-gray-700" /></div>
                  </div>
                </a>
              ))}
            </div>
          )}
          {fileAttachments.length > 0 && (
            <div className={`${message.content || imageAttachments.length > 0 ? "mt-1.5" : ""} space-y-1`}>
              {fileAttachments.map((att) => (
                <a key={att.id} href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 p-1.5 bg-white/50 rounded text-xs hover:bg-white border border-gray-200">
                  <File className="w-3 h-3 text-gray-500" />
                  <span className="flex-1 truncate font-medium text-gray-700">{att.name}</span>
                  <span className="text-gray-400">{formatFileSize(att.size)}</span>
                  <Download className="w-3 h-3 text-gray-400" />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Mock data
const MOCK_SESSIONS: ChatSession[] = [
  { sessionId: "session-demo-1", user: { name: "John Doe", email: "john@example.com", metadata: { pageUrl: "https://localpro.com/pricing" } }, status: "pending", priority: "high", department: "Sales", messageCount: 3, unreadCount: 2, lastMessage: { content: "Hi, I need help with pricing for my business", type: "user", timestamp: new Date(Date.now() - 5 * 60000).toISOString() }, createdAt: new Date(Date.now() - 10 * 60000).toISOString() },
  { sessionId: "session-demo-2", user: { name: "Jane Smith", email: "jane@company.com", metadata: { pageUrl: "https://localpro.com/support" } }, status: "active", priority: "medium", department: "Support", assignedAgent: { _id: "agent1", firstName: "Support", lastName: "Agent" }, messageCount: 8, unreadCount: 0, lastMessage: { content: "Thank you for your help!", type: "user", timestamp: new Date(Date.now() - 2 * 60000).toISOString() }, createdAt: new Date(Date.now() - 30 * 60000).toISOString(), rating: { score: 5, feedback: "Great support!", ratedAt: new Date().toISOString() } },
  { sessionId: "session-demo-3", user: { name: "Bob Wilson", email: "bob@startup.io" }, status: "closed", priority: "low", department: "General", messageCount: 5, unreadCount: 0, lastMessage: { content: "Issue resolved. Thanks!", type: "user", timestamp: new Date(Date.now() - 60 * 60000).toISOString() }, createdAt: new Date(Date.now() - 2 * 60 * 60000).toISOString(), endedAt: new Date(Date.now() - 60 * 60000).toISOString(), rating: { score: 4, ratedAt: new Date().toISOString() } },
];

const MOCK_MESSAGES: ChatMessage[] = [
  { _id: "msg-1", type: "system", content: "Chat session started", createdAt: new Date(Date.now() - 10 * 60000).toISOString() },
  { _id: "msg-2", type: "user", content: "Hi, I need help with pricing for my business. Can you tell me about the enterprise plans?", createdAt: new Date(Date.now() - 9 * 60000).toISOString() },
  { _id: "msg-3", type: "agent", content: "Hello! I'd be happy to help you with our pricing options. Could you tell me more about your business needs?", agentName: "Support Agent", createdAt: new Date(Date.now() - 8 * 60000).toISOString() },
  { _id: "msg-4", type: "user", content: "We're a mid-size company with about 50 employees. We need the full feature set.", createdAt: new Date(Date.now() - 5 * 60000).toISOString() },
];

const MOCK_ANALYTICS: Analytics = {
  period: { start: new Date(Date.now() - 30 * 24 * 60 * 60000).toISOString(), end: new Date().toISOString() },
  overview: { totalSessions: 156, avgMessages: 6.4, closedSessions: 142, avgRating: 4.5 },
  responseTime: { avgResponseTime: 45000, minResponseTime: 15000, maxResponseTime: 180000 },
  sessionsByDay: Array.from({ length: 14 }, (_, i) => ({ _id: new Date(Date.now() - (13 - i) * 24 * 60 * 60000).toISOString().split("T")[0], count: Math.floor(Math.random() * 15) + 5 })),
  topAgents: [{ _id: "Sarah Johnson", sessionsHandled: 45, avgRating: 4.8 }, { _id: "Mike Chen", sessionsHandled: 38, avgRating: 4.6 }, { _id: "Emily Davis", sessionsHandled: 32, avgRating: 4.7 }],
};

const MOCK_STATUS_COUNTS = { pending: MOCK_SESSIONS.filter((s) => s.status === "pending").length, active: MOCK_SESSIONS.filter((s) => s.status === "active").length, closed: MOCK_SESSIONS.filter((s) => s.status === "closed").length, archived: MOCK_SESSIONS.filter((s) => s.status === "archived").length };

// Main Component
export default function AdminLiveChat() {
  const [sessions, setSessions] = useState<ChatSession[]>(MOCK_SESSIONS);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [sessionMessages, setSessionMessages] = useState<ChatMessage[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(MOCK_ANALYTICS);
  const [loading, setLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(new Date());
  const [activeTab, setActiveTab] = useState<"sessions" | "analytics">("sessions");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'createdAt' | 'messageCount'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [pagination, setPagination] = useState({ count: MOCK_SESSIONS.length, total: MOCK_SESSIONS.length, page: 1, pages: 1 });
  const [statusCounts, setStatusCounts] = useState(MOCK_STATUS_COUNTS);
  const [useMockData, setUseMockData] = useState(true);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [newNote, setNewNote] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const mockSessions = MOCK_SESSIONS;
  const mockMessages = MOCK_MESSAGES;
  const mockAnalytics = MOCK_ANALYTICS;

  // Fetch sessions
  const fetchSessions = useCallback(async () => {
    try {
      const queryParams: Record<string, string> = { page: "1", limit: "50" };
      if (statusFilter !== "all") queryParams.status = statusFilter;
      if (priorityFilter !== "all") queryParams.priority = priorityFilter;
      if (searchQuery) queryParams.search = searchQuery;

      const response = await makeClientAuthenticatedRequestWithEndpointSafe("adminLiveChatSessions", { method: "GET", query: queryParams });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const result = await response.json();
      if (result.success && result.data) {
        const sessionsData = Array.isArray(result.data) ? result.data : [];
        const mappedSessions: ChatSession[] = sessionsData.map((s: Record<string, unknown>) => ({ ...s, status: (s.status as string) as ChatSession["status"], priority: (s.priority as string) as ChatSession["priority"] }));
        setSessions(mappedSessions);
        setUseMockData(false);
        setPagination({ count: result.count || sessionsData.length, total: result.total || sessionsData.length, page: result.page || 1, pages: result.pages || 1 });
        if (result.statusCounts) setStatusCounts({ pending: Number(result.statusCounts.pending) || 0, active: Number(result.statusCounts.active) || 0, closed: Number(result.statusCounts.closed) || 0, archived: Number(result.statusCounts.archived) || 0 });
      } else throw new Error(result.message);
    } catch (err) {
      console.debug("[Admin LiveChat] API error, using demo mode:", err);
      setUseMockData(true);
      const demoBridgeSessions = DemoBridge.getSessions();
      const demoChatSessions: ChatSession[] = demoBridgeSessions.map((ds) => ({ sessionId: ds.sessionId, user: ds.user, status: ds.status, priority: ds.priority, lastMessage: ds.messages.length > 0 ? { content: ds.messages[ds.messages.length - 1].content, type: ds.messages[ds.messages.length - 1].type, timestamp: ds.messages[ds.messages.length - 1].createdAt } : undefined, messageCount: ds.messages.length, unreadCount: ds.messages.filter(m => m.type === 'user').length, createdAt: ds.createdAt }));
      const allSessions = [...demoChatSessions, ...mockSessions];
      let filteredSessions = [...allSessions];
      if (statusFilter !== "all") filteredSessions = filteredSessions.filter((s) => s.status === statusFilter);
      if (priorityFilter !== "all") filteredSessions = filteredSessions.filter((s) => s.priority === priorityFilter);
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredSessions = filteredSessions.filter((s) => s.user.name.toLowerCase().includes(query) || s.user.email.toLowerCase().includes(query));
      }
      setSessions(filteredSessions);
      setPagination({ count: filteredSessions.length, total: allSessions.length, page: 1, pages: 1 });
      setStatusCounts({ pending: allSessions.filter((s) => s.status === "pending").length, active: allSessions.filter((s) => s.status === "active").length, closed: allSessions.filter((s) => s.status === "closed").length, archived: allSessions.filter((s) => s.status === "archived").length });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, priorityFilter, searchQuery]);

  // Fetch analytics
  const fetchAnalytics = useCallback(async () => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      const response = await makeClientAuthenticatedRequestWithEndpointSafe("adminLiveChatAnalytics", { method: "GET", query: { startDate: startDate.toISOString(), endDate: endDate.toISOString() } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      if (result.success && result.data) setAnalytics(result.data);
      else setAnalytics(mockAnalytics);
    } catch (err) {
      console.debug("[Admin LiveChat] Error fetching analytics:", err);
      setAnalytics(mockAnalytics);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch session messages
  const fetchSessionMessages = useCallback(async (sessionId: string) => {
    setLoadingMessages(true);
    try {
      const response = await makeClientAuthenticatedRequestWithEndpointSafe("adminLiveChatSessionById", { method: "GET", pathParams: { sessionId } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      if (result.success && result.data) {
        const messagesData = result.data.messages || [];
        const mappedMessages: ChatMessage[] = messagesData.map((m: Record<string, unknown>) => ({ ...m, type: (m.type as string) as ChatMessage["type"] }));
        setSessionMessages(mappedMessages);
        setUseMockData(false);
        if (result.data.session) {
          const sessionData = result.data.session;
          setSelectedSession((prev) => prev?.sessionId === sessionId ? { ...prev, ...sessionData, status: (sessionData.status as string) as ChatSession["status"], priority: (sessionData.priority as string) as ChatSession["priority"] } : prev);
        }
      } else throw new Error(result.message);
    } catch (err) {
      console.debug("[Admin LiveChat] Error fetching messages:", err);
      const demoBridgeMessages = DemoBridge.getMessages(sessionId);
      if (demoBridgeMessages.length > 0) {
        const mappedMessages: ChatMessage[] = demoBridgeMessages.map((m) => ({ _id: m._id, type: m.type, content: m.content, agentName: m.agentName, createdAt: m.createdAt, attachments: m.attachments }));
        setSessionMessages(mappedMessages);
      } else if (useMockData) setSessionMessages(mockMessages);
      else setSessionMessages([]);
    } finally {
      setLoadingMessages(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useMockData]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchSessions(), fetchAnalytics()]);
      setLoading(false);
      setLastUpdated(new Date());
    };
    loadData();
  }, [fetchSessions, fetchAnalytics]);

  useEffect(() => {
    if (selectedSession) {
      fetchSessionMessages(selectedSession.sessionId);
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSession?.sessionId]);

  useEffect(() => {
    try {
      liveChatWS.connect({ admin: true, userId: "admin" });
      const unsubNewSession = liveChatWS.on("new_session", () => fetchSessions());
      const unsubMessage = liveChatWS.on("user_message", (data) => {
        if (selectedSession?.sessionId === data.sessionId) fetchSessionMessages(data.sessionId!);
        fetchSessions();
      });
      return () => { unsubNewSession(); unsubMessage(); liveChatWS.disconnect(); };
    } catch { console.debug('[Admin LiveChat] WebSocket not available'); }
  }, [selectedSession?.sessionId, fetchSessions, fetchSessionMessages]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchSessions(), fetchAnalytics()]);
    setRefreshing(false);
    setLastUpdated(new Date());
  };

  const handleSort = (field: 'createdAt' | 'messageCount') => {
    if (sortBy === field) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setSortOrder('desc'); }
  };

  const handleViewSession = (session: ChatSession) => {
    setSelectedSession(session);
    setViewModalOpen(true);
    setReplyContent("");
    setNewNote("");
    setShowNotes(false);
  };

  const handleSendReply = async () => {
    if (!selectedSession || !replyContent.trim()) return;
    setIsSending(true);
    try {
      const demoMessage = DemoBridge.addAgentReply(selectedSession.sessionId, replyContent, "Support Agent");
      const newMessage: ChatMessage = { _id: demoMessage._id, type: "agent", content: replyContent, agentName: "You", createdAt: demoMessage.createdAt };
      setSessionMessages((prev) => [...prev, newMessage]);
      setReplyContent("");
      if (!useMockData) {
        try {
          const response = await makeClientAuthenticatedRequestWithEndpointSafe("adminLiveChatReply", { method: "POST", pathParams: { sessionId: selectedSession.sessionId }, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: replyContent }) });
          const result = await response.json();
          if (result.success) { await fetchSessionMessages(selectedSession.sessionId); await fetchSessions(); }
        } catch (apiErr) { console.debug("API unavailable:", apiErr); }
      }
    } catch (err) { console.error("Error sending reply:", err); } finally { setIsSending(false); }
  };

  const handleUpdateStatus = async (status: "active" | "closed" | "archived") => {
    if (!selectedSession) return;
    try {
      if (useMockData) {
        setSelectedSession((prev) => (prev ? { ...prev, status } : null));
        setSessions((prev) => prev.map((s) => s.sessionId === selectedSession.sessionId ? { ...s, status } : s));
      } else {
        const response = await makeClientAuthenticatedRequestWithEndpointSafe("adminLiveChatStatus", { method: "PATCH", pathParams: { sessionId: selectedSession.sessionId }, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
        const result = await response.json();
        if (result.success) { setSelectedSession((prev) => (prev ? { ...prev, status } : null)); await fetchSessions(); }
      }
    } catch (err) { console.error("Error updating status:", err); }
  };

  const handleAddNote = async () => {
    if (!selectedSession || !newNote.trim()) return;
    setIsAddingNote(true);
    try {
      if (useMockData) {
        const note = { content: newNote, addedBy: { firstName: "You", lastName: "" }, addedAt: new Date().toISOString() };
        setSelectedSession((prev) => prev ? { ...prev, notes: [...(prev.notes || []), note] } : null);
        setNewNote("");
      } else {
        const response = await makeClientAuthenticatedRequestWithEndpointSafe("adminLiveChatNotes", { method: "POST", pathParams: { sessionId: selectedSession.sessionId }, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: newNote }) });
        const result = await response.json();
        if (result.success) { await fetchSessionMessages(selectedSession.sessionId); setNewNote(""); }
      }
    } catch (err) { console.error("Error adding note:", err); } finally { setIsAddingNote(false); }
  };

  // Sort sessions
  const sortedSessions = [...sessions].sort((a, b) => {
    if (sortBy === 'createdAt') {
      return sortOrder === 'desc' ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    return sortOrder === 'desc' ? b.messageCount - a.messageCount : a.messageCount - b.messageCount;
  });

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loading size="xl" text="Loading live chat..." /></div>;

  const totalSessions = (statusCounts.pending || 0) + (statusCounts.active || 0) + (statusCounts.closed || 0) + (statusCounts.archived || 0);
  const canReply = selectedSession && (selectedSession.status === "active" || selectedSession.status === "pending");

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Live Chat Management</h1>
          <p className="text-gray-600 text-sm">Manage customer support conversations</p>
        </div>
        <div className="mt-2 sm:mt-0 flex items-center space-x-2">
          {lastUpdated && <p className="text-xs text-gray-500">Updated: {lastUpdated.toLocaleTimeString()}</p>}
          <button onClick={handleRefresh} disabled={refreshing} className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">
            <RefreshCw className={`w-3 h-3 mr-1 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Demo Mode Banner */}
      {useMockData && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-yellow-800">Demo Mode</p>
            <p className="text-xs text-yellow-600">Backend not connected. Showing mock data for UI preview.</p>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Total</p>
              <p className="text-xl font-bold text-gray-900">{totalSessions}</p>
            </div>
            <MessageCircle className="w-6 h-6 text-primary" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Pending</p>
              <p className="text-xl font-bold text-yellow-600">{statusCounts.pending}</p>
            </div>
            <Clock className="w-6 h-6 text-yellow-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Active</p>
              <p className="text-xl font-bold text-accent">{statusCounts.active}</p>
            </div>
            <CheckCircle className="w-6 h-6 text-accent" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Closed</p>
              <p className="text-xl font-bold text-gray-600">{statusCounts.closed}</p>
            </div>
            <XCircle className="w-6 h-6 text-gray-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Avg Rating</p>
              <p className="text-xl font-bold text-yellow-600">{analytics?.overview?.avgRating?.toFixed(1) || "N/A"}</p>
            </div>
            <Star className="w-6 h-6 text-yellow-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Avg Response</p>
              <p className="text-xl font-bold text-primary">{((analytics?.responseTime?.avgResponseTime ?? 0) / 1000).toFixed(0)}s</p>
            </div>
            <BarChart3 className="w-6 h-6 text-primary" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[{ id: "sessions", name: "Sessions", icon: MessageCircle, count: totalSessions }, { id: "analytics", name: "Analytics", icon: BarChart3 }].map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as "sessions" | "analytics")} className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}>
              <tab.icon className="w-4 h-4" />
              <span>{tab.name}</span>
              {tab.count !== undefined && <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{tab.count}</span>}
            </button>
          ))}
        </nav>
      </div>

      {/* Sessions Tab */}
      {activeTab === "sessions" && (
        <>
          {/* Filters */}
          <div className="bg-white rounded shadow">
            <div className="px-4 py-3 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-900">Filters & Search</h3>
                <div className="flex items-center space-x-2">
                  <button onClick={() => setShowFilters(!showFilters)} className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50">
                    <Filter className="w-3 h-3 mr-1" />
                    {showFilters ? 'Hide' : 'Show'} Filters
                  </button>
                  <button className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50">
                    <Download className="w-3 h-3 mr-1" />
                    Export
                  </button>
                </div>
              </div>
            </div>

            {showFilters && (
              <div className="p-4 border-b border-gray-200">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                      <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Name or email..." className="w-full pl-7 pr-2 py-1 text-xs border border-gray-300 rounded" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full px-2 py-1 text-xs border border-gray-300 rounded">
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="active">Active</option>
                      <option value="closed">Closed</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Priority</label>
                    <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="w-full px-2 py-1 text-xs border border-gray-300 rounded">
                      <option value="all">All Priority</option>
                      <option value="urgent">Urgent</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <button onClick={() => { setSearchQuery(''); setStatusFilter('all'); setPriorityFilter('all'); }} className="text-xs text-gray-600 hover:text-gray-800">Clear all filters</button>
                  <div className="text-xs text-gray-500">{pagination.count} sessions found</div>
                </div>
              </div>
            )}
          </div>

          {/* Data Table */}
          <div className="bg-white rounded shadow overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-900">Chat Sessions</h3>
                <div className="flex items-center space-x-1">
                  <span className="text-xs text-gray-500">Sort:</span>
                  <button onClick={() => handleSort('createdAt')} className={`inline-flex items-center px-1 py-0.5 text-xs font-medium rounded ${sortBy === 'createdAt' ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-100'}`}>
                    Date{sortBy === 'createdAt' && (sortOrder === 'asc' ? <ChevronUp className="w-2 h-2 ml-0.5" /> : <ChevronDown className="w-2 h-2 ml-0.5" />)}
                  </button>
                  <button onClick={() => handleSort('messageCount')} className={`inline-flex items-center px-1 py-0.5 text-xs font-medium rounded ${sortBy === 'messageCount' ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-100'}`}>
                    Messages{sortBy === 'messageCount' && (sortOrder === 'asc' ? <ChevronUp className="w-2 h-2 ml-0.5" /> : <ChevronDown className="w-2 h-2 ml-0.5" />)}
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Message</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agent</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Messages</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedSessions.length === 0 ? (
                    <tr><td colSpan={8} className="px-3 py-8 text-center text-gray-500"><MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" /><p className="text-sm">No chat sessions found</p></td></tr>
                  ) : (
                    sortedSessions.map((session) => {
                      const status = statusConfig[session.status];
                      const StatusIcon = status.icon;
                      return (
                        <tr key={session.sessionId} className="hover:bg-gray-50">
                          <td className="px-3 py-2 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-7 h-7 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white text-xs font-semibold mr-2">{session.user.name.charAt(0).toUpperCase()}</div>
                              <div>
                                <div className="text-xs font-semibold text-gray-900">{session.user.name}</div>
                                <div className="text-xs text-gray-500">{session.user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <div className="text-xs text-gray-600 max-w-[200px] truncate">{session.lastMessage?.content || "-"}</div>
                            <div className="text-xs text-gray-400">{session.lastMessage ? formatTimeAgo(session.lastMessage.timestamp) : ""}</div>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                              <StatusIcon className="w-3 h-3 mr-0.5" />{status.label}
                            </span>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${priorityConfig[session.priority].color}`}>{session.priority}</span>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            {session.assignedAgent ? (
                              <div className="flex items-center"><User className="w-3 h-3 text-gray-400 mr-1" /><span className="text-xs text-gray-900">{session.assignedAgent.firstName}</span></div>
                            ) : <span className="text-xs text-gray-400">-</span>}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-gray-900">{session.messageCount}</span>
                              {session.unreadCount > 0 && <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{session.unreadCount}</span>}
                            </div>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <div className="text-xs text-gray-900">{formatDate(session.createdAt)}</div>
                            <div className="text-xs text-gray-500">{formatTimeAgo(session.createdAt)}</div>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-xs font-medium">
                            <button onClick={() => handleViewSession(session)} className="text-primary hover:text-primary mr-2"><Eye className="w-4 h-4" /></button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Analytics Tab */}
      {activeTab === "analytics" && analytics && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-primary/10 to-primary/10 rounded-lg p-4">
              <p className="text-xs font-medium text-primary">Total Sessions</p>
              <p className="text-2xl font-bold text-primary">{analytics.overview?.totalSessions ?? 0}</p>
            </div>
            <div className="bg-gradient-to-br from-accent/10 to-accent/10 rounded-lg p-4">
              <p className="text-xs font-medium text-accent">Avg Messages</p>
              <p className="text-2xl font-bold text-accent">{analytics.overview?.avgMessages?.toFixed(1) ?? "0.0"}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
              <p className="text-xs font-medium text-purple-600">Closed</p>
              <p className="text-2xl font-bold text-purple-900">{analytics.overview?.closedSessions ?? 0}</p>
            </div>
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4">
              <p className="text-xs font-medium text-yellow-600">Avg Rating</p>
              <p className="text-2xl font-bold text-yellow-900 flex items-center gap-1"><Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />{analytics.overview.avgRating?.toFixed(1) ?? "N/A"}</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Response Time</h3>
            <div className="grid grid-cols-3 gap-4">
              <div><p className="text-xs text-gray-500">Average</p><p className="text-lg font-semibold text-gray-900">{((analytics.responseTime?.avgResponseTime ?? 0) / 1000).toFixed(0)}s</p></div>
              <div><p className="text-xs text-gray-500">Fastest</p><p className="text-lg font-semibold text-accent">{((analytics.responseTime?.minResponseTime ?? 0) / 1000).toFixed(0)}s</p></div>
              <div><p className="text-xs text-gray-500">Slowest</p><p className="text-lg font-semibold text-red-600">{((analytics.responseTime?.maxResponseTime ?? 0) / 1000).toFixed(0)}s</p></div>
            </div>
          </div>

          {analytics.sessionsByDay && analytics.sessionsByDay.length > 0 && (
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Sessions by Day (14 days)</h3>
              <div className="flex items-end gap-1 h-24">
                {analytics.sessionsByDay.slice(-14).map((day) => {
                  const maxCount = Math.max(...analytics.sessionsByDay.map((d) => d.count));
                  const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
                  return <div key={day._id} className="flex-1 bg-primary/40 rounded-t hover:bg-primary transition-colors" style={{ height: `${Math.max(height, 5)}%` }} title={`${day._id}: ${day.count}`} />;
                })}
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-500"><span>14 days ago</span><span>Today</span></div>
            </div>
          )}

          {analytics.topAgents && analytics.topAgents.length > 0 && (
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Top Agents</h3>
              <div className="space-y-2">
                {analytics.topAgents.slice(0, 5).map((agent, index) => (
                  <div key={agent._id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-semibold">{index + 1}</span>
                      <span className="text-sm text-gray-900">{agent._id}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-gray-500">{agent.sessionsHandled} sessions</span>
                      <span className="flex items-center gap-1 text-yellow-600"><Star className="w-3 h-3 fill-yellow-400" />{agent.avgRating.toFixed(1)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* View Session Modal */}
      <Modal isOpen={viewModalOpen} onClose={() => setViewModalOpen(false)} title={`Chat: ${selectedSession?.user.name || ""}`} size="lg">
        {selectedSession && (
          <div className="flex flex-col h-[600px]">
            {/* Session Header */}
            <div className="border-b border-gray-200 pb-3 mb-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white font-semibold">{selectedSession.user.name.charAt(0).toUpperCase()}</div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">{selectedSession.user.name}</h3>
                    <p className="text-xs text-gray-500">{selectedSession.user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {selectedSession.status === "pending" && <button onClick={() => handleUpdateStatus("active")} className="text-xs px-2 py-1 bg-accent text-white rounded hover:bg-accent/90">Accept</button>}
                  {selectedSession.status === "active" && <button onClick={() => handleUpdateStatus("closed")} className="text-xs px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600">Close</button>}
                  {selectedSession.status === "closed" && <button onClick={() => handleUpdateStatus("archived")} className="text-xs px-2 py-1 bg-slate-500 text-white rounded hover:bg-slate-600">Archive</button>}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig[selectedSession.status].color}`}>{statusConfig[selectedSession.status].label}</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${priorityConfig[selectedSession.priority].color}`}>{selectedSession.priority}</span>
                {selectedSession.department && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">{selectedSession.department}</span>}
                <span className="text-xs text-gray-500">Started: {formatDate(selectedSession.createdAt)}</span>
                <span className="text-xs text-gray-500">• {selectedSession.messageCount} messages</span>
                {selectedSession.rating && <span className="text-xs text-gray-500 flex items-center gap-0.5">• <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />{selectedSession.rating.score}/5</span>}
              </div>
            </div>

            {/* Notes Toggle */}
            <button onClick={() => setShowNotes(!showNotes)} className="flex items-center justify-between text-xs text-gray-600 hover:bg-gray-50 px-2 py-1.5 rounded mb-2">
              <span className="flex items-center gap-1"><FileText className="w-3 h-3" />Internal Notes ({selectedSession.notes?.length || 0})</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showNotes ? "rotate-180" : ""}`} />
            </button>

            {showNotes && (
              <div className="border border-yellow-200 bg-yellow-50 rounded p-2 mb-3 max-h-32 overflow-y-auto">
                {selectedSession.notes && selectedSession.notes.length > 0 ? (
                  <div className="space-y-1">
                    {selectedSession.notes.map((note, idx) => (
                      <div key={idx} className="text-xs bg-white p-2 rounded border border-yellow-200">
                        <p className="text-gray-700">{note.content}</p>
                        <p className="text-gray-400 mt-0.5">{note.addedBy.firstName} • {formatTimeAgo(note.addedAt)}</p>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-xs text-gray-500">No notes</p>}
                <div className="mt-2 flex gap-2">
                  <input type="text" value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Add note..." className="flex-1 text-xs px-2 py-1 border border-gray-200 rounded focus:outline-none focus:border-yellow-400" />
                  <button onClick={handleAddNote} disabled={isAddingNote || !newNote.trim()} className="text-xs px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50">{isAddingNote ? <Loader2 className="w-3 h-3 animate-spin" /> : "Add"}</button>
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto bg-gray-50 rounded p-3 mb-3">
              {loadingMessages ? (
                <div className="flex items-center justify-center h-full"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
              ) : sessionMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400"><MessageCircle className="w-8 h-8 mb-2" /><p className="text-sm">No messages</p></div>
              ) : (
                <>{sessionMessages.map((msg) => <ChatMessageBubble key={msg._id} message={msg} userName={selectedSession.user.name} />)}<div ref={messagesEndRef} /></>
              )}
            </div>

            {/* Reply Input */}
            {canReply ? (
              <div className="flex gap-2">
                <input type="text" value={replyContent} onChange={(e) => setReplyContent(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendReply()} placeholder="Type your reply..." className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-ring" />
                <button onClick={handleSendReply} disabled={isSending || !replyContent.trim()} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed">
                  {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            ) : (
              <div className="text-center text-sm text-gray-500 py-2 bg-gray-100 rounded">Chat session is {selectedSession.status}</div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
