import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | Midnight Riches",
  description:
    "Terms of Service for Midnight Riches — read our terms and conditions before using our platform.",
};

export default function TermsOfServicePage() {
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
            Terms of Service
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            Last updated: March 18, 2026
          </p>
        </header>

        <div className="space-y-8">
          {/* Introduction */}
          <section className="rounded-xl border border-[var(--glass-border)] bg-[var(--bg-card)] p-6 md:p-8">
            <p className="leading-relaxed text-[var(--text-secondary)]">
              Welcome to Midnight Riches. These Terms of Service
              (&quot;Terms&quot;) govern your access to and use of the Midnight
              Riches platform, including our website, applications, and all
              related services (collectively, the &quot;Service&quot;). By
              accessing or using the Service, you agree to be bound by these
              Terms. If you do not agree, you must not use the Service.
            </p>
          </section>

          {/* 1. Acceptance of Terms */}
          <section className="rounded-xl border border-[var(--glass-border)] bg-[var(--bg-card)] p-6 md:p-8">
            <h2
              className="mb-4 text-2xl font-semibold text-[var(--text-primary)]"
              style={{ fontFamily: "var(--font-garamond)" }}
            >
              1. Acceptance of Terms
            </h2>
            <div className="space-y-4 leading-relaxed text-[var(--text-secondary)]">
              <p>
                By creating an account, accessing, or otherwise using Midnight
                Riches, you acknowledge that you have read, understood, and
                agree to be bound by these Terms, as well as our{" "}
                <Link
                  href="/legal/privacy"
                  className="underline underline-offset-4 hover:text-[var(--text-primary)]"
                >
                  Privacy Policy
                </Link>{" "}
                and{" "}
                <Link
                  href="/legal/responsible-gaming"
                  className="underline underline-offset-4 hover:text-[var(--text-primary)]"
                >
                  Responsible Gaming Policy
                </Link>
                .
              </p>
              <p>
                We reserve the right to modify these Terms at any time. Changes
                become effective immediately upon posting. Your continued use of
                the Service after any modification constitutes acceptance of the
                updated Terms. We will make reasonable efforts to notify you of
                material changes via email or an in-app notification.
              </p>
            </div>
          </section>

          {/* 2. Eligibility */}
          <section className="rounded-xl border border-[var(--glass-border)] bg-[var(--bg-card)] p-6 md:p-8">
            <h2
              className="mb-4 text-2xl font-semibold text-[var(--text-primary)]"
              style={{ fontFamily: "var(--font-garamond)" }}
            >
              2. Eligibility
            </h2>
            <div className="space-y-4 leading-relaxed text-[var(--text-secondary)]">
              <p>To use Midnight Riches, you must:</p>
              <ul className="ml-6 list-disc space-y-2">
                <li>Be at least 18 years of age, or the legal gambling age in your jurisdiction, whichever is higher.</li>
                <li>Reside in a jurisdiction where online gambling is not prohibited by applicable law.</li>
                <li>Not be a person barred from receiving services under the laws of your applicable jurisdiction.</li>
                <li>Have the legal capacity and authority to enter into these Terms.</li>
              </ul>
              <p>
                We reserve the right to request proof of age and identity at any
                time. Failure to provide satisfactory documentation may result in
                account suspension or termination.
              </p>
            </div>
          </section>

          {/* 3. Account Registration */}
          <section className="rounded-xl border border-[var(--glass-border)] bg-[var(--bg-card)] p-6 md:p-8">
            <h2
              className="mb-4 text-2xl font-semibold text-[var(--text-primary)]"
              style={{ fontFamily: "var(--font-garamond)" }}
            >
              3. Account Registration
            </h2>
            <div className="space-y-4 leading-relaxed text-[var(--text-secondary)]">
              <p>
                To access certain features of the Service, you must register for
                an account. When registering, you agree to:
              </p>
              <ul className="ml-6 list-disc space-y-2">
                <li>Provide accurate, current, and complete information during the registration process.</li>
                <li>Maintain and promptly update your account information to keep it accurate and complete.</li>
                <li>Maintain the security and confidentiality of your login credentials.</li>
                <li>Accept responsibility for all activities that occur under your account.</li>
                <li>Notify us immediately of any unauthorized use of your account.</li>
              </ul>
              <p>
                You may only maintain one account. Multiple accounts per
                individual are strictly prohibited and may result in the
                termination of all associated accounts and forfeiture of any
                virtual currency balances.
              </p>
            </div>
          </section>

          {/* 4. Virtual Currency */}
          <section className="rounded-xl border border-[var(--glass-border)] bg-[var(--bg-card)] p-6 md:p-8">
            <h2
              className="mb-4 text-2xl font-semibold text-[var(--text-primary)]"
              style={{ fontFamily: "var(--font-garamond)" }}
            >
              4. Virtual Currency
            </h2>
            <div className="space-y-4 leading-relaxed text-[var(--text-secondary)]">
              <p>
                Midnight Riches uses virtual currency (&quot;Coins&quot;) for
                gameplay purposes. You acknowledge and agree that:
              </p>
              <ul className="ml-6 list-disc space-y-2">
                <li>Coins are virtual tokens with no real-world monetary value outside of the Midnight Riches platform.</li>
                <li>Coins may be purchased using real currency through our authorized payment processors.</li>
                <li>Coins cannot be exchanged, refunded, or converted back into real currency except where required by applicable law or as expressly permitted by Midnight Riches.</li>
                <li>Coins are non-transferable between accounts.</li>
                <li>We reserve the right to modify Coin pricing, values, and availability at any time.</li>
                <li>Unused Coins may be subject to expiration after a period of account inactivity as defined in our policies.</li>
              </ul>
              <p className="text-sm text-[var(--text-muted)]">
                All purchases of virtual currency are final. Chargebacks or
                fraudulent payment disputes may result in immediate account
                termination and potential legal action.
              </p>
            </div>
          </section>

          {/* 5. Prohibited Conduct */}
          <section className="rounded-xl border border-[var(--glass-border)] bg-[var(--bg-card)] p-6 md:p-8">
            <h2
              className="mb-4 text-2xl font-semibold text-[var(--text-primary)]"
              style={{ fontFamily: "var(--font-garamond)" }}
            >
              5. Prohibited Conduct
            </h2>
            <div className="space-y-4 leading-relaxed text-[var(--text-secondary)]">
              <p>
                You agree not to engage in any of the following prohibited
                activities:
              </p>
              <ul className="ml-6 list-disc space-y-2">
                <li>Using the Service for any unlawful purpose or in violation of any applicable laws or regulations.</li>
                <li>Exploiting bugs, glitches, or vulnerabilities in the software to gain an unfair advantage.</li>
                <li>Using bots, scripts, automation tools, or any other software to interact with the Service.</li>
                <li>Engaging in collusion, fraud, or any form of cheating.</li>
                <li>Attempting to reverse-engineer, decompile, or disassemble any portion of the Service.</li>
                <li>Interfering with or disrupting the integrity or performance of the Service.</li>
                <li>Creating multiple accounts or using another person&apos;s account without authorization.</li>
                <li>Engaging in money laundering or any other financial crime through the platform.</li>
                <li>Harassing, threatening, or abusing other users or staff.</li>
              </ul>
              <p>
                Violation of these prohibitions may result in immediate account
                suspension or termination, forfeiture of virtual currency, and
                potential referral to law enforcement authorities.
              </p>
            </div>
          </section>

          {/* 6. Intellectual Property */}
          <section className="rounded-xl border border-[var(--glass-border)] bg-[var(--bg-card)] p-6 md:p-8">
            <h2
              className="mb-4 text-2xl font-semibold text-[var(--text-primary)]"
              style={{ fontFamily: "var(--font-garamond)" }}
            >
              6. Intellectual Property
            </h2>
            <div className="space-y-4 leading-relaxed text-[var(--text-secondary)]">
              <p>
                All content, features, and functionality of the Service,
                including but not limited to text, graphics, logos, icons,
                images, audio clips, animations, software, and the compilation
                thereof, are the exclusive property of Midnight Riches or its
                licensors and are protected by international copyright,
                trademark, patent, and other intellectual property laws.
              </p>
              <p>
                You are granted a limited, non-exclusive, non-transferable,
                revocable license to access and use the Service for personal,
                non-commercial entertainment purposes only. This license does
                not include the right to modify, reproduce, distribute, create
                derivative works from, publicly display, or commercially exploit
                any content from the Service.
              </p>
            </div>
          </section>

          {/* 7. Game Fairness */}
          <section className="rounded-xl border border-[var(--glass-border)] bg-[var(--bg-card)] p-6 md:p-8">
            <h2
              className="mb-4 text-2xl font-semibold text-[var(--text-primary)]"
              style={{ fontFamily: "var(--font-garamond)" }}
            >
              7. Game Fairness
            </h2>
            <div className="space-y-4 leading-relaxed text-[var(--text-secondary)]">
              <p>
                Midnight Riches is committed to fair and transparent gaming. All
                game outcomes are determined using a cryptographically secure
                random number generator (RNG) and can be independently verified
                through our{" "}
                <Link
                  href="/legal/provably-fair"
                  className="underline underline-offset-4 hover:text-[var(--text-primary)]"
                >
                  Provably Fair
                </Link>{" "}
                system. We do not manipulate game outcomes, and the house edge
                is clearly disclosed for all games.
              </p>
            </div>
          </section>

          {/* 8. Limitation of Liability */}
          <section className="rounded-xl border border-[var(--glass-border)] bg-[var(--bg-card)] p-6 md:p-8">
            <h2
              className="mb-4 text-2xl font-semibold text-[var(--text-primary)]"
              style={{ fontFamily: "var(--font-garamond)" }}
            >
              8. Limitation of Liability
            </h2>
            <div className="space-y-4 leading-relaxed text-[var(--text-secondary)]">
              <p>
                To the fullest extent permitted by applicable law, Midnight
                Riches and its officers, directors, employees, agents, and
                affiliates shall not be liable for:
              </p>
              <ul className="ml-6 list-disc space-y-2">
                <li>Any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service.</li>
                <li>Any loss of virtual currency, data, or profits resulting from service interruptions, errors, or unauthorized access.</li>
                <li>Any damages resulting from third-party actions, including payment processor failures.</li>
                <li>Any losses resulting from your failure to maintain the security of your account credentials.</li>
              </ul>
              <p>
                Our total aggregate liability to you for any claims arising from
                or related to the Service shall not exceed the amount you have
                paid to Midnight Riches in the twelve (12) months preceding the
                claim.
              </p>
            </div>
          </section>

          {/* 9. Disclaimers */}
          <section className="rounded-xl border border-[var(--glass-border)] bg-[var(--bg-card)] p-6 md:p-8">
            <h2
              className="mb-4 text-2xl font-semibold text-[var(--text-primary)]"
              style={{ fontFamily: "var(--font-garamond)" }}
            >
              9. Disclaimers
            </h2>
            <div className="space-y-4 leading-relaxed text-[var(--text-secondary)]">
              <p>
                The Service is provided on an &quot;AS IS&quot; and &quot;AS
                AVAILABLE&quot; basis without warranties of any kind, whether
                express or implied. We disclaim all warranties, including but
                not limited to implied warranties of merchantability, fitness
                for a particular purpose, and non-infringement.
              </p>
              <p>
                We do not guarantee that the Service will be uninterrupted,
                timely, secure, or error-free. We do not guarantee any specific
                results from using the Service.
              </p>
            </div>
          </section>

          {/* 10. Termination */}
          <section className="rounded-xl border border-[var(--glass-border)] bg-[var(--bg-card)] p-6 md:p-8">
            <h2
              className="mb-4 text-2xl font-semibold text-[var(--text-primary)]"
              style={{ fontFamily: "var(--font-garamond)" }}
            >
              10. Termination
            </h2>
            <div className="space-y-4 leading-relaxed text-[var(--text-secondary)]">
              <p>
                We reserve the right to suspend or terminate your account and
                access to the Service at our sole discretion, without prior
                notice or liability, for any reason, including but not limited
                to a breach of these Terms.
              </p>
              <p>
                You may terminate your account at any time by contacting our
                support team. Upon termination, your right to use the Service
                will cease immediately. Any remaining virtual currency in your
                account at the time of termination will be forfeited unless
                otherwise required by applicable law.
              </p>
              <p>
                Sections of these Terms that by their nature should survive
                termination shall survive, including but not limited to
                intellectual property provisions, disclaimers, limitations of
                liability, and indemnification.
              </p>
            </div>
          </section>

          {/* 11. Governing Law */}
          <section className="rounded-xl border border-[var(--glass-border)] bg-[var(--bg-card)] p-6 md:p-8">
            <h2
              className="mb-4 text-2xl font-semibold text-[var(--text-primary)]"
              style={{ fontFamily: "var(--font-garamond)" }}
            >
              11. Governing Law &amp; Dispute Resolution
            </h2>
            <div className="space-y-4 leading-relaxed text-[var(--text-secondary)]">
              <p>
                These Terms shall be governed by and construed in accordance
                with the laws of the jurisdiction in which Midnight Riches
                operates, without regard to its conflict of law provisions.
              </p>
              <p>
                Any disputes arising out of or relating to these Terms or the
                Service shall first be resolved through good-faith negotiation.
                If negotiation fails, disputes shall be submitted to binding
                arbitration in accordance with the rules of the applicable
                arbitration authority. You agree to waive any right to a jury
                trial or to participate in a class action.
              </p>
            </div>
          </section>

          {/* 12. Contact Information */}
          <section className="rounded-xl border border-[var(--glass-border)] bg-[var(--bg-card)] p-6 md:p-8">
            <h2
              className="mb-4 text-2xl font-semibold text-[var(--text-primary)]"
              style={{ fontFamily: "var(--font-garamond)" }}
            >
              12. Contact Information
            </h2>
            <div className="space-y-4 leading-relaxed text-[var(--text-secondary)]">
              <p>
                If you have any questions or concerns about these Terms of
                Service, please contact us:
              </p>
              <ul className="ml-6 list-disc space-y-2">
                <li>
                  Email:{" "}
                  <a
                    href="mailto:legal@midnightriches.com"
                    className="underline underline-offset-4 hover:text-[var(--text-primary)]"
                  >
                    legal@midnightriches.com
                  </a>
                </li>
                <li>
                  Support:{" "}
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
