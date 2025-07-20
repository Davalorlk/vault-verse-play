
const API_BASE_URL = 'https://mind-vault-kcfw.onrender.com';

export interface UserStats {
  uid: string;
  puzzlesSolved?: number;
  timePlayed?: number;
  experience?: number;
  coins?: number;
}

export const syncUserStats = async (stats: UserStats): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/user/${stats.uid}/stats`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        puzzlesSolved: stats.puzzlesSolved,
        timePlayed: stats.timePlayed,
        experience: stats.experience,
        coins: stats.coins,
        displayName: stats.displayName,
        avatar: stats.avatar
      })
    });

    if (!response.ok) {
      console.error('Failed to sync user stats:', response.statusText);
      return false;
    }

    const updatedUser = await response.json();
    console.log('User stats synced successfully:', updatedUser);
    return true;
  } catch (error) {
    console.error('Error syncing user stats:', error);
    return false;
  }
};

// Debounced version to avoid too many API calls
let syncTimeout: NodeJS.Timeout | null = null;

export const debouncedSyncUserStats = (stats: UserStats, delay: number = 2000) => {
  if (syncTimeout) {
    clearTimeout(syncTimeout);
  }
  
  syncTimeout = setTimeout(() => {
    syncUserStats(stats);
  }, delay);
};
