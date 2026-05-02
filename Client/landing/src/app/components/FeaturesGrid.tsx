'use client';

import React, { useEffect, useRef } from 'react';
import { Lock, Users, Clock, Sun, DollarSign, BarChart2, FileText, Settings, ArrowRight, Zap } from 'lucide-react';

const features = [
  {
    id: 'auth',
    Icon: Lock,
    title: 'Authentication & Role-Based Access',
    desc: 'Granular permissions per role. Admins, managers, and employees each see exactly what they need — nothing more.',
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-700',
    span: '',
    badge: null,
  },
  {
    id: 'employee',
    Icon: Users,
    title: 'Employee Management',
    desc: 'Onboard, update, and offboard employees in seconds. Auto-generate credentials on profile creation.',
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    span: '',
    badge: null,
  },
  {
    id: 'attendance',
    Icon: Clock,
    title: 'Attendance Tracking',
    desc: 'Real-time clock-in/clock-out, geo-fencing support, and automatic overtime calculation.',
    iconBg: 'bg-violet-50',
    iconColor: 'text-violet-600',
    span: '',
    badge: 'Real-time',
  },
  {
    id: 'leave',
    Icon: Sun,
    title: 'Leave Management',
    desc: 'Approval workflows, leave balance tracking, and calendar sync. No more email chains.',
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    span: '',
    badge: null,
  },
  {
    id: 'payroll',
    Icon: DollarSign,
    title: 'Payroll Engine',
    desc: 'Fully automated salary calculation with tax deductions, bonus handling, and one-click disbursement. Zero errors guaranteed.',
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    span: 'lg:col-span-2',
    badge: 'Highlight',
    isPayroll: true,
  },
  {
    id: 'dashboard',
    Icon: BarChart2,
    title: 'Dashboard Analytics',
    desc: 'Live KPIs, workforce trends, and payroll summaries in one unified view.',
    iconBg: 'bg-indigo-50',
    iconColor: 'text-indigo-600',
    span: '',
    badge: null,
  },
  {
    id: 'reports',
    Icon: FileText,
    title: 'Reports',
    desc: 'Generate compliance-ready reports in PDF or CSV with one click. Scheduled delivery included.',
    iconBg: 'bg-rose-50',
    iconColor: 'text-rose-600',
    span: '',
    badge: null,
  },
  {
    id: 'admin',
    Icon: Settings,
    title: 'Admin Permissions',
    desc: 'Multi-level admin control with full audit logs. Know who changed what and when.',
    iconBg: 'bg-teal-50',
    iconColor: 'text-teal-600',
    span: '',
    badge: 'New',
  },
];

export default function FeaturesGrid() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ctx: import('gsap').Context | undefined;

    const init = async () => {
      const { gsap } = await import('gsap');
      const { ScrollTrigger } = await import('gsap/ScrollTrigger');
      gsap.registerPlugin(ScrollTrigger);

      if (!sectionRef.current) return;

      ctx = gsap.context(() => {
        const cards = sectionRef.current!.querySelectorAll('.feature-card');
        gsap.fromTo(
          cards,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.55,
            stagger: 0.06,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: sectionRef.current,
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
    <section
      id="features"
      ref={sectionRef}
      className="py-20 md:py-32 px-4 md:px-8 max-w-7xl mx-auto"
    >
      {/* Section header */}
      <div className="mb-14 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="section-label mb-3">Core Features</p>
          <h2
            className="font-bold tracking-tight leading-tight text-foreground"
            style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)' }}
          >
            Everything HR.<br />
            <span className="text-accent">Nothing Extra.</span>
          </h2>
        </div>
        <div className="max-w-xs">
          <p className="text-muted-foreground leading-relaxed text-sm md:text-base mb-4">
            8 modules, one platform. Built for HR teams that move fast and can&apos;t afford errors.
          </p>
          <div className="flex gap-2">
            <span className="badge badge-default">8 Modules</span>
            <span className="badge badge-secondary">1 Platform</span>
          </div>
        </div>
      </div>

      {/* Bento grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((feat) => (
          <div
            key={feat.id}
            className={`feature-card opacity-100 ${feat.span} card feature-card-hover group cursor-default relative overflow-hidden ${feat.isPayroll ? 'bg-gradient-to-br from-emerald-50 to-teal-50/50 border-emerald-200/60 pulse-ring' : 'bg-white'}`}
          >
            <div className="p-6 md:p-7">
              {/* Badge */}
              {feat.badge && (
                <div className="absolute top-5 right-5">
                  <span className={`badge ${feat.badge === 'Highlight' ? 'badge-success' : feat.badge === 'Real-time' ? 'badge-accent' : 'badge-secondary'}`}>
                    {feat.badge}
                  </span>
                </div>
              )}

              {/* Icon */}
              <div className={`w-11 h-11 rounded-xl ${feat.iconBg} flex items-center justify-center mb-5`}>
                <feat.Icon size={20} className={feat.iconColor} />
              </div>

              {/* Content */}
              <h3 className={`font-semibold mb-2.5 text-foreground ${feat.isPayroll ? 'text-xl md:text-2xl' : 'text-base md:text-lg'}`}>
                {feat.title}
              </h3>
              <p className={`text-sm leading-relaxed text-muted-foreground ${feat.isPayroll ? 'text-base' : ''}`}>
                {feat.desc}
              </p>

              {/* Payroll extra badges */}
              {feat.isPayroll && (
                <div className="flex flex-wrap gap-2 mt-5">
                  {['Auto Calc', 'Tax Ready', 'Instant Pay', 'Zero Errors'].map((badge) => (
                    <span key={badge} className="badge badge-success text-xs">
                      <Zap size={10} className="mr-1" />
                      {badge}
                    </span>
                  ))}
                </div>
              )}

              {/* Hover arrow */}
              <div className="mt-5 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-accent">
                <span className="text-xs font-medium">Learn more</span>
                <ArrowRight size={12} />
              </div>
            </div>

            {/* Bottom accent line on hover */}
            <div className={`absolute bottom-0 left-0 w-0 h-0.5 ${feat.isPayroll ? 'bg-emerald-400' : 'bg-accent'} group-hover:w-full transition-all duration-300`} />
          </div>
        ))}
      </div>
    </section>
  );
}