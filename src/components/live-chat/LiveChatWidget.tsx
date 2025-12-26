"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useLiveChat, ChatMessage, ChatAttachment } from "./LiveChatContext";
import {
  MessageCircle,
  X,
  Minus,
  Send,
  Sparkles,
  Clock,
  CheckCheck,
  User,
  Paperclip,
  Smile,
  ChevronDown,
  Image,
  FileText,
  File,
  Download,
  Star,
  LogOut,
  Wifi,
  WifiOff,
  Loader2,
} from "lucide-react";

// Quick action buttons
const quickActions = [
  { label: "General Inquiry", message: "I have a general question about LocalPro" },
  { label: "Technical Support", message: "I need help with a technical issue" },
  { label: "Account Help", message: "I need help with my account" },
  { label: "Pricing", message: "I'd like to know about pricing and plans" },
];

// Common emojis for quick access
const commonEmojis = [
  "😊", "👍", "❤️", "🎉", "🙏", "😂", "🔥", "✨",
  "👋", "🤔", "😍", "💯", "🙌", "😢", "😎", "🤝",
  "✅", "❌", "⭐", "💡", "📱", "💻", "🏠", "🚗",
];

// Allowed file types
const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function getFileIcon(type: string) {
  if (type.startsWith('image/')) return Image;
  if (type.includes('pdf') || type.includes('document') || type.includes('word')) return FileText;
  return File;
}

