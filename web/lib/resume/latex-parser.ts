export interface ContactLink {
  text: string;
  url?: string;
  icon?: "email" | "linkedin" | "github" | "globe" | "phone" | "link";
}

export interface ProjectLink {
  text: string;
  url: string;
  icon?: string;
}

export interface ParsedItem {
  title?: string;
  subtitle?: string;
  date?: string;
  location?: string;
  row1Left?: string;
  row1Right?: string;
  row2Left?: string;
  row2Right?: string;
  bullets: string[];
  links?: ProjectLink[];
  isSkillsSection?: boolean;
}

export interface ParsedLatexResume {
  name: string;
  contactLine: string[];
  contactLinks: ContactLink[];
  sections: Array<{
    title: string;
    items: ParsedItem[];
    isKeyValSection?: boolean;
  }>;
}

/**
 * Extract an argument enclosed in balanced braces {...}
 */
export function extractBracedArg(str: string, fromIndex: number): { content: string; endIndex: number } | null {
  const openIndex = str.indexOf("{", fromIndex);
  if (openIndex === -1) return null;
  let depth = 0;
  for (let i = openIndex; i < str.length; i++) {
    if (str[i] === "{" && (i === 0 || str[i - 1] !== "\\")) {
      depth++;
    } else if (str[i] === "}" && (i === 0 || str[i - 1] !== "\\")) {
      depth--;
      if (depth === 0) {
        return {
          content: str.substring(openIndex + 1, i),
          endIndex: i + 1,
        };
      }
    }
  }
  return null;
}

export function cleanLatexText(text: string): string {
  if (!text) return "";
  let res = text;

  // Replace \href{url}{text} with text
  res = res.replace(/\\href\{[^}]*\}\{([^}]+)\}/g, "$1");
  // Replace FontAwesome icon commands \faEnvelope, \faGithub, etc.
  res = res.replace(/\\fa[A-Za-z0-9]+\\?\s*/g, "");
  // Replace text styling macros
  res = res.replace(/\\textbf\{([^}]+)\}/g, "$1");
  res = res.replace(/\\textit\{([^}]+)\}/g, "$1");
  res = res.replace(/\\emph\{([^}]+)\}/g, "$1");
  res = res.replace(/\\underline\{([^}]+)\}/g, "$1");
  res = res.replace(/\\scshape/g, "");
  res = res.replace(/\\Huge/g, "");
  res = res.replace(/\\large/g, "");
  res = res.replace(/\\small/g, "");
  res = res.replace(/\\tiny/g, "");
  // Escaped characters
  res = res.replace(/\\%/g, "%");
  res = res.replace(/\\\$/g, "$");
  res = res.replace(/\\&/g, "&");
  res = res.replace(/\\#/g, "#");
  res = res.replace(/\\_/g, "_");
  res = res.replace(/\\\{/g, "{");
  res = res.replace(/\\\}/g, "}");
  // Dashes
  res = res.replace(/---/g, "—");
  res = res.replace(/--/g, "–");
  // Spacing & formatting
  res = res.replace(/\\vspace\{[^}]+\}/g, "");
  res = res.replace(/\\\\/g, " ");
  res = res.replace(/\$\|\$/g, " | ");
  res = res.replace(/\\/g, "");
  res = res.replace(/\s+/g, " ");

  return res.trim();
}

