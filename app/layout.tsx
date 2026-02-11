import type { Metadata } from "next";
import { Rajdhani } from "next/font/google";
import "normalize.css";
import "./global.css";

const rajdhani = Rajdhani({
  variable: "--font-rajdhani",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Kiwi dot app",
  description: "Finance data aggregator",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={rajdhani.variable}>{children}</body>
    </html>
  );
}