// Star Rating Component
function StarRating({ 
  rating, 
  onRate, 
  disabled = false,
  size = "md" 
}: { 
  rating: number; 
  onRate: (rating: number) => void; 
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const [hover, setHover] = useState(0);
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => !disabled && onRate(star)}
          onMouseEnter={() => !disabled && setHover(star)}
          onMouseLeave={() => !disabled && setHover(0)}
          disabled={disabled}
          className={`transition-all ${disabled ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}
        >
          <Star
            className={`${sizeClasses[size]} ${
              star <= (hover || rating)
                ? "fill-yellow-400 text-yellow-400"
                : "text-slate-500"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

// Chat Rating Panel
function ChatRatingPanel({ 
  onSubmit, 
  onSkip,
  isSubmitting 
}: { 
  onSubmit: (score: number, feedback?: string) => void; 
  onSkip: () => void;
  isSubmitting: boolean;
}) {
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (score > 0) {
      onSubmit(score, feedback || undefined);
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <div className="p-4 bg-slate-800/50 border-t border-slate-700/50 text-center">
        <div className="w-12 h-12 mx-auto bg-emerald-500/20 rounded-full flex items-center justify-center mb-2">
          <Star className="w-6 h-6 text-emerald-400 fill-emerald-400" />
        </div>
        <p className="text-sm text-slate-300">Thank you for your feedback!</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-slate-800/50 border-t border-slate-700/50">
      <p className="text-sm text-slate-300 text-center mb-3">How was your experience?</p>
      <div className="flex justify-center mb-3">
        <StarRating rating={score} onRate={setScore} size="lg" />
      </div>
      {score > 0 && (
        <>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Any additional feedback? (optional)"
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 resize-none mb-3"
            rows={2}
          />
          <div className="flex gap-2">
            <button
              onClick={onSkip}
              className="flex-1 py-2 text-sm text-slate-400 hover:text-slate-300 transition-colors"
            >
              Skip
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Submit"
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// Emoji Picker Component
function EmojiPicker({ 
  onSelect, 
  onClose 
}: { 
  onSelect: (emoji: string) => void; 
  onClose: () => void;
}) {
  return (
    <div className="absolute bottom-full left-0 mb-2 bg-slate-800 border border-slate-700 rounded-xl shadow-xl p-3 w-64 z-10">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-slate-400">Quick Emojis</span>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
          <X className="w-3 h-3" />
        </button>
      </div>
      <div className="grid grid-cols-8 gap-1">
        {commonEmojis.map((emoji, index) => (
          <button
            key={index}
            onClick={() => {
              onSelect(emoji);
              onClose();
            }}
            className="w-7 h-7 flex items-center justify-center text-lg hover:bg-slate-700 rounded transition-colors"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}

// Message Attachment Display
function MessageAttachments({ attachments }: { attachments: ChatAttachment[] }) {
  return (
    <div className="mt-2 space-y-2">
      {attachments.map((attachment) => {
        const isImage = attachment.type.startsWith('image/');
        const FileIcon = getFileIcon(attachment.type);
        
        return (
          <div key={attachment.id} className="rounded-lg overflow-hidden">
            {isImage && attachment.previewUrl ? (
              <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={attachment.previewUrl} 
                  alt={attachment.name}
                  className="max-w-[200px] max-h-[150px] object-cover rounded-lg hover:opacity-90 transition-opacity"
                />
              </a>
            ) : (
              <a 
                href={attachment.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-slate-600/50 hover:bg-slate-600 rounded-lg p-2 transition-colors"
              >
                <FileIcon className="w-5 h-5 text-slate-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white truncate">{attachment.name}</p>
                  <p className="text-[10px] text-slate-400">{formatFileSize(attachment.size)}</p>
                </div>
                <Download className="w-4 h-4 text-slate-400" />
              </a>
            )}
          </div>
        );
      })}
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.type === "user";
  const isSystem = message.type === "system";

  if (isSystem) {
    return (
      <div className="flex justify-center my-3">
        <span className="text-xs text-slate-500 bg-slate-800/50 px-3 py-1 rounded-full">
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex gap-2 ${isUser ? "flex-row-reverse" : "flex-row"} mb-3`}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-sm font-semibold shadow-lg">
          {message.agentAvatar || message.agentName?.charAt(0) || "A"}
        </div>
      )}
      <div className={`max-w-[75%] ${isUser ? "items-end" : "items-start"}`}>
        {!isUser && message.agentName && (
          <span className="text-xs text-slate-400 ml-1 mb-1 block">{message.agentName}</span>
        )}
        <div
          className={`px-4 py-2.5 rounded-2xl ${
            isUser
              ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-br-sm"
              : "bg-slate-700/70 text-slate-100 rounded-bl-sm"
          }`}
        >
          {message.content && (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          )}
          {message.attachments && message.attachments.length > 0 && (
            <MessageAttachments attachments={message.attachments} />
          )}
        </div>
        <div className={`flex items-center gap-1 mt-1 ${isUser ? "justify-end" : "justify-start"}`}>
          <Clock className="w-3 h-3 text-slate-500" />
          <span className="text-[10px] text-slate-500">{formatTime(message.timestamp)}</span>
          {isUser && <CheckCheck className="w-3 h-3 text-emerald-400 ml-1" />}
        </div>
      </div>
    </div>
  );
}

function TypingIndicator({ agentName }: { agentName?: string }) {
  return (
    <div className="flex gap-2 mb-3">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-sm font-semibold">
        {agentName?.charAt(0) || "R"}
      </div>
      <div>
        {agentName && (
          <span className="text-xs text-slate-400 ml-1 mb-1 block">{agentName}</span>
        )}
        <div className="bg-slate-700/70 px-4 py-3 rounded-2xl rounded-bl-sm">
          <div className="flex gap-1">
            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function UserInfoForm({ 
  onSubmit, 
  isConnecting 
}: { 
  onSubmit: (name: string, email: string) => void;
  isConnecting?: boolean;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && email.trim() && !isConnecting) {
      onSubmit(name.trim(), email.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4">
      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center mb-3 shadow-lg shadow-emerald-500/20">
          <User className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-white">Let&apos;s get started!</h3>
        <p className="text-sm text-slate-400 mt-1">Tell us a bit about yourself</p>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1.5">Your Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
          className="w-full px-4 py-3 bg-slate-600 border-2 border-slate-400 rounded-xl text-white placeholder-slate-300 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 transition-all text-sm shadow-md hover:border-emerald-500/50 hover:bg-slate-500"
          required
          disabled={isConnecting}
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1.5">Email Address</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className="w-full px-4 py-3 bg-slate-600 border-2 border-slate-400 rounded-xl text-white placeholder-slate-300 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 transition-all text-sm shadow-md hover:border-emerald-500/50 hover:bg-slate-500"
          required
          disabled={isConnecting}
        />
      </div>
      <button
        type="submit"
        disabled={isConnecting}
        className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isConnecting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Connecting...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            Start Chatting
          </>
        )}
      </button>
    </form>
  );
}

export function LiveChatWidget() {
  const {
    isOpen,
    isMinimized,
    messages,
    user,
    isAgentTyping,
    unreadCount,
    sessionId,
    sessionStatus,
    assignedAgent,
    isConnecting,
    isConnected,
    error,
    rating,
    openChat,
    closeChat,
    toggleChat,
    minimizeChat,
    sendMessage,
    setUser,
    clearUnread,
    endChat,
    rateChat,
    sendTypingIndicator,
  } = useLiveChat();

  const [inputValue, setInputValue] = useState("");
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isAgentTyping]);

  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current && user) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized, user]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      clearUnread();
    }
  }, [isOpen, isMinimized, clearUnread]);

  // Show rating when session is closed
  useEffect(() => {
    if (sessionStatus === 'closed' && !rating?.submitted) {
      setShowRating(true);
    }
  }, [sessionStatus, rating]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (showEmojiPicker && !target.closest('.emoji-picker-container')) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojiPicker]);

  const handleSend = () => {
    if (inputValue.trim() || pendingFiles.length > 0) {
      sendMessage(inputValue, pendingFiles.length > 0 ? pendingFiles : undefined);
      setInputValue("");
      setPendingFiles([]);
      setShowQuickActions(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickAction = (message: string) => {
    sendMessage(message);
    setShowQuickActions(false);
  };

  const handleUserSubmit = (name: string, email: string) => {
    setUser({ name, email });
  };

  const handleEmojiSelect = (emoji: string) => {
    setInputValue((prev) => prev + emoji);
    inputRef.current?.focus();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setAttachmentError(null);
    const validFiles: File[] = [];

    Array.from(files).forEach((file) => {
      // Validate file type
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        setAttachmentError(`File type not allowed: ${file.name}`);
        return;
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        setAttachmentError(`File too large (max 10MB): ${file.name}`);
        return;
      }

      validFiles.push(file);
    });

    if (validFiles.length > 0) {
      setPendingFiles((prev) => [...prev, ...validFiles].slice(0, 5));
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleEndChat = () => {
    setShowEndConfirm(false);
    setShowRating(true);
  };

  const handleRatingSubmit = async (score: number, feedback?: string) => {
    setIsSubmittingRating(true);
    await rateChat(score, feedback);
    await endChat(score, feedback);
    setIsSubmittingRating(false);
    setShowRating(false);
  };

  const handleSkipRating = async () => {
    await endChat();
    setShowRating(false);
  };

  if (!mounted) return null;

  const isChatEnded = sessionStatus === 'closed';
  const canSendMessages = user && sessionId && !isChatEnded;

  const widgetContent = (
    <>
      {/* Chat Window */}
      <div
        className={`fixed bottom-24 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-[380px] max-h-[600px] bg-slate-800 rounded-2xl shadow-2xl shadow-black/40 border border-slate-700/50 overflow-hidden transition-all duration-300 z-[9999] ${
          isOpen && !isMinimized
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 translate-y-4 scale-95 pointer-events-none"
        }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">
                  {assignedAgent ? assignedAgent.name : "LocalPro Support"}
                </h3>
                <div className="flex items-center gap-1.5">
                  {isConnected ? (
                    <>
                      <Wifi className="w-3 h-3 text-accent" />
                      <span className="w-2 h-2 bg-accent/30 rounded-full animate-pulse" />
                      <span className="text-xs text-white/80">Connected</span>
                    </>
                  ) : isChatEnded ? (
                    <>
                      <span className="text-xs text-white/80">Chat ended</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-3 h-3 text-yellow-300" />
                      <span className="text-xs text-white/80">Connecting...</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {user && !isChatEnded && (
                <button
                  onClick={() => setShowEndConfirm(true)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/80 hover:text-white"
                  title="End Chat"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={minimizeChat}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/80 hover:text-white"
                title="Minimize"
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                onClick={closeChat}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/80 hover:text-white"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* End Chat Confirmation */}
        {showEndConfirm && (
          <div className="absolute inset-0 bg-slate-900/90 z-20 flex items-center justify-center p-4">
            <div className="bg-slate-800 rounded-xl p-4 max-w-[280px] text-center border border-slate-700">
              <LogOut className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <h4 className="text-white font-semibold mb-2">End this chat?</h4>
              <p className="text-sm text-slate-400 mb-4">
                You&apos;ll have a chance to rate your experience before ending.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowEndConfirm(false)}
                  className="flex-1 py-2 text-sm text-slate-400 hover:text-white border border-slate-600 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEndChat}
                  className="flex-1 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                >
                  End Chat
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Body */}
        {!user ? (
          <UserInfoForm onSubmit={handleUserSubmit} isConnecting={isConnecting} />
        ) : (
          <>
            {/* Error message */}
            {error && (
              <div className="px-4 py-2 bg-red-500/10 border-b border-red-500/20">
                <p className="text-xs text-red-400">{error}</p>
              </div>
            )}

            {/* Messages */}
            <div className="h-[350px] overflow-y-auto p-4 bg-slate-900/50 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
              {isAgentTyping && <TypingIndicator agentName={assignedAgent?.name} />}
              <div ref={messagesEndRef} />
            </div>

            {/* Rating Panel */}
            {showRating && !rating?.submitted && (
              <ChatRatingPanel 
                onSubmit={handleRatingSubmit} 
                onSkip={handleSkipRating}
                isSubmitting={isSubmittingRating}
              />
            )}

            {/* Quick Actions */}
            {!isChatEnded && !showRating && showQuickActions && messages.length <= 2 && (
              <div className="px-4 py-2 border-t border-slate-700/50 bg-slate-800/50">
                <div className="flex items-center gap-1.5 mb-2">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  <span className="text-xs text-slate-400">Quick Actions</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {quickActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickAction(action.message)}
                      className="px-3 py-1.5 text-xs bg-slate-700/50 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-400 rounded-full border border-slate-600/50 hover:border-emerald-500/30 transition-all"
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            {canSendMessages && !showRating && (
              <div className="p-3 border-t border-slate-700/50 bg-slate-800">
                {/* File previews */}
                {pendingFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {pendingFiles.map((file, index) => (
                      <div 
                        key={index}
                        className="relative group bg-slate-700/50 rounded-lg p-2 flex items-center gap-2 max-w-[200px]"
                      >
                        {file.type.startsWith('image/') ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img 
                            src={URL.createObjectURL(file)} 
                            alt={file.name}
                            className="w-10 h-10 object-cover rounded"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-slate-600 rounded flex items-center justify-center">
                            <FileText className="w-5 h-5 text-slate-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-white truncate">{file.name}</p>
                          <p className="text-[10px] text-slate-400">{formatFileSize(file.size)}</p>
                        </div>
                        <button
                          onClick={() => removeFile(index)}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Error message */}
                {attachmentError && (
                  <div className="text-xs text-red-400 mb-2 flex items-center gap-1">
                    <X className="w-3 h-3" />
                    {attachmentError}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  {/* File input (hidden) */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept={ALLOWED_FILE_TYPES.join(',')}
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  
                  {/* Attachment button */}
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-slate-700/50 rounded-lg transition-colors"
                    title="Attach file (images, PDF, docs - max 10MB)"
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>

                  {/* Emoji picker container */}
                  <div className="relative emoji-picker-container">
                    <button 
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className={`p-2 hover:bg-slate-700/50 rounded-lg transition-colors ${
                        showEmojiPicker ? 'text-emerald-400 bg-slate-700/50' : 'text-slate-400 hover:text-emerald-400'
                      }`}
                      title="Add emoji"
                    >
                      <Smile className="w-5 h-5" />
                    </button>
                    {showEmojiPicker && (
                      <EmojiPicker
                        onSelect={handleEmojiSelect}
                        onClose={() => setShowEmojiPicker(false)}
                      />
                    )}
                  </div>

                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => {
                      setInputValue(e.target.value);
                      sendTypingIndicator(e.target.value.length > 0);
                    }}
                    onKeyDown={handleKeyDown}
                    onBlur={() => sendTypingIndicator(false)}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-3 bg-slate-600 border-2 border-slate-400 rounded-xl text-white placeholder-slate-300 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 transition-all text-sm shadow-md hover:border-emerald-500/50 hover:bg-slate-500"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!inputValue.trim() && pendingFiles.length === 0}
                    className="p-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex items-center justify-center gap-1 mt-2">
                  <span className="text-[10px] text-slate-500">Powered by</span>
                  <span className="text-[10px] text-emerald-400 font-semibold">LocalPro</span>
                </div>
              </div>
            )}

            {/* Chat ended message */}
            {isChatEnded && !showRating && (
              <div className="p-4 border-t border-slate-700/50 bg-slate-800/50 text-center">
                <p className="text-sm text-slate-400 mb-2">This chat has ended</p>
                <button
                  onClick={() => {
                    // Reset and start new chat
                    window.location.reload();
                  }}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Start New Chat
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Floating Button */}
      <button
        onClick={toggleChat}
        className={`fixed bottom-4 right-4 sm:right-6 z-[9999] group transition-all duration-300 ${
          isOpen && !isMinimized ? "scale-90" : "scale-100"
        }`}
      >
        {/* Pulse ring effect */}
        {!isOpen && unreadCount > 0 && (
          <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-30" />
        )}
        
        {/* Main button */}
        <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 shadow-2xl shadow-emerald-500/30 flex items-center justify-center hover:scale-110 hover:shadow-emerald-500/50 transition-all group-hover:from-emerald-400 group-hover:to-teal-400">
          <div className={`transition-transform duration-300 ${isOpen && !isMinimized ? "rotate-90 scale-0" : "rotate-0 scale-100"}`}>
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <div className={`absolute transition-transform duration-300 ${isOpen && !isMinimized ? "rotate-0 scale-100" : "-rotate-90 scale-0"}`}>
            <ChevronDown className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Unread badge */}
        {unreadCount > 0 && !isOpen && (
          <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg animate-bounce">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}

        {/* Tooltip */}
        {!isOpen && (
          <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <div className="bg-slate-800 text-white text-sm px-3 py-1.5 rounded-lg shadow-xl whitespace-nowrap border border-slate-700">
              Chat with us! 💬
            </div>
          </div>
        )}
      </button>

      {/* Minimized indicator */}
      {isMinimized && (
        <button
          onClick={openChat}
          className="fixed bottom-24 right-4 sm:right-6 z-[9999] bg-slate-800 border border-slate-700 rounded-full px-4 py-2 flex items-center gap-2 shadow-xl hover:border-emerald-500/50 transition-all"
        >
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          <span className="text-sm text-slate-300">Chat minimized</span>
          {unreadCount > 0 && (
            <span className="w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>
      )}
    </>
  );

  return createPortal(widgetContent, document.body);
}
