// Seed complaint tickets for development/demo.
// status: 'new' | 'in-progress' | 'awaiting-customer' | 'resolved' | 'closed'
// priority: 'low' | 'normal' | 'high' | 'urgent'
// kind: 'product-issue' | 'delivery' | 'refund' | 'wrong-item' | 'damaged' | 'other'
export const complaints = [
  {
    id: 'AR-2026-0001',
    orderId: 'ARS-1024',
    productId: 'p4',
    name: 'Asma Riaz',
    email: 'asma.riaz@example.com',
    phone: '+92 300 1234567',
    city: 'Lahore',
    kind: 'damaged',
    subject: 'Plate broken on arrival',
    message: 'One dinner plate in the 72-piece bone china set arrived broken. Packaging looked OK from outside. Please advise on a replacement.',
    status: 'in-progress',
    priority: 'high',
    date: '2026-05-15',
    replies: [
      { who: 'Maxx Support', date: '2026-05-15', text: 'We are sorry for the inconvenience. Please email a clear photo of the broken plate to support@maxxdegree.com and we will arrange a free replacement.' },
      { who: 'Customer',          date: '2026-05-16', text: 'Photo shared. Thank you for the quick reply.' }
    ],
    internalNotes: 'Replacement piece dispatched from inventory bay B-12 on 2026-05-17.'
  },
  {
    id: 'AR-2026-0002',
    orderId: 'ARS-1018',
    productId: 'p7',
    name: 'Hamza Sheikh',
    email: 'hamza.sheikh@example.com',
    phone: '+92 312 9876543',
    city: 'Islamabad',
    kind: 'product-issue',
    subject: 'Earbuds left side not charging',
    message: 'The left earbud stopped charging after 5 days. Right one works fine. Need replacement under warranty.',
    status: 'new',
    priority: 'normal',
    date: '2026-05-17',
    replies: [],
    internalNotes: ''
  },
  {
    id: 'AR-2026-0003',
    orderId: 'ARS-1022',
    productId: 'p10',
    name: 'Saira Khan',
    email: 'saira.k@example.com',
    phone: '+92 333 1112233',
    city: 'Karachi',
    kind: 'wrong-item',
    subject: 'Wrong color bedsheet delivered',
    message: 'I ordered beige but received light pink. Please arrange return and send the correct color.',
    status: 'resolved',
    priority: 'normal',
    date: '2026-05-10',
    replies: [
      { who: 'Maxx Support', date: '2026-05-10', text: 'Apologies for the mix-up. Our rider will pick up the wrong sheet on 2026-05-12 and deliver the correct beige one at the same time. No charge.' },
      { who: 'Customer',          date: '2026-05-13', text: 'Received the correct one. Thank you for resolving quickly!' }
    ],
    internalNotes: 'Picker training note: confirm color attribute on bedsheet pick list.'
  }
];

export const COMPLAINT_KINDS = [
  { value: 'product-issue', label: 'Product not working / defective' },
  { value: 'damaged',       label: 'Product arrived damaged' },
  { value: 'wrong-item',    label: 'Wrong item / color / size delivered' },
  { value: 'delivery',      label: 'Delivery problem (delayed / not received)' },
  { value: 'refund',        label: 'Refund / return request' },
  { value: 'other',         label: 'Other' }
];

export const COMPLAINT_STATUSES = ['new', 'in-progress', 'awaiting-customer', 'resolved', 'closed'];
export const COMPLAINT_PRIORITIES = ['low', 'normal', 'high', 'urgent'];
