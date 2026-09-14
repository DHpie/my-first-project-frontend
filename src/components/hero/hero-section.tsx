import HeroBackground from "./hero-background";
import SearchForm from "./search-form";

export interface HeroSectionProps {
  /** 背景图的 URL 或静态导入 */
  backgroundImage: string;
  /** 背景图的 alt 文本（无障碍） */
  backgroundAlt?: string;
  /** 品牌主标题文本 */
  headline?: string;
  /** 品牌副标题文本 */
  subtitle?: string;
  /** 搜索输入框占位文本 */
  searchPlaceholder?: string;
}

const DEFAULTS = {
  backgroundAlt: "",
  headline: "Discover China Like a Local",
  subtitle: "Your AI-powered travel companion for exploring China",
  searchPlaceholder: "Search destinations, tips, or ask AI...",
};

export default function HeroSection({
  backgroundImage,
  backgroundAlt = DEFAULTS.backgroundAlt,
  headline = DEFAULTS.headline,
  subtitle = DEFAULTS.subtitle,
  searchPlaceholder = DEFAULTS.searchPlaceholder,
}: HeroSectionProps) {
  return (
    <section
      aria-label="Hero"
      className="relative min-h-[360px] md:min-h-[540px]"
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        <HeroBackground src={backgroundImage} alt={backgroundAlt} />
      </div>

      {/* Content Overlay */}
      <div className="relative z-10 flex flex-col items-center justify-center px-4 py-6 md:py-12 md:max-w-[1200px] md:mx-auto min-h-[360px] md:min-h-[540px]">
        <h1
          className="text-3xl md:text-5xl lg:text-6xl font-bold text-white text-center mb-4"
          style={{
            textShadow: "0 2px 12px rgba(0,0,0,0.4)",
            animation:
              "fade-slide-up 500ms cubic-bezier(0.16, 1, 0.3, 1) both",
          }}
        >
          {headline}
        </h1>
        <p
          className="text-base md:text-lg text-white/95 text-center mb-8 max-w-2xl tracking-wide"
          style={{
            animation:
              "fade-slide-up 500ms cubic-bezier(0.16, 1, 0.3, 1) 150ms both",
          }}
        >
          {subtitle}
        </p>
        <SearchForm />
      </div>
    </section>
  );
}
