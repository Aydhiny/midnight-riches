import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Responsible Gaming | Midnight Riches",
  description:
    "Midnight Riches is committed to responsible gaming. Learn about our tools for setting limits, self-exclusion, and resources for problem gambling.",
};

export default function ResponsibleGamingPage() {
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
            Responsible Gaming
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            Last updated: March 18, 2026
          </p>
        </header>

        <div className="space-y-8">
          {/* Introduction */}
          <section className="rounded-xl border border-[var(--glass-border)] bg-[var(--bg-card)] p-6 md:p-8">
            <p className="leading-relaxed text-[var(--text-secondary)]">
              Midnight Riches is committed to promoting responsible gaming and
              providing a safe, enjoyable entertainment experience for all
              players. Gambling should always be a form of leisure, not a source
              of income or a way to resolve financial difficulties. We provide
              tools, information, and support to help you stay in control.
            </p>
          </section>

          {/* Our Commitment */}
          <section className="rounded-xl border border-[var(--glass-border)] bg-[var(--bg-card)] p-6 md:p-8">
            <h2
              className="mb-4 text-2xl font-semibold text-[var(--text-primary)]"
              style={{ fontFamily: "var(--font-garamond)" }}
            >
              Our Commitment
            </h2>
            <div className="space-y-4 leading-relaxed text-[var(--text-secondary)]">
              <p>
                We take responsible gaming seriously and are dedicated to:
              </p>
              <ul className="ml-6 list-disc space-y-2">
                <li>Preventing underage gambling through strict age verification (18+).</li>
                <li>Providing effective tools to help players manage their gaming activity.</li>
                <li>Ensuring marketing is responsible and does not target vulnerable individuals.</li>
                <li>Training our staff to identify and assist players who may be experiencing gambling-related harm.</li>
                <li>Collaborating with industry organizations to uphold the highest standards of player protection.</li>
              </ul>
            </div>
          </section>

          {/* Setting Limits */}
          <section className="rounded-xl border border-[var(--glass-border)] bg-[var(--bg-card)] p-6 md:p-8">
            <h2
              className="mb-4 text-2xl font-semibold text-[var(--text-primary)]"
              style={{ fontFamily: "var(--font-garamond)" }}
            >
              Setting Limits
            </h2>
            <div className="space-y-6 leading-relaxed text-[var(--text-secondary)]">
              <p>
                We provide several tools in your{" "}
                <Link
                  href="/settings"
                  className="underline underline-offset-4 hover:text-[var(--text-primary)]"
                >
                  account settings
                </Link>{" "}
                to help you manage your play:
              </p>

              <div className="rounded-lg border border-[var(--glass-border)] bg-[var(--bg-secondary)] p-5">
                <h3 className="mb-2 text-lg font-medium text-[var(--text-primary)]">
                  Deposit Limits
                </h3>
                <p>
                  Set daily, weekly, or monthly caps on the amount you can
                  deposit into your account. Decreases to deposit limits take
                  effect immediately, while increases require a 24-hour cooling
                  period to prevent impulsive decisions.
                </p>
              </div>

              <div className="rounded-lg border border-[var(--glass-border)] bg-[var(--bg-secondary)] p-5">
                <h3 className="mb-2 text-lg font-medium text-[var(--text-primary)]">
                  Loss Limits
                </h3>
                <p>
                  Define the maximum amount you are willing to lose within a
                  given time period (daily, weekly, or monthly). Once your loss
                  limit is reached, you will be unable to place further bets
                  until the limit resets.
                </p>
              </div>

              <div className="rounded-lg border border-[var(--glass-border)] bg-[var(--bg-secondary)] p-5">
                <h3 className="mb-2 text-lg font-medium text-[var(--text-primary)]">
                  Session Time Limits
                </h3>
                <p>
                  Set a maximum duration for each gaming session. You will
                  receive notifications as you approach your time limit, and
                  gameplay will pause when the limit is reached. You can also
                  enable periodic reminders (e.g., every 30 or 60 minutes) to
                  help you stay aware of how long you have been playing.
                </p>
              </div>

              <div className="rounded-lg border border-[var(--glass-border)] bg-[var(--bg-secondary)] p-5">
                <h3 className="mb-2 text-lg font-medium text-[var(--text-primary)]">
                  Wager Limits
                </h3>
                <p>
                  Restrict the maximum amount you can wager per spin or per
                  session. This helps you maintain a comfortable betting level
                  and prevents impulsive high-stakes play.
                </p>
              </div>

              <p>
                You can configure all of these in your{" "}
                <Link
                  href="/settings"
                  className="underline underline-offset-4 hover:text-[var(--text-primary)]"
                >
                  account settings
                </Link>
                . Changes to limits that make them more restrictive take effect
                immediately.
              </p>
            </div>
          </section>

          {/* Self-Exclusion */}
          <section className="rounded-xl border border-[var(--glass-border)] bg-[var(--bg-card)] p-6 md:p-8">
            <h2
              className="mb-4 text-2xl font-semibold text-[var(--text-primary)]"
              style={{ fontFamily: "var(--font-garamond)" }}
            >
              Self-Exclusion
            </h2>
            <div className="space-y-4 leading-relaxed text-[var(--text-secondary)]">
              <p>
                If you feel you need a break from gambling, our self-exclusion
                program allows you to restrict access to your account:
              </p>

              <div className="space-y-4">
                <div className="rounded-lg border border-[var(--glass-border)] bg-[var(--bg-secondary)] p-5">
                  <h3 className="mb-2 text-lg font-medium text-[var(--text-primary)]">
                    Temporary Self-Exclusion
                  </h3>
                  <p>
                    Choose a cooling-off period of 24 hours, 7 days, 30 days,
                    or 90 days. During this period, you will be unable to log
                    in, place bets, or make deposits. The exclusion cannot be
                    reversed before the selected period ends.
                  </p>
                </div>

                <div className="rounded-lg border border-[var(--glass-border)] bg-[var(--bg-secondary)] p-5">
                  <h3 className="mb-2 text-lg font-medium text-[var(--text-primary)]">
                    Permanent Self-Exclusion
                  </h3>
                  <p>
                    Request permanent closure of your account. This action is
                    irreversible. Your account will be permanently deactivated,
                    and any remaining virtual currency balance will be
                    forfeited. You will not be able to create a new account. To
                    request permanent self-exclusion, contact our support team.
                  </p>
                </div>
              </div>

              <p>
                Self-exclusion can be activated from your{" "}
                <Link
                  href="/settings"
                  className="underline underline-offset-4 hover:text-[var(--text-primary)]"
                >
                  account settings
                </Link>{" "}
                or by contacting our support team at{" "}
                <a
                  href="mailto:support@midnightriches.com"
                  className="underline underline-offset-4 hover:text-[var(--text-primary)]"
                >
                  support@midnightriches.com
                </a>
                .
              </p>
            </div>
          </section>

          {/* Recognizing Problem Gambling */}
          <section className="rounded-xl border border-[var(--glass-border)] bg-[var(--bg-card)] p-6 md:p-8">
            <h2
              className="mb-4 text-2xl font-semibold text-[var(--text-primary)]"
              style={{ fontFamily: "var(--font-garamond)" }}
            >
              Recognizing Problem Gambling
            </h2>
            <div className="space-y-4 leading-relaxed text-[var(--text-secondary)]">
              <p>
                Problem gambling can develop gradually. If you recognize any of
                the following signs in yourself or someone you know, it may be
                time to seek help:
              </p>
              <ul className="ml-6 list-disc space-y-2">
                <li>Spending more money or time on gambling than you can afford.</li>
                <li>Chasing losses by increasing bets to try to recover previous losses.</li>
                <li>Gambling to escape problems, stress, or negative emotions.</li>
                <li>Lying to family, friends, or others about the extent of your gambling.</li>
                <li>Borrowing money, selling possessions, or neglecting bills to fund gambling.</li>
                <li>Feeling restless, irritable, or anxious when trying to reduce or stop gambling.</li>
                <li>Neglecting work, education, relationships, or personal responsibilities due to gambling.</li>
                <li>Experiencing repeated failed attempts to control, cut back, or stop gambling.</li>
                <li>Continuing to gamble despite persistent negative consequences.</li>
              </ul>
              <p>
                If any of these apply to you, we strongly encourage you to use
                our self-exclusion tools and reach out to one of the
                professional resources listed below.
              </p>
            </div>
          </section>

          {/* Resources */}
          <section className="rounded-xl border border-[var(--glass-border)] bg-[var(--bg-card)] p-6 md:p-8">
            <h2
              className="mb-4 text-2xl font-semibold text-[var(--text-primary)]"
              style={{ fontFamily: "var(--font-garamond)" }}
            >
              Support Resources
            </h2>
            <div className="space-y-6 leading-relaxed text-[var(--text-secondary)]">
              <p>
                The following organizations provide free, confidential support
                for individuals affected by problem gambling:
              </p>

              <div className="space-y-4">
                <div className="rounded-lg border border-[var(--glass-border)] bg-[var(--bg-secondary)] p-5">
                  <h3 className="mb-1 text-lg font-medium text-[var(--text-primary)]">
                    GamCare
                  </h3>
                  <p className="mb-2">
                    Free information, support, and counselling for problem
                    gambling.
                  </p>
                  <p className="text-sm text-[var(--text-muted)]">
                    Website:{" "}
                    <a
                      href="https://www.gamcare.org.uk"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-4 hover:text-[var(--text-primary)]"
                    >
                      www.gamcare.org.uk
                    </a>
                    <br />
                    Helpline: 0808 8020 133 (24/7)
                  </p>
                </div>

                <div className="rounded-lg border border-[var(--glass-border)] bg-[var(--bg-secondary)] p-5">
                  <h3 className="mb-1 text-lg font-medium text-[var(--text-primary)]">
                    BeGambleAware
                  </h3>
                  <p className="mb-2">
                    Provides information and advice to help people make
                    informed decisions about their gambling.
                  </p>
                  <p className="text-sm text-[var(--text-muted)]">
                    Website:{" "}
                    <a
                      href="https://www.begambleaware.org"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-4 hover:text-[var(--text-primary)]"
                    >
                      www.begambleaware.org
                    </a>
                    <br />
                    Helpline: 0808 8020 133
                  </p>
                </div>

                <div className="rounded-lg border border-[var(--glass-border)] bg-[var(--bg-secondary)] p-5">
                  <h3 className="mb-1 text-lg font-medium text-[var(--text-primary)]">
                    Gamblers Anonymous
                  </h3>
                  <p className="mb-2">
                    A fellowship of men and women who have joined together to
                    do something about their gambling problem and help others
                    do the same.
                  </p>
                  <p className="text-sm text-[var(--text-muted)]">
                    Website:{" "}
                    <a
                      href="https://www.gamblersanonymous.org"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-4 hover:text-[var(--text-primary)]"
                    >
                      www.gamblersanonymous.org
                    </a>
                  </p>
                </div>

                <div className="rounded-lg border border-[var(--glass-border)] bg-[var(--bg-secondary)] p-5">
                  <h3 className="mb-1 text-lg font-medium text-[var(--text-primary)]">
                    National Council on Problem Gambling (NCPG)
                  </h3>
                  <p className="mb-2">
                    The national advocate for programs and services to assist
                    problem gamblers and their families.
                  </p>
                  <p className="text-sm text-[var(--text-muted)]">
                    Website:{" "}
                    <a
                      href="https://www.ncpgambling.org"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-4 hover:text-[var(--text-primary)]"
                    >
                      www.ncpgambling.org
                    </a>
                    <br />
                    Helpline: 1-800-522-4700 (24/7)
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Tips for Responsible Play */}
          <section className="rounded-xl border border-[var(--glass-border)] bg-[var(--bg-card)] p-6 md:p-8">
            <h2
              className="mb-4 text-2xl font-semibold text-[var(--text-primary)]"
              style={{ fontFamily: "var(--font-garamond)" }}
            >
              Tips for Responsible Play
            </h2>
            <div className="space-y-4 leading-relaxed text-[var(--text-secondary)]">
              <ul className="ml-6 list-disc space-y-3">
                <li>
                  <strong>Set a budget before you play.</strong> Decide how much
                  you can comfortably afford to spend and stick to it. Never
                  gamble with money you cannot afford to lose.
                </li>
                <li>
                  <strong>Set a time limit.</strong> Use our session time limit
                  feature to manage how long you play. Take regular breaks.
                </li>
                <li>
                  <strong>Do not chase losses.</strong> Accept that losses are
                  part of gaming. Increasing bets to recover losses typically
                  leads to larger losses.
                </li>
                <li>
                  <strong>Treat gambling as entertainment.</strong> Think of
                  the cost of play as the price of entertainment, similar to
                  going to a movie or concert.
                </li>
                <li>
                  <strong>Do not gamble under the influence.</strong> Alcohol,
                  drugs, and strong emotions impair judgment and
                  decision-making.
                </li>
                <li>
                  <strong>Balance gambling with other activities.</strong>{" "}
                  Gambling should not be your primary form of recreation or
                  social interaction.
                </li>
                <li>
                  <strong>Know the odds.</strong> Understand that the house
                  always has an edge. Our{" "}
                  <Link
                    href="/legal/provably-fair"
                    className="underline underline-offset-4 hover:text-[var(--text-primary)]"
                  >
                    Provably Fair
                  </Link>{" "}
                  page explains how our games work.
                </li>
                <li>
                  <strong>Talk to someone.</strong> If gambling stops being fun,
                  talk to a friend, family member, or contact one of the support
                  organizations listed above.
                </li>
              </ul>
            </div>
          </section>

          {/* Age Verification */}
          <section className="rounded-xl border border-[var(--glass-border)] bg-[var(--bg-card)] p-6 md:p-8">
            <h2
              className="mb-4 text-2xl font-semibold text-[var(--text-primary)]"
              style={{ fontFamily: "var(--font-garamond)" }}
            >
              Age Verification
            </h2>
            <div className="space-y-4 leading-relaxed text-[var(--text-secondary)]">
              <p>
                You must be at least 18 years of age (or the legal gambling age
                in your jurisdiction, whichever is higher) to use Midnight
                Riches. We enforce this through:
              </p>
              <ul className="ml-6 list-disc space-y-2">
                <li>Mandatory date of birth verification during account registration.</li>
                <li>Identity verification checks that may require government-issued photo ID.</li>
                <li>Ongoing monitoring and the right to request additional verification at any time.</li>
              </ul>
              <p>
                Accounts found to belong to underage individuals will be
                immediately suspended and closed, and any virtual currency
                balance will be forfeited.
              </p>
            </div>
          </section>

          {/* Contact Support */}
          <section className="rounded-xl border border-[var(--glass-border)] bg-[var(--bg-card)] p-6 md:p-8">
            <h2
              className="mb-4 text-2xl font-semibold text-[var(--text-primary)]"
              style={{ fontFamily: "var(--font-garamond)" }}
            >
              Contact Support
            </h2>
            <div className="space-y-4 leading-relaxed text-[var(--text-secondary)]">
              <p>
                If you need help with responsible gaming features, want to set
                limits, or wish to discuss self-exclusion options, our support
                team is here for you:
              </p>
              <ul className="ml-6 list-disc space-y-2">
                <li>
                  Email:{" "}
                  <a
                    href="mailto:support@midnightriches.com"
                    className="underline underline-offset-4 hover:text-[var(--text-primary)]"
                  >
                    support@midnightriches.com
                  </a>
                </li>
                <li>
                  Responsible gaming inquiries:{" "}
                  <a
                    href="mailto:responsible@midnightriches.com"
                    className="underline underline-offset-4 hover:text-[var(--text-primary)]"
                  >
                    responsible@midnightriches.com
                  </a>
                </li>
              </ul>
              <p>
                You can also manage your limits and self-exclusion preferences
                directly from your{" "}
                <Link
                  href="/settings"
                  className="underline underline-offset-4 hover:text-[var(--text-primary)]"
                >
                  account settings
                </Link>
                .
              </p>
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
