import type { Metadata } from "next";
import { Chewy, DM_Sans } from "next/font/google";
import "./globals.css";

const chewy = Chewy({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-chewy",
  display: "swap",
});


export const metadata: Metadata = {
  title: "Happify Indonesia - Customize Your Products",
  description: "Design and customize your own products with Happify",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${chewy.variable}`}>
      <body
        className="bg-white antialiased"
        style={{ fontFamily: "var(--font-chewy, Chewy)" }}
      >
        {children}
      </body>
    </html>
  );
}