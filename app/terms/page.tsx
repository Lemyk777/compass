import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/legal/LegalPage";

const CONTACT_EMAIL = "alibek196u@gmail.com";
const UPDATED = "June 25, 2026";

export const metadata: Metadata = {
  title: "Terms of Use — Compass",
  description:
    "The terms that govern your use of Compass, an AI-assisted university admissions guidance tool.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Use" updated={UPDATED}>
      <p>
        These Terms of Use (&ldquo;Terms&rdquo;) govern your access to and use of
        Compass (the &ldquo;Service&rdquo;). Compass (&ldquo;Compass,&rdquo;
        &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) is an
        independent project operated by individuals based in the Republic of
        Kazakhstan; it is not a registered company. By creating an account or
        using the Service, you agree to these Terms. If you do not agree, do not
        use the Service.
      </p>

      <LegalSection heading="1. The Service">
        <p>
          Compass provides AI-assisted, data-driven guidance to help
          internationally-based students assess and improve their applications to
          universities in the US, Italy, and Hong Kong. The Service produces
          factor scores, benchmarks, likelihood ranges, and recommendations based
          on the information you provide.
        </p>
      </LegalSection>

      <LegalSection heading="2. Guidance, not guarantees">
        <p>
          <strong>
            Compass provides informational guidance only. It is not admissions
            advice from any university, and it does not guarantee admission to
            any program or institution.
          </strong>{" "}
          Likelihood ranges and scores are estimates generated from the data you
          submit and from general benchmarks; they are inherently uncertain and
          may not reflect the actual decisions of any admissions committee.
          Admissions outcomes depend on many factors outside our knowledge and
          control. You are responsible for your own application decisions.
        </p>
      </LegalSection>

      <LegalSection heading="3. Eligibility and accounts">
        <p>
          You must provide accurate information when creating an account and keep
          your login credentials secure. You are responsible for all activity
          that occurs under your account. You must have the legal capacity to
          enter into these Terms in your jurisdiction; if you are a minor, you may
          use the Service only with the involvement of a parent or guardian.
        </p>
      </LegalSection>

      <LegalSection heading="4. Acceptable use">
        <p>You agree not to:</p>
        <ul>
          <li>
            Submit false, misleading, or fraudulent information through the
            Service;
          </li>
          <li>
            Use the Service for any unlawful purpose or in violation of these
            Terms;
          </li>
          <li>
            Attempt to disrupt, overload, reverse-engineer, or circumvent the
            security, rate limits, or access controls of the Service;
          </li>
          <li>
            Use automated means to access the Service in a way that imposes an
            unreasonable load; or
          </li>
          <li>
            Resell, redistribute, or commercially exploit the Service or its
            output without our permission.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="5. Your content">
        <p>
          You retain ownership of the information you submit (&ldquo;Your
          Content&rdquo;). You grant us a limited license to use, process, and
          store Your Content for the purpose of operating and improving the
          Service and generating your report, including by sending it to the
          service providers described in our{" "}
          <a href="/privacy">Privacy Policy</a>. You represent that you have the
          right to submit Your Content.
        </p>
      </LegalSection>

      <LegalSection heading="6. Ambassador program">
        <p>
          If you participate in the ambassador referral program, you agree to
          promote the Service honestly and lawfully, without spam or misleading
          claims. We may modify or end the program, or withhold attribution for
          activity we reasonably believe to be fraudulent, at our discretion.
        </p>
      </LegalSection>

      <LegalSection heading="7. Intellectual property">
        <p>
          The Service, including its software, design, text, and branding, is
          owned by the operators of Compass and protected by applicable
          intellectual property laws. Except for Your Content, no rights are
          granted to you other than the limited right to use the Service in
          accordance with these Terms.
        </p>
      </LegalSection>

      <LegalSection heading="8. Disclaimers">
        <p>
          The Service is provided &ldquo;as is&rdquo; and &ldquo;as
          available,&rdquo; without warranties of any kind, whether express or
          implied, including warranties of merchantability, fitness for a
          particular purpose, accuracy, and non-infringement. We do not warrant
          that the Service will be uninterrupted, error-free, or that any
          assessment will be accurate or complete.
        </p>
      </LegalSection>

      <LegalSection heading="9. Limitation of liability">
        <p>
          To the maximum extent permitted by law, Compass and its operators will
          not be liable for any indirect, incidental, special, consequential, or
          punitive damages, or for any loss of opportunity, admission, data, or
          profits, arising out of or related to your use of the Service — even if
          advised of the possibility of such damages.
        </p>
      </LegalSection>

      <LegalSection heading="10. Termination">
        <p>
          You may stop using the Service at any time. We may suspend or terminate
          your access if you violate these Terms or use the Service in a way that
          could harm Compass, other users, or third parties. Sections that by
          their nature should survive termination will survive.
        </p>
      </LegalSection>

      <LegalSection heading="11. Changes to these Terms">
        <p>
          We may update these Terms from time to time. When we do, we will revise
          the &ldquo;Last updated&rdquo; date above. Your continued use of the
          Service after a change takes effect constitutes acceptance of the
          updated Terms.
        </p>
      </LegalSection>

      <LegalSection heading="12. Governing law">
        <p>
          These Terms are governed by the laws of the Republic of Kazakhstan,
          without regard to conflict-of-law rules. Any dispute arising out of or
          relating to the Service or these Terms will be subject to the
          jurisdiction of the courts of the Republic of Kazakhstan, except where
          mandatory consumer-protection law in your country of residence grants
          you the right to bring proceedings locally.
        </p>
      </LegalSection>

      <LegalSection heading="13. Contact us">
        <p>
          Questions about these Terms? Contact us at{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
