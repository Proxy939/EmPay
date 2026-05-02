import React from 'react';
import AppLogo from '@/components/ui/AppLogo';

export default function Footer() {
  const year = 2026;

  return (
    <footer className="border-t border-border bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-12">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          {/* Logo + brand + tagline */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2.5">
              <AppLogo size={26} />
              <span className="font-bold text-base tracking-tight text-foreground">
                Em<span className="text-accent">Pay</span>
              </span>
              <span className="badge badge-accent ml-1">HR TECH</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-[200px] leading-relaxed">
              Smart HRMS for teams that move fast.
            </p>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap gap-x-6 gap-y-2">
            {['Features', 'Pricing', 'Docs', 'Privacy', 'Terms']?.map((item) => (
              <a
                key={item}
                href="#"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-150"
              >
                {item}
              </a>
            ))}
          </nav>

          {/* Copyright + social */}
          <div className="flex flex-col items-start md:items-end gap-3">
            <div className="flex items-center gap-2">
              {[
                { label: 'Twitter', path: 'M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z' },
                { label: 'Globe', path: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 0v20M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z' },
                { label: 'Email', path: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zm16 2l-8 5-8-5' },
              ]?.map((icon) => (
                <a
                  key={icon?.label}
                  href="#"
                  aria-label={icon?.label}
                  className="w-8 h-8 rounded-md border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors duration-150"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={icon?.path} />
                  </svg>
                </a>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              © {year} EmPay. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}