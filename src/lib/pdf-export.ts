import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const exportToPdf = async (elementToCapture: HTMLElement, filename: string): Promise<string | null> => {
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
    
    return finalFilename;
  } catch (error) {
    console.error('Error exporting PDF:', error);
    return null;
  }
};