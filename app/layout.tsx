import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Happify Indonesia - Customize Your Products",
  description: "Design and customize your own products with Happify",
};

import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="bg-[#F5F2ED] antialiased">{children}</body>
    </html>
  );
}
