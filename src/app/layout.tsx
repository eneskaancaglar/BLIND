import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BLIND",
  description: "Mobil uyumlu BLIND kart oyunu",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0a0a0a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body
        className="min-h-screen bg-neutral-950 text-neutral-100 antialiased"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
