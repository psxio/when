import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Remember Palestine — Live Data & Action Hub",
  description:
    "Live, open-source data on the impact in Palestine. See the numbers, learn the names, and take action now.",
  openGraph: {
    title: "Remember Palestine — Live Data & Action Hub",
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
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=DM+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
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
