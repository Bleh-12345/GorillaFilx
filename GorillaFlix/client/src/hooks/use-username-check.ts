import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export function useUsernameCheck() {
  const [username, setUsername] = useState<string>('');
  const [debouncedUsername, setDebouncedUsername] = useState<string>('');
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState<boolean>(false);

  // Debounce the username input
  useEffect(() => {
    const handler = setTimeout(() => {
      if (username.length >= 3) {
        setDebouncedUsername(username);
      } else {
        setIsAvailable(null);
      }
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [username]);

  // Check username availability
  useEffect(() => {
    async function checkUsername() {
      if (debouncedUsername.length >= 3) {
        setIsChecking(true);
        try {
          const response = await fetch(`/api/check-username/${encodeURIComponent(debouncedUsername)}`);
          const data = await response.json();
          setIsAvailable(data.available);
        } catch (error) {
          console.error('Error checking username:', error);
          setIsAvailable(null);
        } finally {
          setIsChecking(false);
        }
      }
    }

    if (debouncedUsername) {
      checkUsername();
    }
  }, [debouncedUsername]);

  return {
    username,
    setUsername,
    isAvailable,
    isChecking,
  };
}