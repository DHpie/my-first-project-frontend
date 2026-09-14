import Link from "next/link";

const footerLinks = [
  { label: "About", href: "/coming-soon" },
  { label: "Contact", href: "/coming-soon" },
  { label: "Privacy Policy", href: "/coming-soon" },
];

export default function Footer() {
  return (
    <footer className="border-t border-border bg-background py-8">
      <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-4 px-4 md:flex-row md:justify-between md:px-0">
        <p className="text-sm text-muted-foreground">
          &copy; 2026 ChinaBuddy. All rights reserved.
        </p>

        <nav className="flex flex-col gap-2 md:flex-row md:gap-6">
          {footerLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
