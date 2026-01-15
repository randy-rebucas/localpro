"use client";

import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import '@n8n/chat/style.css';
import { createChat } from '@n8n/chat';
import { CLIENT_CONFIG } from '@/lib/env';
import { MessageCircle, ChevronDown } from 'lucide-react';

export function N8NChatWidget({ webhookUrl }: { webhookUrl: string }) {
	const [isOpen, setIsOpen] = useState(false);
	const [mounted, setMounted] = useState(false);
	const chatInstanceRef = useRef<ReturnType<typeof createChat> | null>(null);
	const chatContainerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		setMounted(true);
	}, []);

	useEffect(() => {
		// Only initialize if webhook URL is configured
		if (!CLIENT_CONFIG.n8nChatWebhookUrl) {
			console.warn('N8N Chat webhook URL is not configured. Please set NEXT_PUBLIC_N8N_CHAT_WEBHOOK_URL environment variable.');
			return;
		}

		// Wait for DOM to be ready
		if (!mounted) return;

		// Find the container element (created by React render)
		const container = document.getElementById('n8n-chat') as HTMLDivElement | null;
		if (!container) {
			console.error('n8n-chat container not found');
			return;
		}
		chatContainerRef.current = container;

		// Initialize the n8n chat widget
		const chatInstance = createChat({
			webhookUrl: webhookUrl,
			target: '#n8n-chat',
			mode: 'window',
			chatInputKey: 'chatInput',
			chatSessionKey: 'sessionId',
			loadPreviousSession: true,
			metadata: {},
			showWelcomeScreen: false,
			defaultLanguage: 'en',
			initialMessages: [
				'Hi there! 👋',
				'My name is Nathan. How can I assist you today?'
			],
			i18n: {
				en: {
					title: 'Hi there! 👋',
					subtitle: "Start a chat. We're here to help you 24/7.",
					footer: '',
					getStarted: 'New Conversation',
					inputPlaceholder: 'Type your question..',
					closeButtonTooltip: 'Close chat',
				},
			},
			enableStreaming: false,
		});

		chatInstanceRef.current = chatInstance;

		// Listen for chat close events from the widget itself
		const handleChatClose = () => {
			setIsOpen(false);
		};

		// Try to attach close event listener if available
		if (container) {
			container.addEventListener('chat-close', handleChatClose);
		}

		// Cleanup function
		return () => {
			if (container) {
				container.removeEventListener('chat-close', handleChatClose);
			}
		};
	}, [mounted, webhookUrl]);

	// Update chat visibility when isOpen changes
	useEffect(() => {
		const container = document.getElementById('n8n-chat');
		if (container) {
			container.style.display = isOpen ? 'block' : 'none';

			// No need to call open/close methods; control visibility via container style
			// If the n8n chat widget exposes an API for open/close, use it here.
			// Otherwise, toggling the container's display is sufficient.
		}
	}, [isOpen]);

	const toggleChat = () => {
		if (!webhookUrl) {
			console.warn('N8N Chat webhook URL is not configured. Please set NEXT_PUBLIC_N8N_CHAT_WEBHOOK_URL environment variable.');
			return;
		}
		setIsOpen((prev) => !prev);
	};

	if (!mounted) {
		return null;
	}

	return (
		<>
			{/* Chat container - n8n will render into this */}
			{webhookUrl && (
				<div id="n8n-chat" className="fixed bottom-24 right-4 sm:right-6 z-[9997]" style={{ display: isOpen ? 'block' : 'none' }}></div>
			)}

			{/* Floating Action Button - Always visible */}
			{createPortal((
				<button
					onClick={toggleChat}
					className={`fixed bottom-4 right-4 sm:right-6 z-[9998] group transition-all duration-300 ${isOpen ? "scale-90" : "scale-100"
						} ${!webhookUrl ? "opacity-50 cursor-not-allowed" : ""}`}
					aria-label={isOpen ? "Close chat" : "Open chat"}
					disabled={!webhookUrl}
				>
					{/* Pulse ring effect */}
					{!isOpen && CLIENT_CONFIG.n8nChatWebhookUrl && (
						<span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-30" />
					)}

					{/* Main button */}
					<div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 shadow-2xl shadow-emerald-500/30 flex items-center justify-center hover:scale-110 hover:shadow-emerald-500/50 transition-all group-hover:from-emerald-400 group-hover:to-teal-400">
						<div className={`transition-transform duration-300 ${isOpen ? "rotate-90 scale-0" : "rotate-0 scale-100"}`}>
							<MessageCircle className="w-6 h-6 text-white" />
						</div>
						<div className={`absolute transition-transform duration-300 ${isOpen ? "rotate-0 scale-100" : "-rotate-90 scale-0"}`}>
							<ChevronDown className="w-6 h-6 text-white" />
						</div>
					</div>

					{/* Tooltip */}
					{!isOpen && (
						<div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
							<div className="bg-slate-800 text-white text-sm px-3 py-1.5 rounded-lg shadow-xl whitespace-nowrap border border-slate-700">
								{CLIENT_CONFIG.n8nChatWebhookUrl ? "Chat with us! 💬" : "Chat not configured"}
							</div>
						</div>
					)}
				</button>
			), document.body)}
		</>
	);
}

