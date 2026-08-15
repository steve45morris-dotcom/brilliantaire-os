import type { Metadata } from "next";
import { Figtree, Unbounded, Space_Mono, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

const unbounded = Unbounded({
  variable: "--font-unbounded",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "ICYFLAMZE // THE BRILLIANTAIRE OS",
  description: "Brilliance is the capital. Systems are the engine. Culture is the output. Impact is the goal.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", figtree.variable, unbounded.variable, spaceMono.variable, "font-sans", geist.variable)}
    >
      <body className="min-h-full flex flex-col bg-ink-bg text-bone-white">
        {children}
      </body>
    </html>
  );
}
