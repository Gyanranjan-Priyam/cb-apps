import { jsPDF } from "jspdf";
import type { ResumeData } from "./types";
import type { ParsedLatexResume } from "./latex-parser";

/**
 * Pure Vector Overleaf-Fidelity ATS PDF Generator
 * - Native Clickable PDF Links (doc.link & textWithLink)
 * - Crisp Vector Icons (Envelope, LinkedIn, GitHub, Globe, ExternalLink)
 * - Times Roman / Computer Modern serif typography
 * - Exact Small-Caps headings and single-line right-aligned dates
 */
export async function generatePdfFromResume(
  visualData: ResumeData,
  parsedLatex?: ParsedLatexResume | null
): Promise<Blob> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 12.7; // 0.5 inch margins
  const contentWidth = pageWidth - marginX * 2;
  const rightMarginX = pageWidth - marginX;

  let y = 14;

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - 12) {
      doc.addPage();
      y = 14;
    }
  };

  const selectedFont = visualData.theme.fontFamily || "Computer Modern";
  let pdfFont: "times" | "helvetica" | "courier" = "times";

  if (
    selectedFont === "Computer Modern" ||
    selectedFont === "Times New Roman" ||
    selectedFont === "Merriweather" ||
    selectedFont === "Playfair Display"
  ) {
    pdfFont = "times";
  } else if (selectedFont === "Source Code Pro") {
    pdfFont = "courier";
  } else {
    pdfFont = "helvetica";
  }

  // ── Vector Icon Drawing Helpers ──
  const drawIcon = (type: string, x: number, iconY: number) => {
    doc.setDrawColor(30, 41, 59);
    doc.setFillColor(30, 41, 59);
    doc.setLineWidth(0.2);

    if (type === "email") {
      // Envelope
      const w = 3.2;
      const h = 2.2;
      const top = iconY - 2.0;
      doc.rect(x, top, w, h, "S");
      doc.line(x, top, x + w / 2, top + 1.2);
      doc.line(x + w, top, x + w / 2, top + 1.2);
    } else if (type === "linkedin") {
      // LinkedIn Box
      const w = 2.8;
      const h = 2.8;
      const top = iconY - 2.4;
      doc.roundedRect(x, top, w, h, 0.4, 0.4, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(5.5);
      doc.text("in", x + 0.6, top + 2.0);
    } else if (type === "github") {
      // GitHub Circle & Octocat Silhouette
      const r = 1.4;
      const cx = x + r;
      const cy = iconY - 1.1;
      doc.circle(cx, cy, r, "F");
      doc.setFillColor(255, 255, 255);
      doc.circle(cx, cy + 0.3, 0.7, "F");
    } else if (type === "globe") {
      // Globe
      const r = 1.4;
      const cx = x + r;
      const cy = iconY - 1.1;
      doc.circle(cx, cy, r, "S");
      doc.ellipse(cx, cy, 0.6, r, "S");
      doc.line(cx - r, cy, cx + r, cy);
    } else if (type === "external") {
      // External Link Icon
      const w = 2.4;
      const top = iconY - 2.0;
      doc.rect(x, top + 0.6, w - 0.6, w - 0.6, "S");
      doc.line(x + 0.8, top + 1.6, x + w, top);
      doc.line(x + w - 0.8, top, x + w, top);
      doc.line(x + w, top, x + w, top + 0.8);
    } else {
      // Phone
      const w = 1.8;
      const h = 2.8;
      const top = iconY - 2.4;
      doc.roundedRect(x, top, w, h, 0.3, 0.3, "S");
      doc.circle(x + w / 2, top + 2.2, 0.2, "F");
    }
  };

  // ── Header: Full Name ──
  const fullName = (parsedLatex?.name || visualData.personalInfo.fullName || "Resume").trim();
  doc.setFont(pdfFont, "bold");
  doc.setFontSize(21);
  doc.setTextColor(0, 0, 0);
  doc.text(fullName, pageWidth / 2, y, { align: "center" });
  y += 5.5;

  // ── Sub-header: Contact Links with Real PDF Hyperlinks & Vector Icons ──
  if (parsedLatex && parsedLatex.contactLinks.length > 0) {
    doc.setFont(pdfFont, "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(0, 0, 0);

    const items = parsedLatex.contactLinks;
    // Calculate total line width to center the entire block
    let totalLineWidth = 0;
    const itemWidths: number[] = [];

    items.forEach((item, idx) => {
      const textWidth = doc.getTextWidth(item.text);
      const iconWidth = item.icon ? 4.2 : 0;
      const itemW = iconWidth + textWidth;
      itemWidths.push(itemW);
      totalLineWidth += itemW;
      if (idx < items.length - 1) {
        totalLineWidth += doc.getTextWidth("   |   ");
      }
    });

    let currentX = (pageWidth - totalLineWidth) / 2;

    items.forEach((item, idx) => {
      const itemStartX = currentX;

      // Draw vector icon
      if (item.icon) {
        drawIcon(item.icon, currentX, y);
        currentX += 4.0;
      }

      // Draw text
      doc.setFont(pdfFont, "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(0, 0, 0);
      doc.text(item.text, currentX, y);
      const textW = doc.getTextWidth(item.text);

      // Add Native Clickable PDF Link Annotation
      if (item.url) {
        const linkW = currentX + textW - itemStartX;
        doc.link(itemStartX, y - 3.5, linkW, 4.5, { url: item.url });
      }

      currentX += textW;

      // Draw separator
      if (idx < items.length - 1) {
        const sep = "   |   ";
        doc.setTextColor(100, 116, 139);
        doc.text(sep, currentX, y);
        currentX += doc.getTextWidth(sep);
      }
    });

    y += 5.5;
  } else {
    y += 2;
  }

  // ── Section Header Helper ──
  const drawSectionHeader = (title: string) => {
    checkPageBreak(12);
    y += 2.5;
    doc.setFont(pdfFont, "bold");
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(title.toUpperCase(), marginX, y);
    y += 1.6;

    // Solid Overleaf Section Divider Rule
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.line(marginX, y, rightMarginX, y);
    y += 3.8;
  };

  // ── Bullet Point Helper ──
  const drawBullet = (text: string) => {
    doc.setFont(pdfFont, "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(0, 0, 0);

    const cleanText = text.replace(/^[•\s\-\*]+/, "").trim();
    const bulletIndent = marginX + 3;
    const textIndent = marginX + 6.5;
    const maxTextWidth = contentWidth - 6.5;

    const lines: string[] = doc.splitTextToSize(cleanText, maxTextWidth);
    const neededHeight = lines.length * 3.8 + 1;
    checkPageBreak(neededHeight);

    // Draw bullet symbol
    doc.text("•", bulletIndent, y);

    // Draw wrapped lines
    lines.forEach((line, i) => {
      doc.text(line, textIndent, y + i * 3.8);
    });

    y += lines.length * 3.8 + 0.8;
  };

  // ══════════════════════════════════════════════════
  // RENDER SECTIONS
  // ══════════════════════════════════════════════════

  if (parsedLatex && parsedLatex.sections.length > 0) {
    for (const section of parsedLatex.sections) {
      drawSectionHeader(section.title);

      // Technical Skills Key-Value block (Zero Bullets)
      if (section.isKeyValSection) {
        for (const item of section.items) {
          if (item.bullets && item.bullets.length > 0) {
            for (const bullet of item.bullets) {
              checkPageBreak(5);
              const colonIdx = bullet.indexOf(":");
              if (colonIdx !== -1) {
                const category = bullet.substring(0, colonIdx).trim() + ":";
                const values = bullet.substring(colonIdx + 1).trim();

                doc.setFont(pdfFont, "bold");
                doc.setFontSize(9.5);
                doc.setTextColor(0, 0, 0);
                doc.text(category, marginX, y);

                const labelWidth = doc.getTextWidth(category + " ");
                doc.setFont(pdfFont, "normal");
                const valLines = doc.splitTextToSize(values, contentWidth - labelWidth);

                if (valLines.length === 1) {
                  doc.text(values, marginX + labelWidth, y);
                  y += 4.2;
                } else {
                  doc.text(valLines[0], marginX + labelWidth, y);
                  y += 3.8;
                  for (let l = 1; l < valLines.length; l++) {
                    doc.text(valLines[l], marginX, y);
                    y += 3.8;
                  }
                  y += 0.6;
                }
              } else {
                doc.setFont(pdfFont, "normal");
                doc.setFontSize(9.5);
                doc.text(bullet, marginX, y);
                y += 4.2;
              }
            }
          }
        }
      } else {
        // Standard Subheadings & Projects
        for (const item of section.items) {
          const r1Left = item.row1Left || item.title;
          const r1Right = item.row1Right || item.date || item.location;
          const r2Left = item.row2Left || item.subtitle;
          const r2Right = item.row2Right;

          // Single Line Project Heading: **Name** | *Tech* | [Demo] | [Code] ....... Date
          if (item.links && item.links.length > 0) {
            checkPageBreak(8);
            doc.setFont(pdfFont, "bold");
            doc.setFontSize(9.5);
            doc.setTextColor(0, 0, 0);

            const titlePart = r1Left || "";
            doc.text(titlePart, marginX, y);
            let currentX = marginX + doc.getTextWidth(titlePart);

            if (r2Left) {
              doc.setFont(pdfFont, "normal");
              doc.text(" | ", currentX, y);
              currentX += doc.getTextWidth(" | ");

              doc.setFont(pdfFont, "italic");
              doc.text(r2Left, currentX, y);
              currentX += doc.getTextWidth(r2Left);
            }

            // Clickable Project Action Links with Vector Icons
            if (item.links && item.links.length > 0) {
              item.links.forEach((l) => {
                doc.setFont(pdfFont, "normal");
                doc.text(" | ", currentX, y);
                currentX += doc.getTextWidth(" | ");

                // Draw small vector icon for demo or github
                drawIcon(l.icon === "github" ? "github" : "external", currentX, y);
                currentX += 3.5;

                const linkStartX = currentX;
                doc.setFont(pdfFont, "normal");
                doc.setTextColor(0, 0, 0);
                doc.text(l.text, currentX, y);
                const lTextW = doc.getTextWidth(l.text);

                // Add Native PDF Hyperlink
                if (l.url) {
                  doc.link(linkStartX - 3.5, y - 3.5, lTextW + 3.5, 4.5, { url: l.url });
                }

                currentX += lTextW;
              });
            }

            // Right-aligned date
            if (r1Right) {
              doc.setFont(pdfFont, "normal");
              doc.setFontSize(9.5);
              doc.setTextColor(0, 0, 0);
              doc.text(r1Right, rightMarginX, y, { align: "right" });
            }

            y += 4;
          } else if (r1Left || r1Right) {
            checkPageBreak(9);

            // Row 1: Left Bold, Right Normal
            doc.setFont(pdfFont, "bold");
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            doc.text(r1Left || "", marginX, y);

            if (r1Right) {
              doc.setFont(pdfFont, "normal");
              doc.setFontSize(9.5);
              doc.text(r1Right, rightMarginX, y, { align: "right" });
            }
            y += 4;

            // Row 2: Left Italic, Right Italic
            if (r2Left || r2Right) {
              doc.setFont(pdfFont, "italic");
              doc.setFontSize(9.5);
              doc.setTextColor(0, 0, 0);

              if (r2Left) {
                doc.text(r2Left, marginX, y);
              }
              if (r2Right) {
                doc.text(r2Right, rightMarginX, y, { align: "right" });
              }
              y += 3.8;
            }
          }

          // Bullet points
          if (item.bullets && item.bullets.length > 0) {
            for (const bullet of item.bullets) {
              drawBullet(bullet);
            }
          }
        }
      }
    }
  } else {
    // Visual mode
    if (visualData.personalInfo.summary) {
      drawSectionHeader("Professional Summary");
      doc.setFont(pdfFont, "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(0, 0, 0);
      const lines = doc.splitTextToSize(visualData.personalInfo.summary, contentWidth);
      checkPageBreak(lines.length * 4);
      lines.forEach((line: string, i: number) => {
        doc.text(line, marginX, y + i * 4);
      });
      y += lines.length * 4 + 2;
    }

    if (visualData.education.length > 0) {
      drawSectionHeader("Education");
      for (const edu of visualData.education) {
        checkPageBreak(9);
        doc.setFont(pdfFont, "bold");
        doc.setFontSize(10);
        doc.text(edu.institution, marginX, y);
        doc.setFont(pdfFont, "normal");
        doc.setFontSize(9.5);
        doc.text(edu.location || "", rightMarginX, y, { align: "right" });
        y += 4;

        doc.setFont(pdfFont, "italic");
        doc.text(`${edu.degree} in ${edu.fieldOfStudy}${edu.gpa ? ` – GPA: ${edu.gpa}` : ""}`, marginX, y);
        doc.text(`${edu.startDate} – ${edu.current ? "Present" : edu.endDate}`, rightMarginX, y, { align: "right" });
        y += 3.8;

        if (edu.bullets && edu.bullets.length > 0) {
          for (const bullet of edu.bullets) {
            drawBullet(bullet);
          }
        }
      }
    }

    if (visualData.experience.length > 0) {
      drawSectionHeader("Experience");
      for (const exp of visualData.experience) {
        checkPageBreak(9);
        doc.setFont(pdfFont, "bold");
        doc.setFontSize(10);
        doc.text(exp.role, marginX, y);
        doc.setFont(pdfFont, "normal");
        doc.setFontSize(9.5);
        doc.text(`${exp.startDate} – ${exp.current ? "Present" : exp.endDate}`, rightMarginX, y, { align: "right" });
        y += 4;

        doc.setFont(pdfFont, "italic");
        doc.text(exp.company, marginX, y);
        doc.text(exp.location || "", rightMarginX, y, { align: "right" });
        y += 3.8;

        if (exp.bullets && exp.bullets.length > 0) {
          for (const bullet of exp.bullets) {
            drawBullet(bullet);
          }
        }
      }
    }

    if (visualData.projects.length > 0) {
      drawSectionHeader("Projects");
      for (const proj of visualData.projects) {
        checkPageBreak(8);
        doc.setFont(pdfFont, "bold");
        doc.setFontSize(9.5);
        doc.text(proj.name, marginX, y);
        let currentX = marginX + doc.getTextWidth(proj.name);

        if (proj.techStack && proj.techStack.length > 0) {
          doc.setFont(pdfFont, "normal");
          doc.text(" | ", currentX, y);
          currentX += doc.getTextWidth(" | ");
          doc.setFont(pdfFont, "italic");
          doc.text(proj.techStack.join(", "), currentX, y);
        }

        if (proj.date) {
          doc.setFont(pdfFont, "normal");
          doc.text(proj.date, rightMarginX, y, { align: "right" });
        }
        y += 4;

        if (proj.bullets && proj.bullets.length > 0) {
          for (const bullet of proj.bullets) {
            drawBullet(bullet);
          }
        }
      }
    }

    if (visualData.skills.length > 0) {
      drawSectionHeader("Technical Skills");
      for (const cat of visualData.skills) {
        checkPageBreak(5);
        doc.setFont(pdfFont, "bold");
        doc.setFontSize(9.5);
        doc.setTextColor(0, 0, 0);
        const label = `${cat.name}: `;
        doc.text(label, marginX, y);

        const labelWidth = doc.getTextWidth(label);
        doc.setFont(pdfFont, "normal");
        doc.text(cat.skills.join(", "), marginX + labelWidth, y);
        y += 4.2;
      }
    }
  }

  return doc.output("blob");
}
