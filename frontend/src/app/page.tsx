import { Navbar } from '@/src/components/Navbar';
import { Hero } from '@/src/components/Hero';
import { HowItWorks } from '@/src/components/HowItWorks';
import { IntelligenceSection } from '@/src/components/IntelligenceSection';
import { PartnershipSection } from '@/src/components/PartnershipSection';
import { FinalCta } from '@/src/components/FinalCta';
import { Footer } from '@/src/components/Footer';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white font-sans text-zinc-900 antialiased selection:bg-amber-200 selection:text-zinc-950">
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <IntelligenceSection />
        <PartnershipSection />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
