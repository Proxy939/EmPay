import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HeroSection from './components/HeroSection';
import FeaturesGrid from './components/FeaturesGrid';
import HowItWorks from './components/HowItWorks';
import PayrollUSP from './components/PayrollUSP';
import Testimonials from './components/Testimonials';
import FinalCTA from './components/FinalCTA';

export default function Page() {
  return (
    <main className="bg-background text-foreground overflow-x-hidden">
      <Header />
      <HeroSection />
      <FeaturesGrid />
      <HowItWorks />
      <PayrollUSP />
      <Testimonials />
      <FinalCTA />
      <Footer />
    </main>
  );
}