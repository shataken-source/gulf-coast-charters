// Mock data for community message board
export const mockThreads = [
  {
    id: '1',
    userId: 'user1',
    userName: 'Sarah Mitchell',
    userAvatar: 'avatar1',
    title: 'Best time to visit the Caribbean?',
    content: 'Planning my first charter trip to the Caribbean. What months would you recommend for the best weather and fewer crowds?',
    createdAt: '2024-11-10T10:30:00Z',
    replies: [
      {
        id: '1a',
        userId: 'user2',
        userName: 'Captain Mike',
        userAvatar: 'avatar2',
        content: 'December through April is peak season - best weather but more expensive. May-June is great for deals!',
        parentId: '1',
        createdAt: '2024-11-10T14:20:00Z'
      },
      {
        id: '1b',
        userId: 'user3',
        userName: 'Jennifer Lopez',
        userAvatar: 'avatar3',
        content: 'I went in March and it was perfect! Warm, sunny, and not too crowded.',
        parentId: '1',
        createdAt: '2024-11-11T09:15:00Z'
      }
    ]
  },
  {
    id: '2',
    userId: 'user4',
    userName: 'David Chen',
    userAvatar: 'avatar4',
    title: 'Tips for first-time charterers?',
    content: 'Never been on a charter before. Any advice on what to pack or what to expect?',
    createdAt: '2024-11-12T08:45:00Z',
    replies: []
  }
];
