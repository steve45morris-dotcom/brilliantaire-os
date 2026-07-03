export interface LocalNotification {
  id: string;
  title: string;
  body: string;
  category: 'mission_start' | 'buffer_exhaust' | 'reflection' | 'briefing' | 'reminder';
  scheduledTime: string;
  delivered: boolean;
}

export class NotificationEngine {
  private queue: LocalNotification[] = [];

  schedule(notification: Omit<LocalNotification, 'delivered'>): LocalNotification {
    const full = { ...notification, delivered: false };
    this.queue.push(full);
    return full;
  }

  getPending(): LocalNotification[] {
    return this.queue.filter(n => !n.delivered);
  }

  triggerDelivery(id: string): boolean {
    const item = this.queue.find(n => n.id === id);
    if (item) {
      item.delivered = true;
      return true;
    }
    return false;
  }
}
