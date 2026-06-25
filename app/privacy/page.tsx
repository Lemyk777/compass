import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/legal/LegalPage";

const CONTACT_EMAIL = "alibek196u@gmail.com";
const UPDATED = "June 25, 2026";

export const metadata: Metadata = {
  title: "Privacy Policy — Compass",
  description:
    "How Compass collects, uses, and protects the information you provide when assessing your university admissions profile.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated={UPDATED}>
      <p>
        This Privacy Policy explains how Compass (&ldquo;Compass,&rdquo;
        &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) collects, uses,
        and protects information when you use our website and services (the
        &ldquo;Service&rdquo;). Compass helps internationally-based students
        assess and improve their applications to universities in the US, Italy,
        and Hong Kong. By using the Service, you agree to the practices described
        here.
      </p>

      <LegalSection heading="1. Information we collect">
        <p>We collect the following categories of information:</p>
        <ul>
          <li>
            <strong>Account information.</strong> When you create an account, we
            collect your email address and authentication details through our
            authentication provider.
          </li>
          <li>
            <strong>Profile information you provide.</strong> To generate your
            report, you submit details about your academic background (such as
            grades, GPA or grading scale, and standardized test scores),
            extracurricular activities, honors and awards, country or region,
            and the universities or programs you are interested in.
          </li>
          <li>
            <strong>Generated analysis.</strong> The factor scores, benchmarks,
            and recommendations produced for your profile are stored so you can
            return to your report.
          </li>
          <li>
            <strong>Referral information.</strong> If you arrive through an
            ambassador referral link, we record the referral code (not personal
            data) to attribute the signup.
          </li>
          <li>
            <strong>Technical and usage data.</strong> Basic technical
            information needed to operate the Service securely, such as cookies
            used for authentication and session management.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="2. How we use your information">
        <p>We use the information we collect to:</p>
        <ul>
          <li>Provide, maintain, and improve the Service;</li>
          <li>
            Generate your personalized admissions assessment and report;
          </li>
          <li>Authenticate you and keep your account secure;</li>
          <li>
            Operate the ambassador referral program and attribute signups; and
          </li>
          <li>
            Monitor usage to prevent abuse, enforce rate limits, and manage
            costs.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="3. Service providers and third parties">
        <p>
          We rely on a small number of trusted service providers to operate the
          Service. These providers process data only on our behalf and according
          to our instructions:
        </p>
        <ul>
          <li>
            <strong>Hosting and database.</strong> Our application, database,
            and authentication are hosted with our infrastructure and database
            providers, which store your account and profile data.
          </li>
          <li>
            <strong>AI analysis.</strong> To produce your report, the profile
            details you submit are sent to our AI provider (Anthropic) for
            processing. This data is used to generate your assessment and is not
            used by us to train AI models.
          </li>
        </ul>
        <p>
          We do not sell your personal information, and we do not share it with
          third parties for their own marketing.
        </p>
      </LegalSection>

      <LegalSection heading="4. Cookies">
        <p>
          We use cookies that are necessary for the Service to function —
          primarily to keep you signed in and to remember an ambassador referral
          code through the signup process. We do not use cookies for
          advertising.
        </p>
      </LegalSection>

      <LegalSection heading="5. Data retention">
        <p>
          We retain your account and profile information for as long as your
          account is active or as needed to provide the Service. You may request
          deletion of your account and associated data at any time by contacting
          us at the address below.
        </p>
      </LegalSection>

      <LegalSection heading="6. Data security">
        <p>
          We take reasonable technical and organizational measures to protect
          your information, including row-level access controls so that each
          user can access only their own data. No method of transmission or
          storage is completely secure, however, and we cannot guarantee
          absolute security.
        </p>
      </LegalSection>

      <LegalSection heading="7. Your rights">
        <p>
          Depending on your location, you may have the right to access, correct,
          export, or delete your personal information, and to object to or
          restrict certain processing. To exercise these rights, contact us at
          the address below and we will respond in accordance with applicable
          law.
        </p>
      </LegalSection>

      <LegalSection heading="8. Children's privacy">
        <p>
          The Service is intended for students who are applying to university.
          If you are under the age of majority in your jurisdiction, you should
          use the Service only with the involvement of a parent or guardian. We
          do not knowingly collect data from children in a manner prohibited by
          applicable law.
        </p>
      </LegalSection>

      <LegalSection heading="9. International users">
        <p>
          The Service is offered to internationally-based students, and your
          information may be processed in countries other than your own,
          including by the service providers described above. By using the
          Service, you consent to this processing.
        </p>
      </LegalSection>

      <LegalSection heading="10. Changes to this policy">
        <p>
          We may update this Privacy Policy from time to time. When we do, we
          will revise the &ldquo;Last updated&rdquo; date above. Your continued
          use of the Service after a change takes effect constitutes acceptance
          of the updated policy.
        </p>
      </LegalSection>

      <LegalSection heading="11. Contact us">
        <p>
          If you have questions about this Privacy Policy or how we handle your
          information, contact us at{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
