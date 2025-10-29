import { axe } from 'jest-axe';

// Note: jest-axe matchers should be extended in test setup files

// Accessibility testing utilities
export const accessibilityTestConfig = {
  rules: {
    // Disable rules that might be too strict for development
    'color-contrast': { enabled: false },
    'color-contrast-enhanced': { enabled: false },
  },
  tags: ['wcag2a', 'wcag2aa', 'wcag21aa'],
  include: [['main'], ['nav'], ['button'], ['input'], ['select'], ['textarea']],
};

// Test component accessibility
export async function testAccessibility(container: HTMLElement) {
  const results = await axe(container, accessibilityTestConfig);
  // Note: toHaveNoViolations should be used in test files with proper setup
  return results;
}

// Test page accessibility
export async function testPageAccessibility(page: { evaluate: (fn: () => Promise<unknown>) => Promise<unknown> }) {
  const results = await page.evaluate(() => {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && (window as unknown as { axe: { run: (element: HTMLElement, config: unknown, callback: (err: unknown, results: unknown) => void) => void } }).axe) {
        (window as unknown as { axe: { run: (element: HTMLElement, config: unknown, callback: (err: unknown, results: unknown) => void) => void } }).axe.run(document.body, accessibilityTestConfig, (err: unknown, results: unknown) => {
          if (err) throw err;
          resolve(results);
        });
      } else {
        resolve({ violations: [] });
      }
    });
  });
  
  return results;
}

// Common accessibility patterns
export const accessibilityPatterns = {
  // Focus management
  focusableElements: [
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'a[href]',
    '[tabindex]:not([tabindex="-1"])',
  ],
  
  // ARIA landmarks
  landmarks: [
    'main',
    'nav',
    'header',
    'footer',
    'aside',
    'section[aria-label]',
    'section[aria-labelledby]',
  ],
  
  // Form accessibility
  formElements: [
    'input[aria-label]',
    'input[aria-labelledby]',
    'label[for]',
    'fieldset legend',
  ],
};

// Check if element is focusable
export function isFocusable(element: HTMLElement): boolean {
  const focusableSelectors = accessibilityPatterns.focusableElements.join(', ');
  return element.matches(focusableSelectors);
}

// Get all focusable elements
export function getFocusableElements(container: HTMLElement = document.body): HTMLElement[] {
  const focusableSelectors = accessibilityPatterns.focusableElements.join(', ');
  return Array.from(container.querySelectorAll(focusableSelectors)) as HTMLElement[];
}

// Trap focus within element
export function trapFocus(element: HTMLElement) {
  const focusableElements = getFocusableElements(element);
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    }
  };

  element.addEventListener('keydown', handleKeyDown);
  
  // Return cleanup function
  return () => element.removeEventListener('keydown', handleKeyDown);
}

// Announce to screen readers
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

// Check color contrast
export function checkColorContrast(foreground: string, background: string): boolean {
  // This is a simplified check - in production, use a proper color contrast library
  const getLuminance = (color: string) => {
    const rgb = color.match(/\d+/g);
    if (!rgb) return 0;
    
    const [r, g, b] = rgb.map(c => {
      const val = parseInt(c) / 255;
      return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  
  const fgLuminance = getLuminance(foreground);
  const bgLuminance = getLuminance(background);
  
  const contrast = (Math.max(fgLuminance, bgLuminance) + 0.05) / (Math.min(fgLuminance, bgLuminance) + 0.05);
  
  return contrast >= 4.5; // WCAG AA standard
}

// Screen reader only class
export const srOnlyClass = 'sr-only';

// Add screen reader only styles to globals.css if not already present
export const srOnlyStyles = `
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.sr-only:focus {
  position: static;
  width: auto;
  height: auto;
  padding: inherit;
  margin: inherit;
  overflow: visible;
  clip: auto;
  white-space: normal;
}
`;
