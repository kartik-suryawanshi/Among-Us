import React from 'react';
import { FileText, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const TermsPage: React.FC = () => {
  return (
    <div className="py-10 max-w-3xl mx-auto space-y-8">
      <div>
        <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded bg-neutral-100 text-neutral-700 text-xs font-medium mb-3">
          <FileText className="w-3.5 h-3.5 text-neutral-500" />
          <span>GitStory Phase 1 Terms of Service</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
          Terms and Conditions
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Effective date: October 17, 2026. Applicable to GitStory Phase 1.
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-xs text-amber-900 flex items-start space-x-3">
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p>
          Notice: These terms govern the demonstration and prototype use of GitStory Phase 1. Prior to a commercial or production launch, formal legal review is required.
        </p>
      </div>

      <div className="bg-white border border-neutral-200 rounded-lg p-6 sm:p-8 space-y-6 text-sm text-neutral-700 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-semibold text-neutral-900">1. Acceptance of Terms</h2>
          <p>
            By accessing or using GitStory, you agree to comply with these terms. If you do not agree to these terms, you should not use the application.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-neutral-900">2. Scope of Service</h2>
          <p>
            GitStory Phase 1 is a developer utility designed to inspect public repository information and commit history. It does not provide access to private repositories, does not execute code modifications, and does not push changes to GitHub.
          </p>
          <p>
            The service is provided on an "as is" and "as available" basis. Availability may be subject to GitHub API rate limits, network availability, and third-party API changes.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-neutral-900">3. Acceptable Use</h2>
          <p>
            You agree to use GitStory solely for lawful purposes. You must not:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-neutral-600">
            <li>Attempt to probe, bypass, or abuse GitHub API rate limits or backend request filters.</li>
            <li>Use automated scripts to generate excessive request volumes against the service.</li>
            <li>Attempt to reverse-engineer or disrupt server operations.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-neutral-900">4. Intellectual Property and Third-Party Data</h2>
          <p>
            All source code, commit records, and descriptions retrieved via GitStory remain the intellectual property of their respective repository owners and authors, subject to the open-source licenses declared in those repositories.
          </p>
          <p>
            GitStory is an independent project and does not claim ownership of any content retrieved through the GitHub REST API.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-neutral-900">5. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by applicable law, GitStory and its contributors shall not be liable for any indirect, incidental, or consequential damages resulting from the use or inability to use the service.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-neutral-900">6. Modifications to Terms</h2>
          <p>
            These terms may be updated as future phases of GitStory are developed and released.
          </p>
        </section>
      </div>

      <div className="pt-2">
        <Link
          to="/"
          className="text-xs text-neutral-600 hover:text-neutral-900 underline underline-offset-2"
        >
          Return to repository explorer
        </Link>
      </div>
    </div>
  );
};
