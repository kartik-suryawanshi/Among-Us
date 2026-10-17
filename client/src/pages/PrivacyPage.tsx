import React from 'react';
import { Shield, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="py-10 max-w-3xl mx-auto space-y-8">
      <div>
        <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded bg-neutral-100 text-neutral-700 text-xs font-medium mb-3">
          <Shield className="w-3.5 h-3.5 text-neutral-500" />
          <span>GitStory Phase 1 Privacy Statement</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
          Privacy Policy
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Effective date: October 17, 2026. Last updated for GitStory Phase 1.
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-xs text-amber-900 flex items-start space-x-3">
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p>
          Notice: This policy specifically describes the data practices of GitStory Phase 1. It is provided for hackathon review and operational transparency. Before a production public launch, formal legal counsel review is required.
        </p>
      </div>

      <div className="bg-white border border-neutral-200 rounded-lg p-6 sm:p-8 space-y-6 text-sm text-neutral-700 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-semibold text-neutral-900">1. Nature of the Service</h2>
          <p>
            GitStory is an independent repository exploration tool. It is not affiliated with, endorsed by, or sponsored by GitHub, Inc.
          </p>
          <p>
            The Phase 1 release operates exclusively in a read-only capacity. GitStory queries publicly available repository data provided through the official GitHub REST API on behalf of the user.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-neutral-900">2. Information We Do Not Collect</h2>
          <p>
            To maintain strict data minimization during Phase 1:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-neutral-600">
            <li>No user accounts: GitStory does not offer or require user registration or logins.</li>
            <li>No credentials: We never ask users to provide GitHub passwords, OAuth access tokens, or personal access tokens.</li>
            <li>No cookies or trackers: Phase 1 does not use analytics beacons, tracking pixels, advertising identifiers, or persistent cookies.</li>
            <li>No database storage: We do not maintain a database (such as PostgreSQL or Redis) to store user search histories or cached repository code.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-neutral-900">3. Information Processed During Requests</h2>
          <p>
            When you enter a public repository identifier or URL:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-neutral-600">
            <li>The repository owner and repository name are sent to our Express backend.</li>
            <li>Our Express backend forwards the query to the GitHub REST API to retrieve public metadata and public commit records.</li>
            <li>The received data is transformed into a clean presentation and transmitted directly back to your browser session.</li>
            <li>Server logs record standard HTTP request data (such as request path and HTTP status code) for operational debugging without storing personal identifiers.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-neutral-900">4. Third-Party Services: GitHub</h2>
          <p>
            Because all repository data originates from GitHub, your interactions through this tool reflect public data already published on GitHub. The processing of public data by GitHub is governed by GitHub's own Privacy Statement and Terms of Service.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-neutral-900">5. Security</h2>
          <p>
            GitStory enforces server-side input validation, strict CORS boundaries, and secure HTTP headers. We do not expose server environment variables or server tokens to the frontend application.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-neutral-900">6. Contact and Inquiries</h2>
          <p>
            For questions or feedback regarding this policy or the GitStory Phase 1 application, please refer to the project repository.
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
