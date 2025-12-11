import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service - Catchup Feed',
  description: 'Terms of Service for Catchup Feed',
};

export default function TermsPage() {
  return (
    <article className="mx-auto max-w-4xl">
      <header className="mb-8">
        <h1 className="text-glow-sm mb-4 text-4xl font-bold">Terms of Service</h1>
        <p className="text-muted-foreground">
          Last updated:{' '}
          {new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </header>

      <div className="space-y-8 text-foreground/90">
        {/* Acceptance of Terms */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
          <p className="mb-4">
            Welcome to Catchup Feed. By accessing or using our service, you agree to be bound by
            these Terms of Service and all applicable laws and regulations. If you do not agree with
            any of these terms, you are prohibited from using or accessing this service.
          </p>
          <p className="mb-4">
            We reserve the right to update, change, or replace any part of these Terms of Service by
            posting updates and/or changes to our website. It is your responsibility to check this
            page periodically for changes. Your continued use of or access to the service following
            the posting of any changes constitutes acceptance of those changes.
          </p>
        </section>

        {/* User Accounts */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">2. User Accounts</h2>

          <h3 className="text-xl font-semibold mb-3">2.1 Account Creation</h3>
          <p className="mb-4">
            To use certain features of Catchup Feed, you must create an account. When you create an
            account with us, you must provide information that is accurate, complete, and current at
            all times. Failure to do so constitutes a breach of the Terms, which may result in
            immediate termination of your account.
          </p>

          <h3 className="text-xl font-semibold mb-3">2.2 Account Security</h3>
          <p className="mb-4">
            You are responsible for safeguarding the password that you use to access the service and
            for any activities or actions under your password. You agree not to disclose your
            password to any third party. You must notify us immediately upon becoming aware of any
            breach of security or unauthorized use of your account.
          </p>

          <h3 className="text-xl font-semibold mb-3">2.3 Account Termination</h3>
          <p className="mb-4">
            We reserve the right to terminate or suspend your account and access to the service
            immediately, without prior notice or liability, for any reason whatsoever, including
            without limitation if you breach the Terms.
          </p>
        </section>

        {/* Content and Conduct */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">3. Content and Conduct</h2>

          <h3 className="text-xl font-semibold mb-3">3.1 User Content</h3>
          <p className="mb-4">
            Our service allows you to configure news sources and preferences. You retain all rights
            to any content you provide or configure through the service. By using our service, you
            grant us a license to use, store, and process your configurations to provide the service
            to you.
          </p>

          <h3 className="text-xl font-semibold mb-3">3.2 Prohibited Activities</h3>
          <p className="mb-4">
            You agree not to engage in any of the following prohibited activities:
          </p>
          <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
            <li>Violating any applicable laws or regulations</li>
            <li>Attempting to gain unauthorized access to our service or systems</li>
            <li>Interfering with or disrupting the service or servers</li>
            <li>Using the service for any illegal or unauthorized purpose</li>
            <li>Transmitting any viruses, malware, or other malicious code</li>
            <li>Collecting or harvesting information from other users</li>
            <li>Impersonating another person or entity</li>
          </ul>
        </section>

        {/* Intellectual Property */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">4. Intellectual Property</h2>

          <h3 className="text-xl font-semibold mb-3">4.1 Service Content</h3>
          <p className="mb-4">
            The service and its original content (excluding content provided by users and
            third-party sources), features, and functionality are and will remain the exclusive
            property of Catchup Feed and its licensors. The service is protected by copyright,
            trademark, and other laws.
          </p>

          <h3 className="text-xl font-semibold mb-3">4.2 Third-Party Content</h3>
          <p className="mb-4">
            Catchup Feed aggregates content from various third-party sources. All rights to such
            content remain with their respective owners. We do not claim ownership of any
            third-party content displayed through our service.
          </p>

          <h3 className="text-xl font-semibold mb-3">4.3 Trademarks</h3>
          <p className="mb-4">
            Catchup Feed name, logo, and all related names, logos, product and service names,
            designs, and slogans are trademarks of Catchup Feed or its affiliates or licensors. You
            must not use such marks without our prior written permission.
          </p>
        </section>

        {/* Limitation of Liability */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">5. Limitation of Liability</h2>

          <p className="mb-4">
            To the maximum extent permitted by applicable law, in no event shall Catchup Feed, its
            affiliates, directors, employees, or agents be liable for any indirect, incidental,
            special, consequential, or punitive damages, including without limitation, loss of
            profits, data, use, goodwill, or other intangible losses, resulting from:
          </p>
          <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
            <li>Your access to or use of or inability to access or use the service</li>
            <li>Any conduct or content of any third party on the service</li>
            <li>Any content obtained from the service</li>
            <li>Unauthorized access, use, or alteration of your transmissions or content</li>
          </ul>

          <p className="mb-4">
            The service is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis.
            Catchup Feed makes no warranties, expressed or implied, and hereby disclaims and negates
            all other warranties including, without limitation, implied warranties or conditions of
            merchantability, fitness for a particular purpose, or non-infringement of intellectual
            property or other violation of rights.
          </p>
        </section>

        {/* Modifications to Service */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">6. Modifications to Service</h2>

          <p className="mb-4">
            We reserve the right to withdraw or amend our service, and any service or material we
            provide via the service, in our sole discretion without notice. We will not be liable if
            for any reason all or any part of the service is unavailable at any time or for any
            period.
          </p>
          <p className="mb-4">
            From time to time, we may restrict access to some parts of the service, or the entire
            service, to users, including registered users. We may also impose limits on certain
            features and services or restrict your access to parts or all of the service without
            notice or liability.
          </p>
        </section>

        {/* Termination */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">7. Termination</h2>

          <p className="mb-4">
            We may terminate or suspend your account and bar access to the service immediately,
            without prior notice or liability, under our sole discretion, for any reason whatsoever
            and without limitation, including but not limited to a breach of the Terms.
          </p>
          <p className="mb-4">
            If you wish to terminate your account, you may simply discontinue using the service or
            contact us to request account deletion.
          </p>
          <p className="mb-4">
            All provisions of the Terms which by their nature should survive termination shall
            survive termination, including, without limitation, ownership provisions, warranty
            disclaimers, indemnity, and limitations of liability.
          </p>
        </section>

        {/* Governing Law */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">8. Governing Law</h2>

          <p className="mb-4">
            These Terms shall be governed and construed in accordance with the laws of the
            jurisdiction in which Catchup Feed operates, without regard to its conflict of law
            provisions.
          </p>
          <p className="mb-4">
            Our failure to enforce any right or provision of these Terms will not be considered a
            waiver of those rights. If any provision of these Terms is held to be invalid or
            unenforceable by a court, the remaining provisions of these Terms will remain in effect.
          </p>
        </section>
      </div>
    </article>
  );
}
