import type { Metadata } from "next";
import { Playfair_Display, DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  display: "swap",
  variable: "--font-playfair",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-dm-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  title: "Remember Palestine \u2014 Live Data & Action Hub",
  description:
    "Live, open-source data on the impact in Palestine. See the numbers, learn the names, and take action now.",
  openGraph: {
    title: "Remember Palestine \u2014 Live Data & Action Hub",
    description:
      "Live, open-source data on the impact in Palestine. See the numbers, learn the names, and take action now.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${dmSans.variable} ${jetbrainsMono.variable}`}
    >
      <body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: "#0a0a0a",
          color: "#e5e5e5",
        }}
      >
        {children}
      </body>
    </html>
  );
}
