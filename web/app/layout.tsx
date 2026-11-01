import type { Metadata, Viewport } from "next";
import { Source_Code_Pro } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import LenisProvider from "@/components/providers/lenis-provider";
import ClarityProvider from "@/components/providers/clarity-provider";
import { Analytics } from "@vercel/analytics/next";
import { RealtimeAttendanceListener } from "@/components/realtime/realtime-attendance-listener";

const sourceCodePro = Source_Code_Pro({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-source-code-pro",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  // Add viewport-fit for safe area insets on notched devices
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://www.codebreakersgcek.tech"),
  title: {
    template: "%s | CodeBreakers GCEK",
    default:
      "CodeBreakers - Coding Club | Government College of Engineering Kalahandi",
  },
  description:
    "Join CodeBreakers, the premier coding club at Government College of Engineering Kalahandi (GCEK). Learn programming, participate in hackathons, compete in coding challenges, and build innovative projects with a community of 500+ passionate developers.",
  keywords: [
    "CodeBreakers",
    "CodeBreakers GCEK",
    "Codebreakers GCE Kalahandi",
    "GCEK",
    "GCE Kalahandi",
    "Government College of Engineering Kalahandi",
    "Kalahandi Engineering College",
    "coding club of GCE Kalahandi",
    "coding club GCEK",
    "programming club Kalahandi",
    "GCEK coding club",
    "GCE Kalahandi tech club",
    "hackathon",
    "competitive programming",
    "coding competitions",
    "programming contests",
    "web development",
    "software development",
    "tech community Kalahandi",
    "student developers GCEK",
    "Odisha engineering college",
    "tech events Kalahandi",
    "project collaboration",
    "coding bootcamp",
    "learn programming GCEK",
    "developer community Odisha",
    "tech club Odisha",
    "engineering students Kalahandi",
    "computer science GCEK",
    "IT club Kalahandi",
    "quiz competition",
    "tech workshops",
    "coding events",
    "best coding club Odisha",
  ],
  authors: [{ name: "CodeBreakers GCEK" }],
  creator: "CodeBreakers GCEK",
  publisher: "Government College of Engineering Kalahandi",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/assets/logo.png", sizes: "32x32", type: "image/png" },
      { url: "/assets/logo.png", sizes: "16x16", type: "image/png" },
      { url: "/assets/logo.png", sizes: "192x192", type: "image/png" },
      { url: "/assets/logo.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/assets/logo.png",
    shortcut: "/assets/logo.png",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.codebreakersgcek.tech",
    siteName: "CodeBreakers GCEK",
    title: "CodeBreakers - Premier Coding Club at GCEK",
    description:
      "Join 500+ developers at CodeBreakers, GCEK's leading coding club. Participate in hackathons, competitive programming, and innovative projects. Build your coding skills and network with passionate developers.",
    images: [
      {
        url: "/assets/logo.png",
        width: 1200,
        height: 630,
        alt: "CodeBreakers GCEK Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CodeBreakers - Premier Coding Club at GCEK",
    description:
      "Join 500+ developers at CodeBreakers, GCEK's leading coding club. Hackathons, competitive programming, and innovative projects.",
    images: ["/assets/logo.png"],
    creator: "@codebreakers_gcek",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "google4606fd743fa15671",
  },
  alternates: {
    canonical: "https://www.codebreakersgcek.tech",
  },
  category: "Education",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "CodeBreakers GCEK",
    alternateName: [
      "CodeBreakers",
      "CodeBreakers GCE Kalahandi",
      "Coding Club of GCE Kalahandi",
    ],
    url: "https://www.codebreakersgcek.tech",
    logo: "https://www.codebreakersgcek.tech/assets/logo.png",
    description:
      "Premier coding club at Government College of Engineering Kalahandi (GCEK) with 500+ members, organizing hackathons, coding competitions, and tech events.",
    foundingLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Bhawanipatna",
        addressRegion: "Kalahandi",
        addressCountry: "India",
      },
    },
    parentOrganization: {
      "@type": "EducationalOrganization",
      name: "Government College of Engineering Kalahandi",
    },
    sameAs: [
      "https://www.instagram.com/codebreakers_gcek",
      "https://www.linkedin.com/company/codebreakers-gcek",
    ],
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var mode = localStorage.getItem('app_theme_mode') || 'system';
                  var isDark = mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  if (isDark) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />
      </head>
      <body className={` ${sourceCodePro.variable} antialiased`}>
        <LenisProvider>{children}</LenisProvider>
        <RealtimeAttendanceListener />
        <Toaster position="top-right" richColors closeButton />
        <Analytics />
        <ClarityProvider />
      </body>
    </html>
  );
}
