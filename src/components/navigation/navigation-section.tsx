import Link from "next/link";
import { Users, Map, Bot, Globe, type LucideIcon } from "lucide-react";

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

export default function NavigationSection() {
  return (
    <section aria-label="Platform navigation" className="py-8 md:py-12">
      <div className="flex flex-col space-y-4 md:flex md:flex-row md:gap-6">
        {CARDS.map((card) => (
          <Link
            key={card.id}
            href={card.href}
            className="flex-1 rounded-xl border border-border bg-card p-6 text-card-foreground shadow-sm transition-all duration-200 hover:shadow-lg hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.98] outline-none"
          >
            <CardIcon icon={card.icon} />
            <h3 className="text-lg font-semibold mb-2">{card.title}</h3>
            <p className="text-sm text-muted-foreground">{card.description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
