// FAQ data — structured for FAQPage JSON-LD so Google + ChatGPT + Perplexity
// can quote answers directly. Keep questions specific and answers <= 3 sentences.
export const faqGroups = [
  {
    name: 'Ordering & Payment',
    items: [
      {
        q: 'How do I place an order on Maxx?',
        a: 'Browse the shop, add items to your cart, click Checkout, fill in your shipping details, choose Cash on Delivery or Bank Transfer, and place the order. You will get a confirmation email within a few hours.'
      },
      {
        q: 'What payment methods do you accept?',
        a: 'We accept two payment methods: Cash on Delivery (pay the courier when your parcel arrives) and Bank Transfer (transfer to our Meezan Bank account before dispatch). We do not accept credit cards or mobile wallets at the moment.'
      },
      {
        q: 'Is Cash on Delivery free in Pakistan?',
        a: 'Yes. Standard delivery is completely free across Pakistan with no minimum order. You only pay the price of your items.'
      },
      {
        q: 'What is Delivery with Allow-to-Open?',
        a: 'For a flat Rs. 300 extra, our courier will let you open and inspect the parcel BEFORE you pay. If something is wrong, you can refuse the parcel and pay nothing. This is the safest option for first-time customers.'
      }
    ]
  },
  {
    name: 'Shipping & Delivery',
    items: [
      {
        q: 'How long does delivery take?',
        a: 'Standard delivery is 2-4 working days across Pakistan. Major cities like Lahore, Karachi, Islamabad, Faisalabad and Multan usually receive orders in 2 days. Smaller towns and remote areas may take 3-4 days.'
      },
      {
        q: 'Do you deliver to my city?',
        a: 'Yes. We deliver to every district in Pakistan via our courier partners (M&P, TCS, Leopards, BlueEX). If your area is hard-to-reach, we will email you before dispatch to confirm.'
      },
      {
        q: 'How can I track my order?',
        a: 'Visit the Track Order page on Maxx and enter your order number (e.g. ARS-1024). You will see live status from Processing to Out for Delivery to Delivered.'
      },
      {
        q: 'Can I change my delivery address after ordering?',
        a: 'Yes, if the order has not yet been dispatched. Email support@maxxdegree.com immediately with your order number.'
      }
    ]
  },
  {
    name: 'Returns & Refunds',
    items: [
      {
        q: 'What is your return policy?',
        a: 'You have 7 days from delivery to request a return for any unused item in its original packaging. We arrange free pickup and either replace the item or refund you - your choice.'
      },
      {
        q: 'My product arrived damaged. What do I do?',
        a: 'File a complaint at /complaint or email photos of the damaged item to support@maxxdegree.com within 48 hours of delivery. We replace damaged items free of cost.'
      },
      {
        q: 'How long do refunds take?',
        a: 'Refunds are issued via the same payment method. Bank Transfer refunds clear in 1-3 working days. For COD orders we offer either store credit (instant) or a JazzCash / Easypaisa transfer (1-2 days).'
      }
    ]
  },
  {
    name: 'Products & Quality',
    items: [
      {
        q: 'Are your products original?',
        a: 'Yes. Every product is verified before it ships from our Kharian warehouse. Branded electronics come with manufacturer warranty cards where applicable.'
      },
      {
        q: 'Do products come with a warranty?',
        a: 'Most electronics and appliances come with 6-month to 1-year manufacturer warranty. The warranty period is listed in the Specifications section of each product page.'
      },
      {
        q: 'Are your imported products genuine?',
        a: 'Yes. We work with verified importers and the import paperwork is available on request. If you receive a counterfeit, we offer a full refund plus an additional Rs. 1,000 store credit as our guarantee.'
      }
    ]
  },
  {
    name: 'Account & Support',
    items: [
      {
        q: 'Do I need an account to order?',
        a: 'No. You can checkout as a guest. Creating an account just lets you track orders, save addresses, and reorder faster.'
      },
      {
        q: 'How do I contact customer support?',
        a: 'Email support@maxxdegree.com or use the complaint form for formal tickets. We reply within 24 hours, usually within a few hours during business time.'
      },
      {
        q: 'Where is Maxx located?',
        a: 'Our flagship store is near Sherreen Masjid in Main Bazar, Kharian, Punjab. We are open 7 days a week from 10am to 10pm. You can visit us in person or order online for delivery.'
      },
      {
        q: 'Do you offer B2B / bulk pricing?',
        a: 'Yes. For bulk orders (10+ units) or B2B retail partnerships, message us on LinkedIn at linkedin.com/company/maxx-shopping or email support@maxxdegree.com with your requirement.'
      }
    ]
  }
];

// Flatten for FAQPage schema
export const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqGroups.flatMap((g) =>
    g.items.map((it) => ({
      '@type': 'Question',
      name: it.q,
      acceptedAnswer: { '@type': 'Answer', text: it.a }
    }))
  )
};
