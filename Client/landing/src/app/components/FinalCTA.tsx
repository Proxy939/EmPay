'use client';

import React, { useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Zap, Shield, MessageCircle, Play, CreditCard, RotateCcw, Lock, Users } from 'lucide-react';

const techBadges = [
  'Node.js', 'Express', 'PostgreSQL', 'Prisma ORM', 'JWT Auth', 'TypeScript',
  'Redis', 'REST API', 'Docker', 'AWS S3',
  'Node.js', 'Express', 'PostgreSQL', 'Prisma ORM', 'JWT Auth', 'TypeScript',
  'Redis', 'REST API', 'Docker', 'AWS S3',
];

const whyItems = [
  {
    icon: Zap,
    title: 'Setup in 15 minutes',
    desc: "Import your employee CSV and you\'re live. No IT team required.",
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    borderColor: 'hover:border-amber-200',
  },
  {
    icon: Shield,
    title: 'Bank-grade security',
    desc: 'SOC 2 Type II, AES-256 encryption, and full audit logs.',
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    borderColor: 'hover:border-blue-200',
  },
  {
    icon: RotateCcw,
    title: 'Scales with you',
    desc: 'From 10 to 10,000 employees — same pricing model, same performance.',
    iconBg: 'bg-violet-50',
    iconColor: 'text-violet-600',
    borderColor: 'hover:border-violet-200',
  },
  {
    icon: MessageCircle,
    title: '24/7 support',
    desc: 'Real humans, not bots. Average response: under 4 minutes.',
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    borderColor: 'hover:border-emerald-200',
  },
];

export default function FinalCTA() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.2 });
  const ctaInView = useInView(ctaRef, { once: true, amount: 0.2 });

  useEffect(() => {
    let ctx: import('gsap').Context | undefined;

    const init = async () => {
      const { gsap } = await import('gsap');
      const { ScrollTrigger } = await import('gsap/ScrollTrigger');
      gsap.registerPlugin(ScrollTrigger);

      if (!sectionRef.current) return;

      ctx = gsap.context(() => {
        gsap.fromTo(
          '.why-item',
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.5,
            stagger: 0.09,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: '.why-grid',
              start: 'top 78%',
            },
          }
        );
      }, sectionRef);
    };

    init();
    return () => ctx?.revert();
  }, []);

  return (
    <>
      {/* WHY EMPAY */}
      <section
        id="why-empay"
        ref={sectionRef}
        className="py-20 md:py-32 px-4 md:px-8 max-w-7xl mx-auto"
      >
        <div className="mb-12">
          <p className="section-label mb-3">Why EmPay</p>
          <h2
            className="font-bold tracking-tight leading-tight text-foreground"
            style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)' }}
          >
            Built Different.<br />
            <span className="text-accent">Works Better.</span>
          </h2>
        </div>

        <div className="why-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {whyItems.map((item) => (
            <div
              key={item.title}
              className={`why-item opacity-100 card feature-card-hover group overflow-hidden bg-white ${item.borderColor}`}
            >
              <div className="p-6">
                <div className={`w-11 h-11 rounded-xl ${item.iconBg} flex items-center justify-center mb-5`}>
                  <item.icon size={20} className={item.iconColor} />
                </div>
                <h3 className="font-semibold text-base mb-2 text-foreground">{item.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* TECH STACK */}
      <section className="py-12 md:py-16 bg-muted/40 border-y border-border overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 md:px-8 mb-7 flex items-center justify-between">
          <p className="section-label">Tech Stack</p>
          <span className="text-xs text-muted-foreground hidden md:block">Powered by modern infrastructure</span>
        </div>
        <div className="relative overflow-hidden">
          <div className="tech-track flex gap-3 w-max">
            {techBadges.map((badge, i) => (
              <div
                key={`${badge}-${i}`}
                className="flex-shrink-0 badge badge-secondary px-4 py-2 text-sm font-medium cursor-default hover:bg-white transition-colors"
              >
                {badge}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section
        id="final-cta"
        ref={ctaRef}
        className="py-24 md:py-36 bg-foreground relative overflow-hidden grid-bg-dark"
      >
        {/* Background orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <div className="drift-shape absolute top-0 right-0 w-[400px] h-[400px] bg-accent/10 rounded-full blur-3xl" />
          <div className="drift-shape absolute bottom-0 left-0 w-[300px] h-[300px] bg-violet-600/10 rounded-full blur-3xl" style={{ animationDelay: '3s' }} />
        </div>

        <div className="max-w-3xl mx-auto px-4 md:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={ctaInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="badge bg-white/10 text-white/80 border-white/20 mb-7 inline-flex">
              Get Started Free
            </span>

            <h2
              className="font-bold tracking-tight leading-tight text-white mb-6"
              style={{ fontSize: 'clamp(2.8rem, 8vw, 5.5rem)' }}
            >
              Start Managing<br />
              Your Workforce<br />
              <span className="text-accent">Smarter Today.</span>
            </h2>

            <p className="text-white/60 text-lg md:text-xl max-w-xl mx-auto leading-relaxed mb-10">
              Join 500+ companies automating HR with EmPay. No setup fees. No credit card required. Cancel anytime.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
              <a
                href="https://em-pay-kohl.vercel.app/login"
                className="inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-white text-foreground rounded-lg font-semibold text-sm hover:bg-white/90 transition-colors shadow-xl"
              >
                <Zap size={16} className="text-accent" />
                Start Free 14-Day Trial
              </a>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-white/10 text-white rounded-lg font-semibold text-sm hover:bg-white/15 transition-colors border border-white/20"
              >
                <Play size={15} />
                Watch Demo
              </a>
            </div>

            {/* Micro trust */}
            <div className="flex flex-wrap justify-center gap-5 md:gap-8">
              {[
                { Icon: CreditCard, text: 'No credit card' },
                { Icon: RotateCcw, text: 'Cancel anytime' },
                { Icon: Lock, text: 'SOC 2 secured' },
                { Icon: Users, text: '500+ companies' },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-2">
                  <item.Icon size={13} className="text-white/40" />
                  <span className="text-white/50 text-xs font-medium">{item.text}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}