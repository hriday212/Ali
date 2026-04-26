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

export async function generatePDFReport(config: ExportConfig, onProgress?: (msg: string) => void) {
  try {
    if (onProgress) onProgress('Capturing High-Res Snapshot...');

    const element = document.getElementById('forecast-report');
    if (!element) throw new Error('Report container not found');

    // Prepare styles for capture based on theme
    const originalStyle = element.style.cssText;
    const isLight = config.theme === 'light';
    const bgColor = isLight ? '#ffffff' : '#020617';
    const textColor = isLight ? '#0f172a' : '#ffffff';
    
    element.style.background = bgColor;
    element.style.color = textColor;
    element.style.padding = '40px';

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: bgColor,
      logging: false,
      onclone: (clonedDoc) => {
        const clonedEl = clonedDoc.getElementById('forecast-report');
        if (clonedEl) {
          if (isLight) {
            // Force light mode styles for all cards and text in the clone
            clonedEl.querySelectorAll('.glass-card').forEach((card: any) => {
              card.style.background = '#f8fafc';
              card.style.borderColor = '#e2e8f0';
              card.style.color = '#0f172a';
              card.style.boxShadow = 'none';
            });
            clonedEl.querySelectorAll('p, h1, h2, h3, span, div').forEach((text: any) => {
              const el = text as HTMLElement;
              if (!el.classList.contains('bg-white')) { // Keep some accents
                 el.style.color = '#0f172a';
              }
            });
          }
          // Hide elements based on config
          if (!config.includeKPIs) {
            const kpi = clonedEl.querySelector('[data-export-id="kpi-cards"]');
            if (kpi) (kpi as HTMLElement).style.display = 'none';
          }
          if (!config.includeCharts) {
            const charts = clonedEl.querySelector('[data-export-id="comparison-charts"]');
            const hChart = clonedEl.querySelector('[data-export-id="hourly-chart"]');
            if (charts) (charts as HTMLElement).style.display = 'none';
            if (hChart) (hChart as HTMLElement).style.display = 'none';
          }
          if (!config.includeNodes) {
            const nodes = clonedEl.querySelector('[data-export-id="node-table"]');
            if (nodes) (nodes as HTMLElement).style.display = 'none';
          }
        }
      }
    });

    if (onProgress) onProgress('Generating Document...');

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: [canvas.width / 2, canvas.height / 2]
    });

    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
    pdf.save(`Clypso_Intelligence_Report_${new Date().toISOString().split('T')[0]}.pdf`);

    // Restore original styles
    element.style.cssText = originalStyle;
    
    if (onProgress) onProgress('Export Complete');
    
  } catch (error) {
    console.error('PDF Snap Routing Failed:', error);
    throw error;
  }
}
