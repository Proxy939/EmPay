'use client';

import React, { useState, useEffect } from 'react';
import AppLogo from '@/components/ui/AppLogo';
import { Menu, X, ChevronRight } from 'lucide-react';

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Payroll', href: '#payroll-usp' },
  { label: 'Testimonials', href: '#testimonials' },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      const close = () => setMobileOpen(false);
      window.addEventListener('scroll', close, { once: true });
    }
  }, [mobileOpen]);

  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/90 backdrop-blur-md border-b border-border shadow-sm'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <AppLogo
            size={30}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          />
          <span className="font-bold text-lg tracking-tight text-foreground">
            Em<span className="text-accent">Pay</span>
          </span>
          <span className="badge badge-accent ml-1 hidden sm:inline-flex">HR TECH</span>
        </div>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks?.map((link) => (
            <a
              key={link?.label}
              href={link?.href}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors duration-150"
            >
              {link?.label}
            </a>
          ))}
        </nav>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-2.5">
          <a
            href="#how-it-works"
            className="btn btn-outline text-sm"
          >
            Live Demo
          </a>
          <a
            href="http://localhost:5173/login"
            className="btn btn-primary text-sm inline-flex items-center gap-1.5"
          >
            Get Started
            <ChevronRight size={14} />
          </a>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-md hover:bg-muted transition-colors"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden mobile-menu-open bg-white border-b border-border px-4 pb-5 pt-2 flex flex-col gap-1 shadow-lg">
          {navLinks?.map((link) => (
            <a
              key={link?.label}
              href={link?.href}
              onClick={() => setMobileOpen(false)}
              className="px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
            >
              {link?.label}
            </a>
          ))}
          <div className="flex flex-col gap-2 pt-3 border-t border-border mt-2">
            <a href="#how-it-works" className="btn btn-outline text-sm text-center">
              Live Demo
            </a>
            <a href="#final-cta" className="btn btn-primary text-sm text-center">
              Get Started
            </a>
          </div>
        </div>
      )}
    </header>
  );
}