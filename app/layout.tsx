import type { Metadata } from "next";
import { Playfair_Display, JetBrains_Mono, Crimson_Text } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-bodoni",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-dm-mono",
});

const crimson = Crimson_Text({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-eb-garamond",
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "WHEN — Mortality Prediction Engine",
  description:
    "AI-powered mortality prediction based on behavioral analysis, search pattern modeling, and life2vec deep learning embeddings.",
  openGraph: {
    title: "WHEN — Mortality Prediction Engine",
    description:
      "Discover your predicted timeline through behavioral analysis and deep learning.",
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
      className={`${playfair.variable} ${jetbrains.variable} ${crimson.variable}`}
    >
      <body className="bg-void text-bone antialiased">{children}</body>
    </html>
  );
}
