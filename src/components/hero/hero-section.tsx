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
      className="relative min-h-[300px] md:min-h-[500px] bg-[#1a1a2e]"
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        <HeroBackground src={backgroundImage} alt={backgroundAlt} />
      </div>

      {/* Content Overlay */}
      <div className="relative z-10 flex flex-col items-center justify-center px-4 py-6 md:py-12 md:max-w-[1200px] md:mx-auto min-h-[300px] md:min-h-[500px]">
        <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white text-center mb-4">
          {headline}
        </h1>
        <p className="text-base md:text-lg text-white/90 text-center mb-8 max-w-2xl">
          {subtitle}
        </p>
        <SearchForm />
      </div>
    </section>
  );
}
