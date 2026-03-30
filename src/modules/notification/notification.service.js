import Notification from "../../DB/models/notification.model.js";
import { emitToUser } from "../../config/socket.js";
import { createNotFoundError } from "../../errors/error.factory.js";

// 1. Create & Emit Notification
export const createNotification = async ({ user, title, message, relatedId, onModel, type }) => {
  // A. Save to Database
  const notification = await Notification.create({
    user, title, message, relatedId, onModel, type
  });

  // B. Fire the real-time Socket event!
  emitToUser(user.toString(), "newNotification", notification);

  return notification;
};

// 2. Get User's History (For the frontend Bell Icon)
export const getUserNotifications = async (userId) => {
  return await Notification.find({ user: userId }).sort({ createdAt: -1 }).limit(50);
};

// 3. Mark as Read
export const markAsRead = async (notificationId, userId) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, user: userId },
    { isRead: true },
    { new: true }
  );
  if (!notification) throw createNotFoundError("Notification not found");
  return notification;
};