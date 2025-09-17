import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// NEUE Hilfsfunktion: Lädt ein Bild und konvertiert es zu einer Base64-Daten-URL
const imageToDataUrl = (url: string): Promise<string> => {
  return fetch(url)
    .then(response => {
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }
      return response.blob();
    })
    .then(blob => new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    }));
};

// ÜBERARBEITETE Hauptfunktion
export const generatePdf = async (element: HTMLElement, fileName: string): Promise<void> => {
  // 1. Klonen des Elements, um das Original nicht zu verändern
  const clonedElement = element.cloneNode(true) as HTMLElement;
  clonedElement.classList.add('pdf-render-container');
  document.body.appendChild(clonedElement);

  try {
    // 2. NEU: Alle Bilder im geklonten Element finden und in Base64 umwandeln
    const images = Array.from(clonedElement.getElementsByTagName('img'));
    const imagePromises = images.map(async (img) => {
      // Nur Bilder mit http/https-Quelle verarbeiten
      if (img.src && img.src.startsWith('http')) {
        try {
          const dataUrl = await imageToDataUrl(img.src);
          img.src = dataUrl;
        } catch (error) {
          console.error('Could not convert image to data URL:', img.src, error);
          // Optional: Bild durch Platzhalter ersetzen oder entfernen bei Fehler
          img.style.display = 'none'; 
        }
      }
    });

    // Warten, bis alle Bilder konvertiert wurden
    await Promise.all(imagePromises);

    // 3. Den HTML-Inhalt als Canvas rendern (wie bisher)
    const canvas = await html2canvas(clonedElement, {
      scale: 2, // Gute Qualität
      useCORS: true,
      logging: true,
      scrollY: -window.scrollY,
      windowWidth: clonedElement.scrollWidth,
      windowHeight: clonedElement.scrollHeight,
    });

    // 4. PDF-Dokument erstellen (wie bisher)
    const imgData = canvas.toDataURL('image/jpeg', 0.85); // Kompression für kleinere Dateigröße
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight);
    heightLeft -= pdfHeight;

    while (heightLeft > 0) {
      position -= pdfHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;
    }

    pdf.save(fileName);

  } catch (error) {
    console.error("Failed to generate PDF:", error);
  } finally {
    // 5. Den unsichtbaren Klon nach dem Export wieder entfernen (wichtig!)
    document.body.removeChild(clonedElement);
  }
};