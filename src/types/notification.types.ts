import { NOTIFICATION_EVENTS, NOTIFICATION_ROOMS } from '../constants/notification.constants';
import { NotificationData, JoinRoomData } from '../interfaces/notification.interface';

export type NotificationEvent = typeof NOTIFICATION_EVENTS[keyof typeof NOTIFICATION_EVENTS];
export type NotificationRoom = typeof NOTIFICATION_ROOMS[keyof typeof NOTIFICATION_ROOMS];

export type NotificationPayload = {
  data: NotificationData;
  type: NotificationEvent;
};

export type JoinRoomPayload = {
  data: JoinRoomData;
  type: typeof NOTIFICATION_EVENTS.JOIN_ROOM;
};

export type LeaveRoomPayload = {
  data: { room: string };
  type: typeof NOTIFICATION_EVENTS.LEAVE_ROOM;
};

export type NotificationHandler = (payload: NotificationPayload) => void;
export type JoinRoomHandler = (payload: JoinRoomPayload) => void;
export type LeaveRoomHandler = (payload: LeaveRoomPayload) => void; 