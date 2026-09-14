import SkipToContent from "@/components/layout/skip-to-content";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";

export default function Home() {
  return (
    <>
      <SkipToContent />
      <Header />

      <main
        id="main-content"
        tabIndex={-1}
        className="min-h-[50vh] px-4 pt-2 md:max-w-[1200px] md:mx-auto md:px-0"
      >
        {/* Hero Section */}

        {/* Navigation Section */}

        {/* Destinations Section */}

        {/* Community Section */}
      </main>

      <Footer />
    </>
  );
}
