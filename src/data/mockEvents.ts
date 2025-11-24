export interface CommunityEvent {
  id: string;
  title: string;
  type: 'charter-meetup' | 'fishing-tournament' | 'sailing-club' | 'group-booking';
  description: string;
  date: string;
  time: string;
  location: string;
  organizer: string;
  organizerId: string;
  maxAttendees: number;
  attendees: string[];
  imageUrl: string;
  price?: number;
  charterLinked?: string;
}

export const mockEvents: CommunityEvent[] = [
  {
    id: 'evt1',
    title: 'Sunset Sailing Meetup',
    type: 'charter-meetup',
    description: 'Join us for a beautiful sunset sail along the coast. Perfect for beginners and experienced sailors alike!',
    date: '2025-11-25',
    time: '17:00',
    location: 'Marina Bay Harbor',
    organizer: 'Captain Sarah Johnson',
    organizerId: 'user1',
    maxAttendees: 12,
    attendees: ['user2', 'user3', 'user4'],
    imageUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800',
    price: 45
  },
  {
    id: 'evt2',
    title: 'Deep Sea Fishing Tournament',
    type: 'fishing-tournament',
    description: 'Annual deep sea fishing competition. Prizes for biggest catch! All skill levels welcome.',
    date: '2025-12-05',
    time: '06:00',
    location: 'Ocean Point Marina',
    organizer: 'Mike "The Fish" Thompson',
    organizerId: 'user5',
    maxAttendees: 30,
    attendees: ['user6', 'user7', 'user8', 'user9'],
    imageUrl: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800',
    price: 120
  },
  {
    id: 'evt3',
    title: 'Weekly Sailing Club',
    type: 'sailing-club',
    description: 'Regular weekly meetup for sailing enthusiasts. Share tips, stories, and plan future adventures.',
    date: '2025-11-22',
    time: '18:30',
    location: 'Yacht Club Lounge',
    organizer: 'Emily Waters',
    organizerId: 'user10',
    maxAttendees: 25,
    attendees: ['user11', 'user12', 'user13', 'user14', 'user15'],
    imageUrl: 'https://images.unsplash.com/photo-1540946485063-a40da27545f8?w=800'
  },
  {
    id: 'evt4',
    title: 'Family Day Group Charter',
    type: 'group-booking',
    description: 'Family-friendly group charter with activities for all ages. Snorkeling equipment included!',
    date: '2025-11-28',
    time: '10:00',
    location: 'Paradise Cove Marina',
    organizer: 'David Chen',
    organizerId: 'user16',
    maxAttendees: 20,
    attendees: ['user17', 'user18'],
    imageUrl: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800',
    price: 75,
    charterLinked: 'charter1'
  }
];
