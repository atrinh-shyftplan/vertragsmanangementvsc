import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const exportToPdf = async (elementToCapture: HTMLElement, filename: string) => {
  if (!elementToCapture) {
    console.error("Element to capture not found!");
    return;
  }

  // 1. Canvas mit voller Höhe erstellen
  const canvas = await html2canvas(elementToCapture, {
    scrollY: -window.scrollY, // Wichtig, um den Anfang zu erfassen
    useCORS: true,
    scale: 2, // Bessere Auflösung
    // Stelle sicher, dass der gesamte Inhalt erfasst wird, nicht nur der sichtbare Teil
    height: elementToCapture.scrollHeight,
    windowHeight: elementToCapture.scrollHeight
  });

  const imgData = canvas.toDataURL('image/png');
  const imgWidth = canvas.width;
  const imgHeight = canvas.height;

  // 2. PDF-Setup (A4-Format, mm-Einheiten)
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const margin = 15; // 15mm Rand

  // 3. Bild-Skalierung berechnen
  const ratio = imgWidth / imgHeight;
  const usableWidth = pdfWidth - (margin * 2);
  const scaledImgHeight = usableWidth / ratio;

  // 4. Paginierung: Bild in Seiten aufteilen
  let heightLeft = scaledImgHeight;
  let position = 0;
  let page = 1;

  // Füge das Bild zur ersten Seite hinzu
  pdf.addImage(imgData, 'PNG', margin, margin, usableWidth, scaledImgHeight);
  heightLeft -= (pdfHeight - (margin * 2));

  // Füge weitere Seiten hinzu, falls nötig
  while (heightLeft > 0) {
    position -= (pdfHeight - (margin * 2));
    pdf.addPage();
    page++;
    pdf.addImage(imgData, 'PNG', margin, position + margin, usableWidth, scaledImgHeight);
    heightLeft -= (pdfHeight - (margin * 2));
  }

  // 5. Seitenzahlen auf allen Seiten hinzufügen
  const pageCount = pdf.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(10);
    pdf.setTextColor(150);
    const text = `Seite ${i} von ${pageCount}`;
    const textWidth = pdf.getStringUnitWidth(text) * pdf.getFontSize() / pdf.internal.scaleFactor;
    pdf.text(
      text,
      pdfWidth - margin - textWidth, // Position X (rechtsbündig mit Rand)
      pdfHeight - margin // Position Y (unten mit Rand)
    );
  }

  // 6. PDF speichern
  pdf.save(filename);
};