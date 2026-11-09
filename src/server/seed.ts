import { connectMongo, collections, ObjectId, closeMongo } from './mongodb.ts';
import { hashPassword } from '../lib/auth.ts';
import {
  DEFAULT_HERO_IMAGE,
  DEFAULT_MUNNAR_IMAGE,
  DEFAULT_ALLEPPEY_IMAGE,
  DEFAULT_THEKKADY_IMAGE,
  DEFAULT_MADURAI_IMAGE,
} from '../lib/constants.ts';
import type { PackageSnapshot } from '../lib/types.ts';

export async function seedDatabase() {
  console.log('[Seed] Starting MongoDB database seed for Company A Tours...');
  await connectMongo();

  // Clear existing records in logical dependency order
  await collections.activityLogs().deleteMany({});
  await collections.messageLogs().deleteMany({});
  await collections.enquiryNotes().deleteMany({});
  await collections.replyDrafts().deleteMany({});
  await collections.packageSuggestions().deleteMany({});
  await collections.enquiryExtractions().deleteMany({});
  await collections.enquiries().deleteMany({});
  await collections.packageVersions().deleteMany({});
  await collections.packages().deleteMany({});
  await collections.destinations().deleteMany({});
  await collections.redirects().deleteMany({});
  await collections.users().deleteMany({});

  // 1. Seed Users (Documented passwords in README.md & ASSUMPTIONS.md)
  const adminPasswordHash = await hashPassword('Admin@123');
  const editorPasswordHash = await hashPassword('Editor@123');
  const consultantPasswordHash = await hashPassword('Consultant@123');

  const now = new Date();

  const adminUserId = new ObjectId().toHexString();
  const adminUser = {
    _id: new ObjectId(adminUserId),
    id: adminUserId,
    name: 'Radhika Menon (Managing Director)',
    email: 'admin@companya.test',
    passwordHash: adminPasswordHash,
    role: 'ADMIN' as const,
    createdAt: now,
    updatedAt: now,
  };
  await collections.users().insertOne(adminUser);

  const editorUserId = new ObjectId().toHexString();
  const editorUser = {
    _id: new ObjectId(editorUserId),
    id: editorUserId,
    name: 'Arjun Varma (Content Editor)',
    email: 'editor@companya.test',
    passwordHash: editorPasswordHash,
    role: 'EDITOR' as const,
    createdAt: now,
    updatedAt: now,
  };
  await collections.users().insertOne(editorUser);

  const consultantUserId = new ObjectId().toHexString();
  const consultantUser = {
    _id: new ObjectId(consultantUserId),
    id: consultantUserId,
    name: 'Anjali Thomas (Senior Travel Consultant)',
    email: 'consultant@companya.test',
    passwordHash: consultantPasswordHash,
    role: 'CONSULTANT' as const,
    createdAt: now,
    updatedAt: now,
  };
  await collections.users().insertOne(consultantUser);

  console.log('[Seed] Demo users created: admin@companya.test, editor@companya.test, consultant@companya.test');

  // 2. Seed Destinations
  const destKeralaId = new ObjectId().toHexString();
  const destKerala = {
    _id: new ObjectId(destKeralaId),
    id: destKeralaId,
    slug: 'kerala-backwaters',
    name: 'Kerala Backwaters & Coast',
    summary: 'Tranquil palm-lined canals, traditional kettuvallam houseboats, fragrant spice gardens, and Marari beach sunsets.',
    heroImage: DEFAULT_ALLEPPEY_IMAGE,
    createdAt: now,
  };
  await collections.destinations().insertOne(destKerala);

  const destMunnarId = new ObjectId().toHexString();
  const destMunnar = {
    _id: new ObjectId(destMunnarId),
    id: destMunnarId,
    slug: 'munnar-hills',
    name: 'Munnar & Western Ghats',
    summary: 'Misty tea plantations, cool mountain breezes, cascading waterfalls, and Periyar wildlife sanctuary.',
    heroImage: DEFAULT_MUNNAR_IMAGE,
    createdAt: now,
  };
  await collections.destinations().insertOne(destMunnar);

  const destTamilNaduId = new ObjectId().toHexString();
  const destTamilNadu = {
    _id: new ObjectId(destTamilNaduId),
    id: destTamilNaduId,
    slug: 'tamil-nadu-temples',
    name: 'Tamil Nadu Temple Trail',
    summary: 'Architectural splendour of Madurai Meenakshi, Ramanathaswamy sacred seaside corridor, and sunset at Kanyakumari.',
    heroImage: DEFAULT_MADURAI_IMAGE,
    createdAt: now,
  };
  await collections.destinations().insertOne(destTamilNadu);

  const destWayanadId = new ObjectId().toHexString();
  const destWayanad = {
    _id: new ObjectId(destWayanadId),
    id: destWayanadId,
    slug: 'wayanad-nilgiris',
    name: 'Wayanad & Nilgiris Escapes',
    summary: 'Pristine rainforest canopy walks, prehistoric Edakkal caves, organic spice estates, and cool hill retreats.',
    heroImage: DEFAULT_THEKKADY_IMAGE,
    createdAt: now,
  };
  await collections.destinations().insertOne(destWayanad);

  // 3. Seed Packages
  // CLIENT SAMPLE 1: PKG-KL-07 (PUBLISHED)
  const snapshotKL07: PackageSnapshot = {
    title: 'Munnar, Thekkady and Alleppey Houseboat',
    summary: 'Our signature 6-day journey across the emerald tea slopes of Munnar, Periyar elephant sanctuary in Thekkady, and an overnight private houseboat cruise through Alleppey backwaters.',
    days: 6,
    nights: 5,
    hotelCategory: '4 Star',
    childPricePercent: 50,
    bestTimeToVisit: 'October to March for pleasant hill weather and clear backwater breezes; June to September for Ayurvedic rejuvenation.',
    tags: ['Best Seller', 'Tea Gardens', 'Houseboat', 'Wildlife', 'Backwaters', 'Family'],
    photos: [
      DEFAULT_HERO_IMAGE,
      DEFAULT_MUNNAR_IMAGE,
      DEFAULT_ALLEPPEY_IMAGE,
      DEFAULT_THEKKADY_IMAGE,
    ],
    seasonalPrices: [
      {
        label: 'Peak (Oct–Mar)',
        startMonth: 10,
        endMonth: 3,
        pricePerPerson: 32500,
      },
      {
        label: 'Summer (Apr–May)',
        startMonth: 4,
        endMonth: 5,
        pricePerPerson: 28500,
      },
      {
        label: 'Monsoon (Jun–Sep)',
        startMonth: 6,
        endMonth: 9,
        pricePerPerson: 24900,
      },
    ],
    inclusions: [
      '5 nights luxury accommodation (2N Munnar, 1N Thekkady, 1N Alleppey Houseboat, 1N Cochin)',
      'Dedicated private air-conditioned vehicle with English/Hindi speaking driver-guide for entire tour',
      'All meals on board traditional private Alleppey Houseboat (Lunch, Evening Tea, Dinner, Breakfast)',
      'Daily buffet breakfast at all hill resorts and hotels',
      'Tea museum visit, Eravikulam National Park passes, and Periyar lake boat safari booking',
      'All fuel, interstate taxes, toll fees, driver allowance, and parking charges',
      '24/7 on-ground concierge support from our Kochi operational headquarters',
    ],
    exclusions: [
      'Airfare or train tickets to/from Kochi Airport (COK)',
      'Optional Ayurvedic treatments or elephant bathing charges',
      'Personal expenses, laundry, telephone calls, and camera fees',
      'Meals not specified in the inclusions',
      '5% GST applicable as per Government of India guidelines',
    ],
    hotels: [
      'Munnar: Fragrant Nature Munnar / Blanket Luxury Valley Resort (4 Star)',
      'Thekkady: Cardamom County / Greenwoods Resort (4 Star)',
      'Alleppey: Private Premium Kettuvallam Houseboat with AC Bedroom & Sun Deck',
      'Cochin: Eighth Bastion / Fragrant Nature Fort Kochi (Heritage 4 Star)',
    ],
    mapPoints: [
      { name: 'Cochin International Airport (COK)', lat: 10.1557, lng: 76.3916, order: 1 },
      { name: 'Munnar Tea Hills', lat: 10.0889, lng: 77.0595, order: 2 },
      { name: 'Thekkady Wildlife Reserve', lat: 9.6031, lng: 77.1615, order: 3 },
      { name: 'Alleppey Backwaters', lat: 9.4981, lng: 76.3388, order: 4 },
      { name: 'Historic Fort Kochi', lat: 9.9658, lng: 76.2421, order: 5 },
    ],
    itinerary: [
      {
        day: 1,
        title: 'Arrival in Cochin & Scenic Drive to Munnar',
        description: 'Warm welcome by Company A representative at Cochin Airport or Ernakulam Railway Station. Enjoy a picturesque drive up the Western Ghats passing Cheeyappara and Valara waterfalls. Check into your mountain resort and spend the evening relaxing amidst cool tea gardens.',
        meals: 'Dinner at Resort',
        stay: 'Munnar Valley Resort',
      },
      {
        day: 2,
        title: 'Munnar Tea Estate Exploration & Eravikulam Sanctuary',
        description: 'Morning drive to Eravikulam National Park, home to the endangered Nilgiri Tahr mountain goat. Visit the Tata Tea Museum to observe orthodox tea manufacturing. Afternoon stroll through Mattupetty Dam, Kundala Lake, and Echo Point with panoramic valley vistas.',
        meals: 'Breakfast at Resort',
        stay: 'Munnar Valley Resort',
      },
      {
        day: 3,
        title: 'Spice Highway to Thekkady & Periyar Lake Cruise',
        description: 'Drive through cardamom-scented mountain passes to Thekkady. Check in and embark on a scenic boat cruise on Lake Periyar inside the wildlife sanctuary to spot wild elephants, bison, and otters. Evening visit to an authentic organic spice garden and optional Kathakali dance presentation.',
        meals: 'Breakfast at Resort',
        stay: 'Thekkady Spice Resort',
      },
      {
        day: 4,
        title: 'Boarding the Private Houseboat in Alleppey',
        description: 'Descend to Alleppey backwaters. Board your private luxury kettuvallam houseboat by 12:30 PM. Cruise along serene palm-canopied canals, observing village life, Chinese fishing nets, and paddy fields. Savor freshly prepared Kerala cuisine prepared on board by your private chef.',
        meals: 'Lunch, Evening Snacks & Dinner on Houseboat',
        stay: 'Private Deluxe Houseboat',
      },
      {
        day: 5,
        title: 'Alleppey to Fort Kochi Heritage Quarter',
        description: 'Wake to serene water reflections and sunrise over the lagoon. After traditional breakfast, disembark at 09:30 AM and drive to Fort Kochi. Visit the historic Santa Cruz Basilica, St. Francis Church, Dutch Palace at Mattancherry, and iconic Chinese Fishing Nets at sunset.',
        meals: 'Breakfast on Houseboat',
        stay: 'Fort Kochi Heritage Hotel',
      },
      {
        day: 6,
        title: 'Departure Transfer to Cochin Airport',
        description: 'After leisurely breakfast, enjoy souvenir shopping for fresh spices, Kerala banana chips, and handicrafts. Transfer to Cochin International Airport with timeless South Indian memories.',
        meals: 'Breakfast at Hotel',
      },
    ],
  };

  const pkgKL07Id = new ObjectId().toHexString();
  const v1KL07Id = new ObjectId().toHexString();

  const pkgKL07 = {
    _id: new ObjectId(pkgKL07Id),
    id: pkgKL07Id,
    code: 'PKG-KL-07',
    slug: 'munnar-thekkady-alleppey-houseboat',
    destinationId: destMunnar.id,
    status: 'PUBLISHED' as const,
    publishAt: null,
    currentVersionId: v1KL07Id,
    createdAt: now,
    updatedAt: now,
  };
  await collections.packages().insertOne(pkgKL07);

  const v1KL07 = {
    _id: new ObjectId(v1KL07Id),
    id: v1KL07Id,
    packageId: pkgKL07.id,
    versionNumber: 1,
    snapshot: JSON.stringify(snapshotKL07),
    changeNote: 'Initial published version with certified seasonal tariffs for 2026/27.',
    createdById: adminUser.id,
    createdAt: now,
  };
  await collections.packageVersions().insertOne(v1KL07);

  // CLIENT SAMPLE 2: PKG-SI-12 (DRAFT)
  const snapshotSI12: PackageSnapshot = {
    title: 'Madurai, Rameswaram and Kanyakumari',
    summary: 'A spiritual and cultural odyssey spanning the monumental Dravidian temples of Madurai, the legendary sea-bridge at Rameswaram, and the confluence of three oceans at Cape Comorin.',
    days: 5,
    nights: 4,
    hotelCategory: '3 Star',
    childPricePercent: 50,
    tags: ['Temple Trail', 'Heritage', 'Pilgrimage', 'Coastal', 'South India'],
    photos: [
      DEFAULT_MADURAI_IMAGE,
      DEFAULT_THEKKADY_IMAGE,
    ],
    seasonalPrices: [
      {
        label: 'All Year Standard',
        startMonth: 1,
        endMonth: 12,
        pricePerPerson: 18750,
      },
    ],
    inclusions: [
      '4 nights accommodation in 3-star selected hotels with breakfast',
      'Private air-conditioned sedan throughout from Madurai to Trivandrum/Madurai',
      'Dhanushkodi 4x4 sea excursion booking',
      'All toll taxes, parking, and driver night halt allowances',
    ],
    exclusions: [
      'Temple special darshan tokens',
      'Train or flight tickets',
      '5% GST applicable',
    ],
    hotels: [
      'Madurai: Heritage Residency / Astoria Hotels (3 Star)',
      'Rameswaram: Hotel Daiwik / Jiwan Residency (3 Star)',
      'Kanyakumari: Hotel Sea View / Sparsa Resort (3 Star)',
    ],
    mapPoints: [
      { name: 'Madurai Junction', lat: 9.9195, lng: 78.1193, order: 1 },
      { name: 'Rameswaram Island', lat: 9.2876, lng: 79.3129, order: 2 },
      { name: 'Kanyakumari Point', lat: 8.0883, lng: 77.5385, order: 3 },
    ],
    itinerary: [
      {
        day: 1,
        title: 'Arrival in Madurai & Meenakshi Amman Temple',
        description: 'Arrive at Madurai. Check in and visit Thirumalai Nayak Palace followed by the evening darshan at the magnificent Meenakshi Sundareswarar Temple.',
      },
      {
        day: 2,
        title: 'Madurai to Rameswaram via Pamban Sea Bridge',
        description: 'Drive across the historic Pamban engineering marvel over the Indian Ocean into Rameswaram island. Visit the 22 sacred teerthams of Ramanathaswamy Temple.',
      },
      {
        day: 3,
        title: 'Dhanushkodi Ghost Town & Drive to Kanyakumari',
        description: 'Early morning expedition to the edge of India at Dhanushkodi where the Bay of Bengal meets the Indian Ocean. Afternoon scenic drive to Kanyakumari for sunset.',
      },
      {
        day: 4,
        title: 'Vivekananda Rock Memorial & Triveni Sangam',
        description: 'Ferry ride to Vivekananda Rock Memorial and Thiruvalluvar Statue. Visit Gandhi Memorial Mandapam and colorful beach bazaars.',
      },
      {
        day: 5,
        title: 'Kanyakumari Sunrise & Departure Transfer',
        description: 'Witness the sunrise over three seas. Drive to Trivandrum or Madurai airport for return journey.',
      },
    ],
  };

  const pkgSI12Id = new ObjectId().toHexString();
  const v1SI12Id = new ObjectId().toHexString();

  const pkgSI12 = {
    _id: new ObjectId(pkgSI12Id),
    id: pkgSI12Id,
    code: 'PKG-SI-12',
    slug: 'madurai-rameswaram-kanyakumari',
    destinationId: destTamilNadu.id,
    status: 'DRAFT' as const,
    publishAt: null,
    currentVersionId: v1SI12Id,
    createdAt: now,
    updatedAt: now,
  };
  await collections.packages().insertOne(pkgSI12);

  const v1SI12 = {
    _id: new ObjectId(v1SI12Id),
    id: v1SI12Id,
    packageId: pkgSI12.id,
    versionNumber: 1,
    snapshot: JSON.stringify(snapshotSI12),
    changeNote: 'Draft package for South India temple circuit under pricing review.',
    createdById: editorUser.id,
    createdAt: now,
  };
  await collections.packageVersions().insertOne(v1SI12);

  /* ASSUMED sample data: 6 additional realistic South India & Kerala packages as requested in client brief */
  const extraPackagesData: {
    code: string;
    slug: string;
    destinationId: string;
    status: 'DRAFT' | 'PUBLISHED';
    snapshot: PackageSnapshot;
  }[] = [
    {
      code: 'PKG-KL-02',
      slug: 'kerala-backwaters-luxury-honeymoon',
      destinationId: destKerala.id,
      status: 'PUBLISHED',
      snapshot: {
        title: 'Kerala Backwaters & Marari Beach Luxury Honeymoon',
        summary: 'Romantic 5-day escape featuring a premium candlelit houseboat cruise, private pool villa in Kumarakom, and serene beachfront seclusion in Marari.',
        days: 5,
        nights: 4,
        hotelCategory: '5 Star Luxury',
        childPricePercent: 50,
        tags: ['Honeymoon', 'Luxury', 'Houseboat', 'Beach', 'Couples', 'Backwaters'],
        photos: [DEFAULT_ALLEPPEY_IMAGE, DEFAULT_HERO_IMAGE],
        seasonalPrices: [
          { label: 'Winter Luxury (Oct–Mar)', startMonth: 10, endMonth: 3, pricePerPerson: 46000 },
          { label: 'Monsoon Romance (Jun–Sep)', startMonth: 6, endMonth: 9, pricePerPerson: 36500 },
          { label: 'Summer Escapade (Apr–May)', startMonth: 4, endMonth: 5, pricePerPerson: 39500 },
        ],
        inclusions: [
          '4 nights in 5-star private pool villas and luxury honeymoon houseboat',
          'Complimentary candlelit dinner with cake and floral bed decoration on houseboat',
          'Private Mercedes-Benz or Crysta transfer with dedicated chauffeur',
          'Daily organic breakfast and all houseboat meals',
          '60-minute couple Ayurvedic rejuvenation massage session',
        ],
        exclusions: ['Airfare', '5% GST applicable'],
        hotels: [
          'Kumarakom Lake Resort (5 Star Heritage)',
          'Alleppey: Luxury 1-Bedroom Private Houseboat',
          'Marari Beach Resort - CGH Earth (5 Star Eco-Luxury)',
        ],
        mapPoints: [
          { name: 'Cochin Airport', lat: 10.1557, lng: 76.3916, order: 1 },
          { name: 'Kumarakom Lagoon', lat: 9.6175, lng: 76.4301, order: 2 },
          { name: 'Alleppey Canals', lat: 9.4981, lng: 76.3388, order: 3 },
          { name: 'Marari Beach', lat: 9.6004, lng: 76.2991, order: 4 },
        ],
        itinerary: [
          { day: 1, title: 'Arrival & Kumarakom Lake Sanctuary', description: 'Chauffeur pickup from Cochin and transfer to luxury lakefront villa in Kumarakom.' },
          { day: 2, title: 'Lagoon Cruising & Village Canoe Stroll', description: 'Private country boat ride through narrow canals and bird sanctuary visit.' },
          { day: 3, title: 'Private Houseboat Embarkation', description: 'Board the honeymoon houseboat with floral decor, candlelit sunset cruise, and wine.' },
          { day: 4, title: 'Marari Golden Sands Retreat', description: 'Transfer to tranquil beach resort in Marari for barefoot luxury and seaside dining.' },
          { day: 5, title: 'Departure to Cochin', description: 'Leisurely breakfast and transfer to airport.' },
        ],
      },
    },
    {
      code: 'PKG-WY-05',
      slug: 'wayanad-rainforest-family-adventure',
      destinationId: destWayanad.id,
      status: 'PUBLISHED',
      snapshot: {
        title: 'Wayanad Rainforest & Treehouse Family Adventure',
        summary: 'Exciting 4-day rainforest immersion for families: canopy treehouses, bamboo rafting at Kuruva Island, Edakkal caves, and spice trail trekking.',
        days: 4,
        nights: 3,
        hotelCategory: '4 Star Eco-Resort',
        childPricePercent: 50,
        tags: ['Family', 'Treehouse', 'Nature', 'Adventure', 'Rainforest'],
        photos: [DEFAULT_THEKKADY_IMAGE, DEFAULT_MUNNAR_IMAGE],
        seasonalPrices: [
          { label: 'Cool Season (Oct–Feb)', startMonth: 10, endMonth: 2, pricePerPerson: 22800 },
          { label: 'Spring & Summer (Mar–May)', startMonth: 3, endMonth: 5, pricePerPerson: 20500 },
          { label: 'Mist Season (Jun–Sep)', startMonth: 6, endMonth: 9, pricePerPerson: 17500 },
        ],
        inclusions: [
          '3 nights eco-resort stay including 1 night in genuine treetop wooden house',
          'Private SUV with driver for all hill trails and airport/station transfers',
          'Bamboo rafting passes at Kuruva Island and Edakkal cave entry tickets',
          'Campfire with music and barbecued local dinner on Day 3',
        ],
        exclusions: ['Personal adventure gear', '5% GST applicable'],
        hotels: ['Vythiri Resort / Tranquil Resort Treehouse (4 Star Eco)'],
        mapPoints: [
          { name: 'Calicut Airport / Station', lat: 11.1367, lng: 75.9553, order: 1 },
          { name: 'Vythiri Rainforest', lat: 11.5516, lng: 76.0401, order: 2 },
          { name: 'Kuruva Island', lat: 11.8219, lng: 76.0945, order: 3 },
        ],
        itinerary: [
          { day: 1, title: 'Calicut to Wayanad Rainforest Gateway', description: 'Scenic hairpin climb up Thamarassery Ghat with breathtaking sunset viewpoints.' },
          { day: 2, title: 'Kuruva Dweep Bamboo Rafting & Edakkal Caves', description: 'Family rafting across Kabini river tributary and exploration of prehistoric stone petroglyphs.' },
          { day: 3, title: 'Banasura Sagar Dam & Zipline Thrills', description: 'Visit Asia’s second largest earthen dam, followed by scenic treehouse stay and campfire.' },
          { day: 4, title: 'Pookode Lake & Return Transfer', description: 'Pedal boating in natural freshwater lake surrounded by evergreen forests.' },
        ],
      },
    },
    {
      code: 'PKG-KL-03',
      slug: 'kochi-munnar-tea-trail-short-break',
      destinationId: destMunnar.id,
      status: 'PUBLISHED',
      snapshot: {
        title: 'Kochi & Munnar Tea Trail Short Break',
        summary: 'The perfect 4-day weekend getaway from city life: historic spice markets of Fort Kochi paired with the cool mist of Munnar’s high-altitude tea plantations.',
        days: 4,
        nights: 3,
        hotelCategory: '4 Star',
        childPricePercent: 50,
        tags: ['Short Break', 'Tea Gardens', 'Heritage', 'Weekend', 'Mountains'],
        photos: [DEFAULT_MUNNAR_IMAGE, DEFAULT_HERO_IMAGE],
        seasonalPrices: [
          { label: 'Peak (Oct–Mar)', startMonth: 10, endMonth: 3, pricePerPerson: 19800 },
          { label: 'Monsoon Greenery (Jun–Sep)', startMonth: 6, endMonth: 9, pricePerPerson: 15400 },
          { label: 'Summer Chill (Apr–May)', startMonth: 4, endMonth: 5, pricePerPerson: 17900 },
        ],
        inclusions: [
          '2 nights in Munnar panoramic view room, 1 night in Fort Kochi boutique hotel',
          'Private air-conditioned sedan for all 4 days',
          'Tea factory tasting tour and Kathakali cultural show tickets',
        ],
        exclusions: ['Camera permits', '5% GST applicable'],
        hotels: ['Tall Trees Munnar (4 Star)', 'Brunton Boatyard Fort Kochi (Heritage)'],
        mapPoints: [
          { name: 'Cochin Airport', lat: 10.1557, lng: 76.3916, order: 1 },
          { name: 'Munnar', lat: 10.0889, lng: 77.0595, order: 2 },
          { name: 'Fort Kochi', lat: 9.9658, lng: 76.2421, order: 3 },
        ],
        itinerary: [
          { day: 1, title: 'Cochin Arrival & Ascent to Munnar', description: 'Scenic drive through rubber plantations and tea estates with waterfall stops.' },
          { day: 2, title: 'Full Day Munnar Tea & Mountain Tour', description: 'Trek through tea trails, visit Top Station, and sample single-estate teas.' },
          { day: 3, title: 'Munnar to Fort Kochi Heritage Quarter', description: 'Descent to Cochin coast. Explore Jew Town, spice markets, and art cafes.' },
          { day: 4, title: 'Chinese Nets at Dawn & Departure', description: 'Morning harbour walk and return transfer to airport.' },
        ],
      },
    },
    {
      code: 'PKG-KL-09',
      slug: 'grand-kerala-heritage-and-wildlife-circuit',
      destinationId: destKerala.id,
      status: 'PUBLISHED',
      snapshot: {
        title: 'Grand Kerala Heritage, Wildlife & Houseboat Explorer',
        summary: 'Comprehensive 8-day expedition connecting Fort Kochi colonial heritage, Munnar tea hills, Thekkady jungle safari, Alleppey backwaters, and pristine Marari beach.',
        days: 8,
        nights: 7,
        hotelCategory: '4 Star Deluxe',
        childPricePercent: 50,
        tags: ['Grand Tour', 'Houseboat', 'Wildlife', 'Beach', 'Heritage', 'Tea Gardens'],
        photos: [DEFAULT_HERO_IMAGE, DEFAULT_ALLEPPEY_IMAGE, DEFAULT_THEKKADY_IMAGE, DEFAULT_MUNNAR_IMAGE],
        seasonalPrices: [
          { label: 'Peak (Oct–Mar)', startMonth: 10, endMonth: 3, pricePerPerson: 44500 },
          { label: 'Monsoon Ayurveda (Jun–Sep)', startMonth: 6, endMonth: 9, pricePerPerson: 33900 },
          { label: 'Summer Breeze (Apr–May)', startMonth: 4, endMonth: 5, pricePerPerson: 38200 },
        ],
        inclusions: [
          '7 nights premium stays including 1 night private Alleppey houseboat',
          'Dedicated Toyota Innova Crysta throughout with veteran tour driver',
          'Periyar boat safari, Eravikulam entry, spice garden guided tour',
          'All breakfasts, all meals on houseboat, and farewell seaside seafood dinner',
        ],
        exclusions: ['Airfare', '5% GST applicable'],
        hotels: [
          'Fort Kochi: Old Harbour Hotel',
          'Munnar: Windermere Estate (4 Star)',
          'Thekkady: Spice Village - CGH Earth',
          'Alleppey: Luxury AC Kettuvallam',
          'Marari: Marari Beach Resort',
        ],
        mapPoints: [
          { name: 'Kochi Airport', lat: 10.1557, lng: 76.3916, order: 1 },
          { name: 'Munnar', lat: 10.0889, lng: 77.0595, order: 2 },
          { name: 'Thekkady', lat: 9.6031, lng: 77.1615, order: 3 },
          { name: 'Alleppey', lat: 9.4981, lng: 76.3388, order: 4 },
          { name: 'Marari Beach', lat: 9.6004, lng: 76.2991, order: 5 },
        ],
        itinerary: [
          { day: 1, title: 'Arrival in Kochi', description: 'Private welcome and heritage walking tour.' },
          { day: 2, title: 'Munnar Tea Highlands', description: 'Scenic mountain ascent with tea plantation visits.' },
          { day: 3, title: 'Eravikulam & High Peaks', description: 'Wildlife viewing and scenic viewpoints.' },
          { day: 4, title: 'Cardamom Hills & Thekkady', description: 'Spice plantation trail and elephant reserve.' },
          { day: 5, title: 'Alleppey Private Houseboat Cruise', description: 'Overnight journey through backwaters.' },
          { day: 6, title: 'Marari Beach Seclusion', description: 'Relax by the Arabian Sea.' },
          { day: 7, title: 'Ayurvedic Wellness & Beach Sunset', description: 'Rejuvenation therapy and sunset cruise.' },
          { day: 8, title: 'Departure from Kochi', description: 'Airport transfer with memories.' },
        ],
      },
    },
    {
      code: 'PKG-SI-15',
      slug: 'ooty-coorg-mysore-heritage-highlands',
      destinationId: destTamilNadu.id,
      status: 'PUBLISHED',
      snapshot: {
        title: 'Ooty, Coorg and Mysore Royal Highlands',
        summary: '6-day royal circuit linking the majestic Mysore Amba Vilas Palace, fragrant coffee plantations of Coorg, and the Queen of Hill Stations, Ooty.',
        days: 6,
        nights: 5,
        hotelCategory: '4 Star',
        childPricePercent: 50,
        tags: ['Coffee Estates', 'Palaces', 'Hills', 'Heritage', 'South India'],
        photos: [DEFAULT_MUNNAR_IMAGE, DEFAULT_MADURAI_IMAGE],
        seasonalPrices: [
          { label: 'High Season (Oct–May)', startMonth: 10, endMonth: 5, pricePerPerson: 29500 },
          { label: 'Monsoon Splendour (Jun–Sep)', startMonth: 6, endMonth: 9, pricePerPerson: 23500 },
        ],
        inclusions: [
          '5 nights accommodation in boutique heritage hotels',
          'Private air-conditioned vehicle from Bangalore / Mysore return',
          'Nilgiri Mountain Toy Train tickets (subject to railway availability)',
          'Mysore Palace entry and Coorg coffee plantation walking tour',
        ],
        exclusions: ['Airfare', '5% GST applicable'],
        hotels: [
          'Mysore: Royal Orchid Metropole (Heritage)',
          'Coorg: Heritage Resort Coorg / Evolve Back',
          'Ooty: Savoy - IHCL SeleQtions',
        ],
        mapPoints: [
          { name: 'Bangalore / Mysore', lat: 12.2958, lng: 76.6394, order: 1 },
          { name: 'Coorg Madikeri', lat: 12.4244, lng: 75.7382, order: 2 },
          { name: 'Ooty Nilgiris', lat: 11.4102, lng: 76.6950, order: 3 },
        ],
        itinerary: [
          { day: 1, title: 'Bangalore to Mysore & Illuminated Palace', description: 'Drive past Srirangapatna to Mysore and witness the royal evening palace illuminations.' },
          { day: 2, title: 'Mysore to Coorg Coffee Heartland', description: 'Visit Bylakuppe Tibetan Golden Temple en route to coffee estate stay in Coorg.' },
          { day: 3, title: 'Abbey Falls & Coffee Estate Walking Tour', description: 'Aromatic plantation walk followed by panoramic sunset at Raja Seat.' },
          { day: 4, title: 'Coorg to Ooty Nilgiri Hills', description: 'Scenic drive through Mudumalai and Bandipur wildlife sanctuaries up the Nilgiri hills.' },
          { day: 5, title: 'Ooty Botanical Gardens & Toy Train Ride', description: 'Ride the UNESCO heritage Nilgiri mountain railway and visit Doddabetta peak.' },
          { day: 6, title: 'Ooty to Coimbatore / Bangalore Departure', description: 'Descent with picturesque hairpin bends and return transfer.' },
        ],
      },
    },
    {
      code: 'PKG-SI-18',
      slug: 'hampi-ruins-and-goa-sun-explorer',
      destinationId: destTamilNadu.id,
      status: 'PUBLISHED',
      snapshot: {
        title: 'Hampi Vijayanagara Ruins & South Goa Beach Explorer',
        summary: '7-day voyage pairing the UNESCO boulder-strewn medieval empire of Hampi with the serene golden sands and Portuguese heritage of South Goa.',
        days: 7,
        nights: 6,
        hotelCategory: '4 Star Heritage',
        childPricePercent: 50,
        tags: ['UNESCO Heritage', 'Ruins', 'Beach', 'History', 'South India'],
        photos: [DEFAULT_MADURAI_IMAGE, DEFAULT_HERO_IMAGE],
        seasonalPrices: [
          { label: 'Winter Season (Oct–Mar)', startMonth: 10, endMonth: 3, pricePerPerson: 35000 },
          { label: 'Off-Peak (Apr–Sep)', startMonth: 4, endMonth: 9, pricePerPerson: 26000 },
        ],
        inclusions: [
          '6 nights accommodation (3N Hampi Heritage, 3N South Goa Beach Resort)',
          'All transfers and sightseeing in private AC Innova Crysta',
          'Licensed archaeologist guide for 2 full days in Hampi and Anegundi',
        ],
        exclusions: ['Monument camera tickets', '5% GST applicable'],
        hotels: ['Hampi: Heritage Resort Hampi (4 Star)', 'Goa: Alila Diwa / Heritage Village Resort (5 Star)'],
        mapPoints: [
          { name: 'Hubli / Bellary Gateway', lat: 15.3647, lng: 75.1240, order: 1 },
          { name: 'Hampi UNESCO Site', lat: 15.3350, lng: 76.4600, order: 2 },
          { name: 'South Goa Marari / Benaulim', lat: 15.2632, lng: 73.9268, order: 3 },
        ],
        itinerary: [
          { day: 1, title: 'Hubli to Hampi Ancient Capital', description: 'Arrive and check in. Sunset view over Hemakuta Hill.' },
          { day: 2, title: 'Sacred Centre: Virupaksha & Stone Chariot', description: 'Explore the monumental Vijayanagara architecture and musical pillars at Vittala Temple.' },
          { day: 3, title: 'Royal Enclosure & Coracle Boat Ride', description: 'Queen’s Bath, Lotus Mahal, and traditional coracle ride across the Tungabhadra river.' },
          { day: 4, title: 'Hampi to South Goa Coastal Haven', description: 'Scenic drive through Western Ghats passes to tranquil South Goa beach resort.' },
          { day: 5, title: 'Old Goa Churches & Spice Farm Feast', description: 'Visit Basilica of Bom Jesus, Se Cathedral, and savor Goan traditional lunch.' },
          { day: 6, title: 'South Goa Beach Leisure & Sunset Cruise', description: 'Day at leisure on white sand beaches with sunset dolphin cruise.' },
          { day: 7, title: 'Goa Airport Departure', description: 'Transfer to Dabolim or Mopa airport.' },
        ],
      },
    },
  ];

  const packageMap = new Map<string, string>();
  packageMap.set('PKG-KL-07', pkgKL07.id);
  packageMap.set('PKG-SI-12', pkgSI12.id);

  for (const pkgItem of extraPackagesData) {
    const pkgId = new ObjectId().toHexString();
    const verId = new ObjectId().toHexString();
    packageMap.set(pkgItem.code, pkgId);

    const createdPkg = {
      _id: new ObjectId(pkgId),
      id: pkgId,
      code: pkgItem.code,
      slug: pkgItem.slug,
      destinationId: pkgItem.destinationId,
      status: pkgItem.status,
      publishAt: null,
      currentVersionId: verId,
      createdAt: now,
      updatedAt: now,
    };
    await collections.packages().insertOne(createdPkg);

    const version = {
      _id: new ObjectId(verId),
      id: verId,
      packageId: pkgId,
      versionNumber: 1,
      snapshot: JSON.stringify(pkgItem.snapshot),
      changeNote: 'Assumed sample data package created for South India catalogue demonstration.',
      createdById: adminUser.id,
      createdAt: now,
    };
    await collections.packageVersions().insertOne(version);
  }

  console.log('[Seed] Packages seeded successfully.');

  // 4. Seed 15+ Enquiries (including mandatory sample enquiry)
  // CLIENT SAMPLE ENQUIRY:
  // "Hi, 2 adults and 1 kid, Kerala 5-6 nights in December, budget around 1.2 lakh total, houseboat a must"
  const sampleEnquiryId = new ObjectId().toHexString();
  const sampleEnquiry = {
    _id: new ObjectId(sampleEnquiryId),
    id: sampleEnquiryId,
    reference: 'ENQ-0001',
    source: 'WEB_FORM' as const,
    packageId: pkgKL07.id,
    name: 'Dr. Vikram Malhotra',
    email: 'vikram.malhotra@testmail.com',
    phone: '+91 98201 54321',
    travelMonth: 'December',
    travelDate: '2026-12-20',
    adults: 2,
    children: 1,
    message: 'Hi, 2 adults and 1 kid, Kerala 5-6 nights in December, budget around 1.2 lakh total, houseboat a must',
    consentDataProcessing: true,
    consentWhatsApp: true,
    status: 'ASSIGNED' as const,
    assignedToId: consultantUser.id,
    firstResponseAt: null,
    createdAt: new Date(Date.now() - 35 * 60 * 1000), // 35 minutes ago (within SLA)
    updatedAt: now,
  };
  await collections.enquiries().insertOne(sampleEnquiry);

  // Seed AI Extraction for sample enquiry
  await collections.enquiryExtractions().insertOne({
    _id: new ObjectId(),
    id: new ObjectId().toHexString(),
    enquiryId: sampleEnquiry.id,
    fields: JSON.stringify({
      destination: 'Kerala',
      startMonth: 'December',
      dates: 'December 20-26',
      nights: 5,
      adults: 2,
      children: 1,
      budgetTotalINR: 120000,
      mustHaves: ['houseboat'],
      confidence: {
        destination: 0.95,
        startMonth: 0.98,
        nights: 0.92,
        adults: 0.99,
        children: 0.99,
        budgetTotalINR: 0.95,
        mustHaves: 0.98,
      },
      sourceSnippets: {
        destination: 'Kerala',
        startMonth: 'December',
        nights: '5-6 nights',
        adults: '2 adults',
        children: '1 kid',
        budgetTotalINR: '1.2 lakh total',
        mustHaves: 'houseboat a must',
      },
    }),
    model: 'gemini-3.8-flash',
    status: 'PENDING' as const,
    createdAt: now,
  });

  // Top 3 Suggestions for sample enquiry (must rank PKG-KL-07 first!)
  const pkgKL09Id = packageMap.get('PKG-KL-09') || pkgKL07.id;
  const pkgKL02Id = packageMap.get('PKG-KL-02') || pkgKL07.id;

  await collections.packageSuggestions().insertMany([
    {
      _id: new ObjectId(),
      id: new ObjectId().toHexString(),
      enquiryId: sampleEnquiry.id,
      packageId: pkgKL07.id,
      rank: 1,
      score: 115,
      reasons: JSON.stringify([
        'Exact destination match: Kerala',
        'Perfect duration match: exactly 5 nights',
        'Seasonal price available for December (Peak (Oct–Mar): ₹32,500/person)',
        'Within budget: estimated ₹85,313 with child discount and 5% GST (Target: ₹1,20,000)',
        'Includes must-have feature: "houseboat"',
      ]),
      createdAt: now,
    },
    {
      _id: new ObjectId(),
      id: new ObjectId().toHexString(),
      enquiryId: sampleEnquiry.id,
      packageId: pkgKL09Id,
      rank: 2,
      score: 85,
      reasons: JSON.stringify([
        'Exact destination match: Kerala',
        'Compatible duration (7 nights vs 5 nights requested)',
        'Seasonal price available for December',
        'Includes must-have feature: "houseboat"',
      ]),
      createdAt: now,
    },
    {
      _id: new ObjectId(),
      id: new ObjectId().toHexString(),
      enquiryId: sampleEnquiry.id,
      packageId: pkgKL02Id,
      rank: 3,
      score: 80,
      reasons: JSON.stringify([
        'Exact destination match: Kerala',
        'Close duration (4 nights vs 5 nights requested)',
        'Includes must-have feature: "houseboat"',
      ]),
      createdAt: now,
    },
  ]);

  // Reply draft with price placeholder
  await collections.replyDrafts().insertOne({
    _id: new ObjectId(),
    id: new ObjectId().toHexString(),
    enquiryId: sampleEnquiry.id,
    body: `Dear Dr. Vikram Malhotra,\n\nWarm greetings from Company A Tours, Kochi! Thank you for considering us for your family holiday to Kerala this December.\n\nBased on your request for 2 adults and 1 child with an authentic houseboat experience, we are delighted to propose our signature 6-day journey:\n\n• Package: Munnar, Thekkady and Alleppey Houseboat (PKG-KL-07)\n• Travel Month: December (Peak Season Tariff)\n• Tariff: {{PRICE:PKG-KL-07}}\n• Highlights: Private air-conditioned kettuvallam houseboat cruise in Alleppey with onboard chef, misty tea hills in Munnar, and Periyar elephant sanctuary safari.\n\nOur quote includes private vehicle and chauffeur, all meals on the houseboat, accommodation in luxury 4-star hill resorts, and 24/7 on-ground assistance from our Kochi team.\n\nPlease let us know if you would like any customization to the day-to-day itinerary.\n\nWarm regards,\nAnjali Thomas\nSenior Tour Consultant, Company A Tours, Kochi\nDirect Phone: +91 484 220 4400`,
    priceBreakdown: JSON.stringify([
      {
        packageCode: 'PKG-KL-07',
        packageTitle: 'Munnar, Thekkady and Alleppey Houseboat',
        seasonLabel: 'Peak (Oct–Mar)',
        pricePerAdult: 32500,
        adults: 2,
        adultsSubtotal: 65000,
        pricePerChild: 16250,
        children: 1,
        childrenSubtotal: 16250,
        subtotal: 81250,
        gstRate: 0.05,
        gstAmount: 4063,
        total: 85313,
      },
    ]),
    status: 'DRAFT' as const,
    createdAt: now,
    updatedAt: now,
  });

  // Note on sample enquiry
  await collections.enquiryNotes().insertOne({
    _id: new ObjectId(),
    id: new ObjectId().toHexString(),
    enquiryId: sampleEnquiry.id,
    authorId: consultantUser.id,
    body: 'Customer requested houseboat as mandatory. PKG-KL-07 is an exact match for 5 nights in December well within the ₹1.2L total budget.',
    createdAt: now,
  });

  // Mock message log for instant acknowledgement
  await collections.messageLogs().insertOne({
    _id: new ObjectId(),
    id: new ObjectId().toHexString(),
    enquiryId: sampleEnquiry.id,
    channel: 'EMAIL' as const,
    direction: 'OUTBOUND' as const,
    template: 'acknowledgement',
    recipient: 'vikram.malhotra@testmail.com',
    body: 'Dear Dr. Vikram Malhotra, Thank you for contacting Company A Tours, Kochi. We have received your enquiry ENQ-0001 for Kerala in December. A senior travel specialist is reviewing your requirements and will reply within the hour.',
    createdAt: now,
  });

  // Pre-seed remaining enquiries across statuses and channels
  const additionalEnquiriesData = [
    {
      reference: 'ENQ-0002',
      source: 'WHATSAPP' as const,
      name: 'Sunita & Deepak Sharma',
      email: 'deepak.sharma@outlook.com',
      phone: '+91 99100 87654',
      travelMonth: 'November',
      adults: 2,
      children: 0,
      message: 'Looking for a relaxing honeymoon trip in Kerala backwaters for 4 nights in November. Private pool villa preferred.',
      consentDataProcessing: true,
      consentWhatsApp: true,
      status: 'QUOTED' as const,
      assignedToId: consultantUser.id,
      firstResponseAt: new Date(Date.now() - 40 * 60 * 1000),
      createdAt: new Date(Date.now() - 65 * 60 * 1000),
    },
    {
      reference: 'ENQ-0003',
      source: 'EMAIL' as const,
      name: 'Marcus & Sarah Jenkins',
      email: 'marcus.jenkins@uktravel.co.uk',
      phone: '+44 7700 900123',
      travelMonth: 'January',
      adults: 4,
      children: 0,
      message: 'We are a group of 4 British birdwatchers and nature photographers visiting South India for 8 days in January. Interested in Periyar wildlife and Munnar tea hills.',
      consentDataProcessing: true,
      consentWhatsApp: false,
      status: 'NEW' as const,
      createdAt: new Date(Date.now() - 95 * 60 * 1000), // > 60 working minutes ago -> OVERDUE for test
    },
    {
      reference: 'ENQ-0004',
      source: 'PHONE' as const,
      name: 'Col. Sanjeev Nair',
      email: 'sanjeev.nair@indianarmy.org',
      phone: '+91 94470 11223',
      travelMonth: 'December',
      adults: 6,
      children: 2,
      message: 'Family reunion trip for 8 pax. Need luxury tempo traveller and accommodations in Munnar and Cochin for 5 days.',
      consentDataProcessing: true,
      consentWhatsApp: true,
      status: 'IN_PROGRESS' as const,
      assignedToId: consultantUser.id,
      createdAt: new Date(Date.now() - 25 * 60 * 1000),
    },
    {
      reference: 'ENQ-0005',
      source: 'CHAT' as const,
      name: 'Pooja Hegde',
      email: 'pooja.hegde@techcorp.in',
      phone: '+91 98860 33445',
      travelMonth: 'October',
      adults: 2,
      children: 2,
      message: 'Wayanad weekend treehouse package for Dussehra holidays. Please send quotation with children prices.',
      consentDataProcessing: true,
      consentWhatsApp: true,
      status: 'WON' as const,
      assignedToId: consultantUser.id,
      firstResponseAt: new Date(Date.now() - 120 * 60 * 1000),
      createdAt: new Date(Date.now() - 150 * 60 * 1000),
    },
    {
      reference: 'ENQ-0006',
      source: 'WEB_FORM' as const,
      name: 'Rajesh Subramanian',
      email: 'rajesh.sub@chennaifinance.com',
      phone: '+91 98400 99887',
      travelMonth: 'December',
      adults: 3,
      children: 0,
      message: 'Tamil Nadu temple tour including Madurai and Rameswaram for elderly parents.',
      consentDataProcessing: true,
      consentWhatsApp: true,
      status: 'NEW' as const,
      createdAt: new Date(Date.now() - 15 * 60 * 1000),
    },
    {
      reference: 'ENQ-0007',
      source: 'WHATSAPP' as const,
      name: 'Gareth Evans',
      email: 'gareth.evans@ausmail.com.au',
      phone: '+61 412 345 678',
      travelMonth: 'February',
      adults: 2,
      children: 0,
      message: 'Hampi and Goa circuit in February. Heritage hotels only.',
      consentDataProcessing: true,
      consentWhatsApp: true,
      status: 'NEW' as const,
      createdAt: new Date(Date.now() - 80 * 60 * 1000), // Overdue
    },
    {
      reference: 'ENQ-0008',
      source: 'EMAIL' as const,
      name: 'Aishwarya & Rohit Gupta',
      email: 'rohit.gupta@delhicapital.com',
      phone: '+91 98110 55667',
      travelMonth: 'January',
      adults: 2,
      children: 1,
      message: 'Alleppey houseboat for 1 night and Munnar 2 nights. Total budget approx 90,000 INR.',
      consentDataProcessing: true,
      consentWhatsApp: false,
      status: 'LOST' as const,
      assignedToId: consultantUser.id,
      firstResponseAt: new Date(Date.now() - 300 * 60 * 1000),
      createdAt: new Date(Date.now() - 350 * 60 * 1000),
    },
    {
      reference: 'ENQ-0009',
      source: 'WEB_FORM' as const,
      name: 'Kavita Pillai',
      email: 'kavita.pillai@bengalurubio.com',
      phone: '+91 97410 77889',
      travelMonth: 'November',
      adults: 4,
      children: 0,
      message: 'Ooty and Coorg 5 nights relaxing holiday with coffee plantation tour.',
      consentDataProcessing: true,
      consentWhatsApp: true,
      status: 'QUOTED' as const,
      assignedToId: consultantUser.id,
      firstResponseAt: new Date(Date.now() - 50 * 60 * 1000),
      createdAt: new Date(Date.now() - 75 * 60 * 1000),
    },
    {
      reference: 'ENQ-0010',
      source: 'PHONE' as const,
      name: 'Prof. Thomas Schmidt',
      email: 't.schmidt@heidelberg-uni.de',
      phone: '+49 6221 54000',
      travelMonth: 'March',
      adults: 2,
      children: 0,
      message: 'Ayurveda rejuvenation package in Kerala for 14 days. Authentic traditional hospital or certified retreat.',
      consentDataProcessing: true,
      consentWhatsApp: false,
      status: 'IN_PROGRESS' as const,
      assignedToId: consultantUser.id,
      createdAt: new Date(Date.now() - 45 * 60 * 1000),
    },
    {
      reference: 'ENQ-0011',
      source: 'CHAT' as const,
      name: 'Neha Chawla',
      email: 'neha.chawla@mumbaidesign.in',
      phone: '+91 98200 44556',
      travelMonth: 'August',
      adults: 2,
      children: 0,
      message: 'Monsoon trip to Munnar and Athirappilly waterfalls. Budget 50k.',
      consentDataProcessing: true,
      consentWhatsApp: true,
      status: 'NEW' as const,
      createdAt: new Date(Date.now() - 20 * 60 * 1000),
    },
    {
      reference: 'ENQ-0012',
      source: 'EMAIL' as const,
      name: 'Siddharth Roy',
      email: 'sid.roy@kolkatatech.org',
      phone: '+91 98300 22334',
      travelMonth: 'December',
      adults: 5,
      children: 1,
      message: 'Kerala 6 nights family vacation. Munnar, Thekkady and Kumarakom.',
      consentDataProcessing: true,
      consentWhatsApp: true,
      status: 'ASSIGNED' as const,
      assignedToId: consultantUser.id,
      createdAt: new Date(Date.now() - 50 * 60 * 1000),
    },
    {
      reference: 'ENQ-0013',
      source: 'WEB_FORM' as const,
      name: 'Farhan & Zoya Akhtar',
      email: 'farhan.akhtar@hyderabadit.com',
      phone: '+91 99490 88776',
      travelMonth: 'October',
      adults: 2,
      children: 0,
      message: 'Private luxury houseboat with jacuzzi in Alleppey. Please send available options and rates.',
      consentDataProcessing: true,
      consentWhatsApp: true,
      status: 'WON' as const,
      assignedToId: consultantUser.id,
      firstResponseAt: new Date(Date.now() - 240 * 60 * 1000),
      createdAt: new Date(Date.now() - 260 * 60 * 1000),
    },
    {
      reference: 'ENQ-0014',
      source: 'WHATSAPP' as const,
      name: 'Meera Nambiar',
      email: 'meera.nambiar@kochiart.com',
      phone: '+91 94460 55443',
      travelMonth: 'December',
      adults: 2,
      children: 2,
      message: 'Kochi Biennale & Fort Kochi heritage weekend package.',
      consentDataProcessing: true,
      consentWhatsApp: true,
      status: 'NEW' as const,
      createdAt: new Date(Date.now() - 70 * 60 * 1000), // Overdue
    },
    {
      reference: 'ENQ-0015',
      source: 'PHONE' as const,
      name: 'Anand Kulkarni',
      email: 'anand.kulkarni@punemanufacturing.com',
      phone: '+91 98500 11229',
      travelMonth: 'January',
      adults: 4,
      children: 0,
      message: 'Corporate retreat for 4 directors in Wayanad luxury resort.',
      consentDataProcessing: true,
      consentWhatsApp: false,
      status: 'IN_PROGRESS' as const,
      assignedToId: consultantUser.id,
      createdAt: new Date(Date.now() - 30 * 60 * 1000),
    },
  ];

  for (const enq of additionalEnquiriesData) {
    const enqId = new ObjectId().toHexString();
    const createdEnq = {
      _id: new ObjectId(enqId),
      id: enqId,
      ...enq,
      packageId: null,
      firstResponseAt: (enq as any).firstResponseAt || null,
      assignedToId: (enq as any).assignedToId || null,
      updatedAt: now,
    };
    await collections.enquiries().insertOne(createdEnq);

    const words = enq.message.toLowerCase();

    await collections.enquiryExtractions().insertOne({
      _id: new ObjectId(),
      id: new ObjectId().toHexString(),
      enquiryId: createdEnq.id,
      fields: JSON.stringify({
        destination: words.includes('wayanad') ? 'Wayanad' : words.includes('ooty') ? 'Ooty' : words.includes('tamil') ? 'Tamil Nadu' : 'Kerala',
        startMonth: enq.travelMonth,
        nights: enq.message.includes('4 night') ? 4 : enq.message.includes('8 day') ? 7 : enq.message.includes('5 day') ? 4 : 5,
        adults: enq.adults,
        children: enq.children,
        budgetTotalINR: enq.message.includes('90,000') ? 90000 : enq.message.includes('50k') ? 50000 : undefined,
        mustHaves: words.includes('houseboat') ? ['houseboat'] : words.includes('treehouse') ? ['treehouse'] : [],
        confidence: {
          destination: 0.9,
          startMonth: 0.9,
          nights: 0.8,
          adults: 0.95,
          children: 0.95,
        },
      }),
      correctedFields: null,
      model: 'rule-based-fallback',
      status: enq.status === 'QUOTED' || enq.status === 'WON' ? 'REVIEWED' : 'PENDING',
      createdAt: now,
    });

    if (enq.status === 'QUOTED' || enq.status === 'WON') {
      await collections.messageLogs().insertOne({
        _id: new ObjectId(),
        id: new ObjectId().toHexString(),
        enquiryId: createdEnq.id,
        channel: enq.source === 'WHATSAPP' ? 'WHATSAPP' : 'EMAIL',
        direction: 'OUTBOUND',
        template: 'quote_proposal',
        recipient: enq.email || enq.phone,
        body: `Quotation sent for ${enq.name}: Itinerary and pricing shared as requested.`,
        createdAt: now,
      });
    }
  }

  console.log('[Seed] 15 enquiries seeded.');

  // 5. Seed 140 Old URL 301 Redirects (from 6-year-old legacy freelancer site)
  const baseRedirects = [
    { fromPath: '/kerala-tour-package-2020', toPath: '/packages/munnar-thekkady-alleppey-houseboat' },
    { fromPath: '/munnar-thekkady-alleppey-tour', toPath: '/packages/munnar-thekkady-alleppey-houseboat' },
    { fromPath: '/kerala-houseboat-booking', toPath: '/destinations/kerala-backwaters' },
    { fromPath: '/alleppey-backwater-packages', toPath: '/packages/kerala-backwaters-luxury-honeymoon' },
    { fromPath: '/wayanad-treehouse-resorts', toPath: '/packages/wayanad-rainforest-family-adventure' },
    { fromPath: '/tamil-nadu-pilgrimage-tours', toPath: '/packages/madurai-rameswaram-kanyakumari' },
    { fromPath: '/rameswaram-kanyakumari-package', toPath: '/packages/madurai-rameswaram-kanyakumari' },
    { fromPath: '/ooty-coorg-package-bangalore', toPath: '/packages/ooty-coorg-mysore-heritage-highlands' },
    { fromPath: '/hampi-heritage-tour-from-goa', toPath: '/packages/hampi-ruins-and-goa-sun-explorer' },
    { fromPath: '/kochi-weekend-package', toPath: '/packages/kochi-munnar-tea-trail-short-break' },
    { fromPath: '/contact-us.html', toPath: '/search' },
    { fromPath: '/about-company-a-tours', toPath: '/' },
  ];

  // Synthesize legacy paths across 6-year history (2018-2024) across 60 catalog packages
  const years = ['2018', '2019', '2020', '2021', '2022', '2023'];
  const legacyPrefixes = [
    { prefix: '/packages/kerala-special-', target: '/packages/munnar-thekkady-alleppey-houseboat' },
    { prefix: '/tour-itinerary/munnar-', target: '/packages/kochi-munnar-tea-trail-short-break' },
    { prefix: '/holidays/alleppey-luxury-', target: '/packages/kerala-backwaters-luxury-honeymoon' },
    { prefix: '/packages/wayanad-adventure-', target: '/packages/wayanad-rainforest-family-adventure' },
    { prefix: '/tamilnadu/temple-tour-', target: '/packages/madurai-rameswaram-kanyakumari' },
    { prefix: '/south-india/heritage-', target: '/packages/ooty-coorg-mysore-heritage-highlands' },
    { prefix: '/hampi-special-', target: '/packages/hampi-ruins-and-goa-sun-explorer' },
    { prefix: '/kerala-grand-explorer-', target: '/packages/grand-kerala-heritage-wildlife-houseboat-explorer' },
  ];

  const syntheticRedirects: { fromPath: string; toPath: string }[] = [];

  // Generate year-based package variations
  for (const lp of legacyPrefixes) {
    for (const yr of years) {
      syntheticRedirects.push({ fromPath: `${lp.prefix}${yr}`, toPath: lp.target });
      syntheticRedirects.push({ fromPath: `${lp.prefix}${yr}.html`, toPath: lp.target });
    }
  }

  // Generate legacy file-extension paths (.php, .asp, old category URLs)
  const legacyFileSlugs = [
    'munnar-honeymoon-package',
    'alleppey-deluxe-houseboat-rate',
    'thekkady-periyar-wildlife-tour',
    'cochin-sightseeing-car-rental',
    'kerala-family-tour-cost',
    'south-india-temple-package-5days',
    'kanyakumari-sunrise-sunset-tour',
    'madurai-meenakshi-temple-guide',
    'rameswaram-dhanushkodi-cab-booking',
    'wayanad-tree-house-honeymoon',
    'ooty-coorg-mysore-car-package',
    'kerala-ayurveda-monsoon-packages',
    'marari-beach-resort-deals',
    'kumarakom-bird-sanctuary-houseboat',
    'kovalam-trivandrum-holiday',
    'bekal-fort-kasargod-tour',
    'athirappilly-waterfalls-day-trip',
    'varkala-cliff-beach-stay',
    'poovar-island-resort-boating',
    'munnar-tea-factory-visit',
  ];

  for (const slug of legacyFileSlugs) {
    syntheticRedirects.push({ fromPath: `/${slug}.php`, toPath: '/packages/munnar-thekkady-alleppey-houseboat' });
    syntheticRedirects.push({ fromPath: `/${slug}.html`, toPath: '/search' });
    syntheticRedirects.push({ fromPath: `/legacy/${slug}`, toPath: '/destinations/kerala-backwaters' });
  }

  // Combine and deduplicate to reach exactly 140 URLs
  const allGenerated = [...baseRedirects, ...syntheticRedirects];
  const uniqueRedirectsMap = new Map<string, string>();
  for (const r of allGenerated) {
    if (!uniqueRedirectsMap.has(r.fromPath)) {
      uniqueRedirectsMap.set(r.fromPath, r.toPath);
    }
  }

  // Fill up to exactly 140 legacy URLs if needed
  let counter = 1;
  while (uniqueRedirectsMap.size < 140) {
    uniqueRedirectsMap.set(`/old-site/archive-route-${counter}.php`, '/packages/munnar-thekkady-alleppey-houseboat');
    counter++;
  }

  const final140Redirects = Array.from(uniqueRedirectsMap.entries()).slice(0, 140).map(([fromPath, toPath]) => ({
    fromPath,
    toPath,
  }));

  for (const redir of final140Redirects) {
    await collections.redirects().insertOne({
      _id: new ObjectId(),
      id: new ObjectId().toHexString(),
      fromPath: redir.fromPath,
      toPath: redir.toPath,
      statusCode: 301,
      createdAt: now,
    });
  }
  console.log(`[Seed] Successfully seeded exactly ${final140Redirects.length} legacy 301 redirects.`);

  // 6. Seed Initial Activity Logs
  await collections.activityLogs().insertMany([
    {
      _id: new ObjectId(),
      id: new ObjectId().toHexString(),
      actorId: adminUser.id,
      action: 'PACKAGE_PUBLISHED',
      entityType: 'PACKAGE',
      entityId: pkgKL07.id,
      meta: JSON.stringify({ code: 'PKG-KL-07', version: 1, title: snapshotKL07.title }),
      createdAt: now,
    },
    {
      _id: new ObjectId(),
      id: new ObjectId().toHexString(),
      actorId: editorUser.id,
      action: 'PACKAGE_DRAFT_SAVED',
      entityType: 'PACKAGE',
      entityId: pkgSI12.id,
      meta: JSON.stringify({ code: 'PKG-SI-12', version: 1, title: snapshotSI12.title }),
      createdAt: now,
    },
    {
      _id: new ObjectId(),
      id: new ObjectId().toHexString(),
      actorId: null,
      action: 'ENQUIRY_RECEIVED',
      entityType: 'ENQUIRY',
      entityId: sampleEnquiry.id,
      meta: JSON.stringify({ reference: 'ENQ-0001', customer: 'Dr. Vikram Malhotra', source: 'WEB_FORM' }),
      createdAt: now,
    },
    {
      _id: new ObjectId(),
      id: new ObjectId().toHexString(),
      actorId: consultantUser.id,
      action: 'ENQUIRY_ASSIGNED',
      entityType: 'ENQUIRY',
      entityId: sampleEnquiry.id,
      meta: JSON.stringify({ reference: 'ENQ-0001', assignee: 'Anjali Thomas' }),
      createdAt: now,
    },
  ]);

  console.log('[Seed] Seeding completed successfully!');
}

import path from 'path';
import { fileURLToPath } from 'url';

// Allow direct execution via tsx src/server/seed.ts
const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  seedDatabase()
    .catch((e) => {
      console.error('[Seed] Error during seeding:', e);
      process.exit(1);
    })
    .finally(async () => {
      console.log('[Seed] Closing database connection...');
      try {
        await closeMongo();
      } catch {}
      console.log('[Seed] Seed script finished');
      process.exit(0);
    });
}
