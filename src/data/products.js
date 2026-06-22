// Demo product catalog (24 SKUs across all categories).
// Image URLs use Unsplash; swap for production assets.
const img = (path) => `https://images.unsplash.com/${path}?w=800&q=80&auto=format&fit=crop`;

export const products = [
  // KITCHEN APPLIANCES
  {
    id: 'p1', slug: 'national-deluxe-blender-3in1', title: 'National Deluxe Blender 3-in-1 (700W)',
    price: 6499, mrp: 9999, rating: 4.6, reviews: 248, stock: 32, sold: 1240,
    category: 'kitchen-appliances', brand: 'National',
    images: [img('photo-1570194065650-d99fb4b8ccb9'), img('photo-1556910103-1c02745aae4d'), img('photo-1583394838336-acd977736f90')],
    short: '3-in-1 jar set with stainless steel blades. Ideal for shakes, chutneys & dry grinding.',
    description: 'The National Deluxe Blender delivers powerful 700W performance with three premium jars. Stainless steel blades, anti-slip base, and overload protection make it the perfect everyday kitchen partner.',
    specs: { Power: '700W', Jars: '3', Warranty: '1 Year', Voltage: '220V' },
    tags: ['flash-sale', 'best-seller', 'featured'], variants: ['White', 'Black']
  },
  {
    id: 'p2', slug: 'philips-electric-kettle-18l', title: 'Philips Electric Kettle 1.8L Premium',
    price: 4299, mrp: 5499, rating: 4.7, reviews: 184, stock: 21, sold: 720,
    category: 'kitchen-appliances', brand: 'Philips',
    images: [img('photo-1556910096-6f5e72db6803'), img('photo-1571175443880-49e1d25b2bc5'), img('photo-1574269909862-7e1d70bb8078')],
    short: '1.8L cordless electric kettle with auto shut-off.',
    description: 'Premium stainless steel finish, auto cut-off when water boils, dry-boil protection, and a fast 2200W heating element.',
    specs: { Capacity: '1.8L', Power: '2200W', Material: 'Stainless Steel', Warranty: '1 Year' },
    tags: ['featured', 'trending']
  },
  {
    id: 'p3', slug: 'anex-sandwich-maker-deluxe', title: 'Anex Deluxe Sandwich Maker (4 Slice)',
    price: 3499, mrp: 4999, rating: 4.4, reviews: 96, stock: 18, sold: 412,
    category: 'kitchen-appliances', brand: 'Anex',
    images: [img('photo-1528712306091-ed0763094c98'), img('photo-1571115764595-644a1f56a55c'), img('photo-1556909114-44e3e70034e2')],
    short: 'Non-stick 4-slice sandwich maker with cool-touch handle.',
    description: 'Bake perfect golden sandwiches in minutes. Non-stick plates, indicator lights, locking handle.',
    specs: { Slices: '4', Power: '750W', Warranty: '6 Months' }, tags: ['new-arrival']
  },

  // CROCKERY
  {
    id: 'p4', slug: 'royal-bone-china-dinner-set-72pc', title: 'Royal Bone China Dinner Set (72 Pieces)',
    price: 18999, mrp: 27999, rating: 4.8, reviews: 312, stock: 8, sold: 580,
    category: 'crockery', brand: 'Royal Albert',
    images: [img('photo-1578749556568-bc2c40e68b61'), img('photo-1610701596007-11502861dcfa'), img('photo-1593618998160-e34014e67546')],
    short: 'Elegant 72-piece bone china dinner set with gold rim.',
    description: 'Premium fine bone china set crafted for families that love to host. Includes plates, bowls, mugs and serveware. Dishwasher safe.',
    specs: { Pieces: '72', Material: 'Bone China', Microwave: 'Safe', Dishwasher: 'Safe' },
    tags: ['flash-sale', 'best-seller']
  },
  {
    id: 'p5', slug: 'glass-tumbler-set-of-6', title: 'Premium Glass Tumbler Set (Pack of 6)',
    price: 1499, mrp: 2299, rating: 4.5, reviews: 142, stock: 50, sold: 980,
    category: 'crockery', brand: 'Maxx',
    images: [img('photo-1551024601-bec78aea704b'), img('photo-1556909011-7309f48f79b6'), img('photo-1551734413-7c80b9fb59f9')],
    short: 'Heavy-base crystal glass tumblers, set of 6.',
    description: 'Lead-free crystal-clear glass with a heavy base for stability. Dishwasher safe and chip resistant.',
    specs: { Pieces: '6', Capacity: '300ml each', Material: 'Crystal Glass' },
    tags: ['trending']
  },
  {
    id: 'p6', slug: 'ceramic-tea-set-12pc', title: 'Ceramic Tea Set Premium (12 pcs)',
    price: 4499, mrp: 6499, rating: 4.6, reviews: 89, stock: 14, sold: 230,
    category: 'crockery', brand: 'Imported',
    images: [img('photo-1593618998160-e34014e67546'), img('photo-1610632380989-680fe40816c6'), img('photo-1578749556568-bc2c40e68b61')],
    short: 'Hand-painted ceramic tea set — teapot, cups & saucers.',
    description: 'Classic ceramic tea set with hand-painted detailing. Premium presentation perfect for guests and gifting.',
    specs: { Pieces: '12', Material: 'Ceramic', Origin: 'Imported' }, tags: ['gift-pick']
  },

  // ELECTRONICS
  {
    id: 'p7', slug: 'wireless-earbuds-pro-anc', title: 'Wireless Earbuds Pro with ANC',
    price: 5999, mrp: 9999, rating: 4.5, reviews: 526, stock: 64, sold: 2310,
    category: 'electronics', brand: 'SoundMax',
    images: [img('photo-1606220588913-b3aacb4d2f46'), img('photo-1590658268037-6bf12165a8df'), img('photo-1572569511254-d8f925fe2cbb')],
    short: 'Active noise cancellation, 30hr playtime, IPX5.',
    description: 'Premium-tier TWS earbuds with ANC, deep bass tuning, ultra-low latency gaming mode, and 30 hours of total playback with the case.',
    specs: { Bluetooth: '5.3', Battery: '30 hrs total', Charging: 'USB-C', Waterproof: 'IPX5' },
    tags: ['flash-sale', 'featured', 'best-seller']
  },
  {
    id: 'p8', slug: 'smart-watch-fitness-pro', title: 'Smart Watch Fitness Pro (1.9" AMOLED)',
    price: 4499, mrp: 7499, rating: 4.4, reviews: 314, stock: 40, sold: 1108,
    category: 'electronics', brand: 'FitTrack',
    images: [img('photo-1523275335684-37898b6baf30'), img('photo-1542728928-1413d1894ed1'), img('photo-1579586337278-3befd40fd17a')],
    short: 'BT calling, 100+ sports modes, heart rate & SpO2.',
    description: 'Premium AMOLED smart watch with Bluetooth calling, fitness tracking, and 7-day battery. Made for active Pakistani lifestyle.',
    specs: { Display: '1.9" AMOLED', Battery: '7 days', Strap: 'Silicone', Compatible: 'Android/iOS' },
    tags: ['new-arrival', 'trending']
  },
  {
    id: 'p9', slug: 'led-strip-rgb-5m-app', title: 'Smart RGB LED Strip 5M (App Controlled)',
    price: 1899, mrp: 2999, rating: 4.6, reviews: 211, stock: 90, sold: 1600,
    category: 'electronics', brand: 'Glow+',
    images: [img('photo-1558002038-1055907df827'), img('photo-1493932484895-752d1471eab5'), img('photo-1555041469-a586c61ea9bc')],
    short: '16M colors, music sync, voice & app control.',
    description: 'Set the mood — control colors, scenes and brightness from your phone. Music sync and voice assistant compatible.',
    specs: { Length: '5 meters', Control: 'App + Remote', Power: '12V Adapter' },
    tags: ['trending', 'best-seller']
  },

  // HOME ESSENTIALS
  {
    id: 'p10', slug: 'cotton-bedsheet-king-size', title: 'Premium Cotton Bedsheet King Size + 2 Pillow Covers',
    price: 3299, mrp: 4999, rating: 4.7, reviews: 184, stock: 35, sold: 642,
    category: 'home-essentials', brand: 'Maxx',
    images: [img('photo-1505693416388-ac5ce068fe85'), img('photo-1631049307264-da0ec9d70304'), img('photo-1522771739844-6a9f6d5f14af')],
    short: '300 thread count premium cotton, soft & breathable.',
    description: 'Ultra-soft 100% cotton king-size bedsheet with two pillow covers. Pre-shrunk fabric for long-lasting fit and feel.',
    specs: { Size: 'King', Material: '100% Cotton', Thread: '300 TC', Includes: 'Sheet + 2 Pillow Covers' },
    tags: ['featured']
  },
  {
    id: 'p11', slug: 'air-freshener-aroma-diffuser', title: 'Aroma Diffuser with LED Mood Lights',
    price: 2499, mrp: 3999, rating: 4.5, reviews: 96, stock: 45, sold: 380,
    category: 'home-essentials', brand: 'Aura',
    images: [img('photo-1545262810-77515befe149'), img('photo-1620916566398-39f1143ab7be'), img('photo-1593842823560-e2bc60b0f6c2')],
    short: 'Ultrasonic essential oil diffuser, 7-color LED.',
    description: 'Whisper-quiet ultrasonic diffuser with 7 mood lighting colors. Auto-off when water runs low.',
    specs: { Capacity: '300ml', Runtime: '6-8 hrs', LED: '7 colors' }, tags: ['new-arrival']
  },
  {
    id: 'p12', slug: 'door-mat-anti-slip-premium', title: 'Premium Anti-Slip Door Mat (Pack of 2)',
    price: 999, mrp: 1499, rating: 4.3, reviews: 76, stock: 120, sold: 510,
    category: 'home-essentials', brand: 'Maxx',
    images: [img('photo-1556909114-44e3e70034e2'), img('photo-1581578731548-c64695cc6952'), img('photo-1505691938895-1758d7feb511')],
    short: 'Heavy-duty rubber backing, machine washable.',
    description: 'Thick microfiber door mats with strong rubber backing. Trap dust and water effectively. Set of 2.',
    specs: { Size: '40x60cm', Pack: '2', Material: 'Microfiber + Rubber' }, tags: ['trending']
  },

  // BEAUTY PRODUCTS
  {
    id: 'p13', slug: 'glow-vitamin-c-serum-30ml', title: 'Glow Vitamin C Brightening Serum (30ml)',
    price: 1799, mrp: 2999, rating: 4.6, reviews: 421, stock: 60, sold: 1800,
    category: 'beauty-products', brand: 'GlowLab',
    images: [img('photo-1556228720-195a672e8a03'), img('photo-1571781926291-c477ebfd024b'), img('photo-1522335789203-aaa44ff7ce06')],
    short: 'Vitamin C + Hyaluronic Acid for radiant skin.',
    description: 'Daily-use brightening serum with 20% Vitamin C, Hyaluronic Acid and Niacinamide. Suitable for all skin types.',
    specs: { Size: '30ml', SkinType: 'All', Cruelty: 'Free' }, tags: ['flash-sale', 'best-seller']
  },
  {
    id: 'p14', slug: 'hair-dryer-2200w-ionic', title: 'Ionic Hair Dryer 2200W (Salon Pro)',
    price: 4499, mrp: 6999, rating: 4.5, reviews: 187, stock: 28, sold: 420,
    category: 'beauty-products', brand: 'Remi',
    images: [img('photo-1522338242992-e1a54906a8da'), img('photo-1610630635320-6dcfb0e23a0d'), img('photo-1502720433255-614171a1835e')],
    short: '3 heat + 2 speed settings, cool shot, ionic care.',
    description: 'Professional 2200W ionic hair dryer with concentrator and diffuser. Reduces frizz and adds shine.',
    specs: { Power: '2200W', Settings: '3 Heat / 2 Speed', Warranty: '1 Year' }, tags: ['featured']
  },

  // DAILY USE ITEMS
  {
    id: 'p15', slug: 'stainless-water-bottle-1l', title: 'Vacuum Insulated Steel Water Bottle (1L)',
    price: 1299, mrp: 1999, rating: 4.7, reviews: 268, stock: 80, sold: 1340,
    category: 'daily-use-items', brand: 'Hydro+',
    images: [img('photo-1602143407151-7111542de6e8'), img('photo-1523362628745-0c100150b504'), img('photo-1602143407407-c12a4ce32bc4')],
    short: '24 hrs cold, 12 hrs hot. Leakproof.',
    description: 'Double-wall vacuum insulated stainless steel bottle. Keeps drinks cold for 24 hours or hot for 12.',
    specs: { Capacity: '1L', Material: 'SS304', Insulation: 'Double Wall' }, tags: ['best-seller']
  },
  {
    id: 'p16', slug: 'silicone-spatula-set-7pc', title: 'Silicone Kitchen Utensil Set (7 pcs)',
    price: 1899, mrp: 2999, rating: 4.5, reviews: 134, stock: 55, sold: 720,
    category: 'daily-use-items', brand: 'Maxx',
    images: [img('photo-1556909114-f6e7ad7d3136'), img('photo-1556909114-44e3e70034e2'), img('photo-1571175443880-49e1d25b2bc5')],
    short: 'Heat-resistant, non-stick safe spatulas.',
    description: 'Complete 7-piece silicone utensil set with wooden handles. Safe for non-stick cookware.',
    specs: { Pieces: '7', Material: 'Food-grade silicone', HeatResist: '230°C' }, tags: ['new-arrival']
  },

  // MINI APPLIANCES
  {
    id: 'p17', slug: 'mini-coffee-maker-portable', title: 'Mini Coffee Maker Portable',
    price: 3499, mrp: 5499, rating: 4.4, reviews: 78, stock: 22, sold: 198,
    category: 'mini-appliances', brand: 'Brewly',
    images: [img('photo-1521017432531-fbd92d768814'), img('photo-1495474472287-4d71bcdd2085'), img('photo-1559056199-641a0ac8b55e')],
    short: 'Single-serve coffee maker for desk or travel.',
    description: 'Compact espresso-style brewer with rechargeable battery. Perfect for offices and travel.',
    specs: { Type: 'Single Serve', Battery: 'Yes', Capacity: '80ml' }, tags: ['new-arrival']
  },
  {
    id: 'p18', slug: 'mini-iron-portable', title: 'Mini Portable Iron Travel Edition',
    price: 1799, mrp: 2799, rating: 4.3, reviews: 56, stock: 38, sold: 240,
    category: 'mini-appliances', brand: 'Smartline',
    images: [img('photo-1581578731548-c64695cc6952'), img('photo-1574269909862-7e1d70bb8078'), img('photo-1556909114-44e3e70034e2')],
    short: 'Pocket-sized iron, fast heat-up, ceramic plate.',
    description: 'Take it anywhere — a tiny iron with a ceramic plate, dry & steam settings, and rapid heat-up.',
    specs: { Power: '800W', Plate: 'Ceramic', Voltage: '220V' }, tags: ['trending']
  },

  // STORAGE & ORGANIZERS
  {
    id: 'p19', slug: 'foldable-wardrobe-organizer', title: 'Foldable 9-Cube Wardrobe Organizer',
    price: 3999, mrp: 5999, rating: 4.5, reviews: 142, stock: 25, sold: 460,
    category: 'storage-organizers', brand: 'NeatBox',
    images: [img('photo-1558997519-83ea9252edf8'), img('photo-1597092833583-d8a1d7d8d3a8'), img('photo-1556228852-80b6e5eeff06')],
    short: 'Tough fabric + steel frame, dust-proof zipper.',
    description: '9-cube modular wardrobe with magnetic doors. Easy assembly, foldable when not in use.',
    specs: { Cubes: '9', Material: 'Non-woven Fabric', Frame: 'Steel' }, tags: ['best-seller']
  },
  {
    id: 'p20', slug: 'kitchen-jar-set-12pc', title: 'Airtight Kitchen Storage Jar Set (12 pcs)',
    price: 2299, mrp: 3499, rating: 4.6, reviews: 198, stock: 60, sold: 900,
    category: 'storage-organizers', brand: 'Maxx',
    images: [img('photo-1556228852-80b6e5eeff06'), img('photo-1556228720-195a672e8a03'), img('photo-1558997519-83ea9252edf8')],
    short: 'BPA-free, stackable, airtight kitchen jars.',
    description: 'Keep your pantry organized with 12 stackable airtight jars. BPA-free, transparent, with labels.',
    specs: { Pieces: '12', Material: 'BPA-free Plastic', Sizes: 'Mixed' }, tags: ['featured']
  },

  // GIFT ITEMS
  {
    id: 'p21', slug: 'luxury-gift-hamper-medium', title: 'Luxury Gift Hamper (Medium)',
    price: 7999, mrp: 11999, rating: 4.8, reviews: 64, stock: 12, sold: 110,
    category: 'gift-items', brand: 'Maxx',
    images: [img('photo-1513885535751-8b9238bd345a'), img('photo-1549465220-1a8b9238cd48'), img('photo-1607082348824-0a96f2a4b9da')],
    short: 'Curated premium hamper for birthdays, Eid & weddings.',
    description: 'Beautifully curated gift hamper with chocolates, scented candle, mug and a premium notebook. Ribbon-wrapped.',
    specs: { Type: 'Gift Hamper', Theme: 'Premium', Occasion: 'All' }, tags: ['gift-pick', 'featured']
  },

  // IMPORTED PRODUCTS
  {
    id: 'p22', slug: 'imported-nonstick-pan-28cm', title: 'Imported Granite Non-Stick Pan (28cm)',
    price: 4499, mrp: 6999, rating: 4.7, reviews: 220, stock: 30, sold: 540,
    category: 'imported-products', brand: 'Imported',
    images: [img('photo-1574269909862-7e1d70bb8078'), img('photo-1556909114-f6e7ad7d3136'), img('photo-1571175443880-49e1d25b2bc5')],
    short: 'Marble coating, induction friendly, ergonomic handle.',
    description: 'Premium imported non-stick pan with 6-layer granite coating. Healthy cooking with minimal oil.',
    specs: { Size: '28cm', Coating: 'Granite', Induction: 'Yes', Origin: 'Imported' },
    tags: ['flash-sale', 'best-seller']
  },
  {
    id: 'p23', slug: 'imported-electric-toothbrush', title: 'Imported Sonic Electric Toothbrush',
    price: 3299, mrp: 5299, rating: 4.5, reviews: 132, stock: 40, sold: 280,
    category: 'imported-products', brand: 'Imported',
    images: [img('photo-1559591935-c6c92c6c95b6'), img('photo-1607619056574-7b8d3ee536b2'), img('photo-1559056199-641a0ac8b55e')],
    short: 'Sonic vibration, 4 modes, USB-C charging.',
    description: 'Premium sonic electric toothbrush with 4 cleaning modes, smart timer and USB-C charging.',
    specs: { Modes: '4', Battery: '30 days', Charging: 'USB-C' }, tags: ['new-arrival']
  },
  {
    id: 'p24', slug: 'imported-led-projector-mini', title: 'Mini LED Projector (1080p Support)',
    price: 9999, mrp: 15999, rating: 4.4, reviews: 88, stock: 14, sold: 160,
    category: 'imported-products', brand: 'Imported',
    images: [img('photo-1626753471107-3f3eb70e2e8a'), img('photo-1593642632559-0c6d3fc62b89'), img('photo-1505740420928-5e560c06d30e')],
    short: 'Portable projector with HDMI, USB, WiFi cast.',
    description: 'Bright mini LED projector with WiFi screen mirroring, HDMI, USB and built-in speaker. Up to 200" projection.',
    specs: { Resolution: 'Native 720p (1080p Support)', Brightness: '4500 Lumens', Throw: '1-5m' },
    tags: ['featured', 'trending']
  }
];

// Lookups
export const productBySlug   = (slug)  => products.find((p) => p.slug === slug);
export const productById     = (id)    => products.find((p) => p.id   === id);
export const productsByTag   = (tag)   => products.filter((p) => p.tags?.includes(tag));
export const productsByCat   = (slug)  => products.filter((p) => p.category === slug);
export const featuredProducts   = () => productsByTag('featured');
export const trendingProducts   = () => productsByTag('trending');
export const newArrivalProducts = () => productsByTag('new-arrival');
export const bestSellers        = () => productsByTag('best-seller');
export const flashSaleProducts  = () => productsByTag('flash-sale');
