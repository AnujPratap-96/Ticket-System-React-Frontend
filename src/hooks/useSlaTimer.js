import { useEffect, useState } from 'react';

/** Live minutes remaining until `targetIso`, updated every 30s. Null once fulfilled. */
export default function useSlaTimer(targetIso, active = true) {
  const compute = () => (targetIso ? Math.floor((new Date(targetIso).getTime() - Date.now()) / 60000) : null);
  const [minutes, setMinutes] = useState(compute);

  useEffect(() => {
    if (!active || !targetIso) return undefined;
    setMinutes(compute());
    const id = setInterval(() => setMinutes(compute()), 30000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetIso, active]);

  return minutes;
}
