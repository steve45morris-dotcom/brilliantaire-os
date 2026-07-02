import type { Metadata } from "next";
import "../styles/globals.css";
import { ThemeProvider } from "../providers/theme-provider";

export const metadata: Metadata = {
  title: "IcyOS Console",
  description: "Autonomous Agentic Orchestration OS Console",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
