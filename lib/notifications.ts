import { toast } from "sonner";

let notificationInterval: NodeJS.Timeout | null = null;

export type NOTIFICATION_SOUNDS = "telegram";

const notificationSounds: Record<NOTIFICATION_SOUNDS, string> = {
  telegram: "https://cdn.xyehr.cn/source/Voicy_Telegram_notification.mp3",
};

// Clear all notification timers
export const clearAllNotificationTimers = () => {
  if (notificationInterval) {
    clearInterval(notificationInterval);
    notificationInterval = null;
  }
};

// Check pending notifications
export const checkPendingNotifications = () => {
  const now = Date.now();
  const pendingEvents = getPendingEvents(now);

  pendingEvents.forEach((event) => {
    triggerNotification(event);
    showToast(event);
  });
};

// Get pending events
const getPendingEvents = (currentTime: number) => {
  const events = JSON.parse(localStorage.getItem("events") || "[]");
  return events.filter((event: any) => event.notificationTime <= currentTime);
};

// Play notification sound
const triggerNotification = (event: any) => {
  const sound = notificationSounds["telegram"];
  new Audio(sound).play();
};

// Show Toast notification
const showToast = (event: any) => {
  toast(`${event.title}`, {
    description: event.description || "No content",
    duration: 4000,
  });
};


export const startNotificationChecking = () => {
  if (!notificationInterval) {
    notificationInterval = setInterval(() => {
      checkPendingNotifications();
    }, 30000);
  }
};

export const stopNotificationChecking = () => {
  if (notificationInterval) {
    clearInterval(notificationInterval);
    notificationInterval = null;
  }
};
