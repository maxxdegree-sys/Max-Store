// Product categories & sub-categories (per Changings.txt).
// `slug` is the parent category; products store `category` + optional `subcategory` slug.

const img = (id) => `https://images.unsplash.com/${id}?w=600&q=80&auto=format&fit=crop`;

export const categories = [
  { id: 1, slug: 'electronics', name: 'Electronics', icon: '📱', image: img('photo-1593642632559-0c6d3fc62b89'), subcategories: [
    { slug: 'mobile-phones', name: 'Mobile Phones' }, { slug: 'tablets', name: 'Tablets' }, { slug: 'laptops', name: 'Laptops' },
    { slug: 'cameras', name: 'Cameras' }, { slug: 'tvs', name: 'TVs' }, { slug: 'audio', name: 'Audio' },
    { slug: 'wearables', name: 'Wearables' }, { slug: 'gaming', name: 'Gaming' }, { slug: 'cables', name: 'Cables' }
  ]},
  { id: 2, slug: 'home-appliances', name: 'Home Appliances', icon: '🏠', image: img('photo-1581578731548-c64695cc6952'), subcategories: [
    { slug: 'washing-machines', name: 'Washing Machines' }, { slug: 'refrigerators', name: 'Refrigerators' },
    { slug: 'air-conditioners', name: 'Air Conditioners' }, { slug: 'fans', name: 'Fans' }, { slug: 'irons', name: 'Irons' },
    { slug: 'vacuum-cleaners', name: 'Vacuum Cleaners' }, { slug: 'water-dispensers', name: 'Water Dispensers' }
  ]},
  { id: 3, slug: 'kitchen-appliances', name: 'Kitchen Appliances', icon: '🍳', image: img('photo-1556909114-44e3e70034e2'), subcategories: [
    { slug: 'blenders', name: 'Blenders' }, { slug: 'food-processors', name: 'Food Processors' }, { slug: 'microwaves', name: 'Microwaves' },
    { slug: 'rice-cookers', name: 'Rice Cookers' }, { slug: 'kettles', name: 'Kettles' }, { slug: 'toasters', name: 'Toasters' },
    { slug: 'coffee-makers', name: 'Coffee Makers' }, { slug: 'air-fryers', name: 'Air Fryers' }
  ]},
  { id: 4, slug: 'kitchen-dining', name: 'Kitchen & Dining', icon: '🍽️', image: img('photo-1610701596007-11502861dcfa'), subcategories: [
    { slug: 'cookware', name: 'Cookware' }, { slug: 'dinner-sets', name: 'Dinner Sets' }, { slug: 'tea-sets', name: 'Tea Sets' },
    { slug: 'glassware', name: 'Glassware' }, { slug: 'cutlery', name: 'Cutlery' }, { slug: 'serving-dishes', name: 'Serving Dishes' },
    { slug: 'storage-containers', name: 'Storage Containers' }
  ]},
  { id: 5, slug: 'furniture-home-decor', name: 'Furniture & Home Decor', icon: '🛋️', image: img('photo-1555041469-a586c61ea9bc'), subcategories: [
    { slug: 'sofas', name: 'Sofas' }, { slug: 'beds', name: 'Beds' }, { slug: 'tables', name: 'Tables' },
    { slug: 'wardrobes', name: 'Wardrobes' }, { slug: 'curtains', name: 'Curtains' }, { slug: 'rugs', name: 'Rugs' },
    { slug: 'wall-art', name: 'Wall Art' }, { slug: 'lighting', name: 'Lighting' }
  ]},
  { id: 6, slug: 'clothing-apparel', name: 'Clothing & Apparel', icon: '👔', image: img('photo-1483985988355-763728e1935b'), subcategories: [
    { slug: 'mens', name: "Men's" }, { slug: 'womens', name: "Women's" }, { slug: 'kids', name: "Kids'" },
    { slug: 'ethnic-wear', name: 'Ethnic Wear' }, { slug: 'activewear', name: 'Activewear' },
    { slug: 'innerwear', name: 'Innerwear' }, { slug: 'winterwear', name: 'Winterwear' }
  ]},
  { id: 7, slug: 'footwear', name: 'Footwear', icon: '👟', image: img('photo-1542291026-7eec264c27ff'), subcategories: [
    { slug: 'mens-shoes', name: "Men's Shoes" }, { slug: 'womens-shoes', name: "Women's Shoes" },
    { slug: 'kids-shoes', name: "Kids' Shoes" }, { slug: 'sandals', name: 'Sandals' },
    { slug: 'sports-shoes', name: 'Sports Shoes' }, { slug: 'formal-shoes', name: 'Formal Shoes' }
  ]},
  { id: 8, slug: 'bags-luggage', name: 'Bags & Luggage', icon: '🎒', image: img('photo-1553062407-98eeb64c6a62'), subcategories: [
    { slug: 'backpacks', name: 'Backpacks' }, { slug: 'handbags', name: 'Handbags' }, { slug: 'travel-bags', name: 'Travel Bags' },
    { slug: 'wallets', name: 'Wallets' }, { slug: 'school-bags', name: 'School Bags' }
  ]},
  { id: 9, slug: 'beauty-personal-care', name: 'Beauty & Personal Care', icon: '💄', image: img('photo-1522335789203-aaa44ff7ce06'), subcategories: [
    { slug: 'skincare', name: 'Skincare' }, { slug: 'hair-care', name: 'Hair Care' }, { slug: 'fragrances', name: 'Fragrances' },
    { slug: 'makeup', name: 'Makeup' }, { slug: 'shavers', name: 'Shavers' }, { slug: 'oral-care', name: 'Oral Care' },
    { slug: 'bath-body', name: 'Bath & Body' }
  ]},
  { id: 10, slug: 'health-wellness', name: 'Health & Wellness', icon: '💊', image: img('photo-1576091160399-112ba8d25d1d'), subcategories: [
    { slug: 'vitamins', name: 'Vitamins' }, { slug: 'medical-devices', name: 'Medical Devices' },
    { slug: 'fitness-equipment', name: 'Fitness Equipment' }, { slug: 'eye-care', name: 'Eye Care' },
    { slug: 'personal-safety', name: 'Personal Safety' }
  ]},
  { id: 11, slug: 'baby-kids', name: 'Baby & Kids', icon: '👶', image: img('photo-1515488042361-ee00e0ddd4e4'), subcategories: [
    { slug: 'baby-clothing', name: 'Baby Clothing' }, { slug: 'diapers', name: 'Diapers' }, { slug: 'feeding', name: 'Feeding' },
    { slug: 'strollers', name: 'Strollers' }, { slug: 'toys', name: 'Toys' }, { slug: 'kids-furniture', name: "Kids' Furniture" }
  ]},
  { id: 12, slug: 'toys-games', name: 'Toys & Games', icon: '🧸', image: img('photo-1558060375-5d34d1f8c5e0'), subcategories: [
    { slug: 'action-figures', name: 'Action Figures' }, { slug: 'board-games', name: 'Board Games' }, { slug: 'puzzles', name: 'Puzzles' },
    { slug: 'outdoor-toys', name: 'Outdoor Toys' }, { slug: 'educational-toys', name: 'Educational Toys' }, { slug: 'rc-toys', name: 'RC Toys' }
  ]},
  { id: 13, slug: 'sports-outdoors', name: 'Sports & Outdoors', icon: '⚽', image: img('photo-1461896836934- voices'), subcategories: [
    { slug: 'cricket', name: 'Cricket' }, { slug: 'football', name: 'Football' }, { slug: 'gym-fitness', name: 'Gym & Fitness' },
    { slug: 'cycling', name: 'Cycling' }, { slug: 'swimming', name: 'Swimming' }, { slug: 'camping', name: 'Camping' },
    { slug: 'sports-clothing', name: 'Sports Clothing' }
  ]},
  { id: 14, slug: 'tools-hardware', name: 'Tools & Hardware', icon: '🔧', image: img('photo-1504148455328-c376907d081c'), subcategories: [
    { slug: 'hand-tools', name: 'Hand Tools' }, { slug: 'power-tools', name: 'Power Tools' },
    { slug: 'electrical-supplies', name: 'Electrical Supplies' }, { slug: 'plumbing', name: 'Plumbing' },
    { slug: 'safety', name: 'Safety' }, { slug: 'measuring-tools', name: 'Measuring Tools' }
  ]},
  { id: 15, slug: 'automotive', name: 'Automotive', icon: '🚗', image: img('photo-1492144534655-ae79c964c9d7'), subcategories: [
    { slug: 'car-accessories', name: 'Car Accessories' }, { slug: 'bike-accessories', name: 'Bike Accessories' },
    { slug: 'car-care', name: 'Car Care' }, { slug: 'oils-lubricants', name: 'Oils & Lubricants' }, { slug: 'gps', name: 'GPS' }
  ]},
  { id: 16, slug: 'books-stationery', name: 'Books & Stationery', icon: '📚', image: img('photo-1512820790803-83ca734da794'), subcategories: [
    { slug: 'fiction', name: 'Fiction' }, { slug: 'non-fiction', name: 'Non-Fiction' }, { slug: 'academic', name: 'Academic' },
    { slug: 'notebooks', name: 'Notebooks' }, { slug: 'pens', name: 'Pens' }, { slug: 'art-supplies', name: 'Art Supplies' }
  ]},
  { id: 17, slug: 'office-supplies', name: 'Office Supplies', icon: '🖨️', image: img('photo-1497366216548-37526070297c'), subcategories: [
    { slug: 'printers', name: 'Printers' }, { slug: 'paper-files', name: 'Paper & Files' },
    { slug: 'desk-accessories', name: 'Desk Accessories' }, { slug: 'shredders', name: 'Shredders' },
    { slug: 'whiteboards', name: 'Whiteboards' }
  ]},
  { id: 18, slug: 'pet-supplies', name: 'Pet Supplies', icon: '🐾', image: img('photo-1450778869180-41d0601e046e'), subcategories: [
    { slug: 'pet-food', name: 'Pet Food' }, { slug: 'pet-accessories', name: 'Accessories' },
    { slug: 'grooming', name: 'Grooming' }, { slug: 'cages-kennels', name: 'Cages & Kennels' }
  ]},
  { id: 19, slug: 'garden-outdoor', name: 'Garden & Outdoor', icon: '🌱', image: img('photo-1416879595882-3373a0480b5b'), subcategories: [
    { slug: 'plants-seeds', name: 'Plants & Seeds' }, { slug: 'garden-tools', name: 'Garden Tools' },
    { slug: 'outdoor-furniture', name: 'Outdoor Furniture' }, { slug: 'bbq', name: 'BBQ' }, { slug: 'irrigation', name: 'Irrigation' }
  ]},
  { id: 20, slug: 'food-groceries', name: 'Food & Groceries', icon: '🛒', image: img('photo-1542838132-92c53300491e'), subcategories: [
    { slug: 'dry-goods', name: 'Dry Goods' }, { slug: 'snacks', name: 'Snacks' }, { slug: 'beverages', name: 'Beverages' },
    { slug: 'cooking-oils', name: 'Cooking Oils' }, { slug: 'organic-foods', name: 'Organic Foods' }
  ]},
  { id: 21, slug: 'musical-instruments', name: 'Musical Instruments', icon: '🎸', image: img('photo-1511379938093-3a0b0c0c0c0c'), subcategories: [
    { slug: 'guitars', name: 'Guitars' }, { slug: 'keyboards', name: 'Keyboards' }, { slug: 'drums', name: 'Drums' },
    { slug: 'wind-instruments', name: 'Wind Instruments' }, { slug: 'studio-equipment', name: 'Studio Equipment' }
  ]},
  { id: 22, slug: 'art-crafts', name: 'Art & Crafts', icon: '🎨', image: img('photo-1513364778564-6c2fa0d0c6e4'), subcategories: [
    { slug: 'painting', name: 'Painting' }, { slug: 'drawing', name: 'Drawing' }, { slug: 'craft-kits', name: 'Craft Kits' },
    { slug: 'sewing', name: 'Sewing' }, { slug: 'scrapbooking', name: 'Scrapbooking' }
  ]},
  { id: 23, slug: 'software-gaming', name: 'Software & Gaming', icon: '🎮', image: img('photo-1542751371-adc38448a05e'), subcategories: [
    { slug: 'pc-games', name: 'PC Games' }, { slug: 'console-games', name: 'Console Games' },
    { slug: 'antivirus', name: 'Antivirus' }, { slug: 'gaming-accessories', name: 'Gaming Accessories' },
    { slug: 'gift-cards', name: 'Gift Cards' }
  ]}
];

// Fix sports image URL (typo in batch)
categories[12].image = img('photo-1461896836934-ffe607ba7981');
categories[20].image = img('photo-1510915361894-db8b60106cb1');

export const categoryBySlug = (slug) => categories.find((c) => c.slug === slug);

export const subcategoryBySlug = (catSlug, subSlug) => {
  const cat = categoryBySlug(catSlug);
  return cat?.subcategories?.find((s) => s.slug === subSlug) || null;
};

export const allSubcategories = () =>
  categories.flatMap((c) => (c.subcategories || []).map((s) => ({ ...s, category: c.slug, categoryName: c.name })));

export const categoryLabel = (catSlug, subSlug) => {
  const cat = categoryBySlug(catSlug);
  if (!cat) return (catSlug || '').replace(/-/g, ' ');
  const sub = subSlug ? cat.subcategories?.find((s) => s.slug === subSlug) : null;
  return sub ? `${cat.name} › ${sub.name}` : cat.name;
};
