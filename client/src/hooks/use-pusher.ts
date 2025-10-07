import { useEffect, useState, useCallback } from 'react';
import Pusher from 'pusher-js';

const pusher = new Pusher(import.meta.env.VITE_PUSHER_KEY || '', {
  cluster: import.meta.env.VITE_PUSHER_CLUSTER || 'us2',
});

interface PusherHookOptions {
  channel: string;
  events: {
    [eventName: string]: (data: any) => void;
  };
}

export function usePusher({ channel, events }: PusherHookOptions) {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const pusherChannel = pusher.subscribe(channel);

    pusher.connection.bind('connected', () => {
      setIsConnected(true);
    });

    pusher.connection.bind('disconnected', () => {
      setIsConnected(false);
    });

    Object.entries(events).forEach(([eventName, callback]) => {
      pusherChannel.bind(eventName, callback);
    });

    return () => {
      Object.entries(events).forEach(([eventName, callback]) => {
        pusherChannel.unbind(eventName, callback);
      });
      pusher.unsubscribe(channel);
    };
  }, [channel, events]);

  return { isConnected, pusher };
}

export function useRealTimeUpdates(
  onProjectUpdate?: (data: any) => void,
  onPaymentProofUpdate?: (data: any) => void,
  onInvestmentUpdate?: (data: any) => void
) {
  const events: { [key: string]: (data: any) => void } = {};

  if (onProjectUpdate) {
    events['created'] = onProjectUpdate;
    events['updated'] = onProjectUpdate;
  }

  if (onPaymentProofUpdate) {
    events['approved'] = onPaymentProofUpdate;
  }

  if (onInvestmentUpdate) {
    events['investment_update'] = onInvestmentUpdate;
  }

  return usePusher({
    channel: 'projects',
    events,
  });
}
