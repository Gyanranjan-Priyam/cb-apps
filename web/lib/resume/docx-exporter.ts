import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  BorderStyle,
  ExternalHyperlink,
} from "docx";
import type { ResumeData } from "./types";
import type { ParsedLatexResume } from "./latex-parser";

export async function generateDocxFromResume(
  visualData: ResumeData,
  parsedLatex?: ParsedLatexResume | null
): Promise<Blob> {
  const children: Paragraph[] = [];

  const fullName = (parsedLatex?.name || visualData.personalInfo.fullName || "Resume").trim();
  const docFont =
    visualData.theme.fontFamily === "Computer Modern"
      ? "Times New Roman"
      : visualData.theme.fontFamily || "Calibri";

  // 1. Header: Full Name
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [
        new TextRun({
          text: fullName.toUpperCase(),
          bold: true,
          size: 32, // 16pt
          font: docFont,
          color: "0F172A",
        }),
      ],
    })
  );

  // 2. Sub-header: Contact links
  if (parsedLatex && parsedLatex.contactLinks.length > 0) {
    const linkParagraphChildren: Array<TextRun | ExternalHyperlink> = [];

    parsedLatex.contactLinks.forEach((link, idx) => {
      if (link.url) {
        linkParagraphChildren.push(
          new ExternalHyperlink({
            children: [
              new TextRun({
                text: link.text,
                style: "Hyperlink",
                size: 19,
                font: docFont,
                color: "2563EB",
                underline: {},
              }),
            ],
            link: link.url,
          })
        );
      } else {
        linkParagraphChildren.push(
          new TextRun({
            text: link.text,
            size: 19,
            font: docFont,
            color: "475569",
          })
        );
      }

      if (idx < parsedLatex.contactLinks.length - 1) {
        linkParagraphChildren.push(
          new TextRun({
            text: "   |   ",
            size: 19,
            font: docFont,
            color: "94A3B8",
          })
        );
      }
    });

    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: linkParagraphChildren,
      })
    );
  } else {
    const contactParts = [
      visualData.personalInfo.phone,
      visualData.personalInfo.email,
      visualData.personalInfo.location,
      visualData.personalInfo.linkedin,
      visualData.personalInfo.github,
    ].filter(Boolean);

    if (contactParts.length > 0) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [
            new TextRun({
              text: contactParts.join("   |   "),
              size: 19,
              font: docFont,
              color: "475569",
            }),
          ],
        })
      );
    }
  }

  // Helper for Section Heading with bottom border
  const createSectionHeader = (title: string) => {
    return new Paragraph({
      spacing: { before: 180, after: 100 },
      border: {
        bottom: {
          color: "0F172A",
          space: 2,
          style: BorderStyle.SINGLE,
          size: 12,
        },
      },
      children: [
        new TextRun({
          text: title.toUpperCase(),
          bold: true,
          size: 23, // 11.5pt
          font: docFont,
          color: "0F172A",
        }),
      ],
    });
  };

  // If in parsed LaTeX mode
  if (parsedLatex && parsedLatex.sections.length > 0) {
    for (const section of parsedLatex.sections) {
      children.push(createSectionHeader(section.title));

      for (const item of section.items) {
        const r1Left = item.row1Left || item.title;
        const r1Right = item.row1Right || item.date || item.location;
        const r2Left = item.row2Left || item.subtitle;
        const r2Right = item.row2Right;

        if (r1Left || r1Right) {
          const r1Runs: Array<TextRun | ExternalHyperlink> = [
            new TextRun({
              text: r1Left || "",
              bold: true,
              size: 21,
              font: docFont,
              color: "0F172A",
            }),
          ];

          if (r1Right) {
            r1Runs.push(
              new TextRun({
                text: `   –   ${r1Right}`,
                size: 20,
                color: "475569",
                font: docFont,
              })
            );
          }

          children.push(
            new Paragraph({
              spacing: { before: 60, after: 20 },
              children: r1Runs,
            })
          );
        }

        if (r2Left || r2Right || (item.links && item.links.length > 0)) {
          const r2Runs: Array<TextRun | ExternalHyperlink> = [];

          if (r2Left) {
            r2Runs.push(
              new TextRun({
                text: r2Left,
                italics: true,
                size: 20,
                color: "334155",
                font: docFont,
              })
            );
          }

          if (r2Right) {
            r2Runs.push(
              new TextRun({
                text: ` (${r2Right})`,
                size: 19,
                color: "64748B",
                font: docFont,
              })
            );
          }

          if (item.links && item.links.length > 0) {
            item.links.forEach((l) => {
              r2Runs.push(new TextRun({ text: "  |  ", size: 18, color: "94A3B8" }));
              r2Runs.push(
                new ExternalHyperlink({
                  children: [
                    new TextRun({
                      text: l.text,
                      style: "Hyperlink",
                      size: 19,
                      font: docFont,
                      color: "2563EB",
                      underline: {},
                    }),
                  ],
                  link: l.url,
                })
              );
            });
          }

          children.push(
            new Paragraph({
              spacing: { after: 30 },
              children: r2Runs,
            })
          );
        }

        if (item.bullets && item.bullets.length > 0) {
          for (const bullet of item.bullets) {
            children.push(
              new Paragraph({
                bullet: { level: 0 },
                spacing: { before: 15, after: 15 },
                children: [
                  new TextRun({
                    text: bullet.replace(/^[•\s\-\*]+/, ""),
                    size: 20,
                    font: docFont,
                    color: "1E293B",
                  }),
                ],
              })
            );
          }
        }
      }
    }
  } else {
    // Visual data export
    // 3. Professional Summary
    if (visualData.personalInfo.summary) {
      children.push(createSectionHeader("Professional Summary"));
      children.push(
        new Paragraph({
          spacing: { after: 100 },
          children: [
            new TextRun({
              text: visualData.personalInfo.summary,
              size: 20,
              font: docFont,
              color: "1E293B",
            }),
          ],
        })
      );
    }

    // 4. Education
    if (visualData.education.length > 0) {
      children.push(createSectionHeader("Education"));
      for (const edu of visualData.education) {
        children.push(
          new Paragraph({
            spacing: { before: 60, after: 20 },
            children: [
              new TextRun({
                text: edu.institution,
                bold: true,
                size: 21,
                font: docFont,
              }),
              new TextRun({
                text: `  |  ${edu.location || ""}`,
                size: 20,
                color: "475569",
                font: docFont,
              }),
            ],
          })
        );
        children.push(
          new Paragraph({
            spacing: { after: 30 },
            children: [
              new TextRun({
                text: `${edu.degree} in ${edu.fieldOfStudy}${edu.gpa ? ` (GPA: ${edu.gpa})` : ""}`,
                italics: true,
                size: 20,
                color: "334155",
                font: docFont,
              }),
              new TextRun({
                text: `   [${edu.startDate} – ${edu.current ? "Present" : edu.endDate}]`,
                size: 19,
                color: "64748B",
                font: docFont,
              }),
            ],
          })
        );
        if (edu.bullets && edu.bullets.length > 0) {
          for (const bullet of edu.bullets) {
            children.push(
              new Paragraph({
                bullet: { level: 0 },
                spacing: { before: 15, after: 15 },
                children: [
                  new TextRun({
                    text: bullet,
                    size: 20,
                    font: docFont,
                    color: "1E293B",
                  }),
                ],
              })
            );
          }
        }
      }
    }

    // 5. Work Experience
    if (visualData.experience.length > 0) {
      children.push(createSectionHeader("Experience"));
      for (const exp of visualData.experience) {
        children.push(
          new Paragraph({
            spacing: { before: 60, after: 20 },
            children: [
              new TextRun({
                text: exp.role,
                bold: true,
                size: 21,
                font: docFont,
              }),
              new TextRun({
                text: `  –  ${exp.company} (${exp.location || ""})`,
                italics: true,
                size: 20,
                color: "334155",
                font: docFont,
              }),
              new TextRun({
                text: `   [${exp.startDate} – ${exp.current ? "Present" : exp.endDate}]`,
                size: 19,
                color: "64748B",
                font: docFont,
              }),
            ],
          })
        );

        if (exp.bullets && exp.bullets.length > 0) {
          for (const bullet of exp.bullets) {
            children.push(
              new Paragraph({
                bullet: { level: 0 },
                spacing: { before: 15, after: 15 },
                children: [
                  new TextRun({
                    text: bullet,
                    size: 20,
                    font: docFont,
                    color: "1E293B",
                  }),
                ],
              })
            );
          }
        }
      }
    }

    // 6. Projects
    if (visualData.projects.length > 0) {
      children.push(createSectionHeader("Projects"));
      for (const proj of visualData.projects) {
        const techStr = proj.techStack.length > 0 ? ` | ${proj.techStack.join(", ")}` : "";
        children.push(
          new Paragraph({
            spacing: { before: 60, after: 20 },
            children: [
              new TextRun({
                text: proj.name,
                bold: true,
                size: 21,
                font: docFont,
              }),
              new TextRun({
                text: techStr,
                italics: true,
                size: 20,
                color: "475569",
                font: docFont,
              }),
              proj.date
                ? new TextRun({
                    text: `   (${proj.date})`,
                    size: 19,
                    color: "64748B",
                    font: docFont,
                  })
                : new TextRun({ text: "" }),
            ],
          })
        );

        if (proj.bullets && proj.bullets.length > 0) {
          for (const bullet of proj.bullets) {
            children.push(
              new Paragraph({
                bullet: { level: 0 },
                spacing: { before: 15, after: 15 },
                children: [
                  new TextRun({
                    text: bullet,
                    size: 20,
                    font: docFont,
                    color: "1E293B",
                  }),
                ],
              })
            );
          }
        }
      }
    }

    // 7. Technical Skills
    if (visualData.skills.length > 0) {
      children.push(createSectionHeader("Technical Skills"));
      for (const cat of visualData.skills) {
        children.push(
          new Paragraph({
            spacing: { before: 15, after: 15 },
            children: [
              new TextRun({
                text: `${cat.name}: `,
                bold: true,
                size: 20,
                font: docFont,
                color: "0F172A",
              }),
              new TextRun({
                text: cat.skills.join(", "),
                size: 20,
                font: docFont,
                color: "334155",
              }),
            ],
          })
        );
      }
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720, // 0.5 in
              right: 720,
              bottom: 720,
              left: 720,
            },
          },
        },
        children,
      },
    ],
  });

  return await Packer.toBlob(doc);
}
