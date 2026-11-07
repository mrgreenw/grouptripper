import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GroupTripper · Good trips start together",
  description: "Create your own group trip, invite friends, vote on dates and places, and try Shirt Studio.",
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
