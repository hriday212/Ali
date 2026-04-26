import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export interface ExportConfig {
  includeKPIs: boolean;
  includeCharts: boolean;
  includeNodes: boolean;
  theme: 'dark' | 'light';
  title?: string;
  platform?: string;
}

/**
 * A robust utility to snapshot React DOM elements and compile them into a high-res PDF.
 */
export async function generatePDFReport(config: ExportConfig, onProgress?: (msg: string) => void) {
  try {
    if (onProgress) onProgress('Initializing Engine...');

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const PAGE_WIDTH = 210; // A4 width in mm
    const PAGE_HEIGHT = 297; // A4 height in mm
    const MARGIN = 15;
    const CONTENT_WIDTH = PAGE_WIDTH - (MARGIN * 2);
    
    let currentY = MARGIN;

    // Helper: Add Title
    pdf.setTextColor(config.theme === 'light' ? '#000000' : '#ffffff');
    if (config.theme === 'dark') {
      pdf.setFillColor('#020617'); // dark background
      pdf.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F');
    }

    pdf.setFontSize(22);
    pdf.text(config.title || 'Performance Intelligence Report', MARGIN, currentY);
    currentY += 8;
    
    pdf.setFontSize(10);
    pdf.setTextColor(config.theme === 'light' ? '#64748b' : '#94a3b8');
    const dateStr = new Date().toLocaleString();
    pdf.text(`Generated: ${dateStr} • Filter: ${config.platform?.toUpperCase() || 'ALL'}`, MARGIN, currentY);
    currentY += 15;

    // Helper: Capture Element
    const captureElement = async (selector: string): Promise<{ imgData: string, width: number, height: number } | null> => {
      const element = document.querySelector(selector) as HTMLElement;
      if (!element) return null;

      // Temporarily enforce styles for snapshotting to prevent Recharts resize loops
      const originalStyle = element.getAttribute('style') || '';
      element.style.setProperty('width', `${element.offsetWidth}px`, 'important');
      element.style.setProperty('overflow', 'visible', 'important');

      const captureTarget = element;

      const canvas = await html2canvas(captureTarget, {
        scale: 2, // High-res
        useCORS: true,
        logging: false,
        backgroundColor: config.theme === 'light' ? '#ffffff' : '#020617',
      });

      // Pure Canvas pixel manipulation for Light Mode (Avoids DOM cloning freezes)
      if (config.theme === 'light') {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Fill pure white background first if transparent
          ctx.globalCompositeOperation = 'destination-over';
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.globalCompositeOperation = 'source-over';

          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imgData.data;
          
          for (let i = 0; i < data.length; i += 4) {
             // Invert colors to simulate light mode
             data[i] = 255 - data[i];       // red
             data[i+1] = 255 - data[i+1];   // green
             data[i+2] = 255 - data[i+2];   // blue
             // Keep alpha channel intact
          }
          ctx.putImageData(imgData, 0, 0);
        }
      }

      // Cleanup CSS fix
      element.setAttribute('style', originalStyle);

      return {
        imgData: canvas.toDataURL('image/jpeg', 0.95),
        width: canvas.width,
        height: canvas.height
      };
    };

    // Helper: Add image to PDF handling pagination
    const addSection = async (selector: string, label: string) => {
      if (onProgress) onProgress(`Capturing ${label}...`);
      
      const capture = await captureElement(selector);
      if (!capture) return;

      const imgProps = pdf.getImageProperties(capture.imgData);
      const pdfImgHeight = (imgProps.height * CONTENT_WIDTH) / imgProps.width;

      // Check for page break
      if (currentY + pdfImgHeight > PAGE_HEIGHT - MARGIN) {
        pdf.addPage();
        if (config.theme === 'dark') {
          pdf.setFillColor('#020617');
          pdf.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, 'F');
        }
        currentY = MARGIN;
      }

      pdf.addImage(capture.imgData, 'JPEG', MARGIN, currentY, CONTENT_WIDTH, pdfImgHeight);
      currentY += pdfImgHeight + 10; // 10mm gap
    };

    // Run captures based on config
    if (config.includeKPIs) await addSection('[data-export-id="kpi-cards"]', 'KPI Analytics');
    if (config.includeCharts) {
      await addSection('[data-export-id="hourly-chart"]', 'Hourly Patterns');
      await addSection('[data-export-id="comparison-charts"]', 'Period Summary');
    }
    if (config.includeNodes) {
      await addSection('[data-export-id="node-table"]', 'Account Breakdown');
    }

    if (onProgress) onProgress('Finalizing Document...');
    pdf.save(`clypso-forecast-${Date.now()}.pdf`);
    
  } catch (error) {
    console.error('PDF Generation Failed:', error);
    throw error;
  }
}
