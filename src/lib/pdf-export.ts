import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const exportToPdf = async (
  originalElement: HTMLElement,
  filename: string
) => {
  if (!originalElement) return;

  // 1. Unsichtbaren Klon für die Aufbereitung erstellen und stylen
  const clone = originalElement.cloneNode(true) as HTMLElement;
  document.body.appendChild(clone);
  clone.classList.add('pdf-render-container');

  // Warten, bis alle Bilder im Klon geladen sind
  const images = Array.from(clone.getElementsByTagName('img'));
  const promises = images.map(img => new Promise(resolve => {
    if (img.complete) resolve(true);
    else img.onload = img.onerror = () => resolve(true);
  }));
  await Promise.all(promises);

  try {
    const canvas = await html2canvas(clone, {
      scale: 2, // Hohe Auflösung für scharfen Text
      useCORS: true,
      scrollY: 0,
      scrollX: 0,
      width: clone.offsetWidth,
      height: clone.scrollHeight,
      windowHeight: clone.scrollHeight,
      windowWidth: clone.offsetWidth,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.85); // JPEG mit 85% Qualität für deutlich kleinere Dateien
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;
    let page = 1;

    pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight);
    heightLeft -= pdf.internal.pageSize.getHeight();

    while (heightLeft > 0) {
      position -= pdf.internal.pageSize.getHeight();
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pdf.internal.pageSize.getHeight();
      page++;
    }

    // Seitenzahlen hinzufügen
    const pageCount = pdf.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(150);
        pdf.text(`${i}`, pdf.internal.pageSize.getWidth() - 15, pdf.internal.pageSize.getHeight() - 10, { align: 'right' });
    }

    pdf.save(filename);

  } finally {
    // 6. Unsichtbaren Klon nach dem Export wieder aus dem DOM entfernen
    document.body.removeChild(clone);
  }
};