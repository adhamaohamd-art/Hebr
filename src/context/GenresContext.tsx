import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useLanguage } from './LanguageContext';
import { settingsService } from '../services/settingsService';
import {
  CustomGenre,
  genreLabel,
  getAllGenreKeys,
  getCustomGenres,
  setCustomGenres,
} from '../lib/genres';

interface GenresContextType {
  /** Built-in genres + the ones the admin added. */
  genreKeys: string[];
  /** Only the genres the admin added. */
  customGenres: CustomGenre[];
  /** Display name of a genre in the current language. */
  labelOf: (key: string) => string;
  /** Apply a new custom list right away (after the admin saves it). */
  applyCustomGenres: (list: unknown) => void;
}

const GenresContext = createContext<GenresContextType | undefined>(undefined);

export const GenresProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { language } = useLanguage();
  const [custom, setCustom] = useState<CustomGenre[]>(getCustomGenres());

  const applyCustomGenres = useCallback((list: unknown) => {
    setCustomGenres(list);
    setCustom(getCustomGenres());
  }, []);

  useEffect(() => {
    let cancelled = false;
    settingsService
      .getSettings()
      .then(s => {
        if (!cancelled) applyCustomGenres(s.customGenres);
      })
      .catch(() => {
        // Built-in genres keep working if the settings can't be loaded
      });
    return () => {
      cancelled = true;
    };
  }, [applyCustomGenres]);

  const value = useMemo<GenresContextType>(
    () => ({
      genreKeys: getAllGenreKeys(),
      customGenres: custom,
      labelOf: (key: string) => genreLabel(key, language),
      applyCustomGenres,
    }),
    // `custom` changes whenever the registry changes, so genreKeys is recomputed with it
    [custom, language, applyCustomGenres]
  );

  return <GenresContext.Provider value={value}>{children}</GenresContext.Provider>;
};

export const useGenres = () => {
  const context = useContext(GenresContext);
  if (!context) {
    throw new Error('useGenres must be used within a GenresProvider');
  }
  return context;
};
