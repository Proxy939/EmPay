'use client';

import React, { useEffect, useRef, useState } from 'react';
import { UserPlus, Clock, Sun, DollarSign, FileText, Zap, CheckCircle } from 'lucide-react';

const steps = [
  {
    num: '01',
    title: 'Create Employee',
    subtitle: 'Auto-generate credentials',
    desc: 'Add an employee profile — EmPay instantly generates secure login credentials and sends a welcome email. Role permissions are auto-applied based on department.',
    Icon: UserPlus,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    accentColor: 'bg-blue-600',
    detail: 'Credentials generated in < 2 seconds',
  },
  {
    num: '02',
    title: 'Track Attendance',
    subtitle: 'Real-time clock-in/out',
    desc: 'Employees clock in via web, mobile, or biometric integration. Overtime, late arrivals, and absences are flagged automatically with no manual intervention.',
    Icon: Clock,
    iconBg: 'bg-violet-50',
    iconColor: 'text-violet-600',
    accentColor: 'bg-violet-600',
    detail: '98.3% attendance accuracy',
  },
  {
    num: '03',
    title: 'Manage Leaves',
    subtitle: 'Approval in one click',
    desc: 'Employees submit leave requests. Managers approve or reject with one tap. Balances update instantly and payroll deductions are pre-calculated.',
    Icon: Sun,
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    accentColor: 'bg-amber-500',
    detail: 'Average approval time: 4 minutes',
  },
  {
    num: '04',
    title: 'Run Payroll',
    subtitle: 'Fully automated',
    desc: 'EmPay pulls attendance, leave, and overtime data to compute exact salaries. Tax deductions, bonuses, and reimbursements applied automatically. One-click disburse.',
    Icon: DollarSign,
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    accentColor: 'bg-emerald-600',
    detail: '$2.4M processed monthly',
  },
  {
    num: '05',
    title: 'Generate Reports',
    subtitle: 'Compliance-ready output',
    desc: 'Export payroll summaries, attendance logs, and audit trails in PDF or CSV. Schedule automated monthly delivery to stakeholders.',
    Icon: FileText,
    iconBg: 'bg-rose-50',
    iconColor: 'text-rose-600',
    accentColor: 'bg-rose-500',
    detail: '340+ reports this month',
  },
];

export default function HowItWorks() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    let ctx: import('gsap').Context | undefined;

    const init = async () => {
      const { gsap } = await import('gsap');
      const { ScrollTrigger } = await import('gsap/ScrollTrigger');
      gsap.registerPlugin(ScrollTrigger);

      if (!sectionRef.current) return;

      ctx = gsap.context(() => {
        const stepEls = sectionRef.current!.querySelectorAll('.how-step');

        stepEls.forEach((el, i) => {
          ScrollTrigger.create({
            trigger: el,
            start: 'top 60%',
            onEnter: () => setActiveStep(i),
            onEnterBack: () => setActiveStep(i),
          });
        });

        if (progressRef.current) {
          gsap.fromTo(
            progressRef.current,
            { height: '0%' },
            {
              height: '100%',
              ease: 'none',
              scrollTrigger: {
                trigger: sectionRef.current,
                start: 'top 60%',
                end: 'bottom 60%',
                scrub: true,
              },
            }
          );
        }

        gsap.fromTo(
          stepEls,
          { opacity: 0, x: -30 },
          {
            opacity: 1,
            x: 0,
            duration: 0.6,
            stagger: 0.12,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top 72%',
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
      id="how-it-works"
      ref={sectionRef}
      className="py-20 md:py-32 bg-muted/30 grid-bg"
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* Header */}
        <div className="mb-14 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="section-label mb-3">How It Works</p>
            <h2
              className="font-bold tracking-tight leading-tight text-foreground"
              style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)' }}
            >
              5 Steps.<br />
              <span className="text-accent">Zero Complexity.</span>
            </h2>
          </div>
          <p className="text-muted-foreground max-w-xs text-sm leading-relaxed">
            From onboarding to payroll disbursement — every step automated, every action logged.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-10 lg:gap-16">
          {/* Progress column */}
          <div className="hidden lg:flex lg:col-span-1 flex-col items-center pt-6">
            <div className="relative w-px bg-border flex-1">
              <div
                ref={progressRef}
                className="absolute top-0 left-0 w-full bg-accent"
                style={{ height: '0%' }}
              />
            </div>
          </div>

          {/* Steps */}
          <div className="lg:col-span-7 space-y-4">
            {steps.map((step, i) => (
              <div
                key={step.num}
                className={`how-step opacity-100 card transition-all duration-300 overflow-hidden ${
                  activeStep === i
                    ? 'shadow-lg border-accent/30 bg-white'
                    : 'shadow-sm bg-white/80'
                }`}
              >
                {/* Active indicator */}
                <div className={`h-0.5 w-full transition-all duration-300 ${activeStep === i ? step.accentColor : 'bg-transparent'}`} />

                <div className="p-5 md:p-6">
                  <div className="flex items-start gap-4">
                    <div className={`flex-shrink-0 w-12 h-12 rounded-xl ${step.iconBg} flex items-center justify-center`}>
                      <step.Icon size={20} className={step.iconColor} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1.5">
                        <span className="font-mono text-2xl font-bold text-foreground/15">
                          {step.num}
                        </span>
                        <h3 className="font-semibold text-lg text-foreground">
                          {step.title}
                        </h3>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2.5 font-medium uppercase tracking-wide">
                        {step.subtitle}
                      </p>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {step.desc}
                      </p>
                      <div className="mt-3.5 inline-flex items-center gap-1.5">
                        <span className={`badge ${activeStep === i ? 'badge-accent' : 'badge-secondary'} text-xs`}>
                          <Zap size={9} className="mr-1" />
                          {step.detail}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Sticky summary panel */}
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-24">
              <div className="card shadow-lg p-6 bg-white">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-semibold text-foreground">Progress</h3>
                  <span className="badge badge-default">{activeStep + 1}/5</span>
                </div>
                <div className="space-y-2 mb-6">
                  {steps.map((step, i) => (
                    <div
                      key={step.num}
                      className={`flex items-center gap-3 p-2.5 rounded-lg transition-all duration-200 ${
                        activeStep === i
                          ? 'bg-accent/8 border border-accent/20'
                          : i < activeStep
                          ? 'bg-muted/50' :'bg-transparent'
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 transition-all ${
                        i < activeStep
                          ? 'bg-emerald-100 text-emerald-600'
                          : activeStep === i
                          ? 'bg-accent text-white' :'bg-muted text-muted-foreground'
                      }`}>
                        {i < activeStep ? <CheckCircle size={14} /> : <span>{i + 1}</span>}
                      </div>
                      <span className={`text-xs font-medium ${
                        activeStep === i ? 'text-foreground' : i < activeStep ? 'text-muted-foreground' : 'text-muted-foreground/60'
                      }`}>
                        {step.title}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Progress bar */}
                <div className="mb-5 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full transition-all duration-500"
                    style={{ width: `${((activeStep + 1) / steps.length) * 100}%` }}
                  />
                </div>

                <a
                  href="#final-cta"
                  className="btn btn-primary w-full text-center text-sm font-semibold justify-center shadow-md"
                >
                  Start Free Trial
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}