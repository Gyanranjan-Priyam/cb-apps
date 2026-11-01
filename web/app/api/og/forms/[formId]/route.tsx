import { ImageResponse } from "next/og";
import { prisma } from "@/lib/db";
import type { FormDefinition } from "@/lib/form-types";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

function extractPlainText(description: string | null): string {
  if (!description) return "";
  try {
    const json = JSON.parse(description);
    function getText(node: Record<string, unknown>): string {
      if (node.text && typeof node.text === "string") return node.text;
      if (Array.isArray(node.content)) {
        return (node.content as Record<string, unknown>[]).map(getText).join(" ");
      }
      return "";
    }
    return getText(json).replace(/\s+/g, " ").trim();
  } catch {
    return description;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ formId: string }> }
) {
  const { formId } = await params;

  const form = await prisma.form.findFirst({
    where: {
      OR: [{ formId }, { id: formId }],
    },
    select: {
      title: true,
      description: true,
      definition: true,
    },
  });

  const title = form?.title || "Feedback & Registration Form";
  const rawDesc = extractPlainText(form?.description || "");
  const description =
    rawDesc ||
    "Fill out this official form published by CodeBreakers GCEK. Your responses will help us improve future examinations and events.";

  const formDef = (form?.definition as unknown as FormDefinition) || null;
  const firstSection = formDef?.sections?.[0];
  const firstField = firstSection?.fields?.[0];
  const previewQuestion =
    firstField?.label ||
    firstSection?.title ||
    "CO-ORDINATION & MANAGEMENT";

  const themeColor = "#673AB7"; // Google Forms classic purple

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          backgroundColor: "#EDE7F6",
          padding: "36px 40px 0 40px",
          fontFamily: "system-ui, -apple-system, sans-serif",
          position: "relative",
        }}
      >
        {/* Main Form Mockup Card (Google Forms Style) */}
        <div
          style={{
            width: "940px",
            backgroundColor: "#FFFFFF",
            borderRadius: "16px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            border: "1px solid #DADCE0",
          }}
        >
          {/* Top colored accent bar */}
          <div
            style={{
              width: "100%",
              height: "14px",
              backgroundColor: themeColor,
            }}
          />

          {/* Card Body */}
          <div
            style={{
              padding: "28px 36px 24px 36px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Form Title */}
            <div
              style={{
                fontSize: 30,
                fontWeight: 800,
                color: "#1C1B1F",
                textTransform: "uppercase",
                letterSpacing: "-0.01em",
                lineHeight: 1.25,
                marginBottom: 12,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {title}
            </div>

            {/* Description Text */}
            <div
              style={{
                fontSize: 15,
                color: "#49454F",
                lineHeight: 1.45,
                marginBottom: 16,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {description}
            </div>

            {/* Required Indicator */}
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "#D93025",
                display: "flex",
                alignItems: "center",
              }}
            >
              * Indicates required question
            </div>
          </div>
        </div>

        {/* Second Question Mockup Card (Peek below) */}
        <div
          style={{
            width: "940px",
            marginTop: "16px",
            backgroundColor: "#FFFFFF",
            borderRadius: "14px 14px 0 0",
            border: "1px solid #DADCE0",
            borderBottom: "none",
            boxShadow: "0 4px 16px rgba(0,0,0,0.05)",
            padding: "20px 36px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Question Label */}
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "#202124",
              textTransform: "uppercase",
              letterSpacing: "0.02em",
              marginBottom: 14,
            }}
          >
            {previewQuestion}
          </div>

          {/* Rating Scale / Options Preview */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              maxWidth: "400px",
              padding: "4px 8px",
            }}
          >
            {[1, 2, 3, 4, 5].map((num) => (
              <div
                key={num}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span style={{ fontSize: 13, color: "#5F6368", fontWeight: 600 }}>{num}</span>
                <div
                  style={{
                    width: "16px",
                    height: "16px",
                    borderRadius: "50%",
                    border: "2px solid #9AA0A6",
                    backgroundColor: "#FFFFFF",
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Floating Domain / Brand Pill */}
        <div
          style={{
            position: "absolute",
            bottom: "16px",
            right: "40px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            backgroundColor: "rgba(30, 41, 59, 0.92)",
            color: "#FFFFFF",
            padding: "8px 16px",
            borderRadius: "999px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: "0.02em",
          }}
        >
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: "#10B981",
            }}
          />
          <span>forms.cbgcek.dev</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
      },
    }
  );
}
