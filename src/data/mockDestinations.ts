export interface Destination {
  id: string;
  name: string;
  country: string;
  region: string;
  description: string;
  image: string;
  activities: string[];
  bestTime: string;
  avgCost: number;
  rating: number;
  reviews: number;
  climate: string;
  featured: boolean;
  latitude: number;
  longitude: number;
  contactEmail?: string;
}


export const destinations: Destination[] = [
  {
    id: '1',
    name: 'Maldives',
    country: 'Maldives',
    region: 'South Asia',
    description: 'Crystal clear waters and pristine beaches perfect for water activities',
    image: 'https://d64gsuwffb70l.cloudfront.net/6918960e54362d714f32b6fc_1763244651543_51223360.webp',
    activities: ['Swimming', 'Snorkeling', 'Diving', 'Beach', 'Relaxation'],
    bestTime: 'Nov-Apr',
    avgCost: 3500,
    rating: 4.9,
    reviews: 2847,
    climate: 'Tropical',
    featured: true,
    latitude: 3.2028,
    longitude: 73.2207,
    contactEmail: 'info@maldives-tours.com'
  },

  {
    id: '2',
    name: 'Swiss Alps',
    country: 'Switzerland',
    region: 'Europe',
    description: 'World-class skiing and snowboarding in stunning alpine scenery',
    image: 'https://d64gsuwffb70l.cloudfront.net/6918960e54362d714f32b6fc_1763244652640_90f2ecf9.webp',
    activities: ['Skiing', 'Snowboarding', 'Hiking', 'Mountain', 'Adventure'],
    bestTime: 'Dec-Mar',
    avgCost: 2800,
    rating: 4.8,
    reviews: 3241,
    climate: 'Alpine',
    featured: true,
    latitude: 46.8182,
    longitude: 8.2275,
    contactEmail: 'info@swissalps-adventures.com'
  },
  {
    id: '3',
    name: 'Rome',
    country: 'Italy',
    region: 'Europe',
    description: 'Ancient history and culture with world-famous landmarks',
    image: 'https://d64gsuwffb70l.cloudfront.net/6918960e54362d714f32b6fc_1763244653644_9970f75a.webp',
    activities: ['Sightseeing', 'History', 'Culture', 'Food', 'Photography'],
    bestTime: 'Apr-Jun',
    avgCost: 2200,
    rating: 4.7,
    reviews: 4156,
    climate: 'Mediterranean',
    featured: true,
    latitude: 41.9028,
    longitude: 12.4964,
    contactEmail: 'tours@rome-experiences.com'
  },
  {
    id: '4',
    name: 'Amazon Rainforest',
    country: 'Brazil',
    region: 'South America',
    description: 'Lush jungle teeming with exotic wildlife and adventure',
    image: 'https://d64gsuwffb70l.cloudfront.net/6918960e54362d714f32b6fc_1763244661695_e631ba44.webp',
    activities: ['Hiking', 'Wildlife', 'Nature', 'Adventure', 'Photography'],
    bestTime: 'Jun-Nov',
    avgCost: 2600,
    rating: 4.6,
    reviews: 1893,
    climate: 'Tropical Rainforest',
    featured: false,
    latitude: -3.4653,
    longitude: -62.2159,
    contactEmail: 'explore@amazon-tours.com'
  },
  {
    id: '5',
    name: 'Tokyo',
    country: 'Japan',
    region: 'Asia',
    description: 'Vibrant city life with incredible food and entertainment',
    image: 'https://d64gsuwffb70l.cloudfront.net/6918960e54362d714f32b6fc_1763244662709_709776f6.webp',
    activities: ['Nightlife', 'Food', 'Shopping', 'Culture', 'Entertainment'],
    bestTime: 'Mar-May',
    avgCost: 2400,
    rating: 4.8,
    reviews: 5234,
    climate: 'Temperate',
    featured: true,
    latitude: 35.6762,
    longitude: 139.6503,
    contactEmail: 'hello@tokyo-travel.com'
  },
  {
    id: '6',
    name: 'Sahara Desert',
    country: 'Morocco',
    region: 'Africa',
    description: 'Vast desert landscapes perfect for adventure and camping',
    image: 'https://d64gsuwffb70l.cloudfront.net/6918960e54362d714f32b6fc_1763244663864_85466d38.webp',
    activities: ['Camping', 'Adventure', 'Photography', 'Stargazing', 'Camel Riding'],
    bestTime: 'Oct-Apr',
    avgCost: 1800,
    rating: 4.5,
    reviews: 1567,
    climate: 'Desert',
    featured: false,
    latitude: 31.7917,
    longitude: -7.0926,
    contactEmail: 'contact@sahara-expeditions.com'
  },
  {
    id: '7',
    name: 'Big Sur',
    country: 'USA',
    region: 'North America',
    description: 'Dramatic coastal cliffs with world-class surfing',
    image: 'https://d64gsuwffb70l.cloudfront.net/6918960e54362d714f32b6fc_1763244665020_888bd18c.webp',
    activities: ['Surfing', 'Hiking', 'Beach', 'Photography', 'Nature'],
    bestTime: 'May-Oct',
    avgCost: 2100,
    rating: 4.7,
    reviews: 2341,
    climate: 'Mediterranean',
    featured: false,
    latitude: 36.2704,
    longitude: -121.8081,
    contactEmail: 'info@bigsur-adventures.com'
  },
  {
    id: '8',
    name: 'Tuscany',
    country: 'Italy',
    region: 'Europe',
    description: 'Rolling vineyards with world-renowned wine and cuisine',
    image: 'https://d64gsuwffb70l.cloudfront.net/6918960e54362d714f32b6fc_1763244672295_061ef158.webp',
    activities: ['Wine Tasting', 'Food', 'Culture', 'Relaxation', 'Cycling'],
    bestTime: 'Apr-Oct',
    avgCost: 2500,
    rating: 4.8,
    reviews: 3876,
    climate: 'Mediterranean',
    featured: true,
    latitude: 43.7711,
    longitude: 11.2486,
    contactEmail: 'wine@tuscany-tours.com'
  },
  {
    id: '9',
    name: 'Lake Tahoe',
    country: 'USA',
    region: 'North America',
    description: 'Pristine mountain lake perfect for water sports',
    image: 'https://d64gsuwffb70l.cloudfront.net/6918960e54362d714f32b6fc_1763244673243_00c36399.webp',
    activities: ['Kayaking', 'Fishing', 'Hiking', 'Swimming', 'Nature'],
    bestTime: 'Jun-Sep',
    avgCost: 1900,
    rating: 4.6,
    reviews: 2654,
    climate: 'Alpine',
    featured: false,
    latitude: 39.0968,
    longitude: -120.0324,
    contactEmail: 'bookings@laketahoe-trips.com'
  },
  {
    id: '10',
    name: 'Great Barrier Reef',
    country: 'Australia',
    region: 'Oceania',
    description: 'World\'s largest coral reef system with incredible marine life',
    image: 'https://d64gsuwffb70l.cloudfront.net/6918960e54362d714f32b6fc_1763244674254_145942df.webp',
    activities: ['Diving', 'Snorkeling', 'Swimming', 'Wildlife', 'Photography'],
    bestTime: 'Jun-Oct',
    avgCost: 3200,
    rating: 4.9,
    reviews: 4523,
    climate: 'Tropical',
    featured: true,
    latitude: -18.2871,
    longitude: 147.6992,
    contactEmail: 'dive@greatbarrierreef.com'
  },
  {
    id: '11',
    name: 'Serengeti',
    country: 'Tanzania',
    region: 'Africa',
    description: 'Iconic African safari with incredible wildlife viewing',
    image: 'https://d64gsuwffb70l.cloudfront.net/6918960e54362d714f32b6fc_1763244675282_70a32287.webp',
    activities: ['Safari', 'Wildlife', 'Photography', 'Nature', 'Adventure'],
    bestTime: 'Jun-Oct',
    avgCost: 4200,
    rating: 4.9,
    reviews: 3145,
    climate: 'Savanna',
    featured: true,
    latitude: -2.3333,
    longitude: 34.8333,
    contactEmail: 'safari@serengeti-tours.com'
  },
  {
    id: '12',
    name: 'Patagonia',
    country: 'Argentina',
    region: 'South America',
    description: 'Rugged wilderness with glaciers and mountain peaks',
    image: 'https://d64gsuwffb70l.cloudfront.net/6918960e54362d714f32b6fc_1763244652640_90f2ecf9.webp',
    activities: ['Hiking', 'Trekking', 'Nature', 'Photography', 'Adventure'],
    bestTime: 'Nov-Mar',
    avgCost: 2900,
    rating: 4.7,
    reviews: 2187,
    climate: 'Subpolar',
    featured: false,
    latitude: -41.8102,
    longitude: -68.9063,
    contactEmail: 'trek@patagonia-expeditions.com'
  }
];

