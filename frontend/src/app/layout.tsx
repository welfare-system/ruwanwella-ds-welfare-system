import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "සුබසාධක අරමුදල් කළමනාකරණ පද්ධතිය (Staff Welfare Management)",
  description: "ශ්‍රී ලංකා රුපියල් (Rs.) මූල්‍ය ඒකකය සහිත පූර්ණ සුබසාධක අරමුදල් කළමනාකරණ පද්ධතිය.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="si">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <div className="ambient-bg" aria-hidden="true">
          <div className="orb-1" />
          <div className="orb-2" />
        </div>
        {children}
      </body>
    </html>
  );
}
