import "./globals.css";
import { ReactNode } from "react";

export const metadata = {
  title: "공정한 Works 현장 관리",
  description: "공정한 Works 현장 관리 앱",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-512.png",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#f0f0f0",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#f0f0f0" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>

      <body className="m-0 overflow-x-hidden bg-gray-50">
        <div className="max-w-[480px] mx-auto w-full min-h-screen bg-white shadow-lg">
          {children}
        </div>
      </body>
    </html>
  );
}
