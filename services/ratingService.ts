import { Rating } from '../types';

const STORAGE_KEY = 'teamup_ratings';

export const ratingService = {
  getAllRatings(): Rating[] {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveRatings(ratings: Rating[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ratings));
  },

  async submitRatings(ratings: Omit<Rating, 'id' | 'createdAt'>[]): Promise<void> {
    const allRatings = this.getAllRatings();
    
    ratings.forEach(rating => {
      const newRating: Rating = {
        ...rating,
        id: `rating_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
      };
      allRatings.push(newRating);
    });
    
    this.saveRatings(allRatings);
  },

  getEventRatings(eventId: string): Rating[] {
    const ratings = this.getAllRatings();
    return ratings.filter(r => r.eventId === eventId);
  },

  getUserRatings(userId: string): Rating[] {
    const ratings = this.getAllRatings();
    return ratings.filter(r => r.ratedUserId === userId);
  },
};

