import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy - Catchup Feed',
  description: 'Privacy Policy for Catchup Feed',
};

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-4xl">
      <header className="mb-8">
        <h1 className="text-glow-sm mb-4 text-4xl font-bold">Privacy Policy</h1>
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
        {/* Introduction */}
        <section>
          <p className="mb-4">
            At Catchup Feed, we take your privacy seriously. This Privacy Policy explains how we
            collect, use, disclose, and safeguard your information when you use our news aggregation
            service. Please read this privacy policy carefully. If you do not agree with the terms
            of this privacy policy, please do not access the service.
          </p>
          <p className="mb-4">
            We reserve the right to make changes to this Privacy Policy at any time and for any
            reason. We will alert you about any changes by updating the &quot;Last updated&quot;
            date of this Privacy Policy. You are encouraged to periodically review this Privacy
            Policy to stay informed of updates.
          </p>
        </section>

        {/* Information We Collect */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>

          <h3 className="text-xl font-semibold mb-3">1.1 Personal Information</h3>
          <p className="mb-4">
            We collect personal information that you voluntarily provide to us when you register for
            an account, express an interest in obtaining information about us or our services, or
            otherwise contact us. The personal information we collect may include:
          </p>
          <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
            <li>Email address</li>
            <li>Name (if provided)</li>
            <li>Account credentials (username and password)</li>
            <li>Profile information</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">1.2 Automatically Collected Information</h3>
          <p className="mb-4">
            When you access our service, we may automatically collect certain information about your
            device and usage patterns, including:
          </p>
          <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
            <li>IP address and general location information</li>
            <li>Browser type and version</li>
            <li>Device type and operating system</li>
            <li>Pages visited and time spent on pages</li>
            <li>Referring website addresses</li>
            <li>Date and time of access</li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">1.3 Usage Data</h3>
          <p className="mb-4">
            We collect information about how you interact with our service, including:
          </p>
          <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
            <li>News sources you configure</li>
            <li>Articles you view or save</li>
            <li>Search queries</li>
            <li>Preferences and settings</li>
            <li>Feature usage patterns</li>
          </ul>
        </section>

        {/* How We Use Your Information */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">2. How We Use Your Information</h2>

          <p className="mb-4">We use the information we collect or receive to:</p>
          <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
            <li>Create and manage your account</li>
            <li>Provide, operate, and maintain our service</li>
            <li>Personalize your news feed based on your preferences</li>
            <li>Improve and optimize our service functionality</li>
            <li>Analyze usage patterns and trends</li>
            <li>Send you technical notices and support messages</li>
            <li>Respond to your inquiries and provide customer support</li>
            <li>Detect and prevent fraud, abuse, or security issues</li>
            <li>Comply with legal obligations</li>
          </ul>

          <p className="mb-4">
            We process your personal information for these purposes based on our legitimate business
            interests, in order to enter into or perform a contract with you, with your consent,
            and/or for compliance with our legal obligations.
          </p>
        </section>

        {/* Data Storage and Security */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">3. Data Storage and Security</h2>

          <h3 className="text-xl font-semibold mb-3">3.1 Data Storage</h3>
          <p className="mb-4">
            Your data is stored securely on cloud infrastructure providers. We use industry-standard
            encryption methods to protect your data both in transit and at rest. All passwords are
            hashed using secure algorithms and are never stored in plain text.
          </p>

          <h3 className="text-xl font-semibold mb-3">3.2 Security Measures</h3>
          <p className="mb-4">
            We implement appropriate technical and organizational security measures designed to
            protect your personal information. However, please note that no method of transmission
            over the Internet or method of electronic storage is 100% secure. While we strive to use
            commercially acceptable means to protect your personal information, we cannot guarantee
            its absolute security.
          </p>

          <h3 className="text-xl font-semibold mb-3">3.3 Data Breach Notification</h3>
          <p className="mb-4">
            In the event of a data breach that affects your personal information, we will notify you
            and any applicable authorities in accordance with applicable law.
          </p>
        </section>

        {/* Cookies and Tracking */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">4. Cookies and Tracking Technologies</h2>

          <h3 className="text-xl font-semibold mb-3">4.1 Cookies</h3>
          <p className="mb-4">
            We use cookies and similar tracking technologies to track activity on our service and
            store certain information. Cookies are small data files stored on your device. You can
            instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
            However, if you do not accept cookies, you may not be able to use some portions of our
            service.
          </p>

          <h3 className="text-xl font-semibold mb-3">4.2 Types of Cookies We Use</h3>
          <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
            <li>
              <strong>Essential Cookies:</strong> Required for authentication and security
            </li>
            <li>
              <strong>Preference Cookies:</strong> Store your settings and preferences
            </li>
            <li>
              <strong>Analytics Cookies:</strong> Help us understand how you use our service
            </li>
            <li>
              <strong>Performance Cookies:</strong> Monitor and improve service performance
            </li>
          </ul>

          <h3 className="text-xl font-semibold mb-3">4.3 Local Storage</h3>
          <p className="mb-4">
            We may use local storage to store user preferences and improve service performance. This
            data remains on your device and is not transmitted to our servers unless necessary for
            service functionality.
          </p>
        </section>

        {/* Third-Party Services */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">5. Third-Party Services</h2>

          <h3 className="text-xl font-semibold mb-3">5.1 Third-Party Content</h3>
          <p className="mb-4">
            Catchup Feed aggregates content from various third-party news sources, including RSS
            feeds, websites, and APIs. When you access content through our service, you may be
            subject to the privacy policies and terms of those third-party sources. We do not
            control and are not responsible for the privacy practices of third-party sources.
          </p>

          <h3 className="text-xl font-semibold mb-3">5.2 Service Providers</h3>
          <p className="mb-4">
            We may employ third-party companies and individuals to facilitate our service, provide
            the service on our behalf, perform service-related services, or assist us in analyzing
            how our service is used. These third parties have access to your personal information
            only to perform these tasks on our behalf and are obligated not to disclose or use it
            for any other purpose.
          </p>

          <h3 className="text-xl font-semibold mb-3">5.3 Analytics Services</h3>
          <p className="mb-4">
            We may use third-party analytics services to monitor and analyze the use of our service.
            These services may collect information about your use of our service and other websites
            and applications.
          </p>
        </section>

        {/* Your Rights */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">6. Your Privacy Rights</h2>

          <p className="mb-4">
            Depending on your location, you may have certain rights regarding your personal
            information:
          </p>

          <h3 className="text-xl font-semibold mb-3">6.1 Access and Portability</h3>
          <p className="mb-4">
            You have the right to request access to the personal information we hold about you and
            to receive a copy of that information in a structured, commonly used format.
          </p>

          <h3 className="text-xl font-semibold mb-3">6.2 Correction and Update</h3>
          <p className="mb-4">
            You have the right to request that we correct any inaccurate or incomplete personal
            information we hold about you. You can update most of your information directly through
            your account settings.
          </p>

          <h3 className="text-xl font-semibold mb-3">6.3 Deletion</h3>
          <p className="mb-4">
            You have the right to request deletion of your personal information, subject to certain
            legal exceptions. You can delete your account at any time through your account settings
            or by contacting us.
          </p>

          <h3 className="text-xl font-semibold mb-3">6.4 Opt-Out</h3>
          <p className="mb-4">
            You can opt out of certain data collection and processing activities. However, some data
            collection is necessary for the basic functionality of our service.
          </p>

          <h3 className="text-xl font-semibold mb-3">6.5 Exercising Your Rights</h3>
          <p className="mb-4">
            To exercise any of these rights, please contact us using the contact information
            provided in this policy. We will respond to your request within a reasonable timeframe
            in accordance with applicable law.
          </p>
        </section>

        {/* Data Retention */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">7. Data Retention</h2>

          <p className="mb-4">
            We retain your personal information only for as long as necessary to fulfill the
            purposes outlined in this Privacy Policy, unless a longer retention period is required
            or permitted by law. When we no longer need your personal information, we will securely
            delete or anonymize it.
          </p>
          <p className="mb-4">Specific retention periods include:</p>
          <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
            <li>Account information: Retained while your account is active</li>
            <li>Usage data: Typically retained for 24 months for analytics purposes</li>
            <li>Security logs: Retained for up to 12 months</li>
            <li>
              Deleted accounts: Personal information removed within 90 days of deletion request
            </li>
          </ul>
        </section>

        {/* Children's Privacy */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">8. Children&apos;s Privacy</h2>

          <p className="mb-4">
            Our service is not intended for individuals under the age of 13 (or the minimum age in
            your jurisdiction). We do not knowingly collect personal information from children. If
            you are a parent or guardian and you are aware that your child has provided us with
            personal information, please contact us. If we become aware that we have collected
            personal information from children without verification of parental consent, we take
            steps to remove that information from our servers.
          </p>
        </section>

        {/* Changes to This Policy */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">9. Changes to This Privacy Policy</h2>

          <p className="mb-4">
            We may update our Privacy Policy from time to time. We will notify you of any changes by
            posting the new Privacy Policy on this page and updating the &quot;Last updated&quot;
            date at the top of this Privacy Policy.
          </p>
          <p className="mb-4">
            You are advised to review this Privacy Policy periodically for any changes. Changes to
            this Privacy Policy are effective when they are posted on this page. Your continued use
            of the service after any modifications to the Privacy Policy will constitute your
            acknowledgment of the modifications and your consent to abide and be bound by the
            modified Privacy Policy.
          </p>
        </section>

        {/* International Data Transfers */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">10. International Data Transfers</h2>

          <p className="mb-4">
            Your information may be transferred to and maintained on computers located outside of
            your state, province, country, or other governmental jurisdiction where the data
            protection laws may differ from those in your jurisdiction. If you are located outside
            our operating jurisdiction and choose to provide information to us, please note that we
            transfer the data to our jurisdiction and process it there.
          </p>
          <p className="mb-4">
            By using our service, you consent to the transfer of your information to our facilities
            and to the facilities of third parties with whom we share it as described in this
            Privacy Policy.
          </p>
        </section>
      </div>
    </article>
  );
}
