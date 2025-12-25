/**
 * Google Tag Manager Event Utilities
 * Client-side utilities for sending events to GTM
 * 
 * @see https://nextjs.org/docs/app/guides/third-party-libraries
 */

'use client';

import { sendGTMEvent } from '@next/third-parties/google';

/**
 * Send a custom event to Google Tag Manager
 * 
 * @example
 * ```tsx
 * import { sendGTMEvent } from '@/lib/gtm-events';
 * 
 * <button onClick={() => sendGTMEvent({ event: 'buttonClicked', value: 'xyz' })}>
 *   Click me
 * </button>
 * ```
 */
export { sendGTMEvent };

/**
 * Helper function to send common event types
 */
export const gtmEvents = {
  /**
   * Track a button click
   */
  trackButtonClick: (buttonName: string, additionalData?: Record<string, unknown>) => {
    sendGTMEvent({
      event: 'button_click',
      button_name: buttonName,
      ...additionalData,
    });
  },

  /**
   * Track a form submission
   */
  trackFormSubmit: (formName: string, additionalData?: Record<string, unknown>) => {
    sendGTMEvent({
      event: 'form_submit',
      form_name: formName,
      ...additionalData,
    });
  },

  /**
   * Track a page view (useful for client-side navigation)
   */
  trackPageView: (path: string, title?: string) => {
    sendGTMEvent({
      event: 'page_view',
      page_path: path,
      page_title: title || document.title,
    });
  },

  /**
   * Track a custom event
   */
  trackCustomEvent: (eventName: string, data?: Record<string, unknown>) => {
    sendGTMEvent({
      event: eventName,
      ...data,
    });
  },
};

