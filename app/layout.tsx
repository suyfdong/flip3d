import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import { JsonLd } from "@/components/JsonLd";
import { websiteSchema } from "@/lib/schema";
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
    "Free online 3D file converter, viewer, repair and embed tools. Convert STL, OBJ, GLB, 3MF, PLY, STEP, IGES, FBX, DAE in your browser. Bambu 3MF ↔ Prusa 3MF, G-code simulator, STL repair. No signup, no upload, 100% local.",
  keywords: [
    "3d file converter",
    "online 3d converter",
    "free 3d converter",
    "stl viewer",
    "online stl viewer",
    "stl to obj",
    "stl to glb",
    "stl to 3mf",
    "obj to stl",
    "glb to stl",
    "3mf to stl",
    "step to stl",
    "step to obj",
    "fbx to stl",
    "iges to stl",
    "ply to stl",
    "dae to obj",
    "bambu 3mf to prusa",
    "prusa 3mf to bambu",
    "gcode simulator",
    "gcode viewer",
    "stl repair",
    "mesh repair",
    "3d viewer iframe embed",
    "no signup 3d tools",
    "browser 3d converter",
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
      "Convert STL, OBJ, GLB, 3MF, PLY, STEP, IGES, FBX, DAE in your browser. Bambu↔Prusa 3MF, G-code preview, STL repair. No signup, 100% local.",
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
        <JsonLd data={websiteSchema()} />
        {children}
      </body>
      <GoogleAnalytics gaId="G-CPN5F9F74P" />
    </html>
  );
}
