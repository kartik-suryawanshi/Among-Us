import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export const Header: React.FC = () => {
  const location = useLocation();

  const isExplorerActive = location.pathname === '/' || location.pathname.startsWith('/repositories');
  const isPrivacyActive = location.pathname === '/privacy';
  const isTermsActive = location.pathname === '/terms';

  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <Link to="/" className="flex items-center space-x-2 text-neutral-900 hover:text-neutral-700 transition-colors">
            <svg className="w-5 h-5 text-emerald-600" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="32" height="32" rx="6" fill="#0f172a" />
              <circle cx="11" cy="11" r="3.5" fill="#16a34a" />
              <circle cx="21" cy="21" r="3.5" fill="#ffffff" />
              <path d="M11 14.5V21h6.5" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="font-semibold text-base tracking-tight text-neutral-900">GitStory</span>
          </Link>
          <nav className="flex items-center space-x-4 text-sm">
            <Link
              to="/"
              className={`transition-colors py-1 ${
                isExplorerActive ? 'text-neutral-900 font-medium' : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              Repository Explorer
            </Link>
          </nav>
        </div>

        <div className="flex items-center space-x-5 text-sm text-neutral-500">
          <Link
            to="/privacy"
            className={`transition-colors py-1 ${
              isPrivacyActive ? 'text-neutral-900 font-medium' : 'hover:text-neutral-800'
            }`}
          >
            Privacy Policy
          </Link>
          <Link
            to="/terms"
            className={`transition-colors py-1 ${
              isTermsActive ? 'text-neutral-900 font-medium' : 'hover:text-neutral-800'
            }`}
          >
            Terms and Conditions
          </Link>
        </div>
      </div>
    </header>
  );
};
