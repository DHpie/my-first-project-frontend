import SkipToContent from "@/components/layout/skip-to-content";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import HeroSection from "@/components/hero/hero-section";
import NavigationSection from "@/components/navigation/navigation-section";
import DestinationsSection from "@/components/destinations/destinations-section";
import CommunitySection from "@/components/community/community-section";
import SectionDivider from "@/components/ui/section-divider";

export default function Home() {
  return (
    <>
      <SkipToContent />
      <Header />

      <main
        id="main-content"
        tabIndex={-1}
        className="min-h-[50vh] px-4 pt-2 md:max-w-[1200px] lg:max-w-[1280px] md:mx-auto md:px-0"
      >
        <HeroSection backgroundImage="/hero.png" />

        <NavigationSection />

        <SectionDivider />

        <DestinationsSection />

        <SectionDivider />

        <CommunitySection />
      </main>

      <Footer />
    </>
  );
}
