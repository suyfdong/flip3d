import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://flip3d.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Flip3D — Free 3D File Converter, Viewer & Repair Tools",
    template: "%s | Flip3D",
  },
  description:
    "Free online 3D file converter, viewer and repair tools. Convert STL, OBJ, GLB, 3MF, STEP, FBX in your browser. No signup. No upload. 100% local processing.",
  keywords: [
    "3d file converter",
    "stl viewer",
    "step to stl",
    "3mf to stl",
    "glb to obj",
    "free online 3d tools",
    "no signup",
    "bambu 3mf to prusa",
    "gcode simulator",
    "stl repair",
  ],
  authors: [{ name: "Flip3D" }],
  creator: "Flip3D",
  publisher: "Flip3D",
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Flip3D",
    title: "Flip3D — Free 3D File Converter, Viewer & Repair Tools",
    description:
      "Convert STL, OBJ, GLB, 3MF, STEP, FBX in your browser. No signup. No upload. 100% local.",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Flip3D — Free 3D File Converter & Viewer",
    description:
      "Convert, view and repair 3D files in your browser. No signup. 100% local.",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: SITE_URL,
  },
  verification: {
    google: "N5M6GjYvuUsnWd8Va7IBAXa80lNJgRTvNtuo4MILJAE",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
        {children}
      </body>
      <GoogleAnalytics gaId="G-CPN5F9F74P" />
    </html>
  );
}
