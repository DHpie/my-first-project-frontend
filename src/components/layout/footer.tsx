import Link from "next/link";

const footerLinks = [
  { label: "About", href: "/coming-soon" },
  { label: "Contact", href: "/coming-soon" },
  { label: "Privacy Policy", href: "/coming-soon" },
];

export default function Footer() {
  return (
    <footer className="bg-[#1A1A1A] py-8">
      {/* Brand gradient top line */}
      <div className="h-0.5 bg-gradient-to-r from-[#C41E3A] to-[#D4A017]" />

      <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-4 px-4 pt-6 md:flex-row md:justify-between md:px-0">
        <p className="text-sm text-white/60">
          &copy; 2026 <span className="text-[#D4A017]">ChinaBuddy</span>. All
          rights reserved.
        </p>

        <nav className="flex flex-col gap-2 md:flex-row md:gap-6">
          {footerLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-sm text-white/70 transition-colors hover:text-[#D4A017]"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
