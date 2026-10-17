import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Header } from './components/Header';
import { HomePage } from './pages/HomePage';
import { RepositoryPage } from './pages/RepositoryPage';
import { CommitPage } from './pages/CommitPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { TermsPage } from './pages/TermsPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-[#faf9f6] text-neutral-900 font-sans">
        <Header />

        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/repositories/:owner/:repo" element={<RepositoryPage />} />
            <Route path="/repositories/:owner/:repo/commits/:sha" element={<CommitPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route
              path="*"
              element={
                <div className="py-16 text-center space-y-4">
                  <h1 className="text-xl font-bold text-neutral-900">Page Not Found</h1>
                  <p className="text-sm text-neutral-500">The requested page does not exist.</p>
                  <Link
                    to="/"
                    className="inline-block px-4 py-2 text-xs font-medium text-white bg-neutral-900 rounded hover:bg-neutral-800"
                  >
                    Go to Repository Explorer
                  </Link>
                </div>
              }
            />
          </Routes>
        </main>

        <footer className="border-t border-neutral-200 bg-white py-6 mt-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-neutral-800">GitStory</span>
              <span>•</span>
              <span>Phase 1 Repository Explorer</span>
            </div>

            <div className="flex items-center space-x-4">
              <Link to="/" className="hover:text-neutral-800 transition-colors">
                Explorer
              </Link>
              <Link to="/privacy" className="hover:text-neutral-800 transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="hover:text-neutral-800 transition-colors">
                Terms and Conditions
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
};

export default App;
