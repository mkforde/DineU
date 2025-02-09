export interface GalleryPost {
  id: string;
  userId: string;
  userName: string;
  userAvatar: any; // Image source
  diningHall: string;
  image: any; // Image source
  rating: number;
  caption: string;
  timestamp: string;
  likes: number;
  comments: number;
}

export const mockGalleryPosts: GalleryPost[] = [
  {
    id: '1',
    userId: 'user1',
    userName: 'Alex C.',
    userAvatar: require('../assets/images/Avatar1.png'),
    diningHall: 'Ferris Booth Commons',
    image: require('../assets/images/icon_nutrition.png'),
    rating: 4.5,
    caption: 'The pasta here is actually amazing today! 🍝',
    timestamp: '2 hours ago',
    likes: 24,
    comments: 5
  },
  {
    id: '2',
    userId: 'user2',
    userName: 'Sarah L.',
    userAvatar: require('../assets/images/Avatar2.png'),
    diningHall: "JJ's Place",
    image: require('../assets/images/icon.png'),
    rating: 5,
    caption: 'Best late night burger on campus! 🍔',
    timestamp: '1 hour ago',
    likes: 32,
    comments: 8
  },
  {
    id: '3',
    userId: 'user3',
    userName: 'Mike R.',
    userAvatar: require('../assets/images/Avatar3.png'),
    diningHall: "Chef Mike's Sub Shop",
    image: require('../assets/images/Vegan.png'),
    rating: 4.8,
    caption: 'This sandwich is stacked! Worth the wait 🥪',
    timestamp: '30 minutes ago',
    likes: 15,
    comments: 3
  },
  // Add more mock posts as needed
];

export const getDiningHallPosts = (diningHallName: string) => {
  return mockGalleryPosts.filter(post => post.diningHall === diningHallName);
};

export const getRecentPosts = () => {
  return mockGalleryPosts.sort((a, b) => {
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });
}; 