import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { HeroSection } from '@/components/home/HeroSection';
import { HowItWorks } from '@/components/home/HowItWorks';
import { FeaturedHospitals } from '@/components/home/FeaturedHospitals';
import { WhyChooseUs } from '@/components/home/WhyChooseUs';
import { ForHospitals } from '@/components/home/ForHospitals';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        <HowItWorks />
        <FeaturedHospitals />
        <WhyChooseUs />
        <ForHospitals />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
