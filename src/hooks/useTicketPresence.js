import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../api/client';

const HEARTBEAT_MS = 15000;

/**
 * Heartbeat for staff viewing a ticket. Sends "typing" while the composer has text,
 * "viewing" otherwise, and returns the other agents currently active.
 */
export default function useTicketPresence(ticketId, enabled, isTyping) {
  const [collisions, setCollisions] = useState([]);
  const typingRef = useRef(isTyping);

  useEffect(() => { typingRef.current = isTyping; }, [isTyping]);

  const ping = useCallback(async () => {
    try {
      const res = await api.post(`/tickets/${ticketId}/presence`, {
        action: typingRef.current ? 'typing' : 'viewing',
      });
      setCollisions(res.data.active_collisions || []);
    } catch {
      // presence is best-effort; the next heartbeat retries
    }
  }, [ticketId]);

  useEffect(() => {
    if (!enabled || !ticketId) return undefined;
    ping();
    const id = setInterval(ping, HEARTBEAT_MS);
    return () => clearInterval(id);
  }, [ticketId, enabled, ping]);

  // Announce a typing-state change immediately instead of waiting for the next beat.
  useEffect(() => {
    if (enabled && ticketId) ping();
  }, [isTyping, enabled, ticketId, ping]);

  return { collisions, setCollisions, ping };
}
