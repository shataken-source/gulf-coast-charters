export interface ScraperUrl {
  id: string;
  url: string;
  name: string;
  category: string;
  priority: number;
  active: boolean;
  lastScraped?: string;
  notes?: string;
}

export const scraperUrls: ScraperUrl[] = [
  {
    id: '1',
    url: 'https://www.gulfshorefishingcharters.com/',
    name: 'Gulf Shores Fishing Charters',
    category: 'Charter Company',
    priority: 10,
    active: true,
    notes: 'Private charters in Gulf Shores, Alabama'
  },
  {
    id: '2',
    url: 'https://www.zekeslanding.com/',
    name: "Zeke's Landing & Marina",
    category: 'Charter Fleet',
    priority: 10,
    active: true,
    notes: 'Largest charter fleet on the Gulf Coast'
  },
  {
    id: '3',
    url: 'https://www.gulfrebelcharters.com/',
    name: 'Gulf Rebel Charters',
    category: 'Charter Company',
    priority: 9,
    active: true,
    notes: 'Family-owned, 60+ years experience in Orange Beach'
  },
  {
    id: '4',
    url: 'https://fishingcharterbiloxi.com/',
    name: 'Mississippi Gulf Coast Fishing Charters',
    category: 'Charter Company',
    priority: 9,
    active: true,
    notes: 'Inshore and offshore fishing in Biloxi, MS'
  },
  {
    id: '5',
    url: 'https://www.gulfislandcharters.net/',
    name: 'Gulf Island Charters',
    category: 'Charter Company',
    priority: 8,
    active: true,
    notes: 'Family adventure charters'
  },
  {
    id: '6',
    url: 'http://www.anniegirlcharters.com',
    name: 'Annie Girl Charters',
    category: 'Charter Company',
    priority: 8,
    active: true,
    notes: 'Gulf Coast fishing charters'
  },
  {
    id: '7',
    url: 'https://reelsurprisecharters.com/',
    name: 'Reel Surprise Charters',
    category: 'Charter Company',
    priority: 9,
    active: true,
    notes: 'Bilingual crew, shared and private trips'
  },
  {
    id: '8',
    url: 'https://getawaygulffishing.com/',
    name: 'Getaway Charters',
    category: 'Charter Company',
    priority: 9,
    active: true,
    notes: 'Family fishing specialists since 1995'
  },
  {
    id: '9',
    url: 'https://www.fishingbooker.com/charters/usa/alabama/orange-beach',
    name: 'FishingBooker Orange Beach',
    category: 'Directory',
    priority: 7,
    active: true,
    notes: 'Charter directory for Orange Beach'
  },
  {
    id: '10',
    url: 'https://www.captainexperiences.com/gulf-shores',
    name: 'Captain Experiences Gulf Shores',
    category: 'Directory',
    priority: 7,
    active: true,
    notes: 'Gulf Shores charter directory'
  }
];

export const scraperConfig = {
  autoSave: true,
  rateLimit: 2000,
  retryAttempts: 2,
  timeout: 30000,
  deduplication: true,
  notifyOnComplete: true
};
