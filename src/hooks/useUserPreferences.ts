import { useState, useEffect } from "react";

export interface UserPreferences {
  displayName: string;
  writingFrequency: string;
  promptStyle: string;
}

export const useUserPreferences = () => {
  const [preferences, setPreferences] = useState<UserPreferences>({
    displayName: localStorage.getItem('userDisplayName') || '',
    writingFrequency: localStorage.getItem('writingFrequency') || 'daily',
    promptStyle: localStorage.getItem('promptStyle') || 'reflective',
  });

  useEffect(() => {
    const handleStorageChange = () => {
      setPreferences({
        displayName: localStorage.getItem('userDisplayName') || '',
        writingFrequency: localStorage.getItem('writingFrequency') || 'daily',
        promptStyle: localStorage.getItem('promptStyle') || 'reflective',
      });
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return preferences;
};
