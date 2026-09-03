import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Website Watchdog — Monitoring for agencies",
  description:
    "One dashboard that watches every client site you manage — downtime, expiring SSL, broken links, and slipping performance.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=Sora:wght@600;700;800&display=swap"
        />
      </head>
      <body className="font-sans">{children}</body>
    </html>
  );
}
