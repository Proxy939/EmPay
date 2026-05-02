'use client';

import React, { useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { XCircle, Calculator, Shield, Zap, FileCheck, CheckCircle, DollarSign, Clock } from 'lucide-react';

const floatingBadges = [
  { text: 'No Excel', Icon: XCircle, className: 'bg-white/10 text-white border-white/20', delay: 0 },
  { text: 'Auto Calculations', Icon: Calculator, className: 'bg-accent text-white border-accent', delay: 0.1 },
  { text: 'Error Detection', Icon: Shield, className: 'bg-white/10 text-white border-white/20', delay: 0.2 },
  { text: 'Instant Disburse', Icon: Zap, className: 'bg-white/10 text-white border-white/20', delay: 0.3 },
  { text: 'Tax Compliant', Icon: FileCheck, className: 'bg-white/10 text-white border-white/20', delay: 0.4 },
  { text: '100% Accurate', Icon: CheckCircle, className: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', delay: 0.5 },
];

const stats = [
  { value: '$2.4M', label: 'Processed monthly', Icon: DollarSign, color: 'text-emerald-400' },
  { value: '0', label: 'Payroll errors', Icon: Shield, color: 'text-blue-400' },
  { value: '3 min', label: 'To run payroll', Icon: Clock, color: 'text-violet-400' },
  { value: '99.9%', label: 'Uptime SLA', Icon: Zap, color: 'text-amber-400' },
];

export default function PayrollUSP() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.25 });

  useEffect(() => {
    let ctx: import('gsap').Context | undefined;

    const init = async () => {
      const { gsap } = await import('gsap');
      const { ScrollTrigger } = await import('gsap/ScrollTrigger');
      gsap.registerPlugin(ScrollTrigger);

      if (!sectionRef.current) return;

      ctx = gsap.context(() => {
        gsap.to('.usp-orb-1', {
          yPercent: -20,
          ease: 'none',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
        });
        gsap.to('.usp-orb-2', {
          yPercent: 15,
          ease: 'none',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
        });
      }, sectionRef);
    };

    init();
    return () => ctx?.revert();
  }, []);

  return (
    <section
      id="payroll-usp"
      ref={sectionRef}
      className="py-24 md:py-36 bg-foreground text-white relative overflow-hidden grid-bg-dark"
    >
      {/* Background orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="usp-orb-1 absolute -top-32 -right-32 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-3xl" />
        <div className="usp-orb-2 absolute -bottom-32 -left-32 w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
        {/* Main impact text */}
        <div className="text-center mb-16 md:mb-20">
          <span className="badge bg-accent/20 text-blue-300 border-accent/30 mb-6 inline-flex">
            Payroll Engine
          </span>

          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="font-bold tracking-tight leading-tight text-white mb-6"
            style={{ fontSize: 'clamp(2.8rem, 8vw, 6rem)' }}
          >
            Payroll That<br />
            <span className="text-accent">Thinks Before</span><br />
            You Do.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.25, duration: 0.55 }}
            className="text-white/60 text-lg md:text-xl max-w-xl mx-auto leading-relaxed"
          >
            EmPay&apos;s payroll engine reads your attendance data, applies tax rules, and calculates salaries — before you even open your laptop on payday.
          </motion.p>
        </div>

        {/* Floating badges */}
        <div className="flex flex-wrap justify-center gap-3 mb-16 md:mb-20">
          {floatingBadges.map((badge) => (
            <motion.div
              key={badge.text}
              initial={{ opacity: 0, y: 25, scale: 0.85 }}
              animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
              transition={{ delay: 0.35 + badge.delay, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full border text-sm font-medium cursor-default transition-all hover:scale-105 ${badge.className}`}
            >
              <badge.Icon size={14} />
              {badge.text}
            </motion.div>
          ))}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-14">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.5 + i * 0.1, duration: 0.5 }}
              className="bg-white/5 border border-white/10 rounded-xl p-6 md:p-8 text-center hover:bg-white/8 transition-colors group"
            >
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mx-auto mb-3">
                <stat.Icon size={18} className={stat.color} />
              </div>
              <p className={`font-bold text-3xl md:text-4xl mb-1.5 ${stat.color}`}>{stat.value}</p>
              <p className="text-white/50 text-xs font-medium">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <a
            href="#final-cta"
            className="inline-flex items-center gap-2 px-8 py-4 bg-accent text-white rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors shadow-lg shadow-accent/25"
          >
            Run Your First Payroll Free
            <Zap size={15} />
          </a>
        </div>
      </div>
    </section>
  );
}