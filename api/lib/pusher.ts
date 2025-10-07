import Pusher from 'pusher';

export const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID || '',
  key: process.env.PUSHER_KEY || '',
  secret: process.env.PUSHER_SECRET || '',
  cluster: process.env.PUSHER_CLUSTER || 'us2',
  useTLS: true,
});

export async function triggerEvent(
  channel: string,
  event: string,
  data: any
): Promise<void> {
  try {
    await pusher.trigger(channel, event, data);
  } catch (error) {
    console.error('Pusher trigger error:', error);
  }
}

export async function triggerBatch(events: Array<{
  channel: string;
  event: string;
  data: any;
}>): Promise<void> {
  try {
    await pusher.triggerBatch(events.map(e => ({
      channel: e.channel,
      name: e.event,
      data: e.data,
    })));
  } catch (error) {
    console.error('Pusher batch trigger error:', error);
  }
}
