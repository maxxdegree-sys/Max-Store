import Breadcrumbs from '../components/ui/Breadcrumbs';
import SEO from '../components/seo/SEO';
import { BUSINESS } from '../utils/format';

export default function PrivacyPolicy() {
  return (
    <>
      <SEO title="Privacy Policy" />
      <Breadcrumbs items={[{ label: 'Privacy Policy' }]} />
      <article className="container-px pb-14 prose prose-sm sm:prose max-w-3xl dark:prose-invert">
        <h1>Privacy Policy</h1>
        <p className="text-ink-500">Last updated: May 2026</p>
        <p>
          Maxx (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) respects your privacy. This policy explains what information
          we collect, how we use it, and the choices you have. By using Maxx you agree to this policy.
        </p>

        <Section title="1. Information we collect">
          <ul>
            <li><b>Account info:</b> name, email, phone, password.</li>
            <li><b>Order info:</b> shipping address, payment method (we don&apos;t store full card numbers).</li>
            <li><b>Usage:</b> browsing, device, analytics events (Google Analytics, Meta Pixel).</li>
          </ul>
        </Section>

        <Section title="2. How we use it">
          <ul>
            <li>Fulfilling orders and providing customer support.</li>
            <li>Personalizing offers and product recommendations.</li>
            <li>Fraud prevention and legal compliance.</li>
          </ul>
        </Section>

        <Section title="3. Sharing">
          <p>We share data only with: courier partners (for delivery), payment processors (for transactions), and analytics vendors. We never sell your data.</p>
        </Section>

        <Section title="4. Your rights">
          <p>You can request access, correction or deletion of your data anytime by emailing {BUSINESS.email}.</p>
        </Section>

        <Section title="5. Cookies">
          <p>We use cookies for session management, cart persistence, and analytics. You can disable cookies in your browser, but some features may not work.</p>
        </Section>

        <Section title="6. Contact">
          <p>For privacy questions write to <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a>.</p>
        </Section>
      </article>
    </>
  );
}

function Section({ title, children }) {
  return (
    <section>
      <h2 className="mt-6">{title}</h2>
      {children}
    </section>
  );
}
