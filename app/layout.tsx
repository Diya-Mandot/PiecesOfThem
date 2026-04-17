import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Playfair_Display, Newsreader, Instrument_Sans, Inter } from "next/font/google";

import "./globals.css";

// Stand-in for Editorial New until the licensed font is added via @font-face
const editorial = Playfair_Display({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-editorial",
  display: "swap",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-newsreader",
  display: "swap",
});

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PiecesOfThem",
  description: "Regulatory evidence ledger for lived-experience fragments.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className={`${editorial.variable} ${newsreader.variable} ${instrumentSans.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
