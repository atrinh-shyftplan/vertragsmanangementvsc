import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const exportToPdf = async (elementToCapture: HTMLElement, defaultFilename: string): Promise<string | null> => {
  return new Promise((resolve) => {
    // Create dialog for filename input
    const dialog = document.createElement('div');
    dialog.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
    dialog.innerHTML = `
      <div class="bg-background p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
        <h2 class="text-lg font-semibold mb-4">PDF exportieren</h2>
        <label class="block text-sm font-medium mb-2">Dateiname:</label>
        <input 
          type="text" 
          id="filename-input"
          class="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          value="${defaultFilename}"
        />
        <div class="flex gap-2 mt-4 justify-end">
          <button id="cancel-btn" class="px-4 py-2 text-muted-foreground hover:text-foreground">
            Abbrechen
          </button>
          <button id="export-btn" class="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
            Exportieren
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(dialog);

    const filenameInput = dialog.querySelector('#filename-input') as HTMLInputElement;
    const cancelBtn = dialog.querySelector('#cancel-btn') as HTMLButtonElement;
    const exportBtn = dialog.querySelector('#export-btn') as HTMLButtonElement;

    filenameInput.focus();
    filenameInput.select();

    const cleanup = () => {
      document.body.removeChild(dialog);
    };

    cancelBtn.onclick = () => {
      cleanup();
      resolve(null);
    };

    const performExport = async () => {
      const filename = filenameInput.value.trim() || defaultFilename;
      cleanup();

      try {
        // Create canvas from element
        const canvas = await html2canvas(elementToCapture, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff'
        });

        // Calculate PDF dimensions
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        
        // Calculate scaling to fit width
        const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
        const scaledWidth = imgWidth * ratio;
        const scaledHeight = imgHeight * ratio;
        
        // Calculate how many pages we need
        const pageHeight = pdfHeight - 20; // Leave margin for page numbers
        const pagesNeeded = Math.ceil(scaledHeight / pageHeight);
        
        for (let page = 0; page < pagesNeeded; page++) {
          if (page > 0) {
            pdf.addPage();
          }
          
          // Calculate the portion of the image for this page
          const sourceY = (page * pageHeight) / ratio;
          const sourceHeight = Math.min(pageHeight / ratio, imgHeight - sourceY);
          
          // Create a canvas for this page portion
          const pageCanvas = document.createElement('canvas');
          const pageCtx = pageCanvas.getContext('2d')!;
          pageCanvas.width = imgWidth;
          pageCanvas.height = sourceHeight;
          
          // Draw the portion of the original canvas
          pageCtx.drawImage(
            canvas,
            0, sourceY,
            imgWidth, sourceHeight,
            0, 0,
            imgWidth, sourceHeight
          );
          
          const pageImgData = pageCanvas.toDataURL('image/png');
          const actualHeight = sourceHeight * ratio;
          
          pdf.addImage(pageImgData, 'PNG', 0, 0, scaledWidth, actualHeight);
          
          // Add page number
          pdf.setFontSize(10);
          pdf.setTextColor(128, 128, 128);
          const pageText = `Seite ${page + 1} von ${pagesNeeded}`;
          const textWidth = pdf.getTextWidth(pageText);
          pdf.text(pageText, pdfWidth - textWidth - 10, pdfHeight - 5);
        }

        // Save the PDF
        const finalFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
        pdf.save(finalFilename);
        
        resolve(finalFilename);
      } catch (error) {
        console.error('Error exporting PDF:', error);
        resolve(null);
      }
    };

    exportBtn.onclick = performExport;
    
    filenameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        performExport();
      } else if (e.key === 'Escape') {
        cleanup();
        resolve(null);
      }
    });
  });
};