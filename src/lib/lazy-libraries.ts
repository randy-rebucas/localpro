/**
 * Lazy Loading Utilities for External Libraries
 * 
 * This file provides utilities for lazy loading heavy external libraries
 * that are only needed in specific scenarios (e.g., PDF generation, image processing)
 */

/**
 * Lazy load jsPDF library
 * Only loads when user needs to generate PDFs
 * 
 * @example
 * const jsPDF = await lazyLoadJsPDF();
 * const doc = new jsPDF();
 */
export async function lazyLoadJsPDF() {
  const { default: jsPDF } = await import('jspdf');
  return jsPDF;
}

/**
 * Lazy load html2canvas library
 * Only loads when user needs to capture screenshots
 * 
 * @example
 * const html2canvas = await lazyLoadHtml2Canvas();
 * const canvas = await html2canvas(element);
 */
export async function lazyLoadHtml2Canvas() {
  const html2canvas = await import('html2canvas');
  return html2canvas.default;
}

/**
 * Lazy load both jsPDF and html2canvas for PDF generation with screenshots
 * 
 * @example
 * const { jsPDF, html2canvas } = await lazyLoadPDFLibraries();
 * const canvas = await html2canvas(element);
 * const imgData = canvas.toDataURL('image/png');
 * const pdf = new jsPDF();
 * pdf.addImage(imgData, 'PNG', 0, 0);
 */
export async function lazyLoadPDFLibraries() {
  const [jsPDFModule, html2canvasModule] = await Promise.all([
    import('jspdf'),
    import('html2canvas')
  ]);
  
  return {
    jsPDF: jsPDFModule.default,
    html2canvas: html2canvasModule.default
  };
}

/**
 * Preload PDF libraries on hover or interaction
 * Useful for buttons that generate PDFs
 * 
 * @example
 * <button
 *   onMouseEnter={preloadPDFLibraries}
 *   onClick={handleGeneratePDF}
 * >
 *   Generate PDF
 * </button>
 */
export function preloadPDFLibraries() {
  // Start loading libraries in background
  Promise.all([
    import('jspdf'),
    import('html2canvas')
  ]).catch(() => {
    // Silently fail - libraries will load when needed
  });
}

/**
 * Check if PDF libraries are already loaded
 */
let pdfLibrariesPromise: Promise<{ jsPDF: typeof import('jspdf').default; html2canvas: typeof import('html2canvas').default }> | null = null;

export function getPDFLibraries() {
  if (!pdfLibrariesPromise) {
    pdfLibrariesPromise = lazyLoadPDFLibraries();
  }
  return pdfLibrariesPromise;
}

