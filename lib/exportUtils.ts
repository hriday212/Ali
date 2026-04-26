export interface ExportConfig {
  includeKPIs: boolean;
  includeCharts: boolean;
  includeNodes: boolean;
  theme: 'dark' | 'light';
  title?: string;
  platform?: string;
}

/**
 * A robust native utility to snapshot React DOM elements natively using the browser's high-res PDF engine.
 */
export async function generatePDFReport(config: ExportConfig, onProgress?: (msg: string) => void) {
  try {
    if (onProgress) onProgress('Routing to Print Engine...');

    // Toggle global CSS classes based on user preferences
    if (!config.includeKPIs) document.body.classList.add('print-exclude-kpis');
    if (!config.includeCharts) document.body.classList.add('print-exclude-charts');
    if (!config.includeNodes) document.body.classList.add('print-exclude-nodes');
    if (config.theme === 'light') document.body.classList.add('print-theme-light');

    // Slight delay to ensure DOM repaints the exclusions before capturing
    await new Promise(r => setTimeout(r, 300));

    window.print();

    // Cleanup exclusions to restore dashboard to standard state
    document.body.classList.remove('print-exclude-kpis');
    document.body.classList.remove('print-exclude-charts');
    document.body.classList.remove('print-exclude-nodes');
    document.body.classList.remove('print-theme-light');
    
  } catch (error) {
    console.error('PDF Native Routing Failed:', error);
    throw error;
  }
}
