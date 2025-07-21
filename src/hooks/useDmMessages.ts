import { useState, useEffect, useCallback } from 'react';

export function useDmMessages(friendId: string) {
  const storageKey = `dmMessages_${friendId}`;
  const [messages, setMessages] = useState<any[]>(() => {
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(messages));
  }, [messages, storageKey]);

  const addMessage = useCallback((msg: any) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    localStorage.removeItem(storageKey);
  }, [storageKey]);

  return { messages, addMessage, clearMessages };
}
