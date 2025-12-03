import "./globals.css";
import { ReactNode } from "react";

export const metadata = {
  title: "달개비",
  description: "달개비 - 현장 사진 업로드 및 관리 앱",
  applicationName: "달개비",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "달개비",
  },
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
  themeColor: "#9333ea",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#9333ea" />
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
