'use client';

import React, { useEffect, useRef } from 'react';
import AppImage from '@/components/ui/AppImage';
import { Star } from 'lucide-react';

const testimonials = [
{
  name: 'Marcus Webb',
  role: 'VP of Operations',
  company: 'Bridgeford Logistics',
  size: '320 employees',
  quote: "EmPay cut our payroll processing time from 3 days to 18 minutes. We haven\'t had a single calculation error since switching.",
  avatar: "https://images.unsplash.com/photo-1711921183465-45ed6fc21ea7",
  rating: 5,
  highlight: 'From 3 days → 18 minutes',
  accentColor: 'bg-blue-50 text-blue-700 border-blue-200'
},
{
  name: 'Priya Nair',
  role: 'Head of HR',
  company: 'Clearwave Technologies',
  size: '180 employees',
  quote: "The role-based access is a game-changer. Our managers only see their teams, and payroll runs itself on the 1st of every month.",
  avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_19bd1cbdb-1777710291401.png",
  rating: 5,
  highlight: 'Fully automated monthly payroll',
  accentColor: 'bg-violet-50 text-violet-700 border-violet-200'
},
{
  name: 'James Okafor',
  role: 'Founder & CEO',
  company: 'Stackflow Studio',
  size: '65 employees',
  quote: "As a startup, we needed HRMS that didn't require a dedicated HR team to manage it. EmPay is that — it runs itself.",
  avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_17c9bb2ee-1767346903671.png",
  rating: 5,
  highlight: 'No dedicated HR team needed',
  accentColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
},
{
  name: 'Sarah Mitchell',
  role: 'Finance Director',
  company: 'Meridian Capital Group',
  size: '410 employees',
  quote: "Audit-ready reports at the click of a button. Our compliance team went from dreading quarter-end to having everything ready days early.",
  avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_11f26b5c0-1769525693518.png",
  rating: 5,
  highlight: 'Compliance reports in seconds',
  accentColor: 'bg-amber-50 text-amber-700 border-amber-200'
},
{
  name: 'David Chen',
  role: 'HR Manager',
  company: 'NovaBuild Construction',
  size: '540 employees',
  quote: "Managing attendance across 3 sites used to be chaos. EmPay\'s geo-fencing and real-time tracking solved it completely.",
  avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_13208dda5-1768717524131.png",
  rating: 5,
  highlight: 'Multi-site attendance solved',
  accentColor: 'bg-rose-50 text-rose-700 border-rose-200'
},
{
  name: 'Aisha Thompson',
  role: 'COO',
  company: 'Prestige Healthcare',
  size: '225 employees',
  quote: "Leave management used to eat up 2 hours every Monday. Now it's handled automatically. I don't even think about it anymore.",
  avatar: "https://img.rocket.new/generatedImages/rocket_gen_img_18931905a-1772067527304.png",
  rating: 5,
  highlight: 'Saved 2+ hours every week',
  accentColor: 'bg-teal-50 text-teal-700 border-teal-200'
}];


const allTestimonials = [...testimonials, ...testimonials];

export default function Testimonials() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ctx: import('gsap').Context | undefined;

    const init = async () => {
      const { gsap } = await import('gsap');
      const { ScrollTrigger } = await import('gsap/ScrollTrigger');
      gsap.registerPlugin(ScrollTrigger);

      if (!sectionRef.current) return;

      ctx = gsap.context(() => {
        gsap.fromTo(
          '.testimonial-header',
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top 78%'
            }
          }
        );
      }, sectionRef);
    };

    init();
    return () => ctx?.revert();
  }, []);

  return (
    <section
      id="testimonials"
      ref={sectionRef}
      className="py-20 md:py-32 bg-white overflow-hidden">
      
      <div className="max-w-7xl mx-auto px-4 md:px-8 mb-12">
        <div className="testimonial-header opacity-100 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="section-label mb-3">Testimonials</p>
            <h2
              className="font-bold tracking-tight leading-tight text-foreground"
              style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)' }}>
              
              HR Teams<br />
              <span className="text-accent">Love It.</span>
            </h2>
          </div>
          <div className="max-w-xs">
            <p className="text-muted-foreground text-sm leading-relaxed mb-3">
              Trusted by 500+ companies across logistics, tech, healthcare, and construction.
            </p>
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((s) =>
                <Star key={s} size={14} className="text-amber-400 fill-amber-400" />
                )}
              </div>
              <span className="text-xs text-muted-foreground font-medium">4.9 / 5 avg rating</span>
            </div>
          </div>
        </div>
      </div>

      {/* Auto-scroll track */}
      <div className="relative overflow-hidden">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

        <div className="testimonials-track flex gap-4 w-max py-2">
          {allTestimonials.map((t, i) =>
          <div
            key={`${t.name}-${i}`}
            className="w-[340px] md:w-[380px] flex-shrink-0 card bg-white hover:shadow-lg transition-shadow duration-300 relative overflow-hidden">
            
              <div className="p-6">
                {/* Rating */}
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.rating }).map((_, ri) =>
                <Star key={ri} size={13} className="text-amber-400 fill-amber-400" />
                )}
                </div>

                {/* Highlight badge */}
                <span className={`badge border mb-4 inline-flex ${t.accentColor}`}>
                  {t.highlight}
                </span>

                {/* Quote */}
                <p className="text-foreground/75 text-sm leading-relaxed mb-5">
                  &ldquo;{t.quote}&rdquo;
                </p>

                {/* Author */}
                <div className="flex items-center gap-3 pt-4 border-t border-border">
                  <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border border-border">
                    <AppImage
                    src={t.avatar}
                    alt={`${t.name}, ${t.role} at ${t.company}`}
                    width={40}
                    height={40}
                    className="w-full h-full object-cover" />
                  
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role} · {t.company}</p>
                    <p className="text-xs text-accent font-medium">{t.size}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>);

}