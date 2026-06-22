import Breadcrumbs from '../components/ui/Breadcrumbs';
import SEO from '../components/seo/SEO';

export default function Terms() {
  return (
    <>
      <SEO title="Terms & Conditions" />
      <Breadcrumbs items={[{ label: 'Terms & Conditions' }]} />
      <article className="container-px pb-14 prose prose-sm sm:prose max-w-3xl dark:prose-invert">
        <h1>Terms &amp; Conditions</h1>
        <p className="text-ink-500">Last updated: May 2026</p>
        <p>By placing an order on Maxx you agree to the following terms.</p>

        <Section title="Orders">
          <p>All orders are subject to product availability and confirmation of the order price. We reserve the right to refuse any order.</p>
        </Section>

        <Section title="Pricing & Payments">
          <p>Prices are in PKR and inclusive of applicable taxes unless stated otherwise. Payment options are Cash on Delivery (COD) and Bank Transfer.</p>
        </Section>

        <Section title="Shipping">
          <p>Standard delivery is free across Pakistan and arrives in 2-4 business days. An optional Allow-to-Open delivery service (which lets you inspect the parcel before paying) is available for a flat Rs. 300.</p>
        </Section>

        <Section title="Returns & Refunds">
          <p>7-day no-questions-asked returns from the date of delivery for unused items in original packaging. Refunds via the same payment method or store credit.</p>
        </Section>

        <Section title="Limitation of liability">
          <p>Maxx is not liable for indirect, incidental, or consequential damages arising out of use of the website.</p>
        </Section>

        <Section title="Governing law">
          <p>These terms are governed by the laws of the Islamic Republic of Pakistan. Any disputes shall be subject to the exclusive jurisdiction of courts in Gujrat District.</p>
        </Section>
      </article>
    </>
  );
}

function Section({ title, children }) {
  return (<><h2 className="mt-6">{title}</h2>{children}</>);
}
