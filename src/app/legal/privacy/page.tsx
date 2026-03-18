import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | Midnight Riches",
  description:
    "Privacy Policy for Midnight Riches — learn how we collect, use, and protect your personal information.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] px-4 py-20">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/"
          className="mb-10 inline-flex items-center gap-2 text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5" />
            <path d="m12 19-7-7 7-7" />
          </svg>
          Back to Home
        </Link>

        <header className="mb-12">
          <h1
            className="mb-4 text-4xl font-bold tracking-tight text-[var(--text-primary)]"
            style={{ fontFamily: "var(--font-garamond)" }}
          >
            Privacy Policy
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            Last updated: March 18, 2026
          </p>
        </header>

        <div className="space-y-8">
          {/* Introduction */}
          <section className="rounded-xl border border-[var(--glass-border)] bg-[var(--bg-card)] p-6 md:p-8">
            <p className="leading-relaxed text-[var(--text-secondary)]">
              At Midnight Riches, your privacy is of paramount importance to us.
              This Privacy Policy explains how we collect, use, disclose, and
              safeguard your personal information when you use our platform. By
              using our Service, you consent to the data practices described in
              this policy.
            </p>
          </section>

          {/* 1. Information We Collect */}
          <section className="rounded-xl border border-[var(--glass-border)] bg-[var(--bg-card)] p-6 md:p-8">
            <h2
              className="mb-4 text-2xl font-semibold text-[var(--text-primary)]"
              style={{ fontFamily: "var(--font-garamond)" }}
            >
              1. Information We Collect
            </h2>
            <div className="space-y-6 leading-relaxed text-[var(--text-secondary)]">
              <div>
                <h3 className="mb-2 text-lg font-medium text-[var(--text-primary)]">
                  1.1 Account Information
                </h3>
                <p className="mb-3">
                  When you create an account, we collect information you provide
                  directly, including:
                </p>
                <ul className="ml-6 list-disc space-y-1">
                  <li>Full name and display name</li>
                  <li>Email address</li>
                  <li>Date of birth (for age verification)</li>
                  <li>Password (stored using industry-standard hashing)</li>
                  <li>Profile avatar (if uploaded)</li>
                  <li>OAuth provider data (if signing in via Google)</li>
                </ul>
              </div>

              <div>
                <h3 className="mb-2 text-lg font-medium text-[var(--text-primary)]">
                  1.2 Usage Data
                </h3>
                <p className="mb-3">
                  We automatically collect certain information about your
                  interaction with the Service, including:
                </p>
                <ul className="ml-6 list-disc space-y-1">
                  <li>Game session data (spins, bets, outcomes, timestamps)</li>
                  <li>Device information (browser type, operating system, device identifiers)</li>
                  <li>IP address and approximate geolocation</li>
                  <li>Pages visited, features used, and time spent on the platform</li>
                  <li>Referring URLs and exit pages</li>
                </ul>
              </div>

              <div>
                <h3 className="mb-2 text-lg font-medium text-[var(--text-primary)]">
                  1.3 Transaction Data
                </h3>
                <p>
                  When you make purchases, our payment processor (Stripe)
                  collects payment information. We receive limited transaction
                  details such as the transaction amount, date, and a truncated
                  card identifier. We never store full credit card numbers on our
                  servers.
                </p>
              </div>

              <div>
                <h3 className="mb-2 text-lg font-medium text-[var(--text-primary)]">
                  1.4 Cookies &amp; Tracking Technologies
                </h3>
                <p className="mb-3">We use the following types of cookies:</p>
                <ul className="ml-6 list-disc space-y-1">
                  <li>
                    <strong>Essential cookies:</strong> Required for
                    authentication, session management, and security.
                  </li>
                  <li>
                    <strong>Functional cookies:</strong> Remember your
                    preferences such as language and theme settings.
                  </li>
                  <li>
                    <strong>Analytics cookies:</strong> Help us understand how
                    users interact with the platform to improve our Service.
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* 2. How We Use Your Data */}
          <section className="rounded-xl border border-[var(--glass-border)] bg-[var(--bg-card)] p-6 md:p-8">
            <h2
              className="mb-4 text-2xl font-semibold text-[var(--text-primary)]"
              style={{ fontFamily: "var(--font-garamond)" }}
            >
              2. How We Use Your Data
            </h2>
            <div className="space-y-4 leading-relaxed text-[var(--text-secondary)]">
              <p>We use the information we collect to:</p>
              <ul className="ml-6 list-disc space-y-2">
                <li>Provide, operate, and maintain the Service.</li>
                <li>Process transactions and manage your virtual currency balance.</li>
                <li>Verify your identity and eligibility (age and jurisdiction checks).</li>
                <li>Personalize your experience, including language and theme preferences.</li>
                <li>Monitor and enforce our Terms of Service and detect fraud or abuse.</li>
                <li>Implement and maintain our Provably Fair system to ensure game integrity.</li>
                <li>Send you service-related communications (account alerts, security notices).</li>
                <li>Analyze usage patterns to improve the Service and develop new features.</li>
                <li>Comply with legal obligations and respond to lawful requests from authorities.</li>
              </ul>
            </div>
          </section>

          {/* 3. Data Sharing */}
          <section className="rounded-xl border border-[var(--glass-border)] bg-[var(--bg-card)] p-6 md:p-8">
            <h2
              className="mb-4 text-2xl font-semibold text-[var(--text-primary)]"
              style={{ fontFamily: "var(--font-garamond)" }}
            >
              3. Data Sharing &amp; Third Parties
            </h2>
            <div className="space-y-4 leading-relaxed text-[var(--text-secondary)]">
              <p>
                We do not sell, rent, or trade your personal information. We
                share data only in the following limited circumstances:
              </p>
              <ul className="ml-6 list-disc space-y-2">
                <li>
                  <strong>Stripe (Payment Processor):</strong> We share
                  necessary transaction data with Stripe to process purchases.
                  Stripe&apos;s handling of your payment information is governed
                  by their own privacy policy.
                </li>
                <li>
                  <strong>Legal Compliance:</strong> We may disclose your
                  information if required by law, subpoena, court order, or
                  governmental regulation.
                </li>
                <li>
                  <strong>Safety &amp; Fraud Prevention:</strong> We may share
                  information to investigate or prevent fraud, security breaches,
                  or other potentially prohibited or illegal activities.
                </li>
                <li>
                  <strong>Business Transfers:</strong> In the event of a merger,
                  acquisition, or sale of assets, your information may be
                  transferred as part of that transaction.
                </li>
              </ul>
            </div>
          </section>

          {/* 4. Data Security */}
          <section className="rounded-xl border border-[var(--glass-border)] bg-[var(--bg-card)] p-6 md:p-8">
            <h2
              className="mb-4 text-2xl font-semibold text-[var(--text-primary)]"
              style={{ fontFamily: "var(--font-garamond)" }}
            >
              4. Data Security
            </h2>
            <div className="space-y-4 leading-relaxed text-[var(--text-secondary)]">
              <p>
                We implement industry-standard security measures to protect your
                personal information, including:
              </p>
              <ul className="ml-6 list-disc space-y-2">
                <li>TLS/SSL encryption for all data in transit.</li>
                <li>AES-256 encryption for sensitive data at rest.</li>
                <li>Bcrypt hashing for password storage.</li>
                <li>JWT-based authentication with secure, httpOnly cookies.</li>
                <li>Regular security audits and penetration testing.</li>
                <li>Role-based access controls for internal systems.</li>
              </ul>
              <p>
                While we take all reasonable precautions, no method of
                electronic transmission or storage is 100% secure. We cannot
                guarantee absolute security.
              </p>
            </div>
          </section>

          {/* 5. Your Rights */}
          <section className="rounded-xl border border-[var(--glass-border)] bg-[var(--bg-card)] p-6 md:p-8">
            <h2
              className="mb-4 text-2xl font-semibold text-[var(--text-primary)]"
              style={{ fontFamily: "var(--font-garamond)" }}
            >
              5. Your Rights
            </h2>
            <div className="space-y-4 leading-relaxed text-[var(--text-secondary)]">
              <p>
                Depending on your jurisdiction, you may have the following rights
                regarding your personal data:
              </p>
              <ul className="ml-6 list-disc space-y-2">
                <li>
                  <strong>Right of Access:</strong> Request a copy of the
                  personal data we hold about you.
                </li>
                <li>
                  <strong>Right to Rectification:</strong> Request correction of
                  inaccurate or incomplete personal data.
                </li>
                <li>
                  <strong>Right to Deletion:</strong> Request erasure of your
                  personal data, subject to legal retention requirements.
                </li>
                <li>
                  <strong>Right to Data Portability:</strong> Request your data
                  in a structured, commonly used, machine-readable format.
                </li>
                <li>
                  <strong>Right to Restrict Processing:</strong> Request that we
                  limit the processing of your data under certain circumstances.
                </li>
                <li>
                  <strong>Right to Object:</strong> Object to data processing
                  based on legitimate interests.
                </li>
                <li>
                  <strong>Right to Withdraw Consent:</strong> Withdraw consent
                  at any time where processing is based on consent.
                </li>
              </ul>
              <p>
                To exercise any of these rights, contact us at{" "}
                <a
                  href="mailto:privacy@midnightriches.com"
                  className="underline underline-offset-4 hover:text-[var(--text-primary)]"
                >
                  privacy@midnightriches.com
                </a>
                . We will respond to verified requests within 30 days.
              </p>
            </div>
          </section>

          {/* 6. Data Retention */}
          <section className="rounded-xl border border-[var(--glass-border)] bg-[var(--bg-card)] p-6 md:p-8">
            <h2
              className="mb-4 text-2xl font-semibold text-[var(--text-primary)]"
              style={{ fontFamily: "var(--font-garamond)" }}
            >
              6. Data Retention
            </h2>
            <div className="space-y-4 leading-relaxed text-[var(--text-secondary)]">
              <p>
                We retain your personal data for as long as your account is
                active or as needed to provide you with the Service. After
                account closure, we may retain certain data for a limited period
                as necessary to comply with legal obligations, resolve disputes,
                and enforce our agreements. Game session records may be retained
                for up to seven (7) years for regulatory compliance and audit
                purposes.
              </p>
            </div>
          </section>

          {/* 7. Children's Privacy */}
          <section className="rounded-xl border border-[var(--glass-border)] bg-[var(--bg-card)] p-6 md:p-8">
            <h2
              className="mb-4 text-2xl font-semibold text-[var(--text-primary)]"
              style={{ fontFamily: "var(--font-garamond)" }}
            >
              7. Children&apos;s Privacy
            </h2>
            <div className="space-y-4 leading-relaxed text-[var(--text-secondary)]">
              <p>
                Midnight Riches is not intended for individuals under the age of
                18. We do not knowingly collect personal information from minors.
                If we become aware that a user is under 18, we will promptly
                delete their account and all associated data. If you believe a
                minor has provided us with personal information, please contact
                us immediately at{" "}
                <a
                  href="mailto:privacy@midnightriches.com"
                  className="underline underline-offset-4 hover:text-[var(--text-primary)]"
                >
                  privacy@midnightriches.com
                </a>
                .
              </p>
            </div>
          </section>

          {/* 8. International Data Transfers */}
          <section className="rounded-xl border border-[var(--glass-border)] bg-[var(--bg-card)] p-6 md:p-8">
            <h2
              className="mb-4 text-2xl font-semibold text-[var(--text-primary)]"
              style={{ fontFamily: "var(--font-garamond)" }}
            >
              8. International Data Transfers
            </h2>
            <div className="space-y-4 leading-relaxed text-[var(--text-secondary)]">
              <p>
                Your data may be processed and stored on servers located outside
                your country of residence. By using the Service, you consent to
                the transfer of your information to countries that may have
                different data protection standards. We ensure that appropriate
                safeguards are in place to protect your data in accordance with
                this Privacy Policy.
              </p>
            </div>
          </section>

          {/* 9. Changes to This Policy */}
          <section className="rounded-xl border border-[var(--glass-border)] bg-[var(--bg-card)] p-6 md:p-8">
            <h2
              className="mb-4 text-2xl font-semibold text-[var(--text-primary)]"
              style={{ fontFamily: "var(--font-garamond)" }}
            >
              9. Changes to This Policy
            </h2>
            <div className="space-y-4 leading-relaxed text-[var(--text-secondary)]">
              <p>
                We may update this Privacy Policy from time to time to reflect
                changes in our practices, legal requirements, or operational
                needs. When we make material changes, we will notify you via
                email or a prominent notice on the platform at least 30 days
                before the changes take effect. Your continued use of the
                Service after the effective date constitutes acceptance of the
                revised policy.
              </p>
            </div>
          </section>

          {/* 10. Contact */}
          <section className="rounded-xl border border-[var(--glass-border)] bg-[var(--bg-card)] p-6 md:p-8">
            <h2
              className="mb-4 text-2xl font-semibold text-[var(--text-primary)]"
              style={{ fontFamily: "var(--font-garamond)" }}
            >
              10. Contact Us
            </h2>
            <div className="space-y-4 leading-relaxed text-[var(--text-secondary)]">
              <p>
                If you have questions, concerns, or requests regarding this
                Privacy Policy or your personal data, contact us:
              </p>
              <ul className="ml-6 list-disc space-y-2">
                <li>
                  Privacy inquiries:{" "}
                  <a
                    href="mailto:privacy@midnightriches.com"
                    className="underline underline-offset-4 hover:text-[var(--text-primary)]"
                  >
                    privacy@midnightriches.com
                  </a>
                </li>
                <li>
                  General support:{" "}
                  <a
                    href="mailto:support@midnightriches.com"
                    className="underline underline-offset-4 hover:text-[var(--text-primary)]"
                  >
                    support@midnightriches.com
                  </a>
                </li>
              </ul>
            </div>
          </section>

          {/* Footer */}
          <footer className="pt-4 text-center text-sm text-[var(--text-muted)]">
            <p>
              &copy; {new Date().getFullYear()} Midnight Riches. All rights
              reserved.
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
