import { jsPDF } from 'jspdf';

export function generatePrescriptionPDF(data) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const checkPageBreak = (neededHeight) => {
    if (y + neededHeight > pageHeight - margin) {
      doc.addPage();
      y = margin;
      return true;
    }
    return false;
  };

  // Header banner
  doc.setFillColor(37, 99, 235); // Blue 600
  doc.rect(0, 0, pageWidth, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('MedScript Analyzer', margin, 13);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('AI-Powered Prescription Analysis Report', margin, 19);

  const dateStr = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  doc.text(`Generated: ${dateStr}`, pageWidth - margin, 19, { align: 'right' });

  y = 32;

  // Disclaimer banner
  doc.setFillColor(254, 242, 242); // Red 50
  doc.setDrawColor(254, 202, 202); // Red 200
  doc.rect(margin, y, contentWidth, 12, 'FD');
  doc.setTextColor(185, 28, 28); // Red 700
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('IMPORTANT MEDICAL DISCLAIMER:', margin + 4, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.text(
    'This report is AI-generated and not medical advice. Always verify with your doctor or pharmacist.',
    margin + 4,
    y + 9
  );

  y += 18;

  // Patient & Doctor Section
  const hasPatient = data.patient && (data.patient.name || data.patient.age || data.patient.gender);
  const hasDoctor = data.doctor && (data.doctor.name || data.doctor.clinic);

  if (hasPatient || hasDoctor) {
    checkPageBreak(25);
    doc.setFillColor(243, 244, 246); // Gray 100
    doc.roundedRect(margin, y, contentWidth, 20, 2, 2, 'F');

    doc.setTextColor(31, 41, 55);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');

    if (hasPatient) {
      doc.text('Patient Details', margin + 4, y + 6);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const pInfo = [
        data.patient.name && data.patient.name !== 'unclear' ? `Name: ${data.patient.name}` : null,
        data.patient.age && data.patient.age !== 'unclear' ? `Age: ${data.patient.age}` : null,
        data.patient.gender && data.patient.gender !== 'unclear' ? `Gender: ${data.patient.gender}` : null
      ]
        .filter(Boolean)
        .join(' | ');
      doc.text(pInfo || 'Information not specified', margin + 4, y + 13);
    }

    if (hasDoctor) {
      const col2X = margin + contentWidth / 2 + 2;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('Prescribing Doctor', col2X, y + 6);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const dInfo = [
        data.doctor.name && data.doctor.name !== 'unclear' ? data.doctor.name : null,
        data.doctor.clinic && data.doctor.clinic !== 'unclear' ? data.doctor.clinic : null
      ]
        .filter(Boolean)
        .join(' - ');
      doc.text(dInfo || 'Information not specified', col2X, y + 13);
    }

    y += 26;
  }

  // Medicines List
  if (Array.isArray(data.medicines) && data.medicines.length > 0) {
    checkPageBreak(20);
    doc.setTextColor(30, 58, 138); // Blue 900
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Prescribed Medicines (${data.medicines.length})`, margin, y);
    y += 6;

    data.medicines.forEach((med, index) => {
      checkPageBreak(28);

      doc.setFillColor(249, 250, 251);
      doc.setDrawColor(229, 231, 235);
      doc.roundedRect(margin, y, contentWidth, 24, 2, 2, 'FD');

      // Medicine title
      doc.setTextColor(17, 24, 39);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`${index + 1}. ${med.name || 'Unnamed Medicine'}`, margin + 4, y + 6);

      if (med.strength && med.strength !== 'unclear') {
        doc.setTextColor(37, 99, 235);
        doc.setFontSize(8);
        doc.text(`[${med.strength}]`, margin + 60, y + 6);
      }

      // Details
      doc.setTextColor(75, 85, 99);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');

      const doseParts = [
        med.dose && med.dose !== 'unclear' ? `Dose: ${med.dose}` : null,
        med.frequency && med.frequency !== 'unclear' ? `Frequency: ${med.frequency}` : null,
        med.timing && med.timing !== 'unclear' ? `Timing: ${med.timing}` : null,
        med.duration && med.duration !== 'unclear' ? `Duration: ${med.duration}` : null
      ].filter(Boolean);

      doc.text(doseParts.join('  •  ') || 'Standard instructions apply', margin + 4, y + 12);

      if (med.purpose && med.purpose !== 'unclear') {
        doc.setTextColor(55, 65, 81);
        doc.setFont('helvetica', 'italic');
        const purposeLines = doc.splitTextToSize(`Purpose: ${med.purpose}`, contentWidth - 8);
        doc.text(purposeLines, margin + 4, y + 18);
      }

      y += 28;
    });
  }

  // Drug Interactions
  if (Array.isArray(data.interactions) && data.interactions.length > 0) {
    checkPageBreak(25);
    doc.setTextColor(180, 83, 9); // Amber 700
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Potential Drug Interactions & Warnings', margin, y);
    y += 5;

    data.interactions.forEach((item) => {
      checkPageBreak(12);
      doc.setTextColor(55, 65, 81);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(`• ${item}`, contentWidth - 4);
      doc.text(lines, margin + 2, y);
      y += lines.length * 4.5 + 2;
    });
    y += 4;
  }

  // Precautions & Side Effects
  const hasPrecautions = Array.isArray(data.precautions) && data.precautions.length > 0;
  const hasSideEffects = Array.isArray(data.sideEffects) && data.sideEffects.length > 0;

  if (hasPrecautions || hasSideEffects) {
    checkPageBreak(25);
    doc.setTextColor(30, 58, 138);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Precautions & Side Effects', margin, y);
    y += 5;

    if (hasPrecautions) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(37, 99, 235);
      doc.text('Precautions:', margin, y);
      y += 4.5;
      data.precautions.forEach((p) => {
        checkPageBreak(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(55, 65, 81);
        const lines = doc.splitTextToSize(`- ${p}`, contentWidth - 4);
        doc.text(lines, margin + 2, y);
        y += lines.length * 4.2 + 1.5;
      });
      y += 2;
    }

    if (hasSideEffects) {
      checkPageBreak(15);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(220, 38, 38);
      doc.text('Possible Side Effects:', margin, y);
      y += 4.5;
      data.sideEffects.forEach((s) => {
        checkPageBreak(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(55, 65, 81);
        const lines = doc.splitTextToSize(`- ${s}`, contentWidth - 4);
        doc.text(lines, margin + 2, y);
        y += lines.length * 4.2 + 1.5;
      });
      y += 3;
    }
  }

  // Doctor Instructions
  if (data.instructions && data.instructions.trim()) {
    checkPageBreak(20);
    doc.setTextColor(30, 58, 138);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text("Doctor's Notes & Instructions", margin, y);
    y += 5;

    doc.setTextColor(55, 65, 81);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    const instLines = doc.splitTextToSize(data.instructions, contentWidth - 4);
    doc.text(instLines, margin + 2, y);
    y += instLines.length * 4.5 + 4;
  }

  // Uncertain items
  if (Array.isArray(data.uncertainFields) && data.uncertainFields.length > 0) {
    checkPageBreak(20);
    doc.setFillColor(254, 252, 232); // Yellow 50
    doc.setDrawColor(253, 230, 138); // Amber 200
    const unLines = doc.splitTextToSize(
      `Unclear / Illegible Items (Verify with Doctor): ${data.uncertainFields.join(', ')}`,
      contentWidth - 8
    );
    const boxHeight = unLines.length * 4.5 + 6;
    doc.roundedRect(margin, y, contentWidth, boxHeight, 2, 2, 'FD');
    doc.setTextColor(146, 64, 14);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(unLines, margin + 4, y + 5);
    y += boxHeight + 4;
  }

  // Save the PDF
  const filename = `Prescription_Analysis_${Date.now()}.pdf`;
  doc.save(filename);
}
