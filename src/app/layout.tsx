import type { Metadata } from 'next';
import './globals.css';
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import SkipToContent from "@/components/layout/skip-to-content";
import { Toaster } from 'sonner';

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
        <SkipToContent />
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
