export interface BlogArticle {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  author: {
    name: string;
    role: string;
    avatar?: string;
  };
  publishedAt: string;
  readingMinutes: number;
  coverImage: string;
  relatedPackageCode: string;
  relatedPackageTitle: string;
  relatedPackageSlug: string;
  relatedPackagePrice: number;
  content: {
    introduction: string;
    sections: {
      heading: string;
      body: string;
    }[];
    insiderTip: string;
  };
}

export const BLOG_ARTICLES: BlogArticle[] = [
  {
    slug: 'monsoon-magic-alleppey-houseboats-kerala',
    title: "Monsoon Magic: Why June to September is Kerala's Best Kept Secret",
    excerpt: "While crowds rush to the backwaters in December, seasoned travellers know that Kerala's monsoon brings emerald vibrancy, cooler breezes, and Ayurvedic rejuvenation at half the tariff.",
    category: 'Backwaters & Cruises',
    author: {
      name: 'Anjali Thomas',
      role: 'Senior Travel Consultant, Kochi',
    },
    publishedAt: '2026-10-15',
    readingMinutes: 5,
    coverImage: '/src/assets/images/destination_alleppey_1793807409061.jpg',
    relatedPackageCode: 'PKG-KL-07',
    relatedPackageTitle: 'Munnar, Thekkady and Alleppey Houseboat (6D/5N)',
    relatedPackageSlug: 'munnar-thekkady-alleppey-houseboat',
    relatedPackagePrice: 24900,
    content: {
      introduction: "There is an old Malayalam proverb that Kerala does not simply experience rain — it lives inside it. During the southwest monsoon (Edavappathi), the canals of Alleppey and Kumarakom transform into mirror-like channels reflecting coconut fronds heavy with raindrops.",
      sections: [
        {
          heading: "The Rejuvenating Rhythm of Rain on Thatch",
          body: "A traditional kettuvallam houseboat moored along the Vembanad Lake during a gentle afternoon downpour offers a sensory stillness impossible to find during peak dry season. The air is cool, free of humidity, and scented with wet cardamom and eucalyptus from the nearby Western Ghats.",
        },
        {
          heading: "Authentic Ayurvedic Rejuvenation",
          body: "According to classical Ashtanga Hridayam texts, the human body's pores are most receptive to herbal oils during the monsoon season. Our curated wellness retreats in Thekkady and Kumarakom offer physician-supervised Panchakarma and Abhyanga therapies timed perfectly with this climate.",
        },
        {
          heading: "Seasonal Tariff Advantage",
          body: "Beyond nature, monsoon travel represents extraordinary commercial value. At Company A Tours, our 6-day signature Munnar and Alleppey circuit is certified at ₹24,900 per person in monsoon versus ₹32,500 in peak winter — an immediate 23% saving with identical luxury transport and private houseboat standards.",
        },
      ],
      insiderTip: "Always book an upper-deck private houseboat with glass-paneled observation lounges so you can watch rainstorms roll over the paddy fields without getting damp.",
    },
  },
  {
    slug: 'secret-tea-trails-munnar-high-ranges',
    title: "Beyond Top Station: 4 Secret Tea Trails in Munnar's High Ranges",
    excerpt: "Escape the tourist traffic and discover century-old planters' trails, wild rhododendron ridges, and mist-veiled viewpoints in the Western Ghats.",
    category: 'Hill Stations & Highlands',
    author: {
      name: 'Arjun Varma',
      role: 'Curator & Field Explorer',
    },
    publishedAt: '2026-09-28',
    readingMinutes: 6,
    coverImage: '/src/assets/images/hero_munnar_tea_hills_1793807408412.jpg',
    relatedPackageCode: 'PKG-KL-03',
    relatedPackageTitle: 'Kochi & Munnar Tea Trail Short Break (4D/3N)',
    relatedPackageSlug: 'kochi-munnar-tea-trail-short-break',
    relatedPackagePrice: 19800,
    content: {
      introduction: "Rising 1,600 metres above sea level, Munnar was once the summer capital of the British administration in South India. While thousands flock to Mattupetty Dam, the real magic of these hills unfolds along quiet walking paths through the Lockheart Estate and Chithirapuram.",
      sections: [
        {
          heading: "The Chithirapuram Planters' Walk",
          body: "Winding through century-old tea bushes planted during the 1890s, this gentle 4-kilometre trail passes stone bungalows with rose gardens that feel suspended in time. In the morning, you can observe local pluckers balancing harvesting shears with uncanny precision.",
        },
        {
          heading: "Eravikulam's Hidden Shola Grasslands",
          body: "Home to the endangered Nilgiri Tahr, the high-altitude shola forest patches around Rajamalai harbor orchids, wild cinnamon trees, and streams pure enough to drink from.",
        },
      ],
      insiderTip: "Pack a windcheater and sturdy walking shoes. Temperatures can drop to 10°C in the evenings, even when the plains of Kochi are warm.",
    },
  },
  {
    slug: 'dravidian-temple-odyssey-madurai-kanyakumari',
    title: "Spiritual Architecture: Journeying from Madurai to the Sea-Lashed tip of India",
    excerpt: "How to experience the 1,000-pillar hall of Meenakshi, cross the historic Pamban sea bridge, and witness sunset over three oceans at Kanyakumari.",
    category: 'Heritage & Pilgrimage',
    author: {
      name: 'Radhika Menon',
      role: 'Managing Director, Company A Tours',
    },
    publishedAt: '2026-11-01',
    readingMinutes: 7,
    coverImage: '/src/assets/images/destination_madurai_temple_1793807409403.jpg',
    relatedPackageCode: 'PKG-SI-12',
    relatedPackageTitle: 'Madurai, Rameswaram and Kanyakumari Temple Circuit (5D/4N)',
    relatedPackageSlug: 'madurai-rameswaram-kanyakumari',
    relatedPackagePrice: 18750,
    content: {
      introduction: "South India's great temple corridor is not simply an itinerary of monuments; it is an unbroken continuum of living worship, architectural brilliance, and coastal geography.",
      sections: [
        {
          heading: "Madurai Meenakshi: Living Dravidian Grandeur",
          body: "The soaring gopurams of Meenakshi Temple, sculpted with thousands of painted mythological figures, come alive during the nightly procession of Lord Sundareswarar. The 1,000-pillar hall showcases musical stone columns that ring like bells when struck.",
        },
        {
          heading: "Pamban Bridge & Rameswaram's Sacred Corridors",
          body: "Driving over the sea into Rameswaram island remains one of India's most dramatic highway journeys. The 22 sacred wells (theerthams) inside the temple are drawn by temple priests for pilgrims seeking spiritual purification.",
        },
      ],
      insiderTip: "Book early morning temple entry slots through our dedicated Kochi concierge to avoid mid-day sun on temple stone courtyards.",
    },
  },
];

