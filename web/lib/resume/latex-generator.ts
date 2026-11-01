import type { ResumeData } from "./types";

function escapeLatex(text: string): string {
  if (!text) return "";
  return text
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/%/g, "\\%")
    .replace(/\$/g, "\\$")
    .replace(/_/g, "\\_")
    .replace(/&/g, "\\&")
    .replace(/#/g, "\\#")
    .replace(/{/g, "\\{")
    .replace(/}/g, "\\}")
    .replace(/~/g, "\\textasciitilde{}")
    .replace(/\^/g, "\\textasciicircum{}");
}

export function generateLatexFromResumeData(data: ResumeData): string {
  const { personalInfo, experience, education, projects, skills, certifications, achievements, customSections, theme } = data;

  const contactItems: string[] = [];
  if (personalInfo.phone) contactItems.push(escapeLatex(personalInfo.phone));
  if (personalInfo.email) {
    contactItems.push(`\\href{mailto:${personalInfo.email}}{\\underline{${escapeLatex(personalInfo.email)}}}`);
  }
  if (personalInfo.linkedin) {
    const url = personalInfo.linkedin.startsWith("http") ? personalInfo.linkedin : `https://${personalInfo.linkedin}`;
    contactItems.push(`\\href{${url}}{\\underline{${escapeLatex(personalInfo.linkedin.replace(/^https?:\/\/(www\.)?/, ""))}}}`);
  }
  if (personalInfo.github) {
    const url = personalInfo.github.startsWith("http") ? personalInfo.github : `https://${personalInfo.github}`;
    contactItems.push(`\\href{${url}}{\\underline{${escapeLatex(personalInfo.github.replace(/^https?:\/\/(www\.)?/, ""))}}}`);
  }
  if (personalInfo.portfolio) {
    const url = personalInfo.portfolio.startsWith("http") ? personalInfo.portfolio : `https://${personalInfo.portfolio}`;
    contactItems.push(`\\href{${url}}{\\underline{${escapeLatex(personalInfo.portfolio.replace(/^https?:\/\/(www\.)?/, ""))}}}`);
  }

  let latex = `%-------------------------
% Auto-generated Resume in LaTeX
% CodeBreakers Resume Engine
%------------------------

\\documentclass[letterpaper,11pt]{article}

\\usepackage{latexsym}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage{marvosym}
\\usepackage[usenames,dvipsnames]{color}
\\usepackage{verbatim}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage{fancyhdr}
\\usepackage[english]{babel}
\\usepackage{tabularx}
\\input{glyphtounicode}

% Adjust margins
\\addtolength{\\oddsidemargin}{-0.5in}
\\addtolength{\\evensidemargin}{-0.5in}
\\addtolength{\\textwidth}{1in}
\\addtolength{\\topmargin}{-.5in}
\\addtolength{\\textheight}{1.0in}

\\urlstyle{same}

\\raggedbottom
\\raggedright
\\setlength{\\tabcolsep}{0in}

% Sections formatting
\\titleformat{\\section}{
  \\vspace{-4pt}\\scshape\\raggedright\\large
}{}{0em}{}[\\color{black}\\titlerule \\vspace{-5pt}]

\\pdfgentounicode=1

% Custom commands
\\newcommand{\\resumeItem}[1]{
  \\item\\small{
    {#1 \\vspace{-2pt}}
  }
}

\\newcommand{\\resumeSubheading}[4]{
  \\vspace{-2pt}\\item
    \\begin{tabular*}{0.97\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}
      \\textbf{#1} & #2 \\\\
      \\textit{\\small#3} & \\textit{\\small #4} \\\\
    \\end{tabular*}\\vspace{-7pt}
}

\\newcommand{\\resumeProjectHeading}[2]{
    \\item
    \\begin{tabular*}{0.97\\textwidth}{l@{\\extracolsep{\\fill}}r}
      \\small#1 & #2 \\\\
    \\end{tabular*}\\vspace{-7pt}
}

\\newcommand{\\resumeSubHeadingListStart}{\\begin{itemize}[leftmargin=0.15in, label={}]}
\\newcommand{\\resumeSubHeadingListEnd}{\\end{itemize}}
\\newcommand{\\resumeItemListStart}{\\begin{itemize}}
\\newcommand{\\resumeItemListEnd}{\\end{itemize}\\vspace{-5pt}}

\\begin{document}

%----------HEADING----------
\\begin{center}
    \\textbf{\\Huge \\scshape ${escapeLatex(personalInfo.fullName || "Your Name")}} \\\\ \\vspace{1pt}
    \\small ${contactItems.join(" $|$ \n    ")}
\\end{center}
`;

  // Summary Section
  if (personalInfo.summary && personalInfo.summary.trim()) {
    latex += `
%-----------SUMMARY-----------
\\section{Professional Summary}
\\begin{itemize}[leftmargin=0.15in, label={}]
    \\small{\\item{
     ${escapeLatex(personalInfo.summary)}
    }}
\\end{itemize}
`;
  }

  // Iterate sections in theme order or standard order
  const order = theme.sectionOrder || ["education", "experience", "projects", "skills", "certifications", "achievements"];

  for (const sec of order) {
    if (sec === "education" && education.length > 0) {
      latex += `
%-----------EDUCATION-----------
\\section{Education}
  \\resumeSubHeadingListStart
`;
      for (const edu of education) {
        const degreeField = edu.degree && edu.fieldOfStudy ? `${edu.degree} in ${edu.fieldOfStudy}` : edu.degree || edu.fieldOfStudy;
        const gpaStr = edu.gpa ? `; GPA: ${edu.gpa}` : "";
        const dateRange = edu.startDate ? `${edu.startDate} -- ${edu.current ? "Present" : edu.endDate || "Present"}` : "";

        latex += `    \\resumeSubheading
      {${escapeLatex(edu.institution)}}{${escapeLatex(edu.location)}}
      {${escapeLatex(degreeField + gpaStr)}}{${escapeLatex(dateRange)}}
`;
        if (edu.bullets && edu.bullets.length > 0) {
          latex += `      \\resumeItemListStart\n`;
          for (const b of edu.bullets) {
            if (b.trim()) {
              latex += `        \\resumeItem{${escapeLatex(b)}}\n`;
            }
          }
          latex += `      \\resumeItemListEnd\n`;
        }
      }
      latex += `  \\resumeSubHeadingListEnd\n`;
    }

    if (sec === "experience" && experience.length > 0) {
      latex += `
%-----------EXPERIENCE-----------
\\section{Experience}
  \\resumeSubHeadingListStart
`;
      for (const exp of experience) {
        const dateRange = exp.startDate ? `${exp.startDate} -- ${exp.current ? "Present" : exp.endDate || "Present"}` : "";

        latex += `    \\resumeSubheading
      {${escapeLatex(exp.role)}}{${escapeLatex(dateRange)}}
      {${escapeLatex(exp.company)}}{${escapeLatex(exp.location)}}
`;
        if (exp.bullets && exp.bullets.length > 0) {
          latex += `      \\resumeItemListStart\n`;
          for (const b of exp.bullets) {
            if (b.trim()) {
              latex += `        \\resumeItem{${escapeLatex(b)}}\n`;
            }
          }
          latex += `      \\resumeItemListEnd\n`;
        }
      }
      latex += `  \\resumeSubHeadingListEnd\n`;
    }

    if (sec === "projects" && projects.length > 0) {
      latex += `
%-----------PROJECTS-----------
\\section{Projects}
    \\resumeSubHeadingListStart
`;
      for (const proj of projects) {
        const techStr = proj.techStack && proj.techStack.length > 0 ? ` $|$ \\emph{${escapeLatex(proj.techStack.join(", "))}}` : "";
        latex += `      \\resumeProjectHeading
          {\\textbf{${escapeLatex(proj.name)}}${techStr}}{${escapeLatex(proj.date || "")}}
`;
        if (proj.bullets && proj.bullets.length > 0) {
          latex += `          \\resumeItemListStart\n`;
          for (const b of proj.bullets) {
            if (b.trim()) {
              latex += `            \\resumeItem{${escapeLatex(b)}}\n`;
            }
          }
          latex += `          \\resumeItemListEnd\n`;
        }
      }
      latex += `    \\resumeSubHeadingListEnd\n`;
    }

    if (sec === "skills" && skills.length > 0) {
      latex += `
%-----------TECHNICAL SKILLS-----------
\\section{Technical Skills}
 \\begin{itemize}[leftmargin=0.15in, label={}]
    \\small{\\item{
`;
      for (let i = 0; i < skills.length; i++) {
        const cat = skills[i];
        const isLast = i === skills.length - 1;
        latex += `     \\textbf{${escapeLatex(cat.name)}}{: ${escapeLatex(cat.skills.join(", "))}}${isLast ? "" : " \\\\"}\n`;
      }
      latex += `    }}
 \\end{itemize}
`;
    }

    if (sec === "certifications" && certifications.length > 0) {
      latex += `
%-----------CERTIFICATIONS-----------
\\section{Certifications}
 \\begin{itemize}[leftmargin=0.15in, label={}]
    \\small{\\item{
`;
      for (let i = 0; i < certifications.length; i++) {
        const cert = certifications[i];
        const isLast = i === certifications.length - 1;
        const details = [cert.issuer, cert.issueDate].filter(Boolean).join(" -- ");
        latex += `     \\textbf{${escapeLatex(cert.name)}}{: ${escapeLatex(details)}}${isLast ? "" : " \\\\"}\n`;
      }
      latex += `    }}
 \\end{itemize}
`;
    }

    if (sec === "achievements" && achievements.length > 0) {
      latex += `
%-----------ACHIEVEMENTS-----------
\\section{Honors \\& Awards}
 \\begin{itemize}[leftmargin=0.15in, label={}]
    \\small{\\item{
`;
      for (let i = 0; i < achievements.length; i++) {
        const ach = achievements[i];
        const isLast = i === achievements.length - 1;
        const meta = [ach.organization, ach.date].filter(Boolean).join(", ");
        const desc = ach.description ? ` -- ${ach.description}` : "";
        latex += `     \\textbf{${escapeLatex(ach.title)}}{${meta ? ` (${escapeLatex(meta)})` : ""}${escapeLatex(desc)}}${isLast ? "" : " \\\\"}\n`;
      }
      latex += `    }}
 \\end{itemize}
`;
    }
  }

  // Custom sections
  if (customSections && customSections.length > 0) {
    for (const cSec of customSections) {
      latex += `
%-----------${cSec.title.toUpperCase()}-----------
\\section{${escapeLatex(cSec.title)}}
  \\resumeSubHeadingListStart
`;
      for (const item of cSec.items) {
        latex += `    \\resumeSubheading
      {${escapeLatex(item.title)}}{${escapeLatex(item.date || "")}}
      {${escapeLatex(item.subtitle || "")}}{}
`;
        if (item.bullets && item.bullets.length > 0) {
          latex += `      \\resumeItemListStart\n`;
          for (const b of item.bullets) {
            if (b.trim()) {
              latex += `        \\resumeItem{${escapeLatex(b)}}\n`;
            }
          }
          latex += `      \\resumeItemListEnd\n`;
        }
      }
      latex += `  \\resumeSubHeadingListEnd\n`;
    }
  }

  latex += `
\\end{document}
`;

  return latex;
}