export function parseLatexResume(latex: string): ParsedLatexResume {
  const result: ParsedLatexResume = {
    name: "",
    contactLine: [],
    contactLinks: [],
    sections: [],
  };

  if (!latex || typeof latex !== "string") {
    return result;
  }

  // 1. Extract Name (from center header or \textbf{\Huge ...})
  const nameMatch =
    latex.match(/\\textbf\{\\Huge\s*(?:\\scshape)?\s*([^}]+)\}/) ||
    latex.match(/\\textbf\{([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\}/) ||
    latex.match(/\\begin\{center\}[\s\S]*?\\textbf\{([^}]+)\}/);

  if (nameMatch) {
    result.name = cleanLatexText(nameMatch[1]);
  }

  // 2. Extract Contact Info & Links
  const centerMatch = latex.match(/\\begin\{center\}([\s\S]*?)\\end\{center\}/);
  if (centerMatch) {
    const centerContent = centerMatch[1];
    const lines = centerContent.split(/\\\\/);
    if (lines.length > 1) {
      const contactRaw = lines.slice(1).join(" ");
      const rawParts = contactRaw.split(/\$?\s*\|\s*\$?|\$\|\$/);

      rawParts.forEach((part) => {
        const hrefMatch = part.match(/\\href\{([^}]+)\}\{([^}]+)\}/);
        let url: string | undefined;
        let text = cleanLatexText(part);
        let icon: ContactLink["icon"] = "link";

        if (hrefMatch) {
          url = hrefMatch[1].trim();
          text = cleanLatexText(hrefMatch[2]);
        }

        const lowerUrl = (url || "").toLowerCase();
        const lowerPart = part.toLowerCase();

        if (lowerUrl.startsWith("mailto:") || lowerPart.includes("envelope") || text.includes("@")) {
          icon = "email";
          if (!url && text.includes("@")) url = `mailto:${text}`;
        } else if (lowerUrl.includes("linkedin.com") || lowerPart.includes("linkedin")) {
          icon = "linkedin";
          if (!url) url = `https://${text}`;
        } else if (lowerUrl.includes("github.com") || lowerPart.includes("github")) {
          icon = "github";
          if (!url) url = `https://${text}`;
        } else if (lowerUrl.includes("http") || lowerPart.includes("globe") || text.includes(".tech") || text.includes(".com") || text.includes(".dev") || text.includes(".me") || text.includes(".org")) {
          icon = "globe";
          if (!url) url = `https://${text}`;
        } else if (/\+?\d[\d\s-]{7,}/.test(text)) {
          icon = "phone";
          if (!url) url = `tel:${text.replace(/\s+/g, "")}`;
        }

        if (text.length > 0 && !text.toLowerCase().includes("textbf")) {
          result.contactLine.push(text);
          result.contactLinks.push({ text, url, icon });
        }
      });
    }
  }

  // 3. Extract Sections (\section{...})
  const sectionSplits = latex.split(/\\section\{([^}]+)\}/);

  for (let s = 1; s < sectionSplits.length; s += 2) {
    const sectionTitle = cleanLatexText(sectionSplits[s]);
    const sectionBody = sectionSplits[s + 1] || "";

    const parsedSection: ParsedLatexResume["sections"][0] = {
      title: sectionTitle,
      items: [],
      isKeyValSection: false,
    };

    let pos = 0;
    let hasFoundComplexItem = false;

    // Search for \resumeSubheading or \resumeProjectHeading using balanced braces
    while (pos < sectionBody.length) {
      const subIdx = sectionBody.indexOf("\\resumeSubheading", pos);
      const projIdx = sectionBody.indexOf("\\resumeProjectHeading", pos);

      if (subIdx === -1 && projIdx === -1) break;

      if (subIdx !== -1 && (projIdx === -1 || subIdx < projIdx)) {
        // Parse \resumeSubheading{arg1}{arg2}{arg3}{arg4}
        hasFoundComplexItem = true;
        let cursor = subIdx + "\\resumeSubheading".length;
        const arg1 = extractBracedArg(sectionBody, cursor);
        const arg2 = arg1 ? extractBracedArg(sectionBody, arg1.endIndex) : null;
        const arg3 = arg2 ? extractBracedArg(sectionBody, arg2.endIndex) : null;
        const arg4 = arg3 ? extractBracedArg(sectionBody, arg3.endIndex) : null;

        if (arg1 && arg2 && arg3 && arg4) {
          const r1Left = cleanLatexText(arg1.content);
          const r1Right = cleanLatexText(arg2.content);
          const r2Left = cleanLatexText(arg3.content);
          const r2Right = cleanLatexText(arg4.content);

          // Find following bullets up to next subheading/projectHeading/section
          const nextSub = sectionBody.indexOf("\\resumeSubheading", arg4.endIndex);
          const nextProj = sectionBody.indexOf("\\resumeProjectHeading", arg4.endIndex);
          const nextEnd = sectionBody.indexOf("\\resumeSubHeadingListEnd", arg4.endIndex);

          let bulletLimit = sectionBody.length;
          [nextSub, nextProj, nextEnd].forEach((idx) => {
            if (idx !== -1 && idx < bulletLimit) bulletLimit = idx;
          });

          const bulletChunk = sectionBody.substring(arg4.endIndex, bulletLimit);
          const bullets = extractBullets(bulletChunk);

          parsedSection.items.push({
            title: r1Left,
            location: r1Right,
            subtitle: r2Left,
            date: r2Right,
            row1Left: r1Left,
            row1Right: r1Right,
            row2Left: r2Left,
            row2Right: r2Right,
            bullets,
          });

          pos = bulletLimit;
        } else {
          pos = subIdx + 1;
        }
      } else if (projIdx !== -1) {
        // Parse \resumeProjectHeading{arg1}{arg2}
        hasFoundComplexItem = true;
        let cursor = projIdx + "\\resumeProjectHeading".length;
        const arg1 = extractBracedArg(sectionBody, cursor);
        const arg2 = arg1 ? extractBracedArg(sectionBody, arg1.endIndex) : null;

        if (arg1 && arg2) {
          const rawHeading = arg1.content;
          const date = cleanLatexText(arg2.content);

          // Extract project links e.g. \href{url}{\faExternalLinkAlt\ Demo}
          const links: ProjectLink[] = [];
          const hrefRegex = /\\href\{([^}]+)\}\{([^}]+)\}/g;
          let hMatch: RegExpExecArray | null;
          while ((hMatch = hrefRegex.exec(rawHeading)) !== null) {
            const url = hMatch[1].trim();
            const linkText = cleanLatexText(hMatch[2]);
            const lower = (hMatch[2] + url).toLowerCase();
            let icon = "link";
            if (lower.includes("github") || lower.includes("code")) icon = "github";
            else if (lower.includes("demo") || lower.includes("external") || lower.includes("apk")) icon = "external";
            links.push({ text: linkText, url, icon });
          }

          // Split heading by pipe to get Name and Tech Stack
          const pipeParts = rawHeading
            .split(/\$?\s*\|\s*\$?|\$\|\$/)
            .map((p) => cleanLatexText(p))
            .filter(Boolean);

          const title = pipeParts[0] || cleanLatexText(rawHeading);
          const techStackParts = pipeParts.slice(1).filter((p) => !links.some((l) => l.text === p));
          const techStack = techStackParts.join(" | ");

          // Find following bullets
          const nextSub = sectionBody.indexOf("\\resumeSubheading", arg2.endIndex);
          const nextProj = sectionBody.indexOf("\\resumeProjectHeading", arg2.endIndex);
          const nextEnd = sectionBody.indexOf("\\resumeSubHeadingListEnd", arg2.endIndex);

          let bulletLimit = sectionBody.length;
          [nextSub, nextProj, nextEnd].forEach((idx) => {
            if (idx !== -1 && idx < bulletLimit) bulletLimit = idx;
          });

          const bulletChunk = sectionBody.substring(arg2.endIndex, bulletLimit);
          const bullets = extractBullets(bulletChunk);

          parsedSection.items.push({
            title,
            subtitle: techStack,
            date,
            row1Left: title,
            row1Right: date,
            row2Left: techStack,
            bullets,
            links,
          });

          pos = bulletLimit;
        } else {
          pos = projIdx + 1;
        }
      }
    }

    // Pattern C: Technical Skills Key-Value list (\textbf{Category}{: items})
    if (!hasFoundComplexItem) {
      const skillRegex = /\\textbf\{([^}]+)\}\s*\{?[:\s]*([^\\}\n\r]+)\}?/g;
      let skillMatch: RegExpExecArray | null;
      const bullets: string[] = [];

      while ((skillMatch = skillRegex.exec(sectionBody)) !== null) {
        const category = cleanLatexText(skillMatch[1]);
        const items = cleanLatexText(skillMatch[2]);
        if (category && items && items.length > 1) {
          bullets.push(`${category}: ${items}`);
        }
      }

      if (bullets.length > 0) {
        parsedSection.isKeyValSection = true;
        parsedSection.items.push({
          bullets,
          isSkillsSection: true,
        });
        hasFoundComplexItem = true;
      }
    }

    // Pattern D: Standalone \resumeItem or \item under section (Achievements, Certifications, etc.)
    if (!hasFoundComplexItem) {
      const bullets = extractBullets(sectionBody);
      if (bullets.length > 0) {
        parsedSection.items.push({
          bullets,
        });
      }
    }

    if (parsedSection.items.length > 0) {
      result.sections.push(parsedSection);
    }
  }

  return result;
}

function extractBullets(chunk: string): string[] {
  const bullets: string[] = [];
  let pos = 0;
  while (pos < chunk.length) {
    const itemIdx = chunk.indexOf("\\resumeItem", pos);
    if (itemIdx === -1) break;
    const arg = extractBracedArg(chunk, itemIdx + "\\resumeItem".length);
    if (arg) {
      const text = cleanLatexText(arg.content);
      if (text && text.length > 2) {
        bullets.push(text);
      }
      pos = arg.endIndex;
    } else {
      pos = itemIdx + 1;
    }
  }

  // Fallback for standard \item
  if (bullets.length === 0) {
    const itemRegex = /\\item\s+([^\n\\]+)/g;
    let match: RegExpExecArray | null;
    while ((match = itemRegex.exec(chunk)) !== null) {
      const text = cleanLatexText(match[1]);
      if (text && text.length > 2) {
        bullets.push(text);
      }
    }
  }

  return bullets;
}
