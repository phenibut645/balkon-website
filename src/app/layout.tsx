import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Balkon Dashboard",
  description: "Discord bot dashboard for economy, streamers and OBS control.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
