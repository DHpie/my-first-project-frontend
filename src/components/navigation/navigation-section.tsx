"use client";

import Link from "next/link";
import { Users, Map, Bot, Globe, type LucideIcon } from "lucide-react";
import { useScrollReveal } from "@/lib/use-scroll-reveal";

interface NavigationCard {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
}

const CARDS: NavigationCard[] = [
  {
    id: "community",
    icon: Users,
    title: "Travel Community",
    description:
      "Share experiences and discover hidden gems from fellow travelers",
    href: "/community",
  },
  {
    id: "attractions",
    icon: Map,
    title: "Attraction Guides",
    description:
      "Curated guides for China's top destinations and hidden treasures",
    href: "/attractions",
  },
  {
    id: "ai-assistant",
    icon: Bot,
    title: "AI Assistant",
    description: "Plan your trip with personalized AI-powered recommendations",
    href: "/ai-assistant",
  },
];

function CardIcon({ icon: Icon }: { icon: LucideIcon }) {
  try {
    return <Icon className="h-8 w-8 text-primary mb-3" />;
  } catch {
    return <Globe className="h-8 w-8 text-primary mb-3" />;
  }
}

function NavCard({ card, index }: { card: NavigationCard; index: number }) {
  const ref = useScrollReveal<HTMLAnchorElement>();

  return (
    <Link
      ref={ref}
      href={card.href}
      className="group relative flex-1 overflow-hidden rounded-xl border border-border bg-card p-6 text-card-foreground shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.98] outline-none"
      style={{
        animationDelay: `${index * 100}ms`,
      }}
    >
      <CardIcon icon={card.icon} />
      <h3 className="text-lg font-semibold mb-2">{card.title}</h3>
      <p className="text-sm text-muted-foreground">{card.description}</p>

      {/* Bottom gradient accent bar */}
      <div
        className="absolute inset-x-0 bottom-0 h-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        style={{ background: "var(--gradient-card-accent)" }}
      />
    </Link>
  );
}

export default function NavigationSection() {
  return (
    <section aria-label="Platform navigation" className="py-8 md:py-12">
      <div className="flex flex-col space-y-4 md:flex md:flex-row md:gap-6">
        {CARDS.map((card, index) => (
          <NavCard key={card.id} card={card} index={index} />
        ))}
      </div>
    </section>
  );
}
