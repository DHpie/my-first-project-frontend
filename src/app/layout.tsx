import type { Metadata } from 'next';
import './globals.css';
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import AIWidget from "@/components/ai-widget/ai-widget";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: 'ChinaBuddy',
  description: 'Discover China Like a Local',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body className={cn("bg-background text-foreground", geist.variable)}>
        {children}
        <AIWidget />
      </body>
    </html>
  );
}
