// utils/favorites.ts
const FAVORITES_KEY = 'favoritedProfiles';

export const getFavorites = (): string[] => {
  if (typeof window === 'undefined') return [];
  return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
};

export const isFavorited = (id: string) => {
  return getFavorites().includes(id);
};

export const toggleFavorite = (id: string) => {
  const favorites = getFavorites();
  if (favorites.includes(id)) {
    const newFavorites = favorites.filter(favId => favId !== id);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
  } else {
    favorites.push(id);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }
};