import { useState, useCallback } from 'react';
import type { PublicOffer } from '../types/offer';

const STORAGE_KEY = 'ats_favorite_offers';

function loadFavorites(): PublicOffer[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PublicOffer[]) : [];
  } catch {
    return [];
  }
}

function saveFavorites(offers: PublicOffer[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(offers));
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<PublicOffer[]>(loadFavorites);

  const isFavorite = useCallback(
    (id: number) => favorites.some((o) => o.id === id),
    [favorites],
  );

  const toggleFavorite = useCallback((offer: PublicOffer) => {
    setFavorites((prev) => {
      const next = prev.some((o) => o.id === offer.id)
        ? prev.filter((o) => o.id !== offer.id)
        : [...prev, offer];
      saveFavorites(next);
      return next;
    });
  }, []);

  const removeFavorite = useCallback((id: number) => {
    setFavorites((prev) => {
      const next = prev.filter((o) => o.id !== id);
      saveFavorites(next);
      return next;
    });
  }, []);

  return { favorites, isFavorite, toggleFavorite, removeFavorite };
}
