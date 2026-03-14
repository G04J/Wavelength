import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wavelength — Find your people nearby",
  description:
    "Anonymous compatibility between people in the same physical space. Mutual interest only.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
