import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GroupTripper · Good trips start together",
  description: "A configurable group-trip planner. Try the fictional guest tour, customize your own trip, and get the free template.",
icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
