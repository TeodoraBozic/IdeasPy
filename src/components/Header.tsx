'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b border-gray-300 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="text-xl font-bold text-blue-500">
              StartupIdeas
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-4">
            <Link 
              href="/ideas" 
              className="text-gray-700 hover:text-blue-500 px-3 py-2 rounded-lg text-sm font-medium"
            >
              Ideje
            </Link>
            <Link 
              href="/users" 
              className="text-gray-700 hover:text-blue-500 px-3 py-2 rounded-lg text-sm font-medium"
            >
              Useri
            </Link>
            <Link 
              href="/profile" 
              className="text-gray-700 hover:text-blue-500 px-3 py-2 rounded-lg text-sm font-medium"
            >
              Moj Profil
            </Link>
          </nav>

          {/* Login Button */}
          <div className="hidden md:flex">
            <Link
              href="/login"
              className="btn-primary"
            >
              Login
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-blue-500 p-2"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white border border-gray-300 rounded-lg mt-2">
              <Link
                href="/ideas"
                className="text-gray-700 hover:text-blue-500 block px-3 py-2 rounded-lg text-sm font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Ideje
              </Link>
              <Link
                href="/users"
                className="text-gray-700 hover:text-blue-500 block px-3 py-2 rounded-lg text-sm font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Useri
              </Link>
              <Link
                href="/profile"
                className="text-gray-700 hover:text-blue-500 block px-3 py-2 rounded-lg text-sm font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Moj Profil
              </Link>
              <Link
                href="/login"
                className="btn-primary block text-center mt-4"
                onClick={() => setIsMenuOpen(false)}
              >
                Login
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}