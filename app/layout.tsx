import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { buildMetadata, VIEWPORT } from "@/lib/seo";
import StructuredData from "@/components/structured-data";
import { Toaster } from "@/components/ui/sonner";
import SmoothScroll from "@/components/smooth-scroll";
import SiteBackground from "@/components/site-background";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = buildMetadata();
export const viewport = VIEWPORT;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="relative min-h-full flex flex-col text-foreground">
        <SiteBackground />
        <StructuredData />
        <SmoothScroll>{children}</SmoothScroll>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
