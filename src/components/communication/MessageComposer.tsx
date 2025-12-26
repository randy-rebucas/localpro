"use client";

import { useState, useRef, useCallback } from 'react';
import { Send, Paperclip, Smile, X } from 'lucide-react';
import { CommunicationAPI, RealtimeCommunication, MessageUtils } from '@/lib/communication-utils';
import { logger } from '@/lib/logger';

interface Message {
  id: string;
  content: string;
  messageType: string;
  senderId: string;
  timestamp: string;
  attachments?: { name: string; type: string; size: number; file: File }[];
}

interface MessageComposerProps {
  conversationId: string;
  onMessageSent: (message: Message) => void;
  onTyping: (isTyping: boolean) => void;
  disabled?: boolean;
}

export default function MessageComposer({ 
  conversationId, 
  onMessageSent, 
  onTyping, 
  disabled = false 
}: MessageComposerProps) {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [sending, setSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSendMessage = useCallback(async () => {
    if (!message.trim() && attachments.length === 0) return;

    setSending(true);
    try {
      const messageType = attachments.length > 0 ? 'file' : 'text';
      const attachmentData = attachments.map(file => ({
        name: file.name,
        type: file.type,
        size: file.size,
        file: file
      }));

      const newMessage = await CommunicationAPI.sendMessage(
        conversationId, 
        message, 
        messageType, 
        attachmentData
      );

      onMessageSent(newMessage);
      setMessage('');
      setAttachments([]);
    } catch (error) {
      logger.error('Error sending message', error instanceof Error ? error : new Error(String(error)));
    } finally {
      setSending(false);
    }
  }, [message, attachments, conversationId, onMessageSent]);

  const handleTyping = useCallback((value: string) => {
    setMessage(value);
    
    if (value.trim() && !isTyping) {
      setIsTyping(true);
      RealtimeCommunication.sendTyping(conversationId, 'start');
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        RealtimeCommunication.sendTyping(conversationId, 'stop');
      }
    }, 2000);

    onTyping(!!value.trim());
  }, [conversationId, isTyping, onTyping]);

  const handleFileSelect = useCallback((files: FileList) => {
    const newFiles = Array.from(files);
    setAttachments(prev => [...prev, ...newFiles]);
  }, []);

  const removeAttachment = useCallback((index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  const handleEmojiSelect = useCallback((emoji: string) => {
    setMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  }, []);

  return (
    <div className="border-t bg-white p-4">
      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {attachments.map((file, index) => (
            <div key={index} className="flex items-center gap-2 bg-gray-100 rounded-lg p-2">
              <span className="text-sm text-gray-600 truncate max-w-32">
                {file.name}
              </span>
              <span className="text-xs text-gray-500">
                {MessageUtils.formatFileSize(file.size)}
              </span>
              <button
                onClick={() => removeAttachment(index)}
                className="text-red-500 hover:text-red-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        {/* File Upload */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
        >
          <Paperclip className="h-5 w-5" />
        </button>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
          className="hidden"
        />

        {/* Message Input */}
        <div className="flex-1 relative">
          <textarea
            value={message}
            onChange={(e) => handleTyping(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            disabled={disabled || sending}
            className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 pr-10 focus:border-primary focus:outline-none disabled:opacity-50"
            rows={1}
            style={{ minHeight: '40px', maxHeight: '120px' }}
          />
          
          {/* Emoji Picker */}
          {showEmojiPicker && (
            <div className="absolute bottom-full right-0 mb-2 bg-white border border-gray-300 rounded-lg shadow-lg p-2 z-10">
              <div className="grid grid-cols-8 gap-1">
                {['😀', '😂', '😍', '🥰', '😎', '🤔', '👍', '👎', '❤️', '🎉', '🔥', '💯'].map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => handleEmojiSelect(emoji)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Emoji Button */}
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          disabled={disabled}
          className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
        >
          <Smile className="h-5 w-5" />
        </button>

        {/* Send Button */}
        <button
          onClick={handleSendMessage}
          disabled={disabled || sending || (!message.trim() && attachments.length === 0)}
          className="p-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
