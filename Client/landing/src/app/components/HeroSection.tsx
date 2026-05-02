'use client';

import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Play, CheckCircle, Shield, Zap, Users, DollarSign, Clock, BarChart2 } from 'lucide-react';

const floatingCards = [
  {
    icon: Users,
    label: 'Active Employees',
    value: '1,247',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    delay: 0,
  },
  {
    icon: DollarSign,
    label: 'Payroll Processed',
    value: '$2.4M',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    delay: 0.15,
  },
  {
    icon: Clock,
    label: 'Attendance Rate',
    value: '98.3%',
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    delay: 0.3,
  },
  {
    icon: BarChart2,
    label: 'Reports Generated',
    value: '340',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    delay: 0.45,
  },
];

const staggerContainer = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

const popIn = {
  hidden: { opacity: 0, scale: 0.85 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: [0.34, 1.56, 0.64, 1] },
  },
};

export default function HeroSection() {
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ctx: import('gsap').Context | undefined;

    const initGSAP = async () => {
      const mod = await import('gsap');
      const gsap = mod.gsap;
      if (bgRef.current && gsap) {
        ctx = gsap.context(() => {
          gsap.to('.hero-orb-1', {
            x: 30,
            y: -20,
            duration: 8,
            ease: 'sine.inOut',
            yoyo: true,
            repeat: -1,
          });
          gsap.to('.hero-orb-2', {
            x: -20,
            y: 25,
            duration: 10,
            ease: 'sine.inOut',
            yoyo: true,
            repeat: -1,
            delay: 1.5,
          });
        }, bgRef);
      }
    };

    initGSAP();
    return () => ctx?.revert();
  }, []);

  return (
    <section
      className="relative min-h-screen flex flex-col justify-center overflow-hidden bg-white pt-16 grid-bg"
      ref={bgRef}
    >
      {/* Soft gradient orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="hero-orb-1 absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-blue-100/60 to-violet-100/40 rounded-full blur-3xl opacity-70" />
        <div className="hero-orb-2 absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-amber-50/80 to-emerald-50/60 rounded-full blur-3xl opacity-60" />
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 w-full relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center py-16 md:py-24">
          {/* Left: Text */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="flex flex-col gap-6"
          >
            {/* Badge */}
            <motion.div variants={fadeUp} className="flex flex-wrap gap-2">
              <span className="badge badge-accent">✦ New in 2026</span>
              <span className="badge badge-secondary">HRMS Platform</span>
              <span className="badge badge-success">v2.0 Launched</span>
            </motion.div>

            {/* Main headline */}
            <motion.h1
              variants={staggerContainer}
              className="font-bold leading-[1.05] tracking-tight text-foreground"
              style={{ fontSize: 'clamp(2.8rem, 7vw, 5.5rem)' }}
            >
              {[
                { text: 'All-in-One', accent: false },
                { text: 'HRMS That', accent: false },
                { text: 'Actually Works.', accent: true },
              ].map((item, i) => (
                <motion.span
                  key={i}
                  variants={fadeUp}
                  className={`block ${item.accent ? 'text-accent' : ''}`}
                >
                  {item.text}
                </motion.span>
              ))}
            </motion.h1>

            {/* Subtext */}
            <motion.p
              variants={fadeUp}
              className="text-lg text-muted-foreground max-w-md leading-relaxed"
            >
              From attendance to payroll — fully automated, role-based, and scalable for teams of any size.
            </motion.p>

            {/* CTAs */}
            <motion.div variants={staggerContainer} className="flex flex-wrap gap-3">
              <motion.a
                variants={popIn}
                href="http://localhost:5173/login"
                className="btn btn-primary px-6 py-3 text-sm font-semibold inline-flex items-center gap-2 shadow-md hover:shadow-lg transition-shadow"
              >
                Get Started Free
                <ArrowRight size={15} />
              </motion.a>
              <motion.a
                variants={popIn}
                href="#how-it-works"
                className="btn btn-outline px-6 py-3 text-sm font-semibold flex items-center gap-2"
              >
                <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center">
                  <Play size={12} className="text-accent ml-0.5" />
                </div>
                Watch Demo
              </motion.a>
            </motion.div>

            {/* Trust indicators */}
            <motion.div variants={fadeUp} className="flex flex-wrap gap-5 pt-1">
              {[
                { icon: CheckCircle, text: 'No setup fees' },
                { icon: Shield, text: 'SOC 2 compliant' },
                { icon: Zap, text: '14-day free trial' },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-2">
                  <item.icon size={14} className="text-emerald-500" />
                  <span className="text-xs text-muted-foreground font-medium">{item.text}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right: Dashboard mockup */}
          <motion.div
            initial={{ opacity: 0, x: 50, y: 10 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative mt-8 lg:mt-0"
          >
            {/* Main dashboard card */}
            <div className="card shadow-2xl overflow-hidden border border-border/60">
              {/* Browser bar */}
              <div className="bg-muted border-b border-border px-4 py-3 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                </div>
                <div className="ml-3 flex-1 bg-white border border-border rounded-md h-6 px-3 flex items-center">
                  <span className="text-xs text-muted-foreground font-mono">app.empay.io/dashboard</span>
                </div>
              </div>

              {/* Dashboard content */}
              <div className="p-5 bg-white">
                {/* Header row */}
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="font-semibold text-foreground text-sm">Dashboard Overview</p>
                    <p className="text-xs text-muted-foreground">May 2026</p>
                  </div>
                  <span className="badge badge-success text-xs">● Live</span>
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  {floatingCards.map((card, i) => (
                    <motion.div
                      key={card.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + card.delay, duration: 0.5 }}
                      className="card p-3.5 border border-border/60"
                    >
                      <div className="flex items-center gap-2.5 mb-2">
                        <div className={`w-7 h-7 rounded-lg ${card.bg} flex items-center justify-center`}>
                          <card.icon size={14} className={card.color} />
                        </div>
                        <span className="text-xs text-muted-foreground">{card.label}</span>
                      </div>
                      <p className={`font-bold text-lg ${card.color}`}>{card.value}</p>
                    </motion.div>
                  ))}
                </div>

                {/* Mini chart bar */}
                <div className="card p-3.5 border border-border/60">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-foreground">Payroll Trend</span>
                    <span className="badge badge-success text-xs">+12.4%</span>
                  </div>
                  <div className="flex items-end gap-1.5 h-12">
                    {[40, 65, 45, 80, 60, 90, 75, 95, 70, 100, 85, 92].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-sm bg-accent/20 hover:bg-accent/40 transition-colors"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Floating notification card */}
            <motion.div
              initial={{ opacity: 0, x: 30, y: -10 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ delay: 0.9, duration: 0.5 }}
              className="absolute -top-4 -right-4 card shadow-xl p-3 flex items-center gap-2.5 bg-white border border-border/60 float-anim"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle size={16} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">Payroll Processed</p>
                <p className="text-xs text-muted-foreground">$2.4M disbursed</p>
              </div>
            </motion.div>

            {/* Floating badge */}
            <motion.div
              initial={{ opacity: 0, x: -20, y: 20 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ delay: 1.1, duration: 0.5 }}
              className="absolute -bottom-4 -left-4 card shadow-xl p-3 flex items-center gap-2.5 bg-white border border-border/60"
            >
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Users size={14} className="text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">1,247 Employees</p>
                <p className="text-xs text-muted-foreground">Across 3 locations</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}