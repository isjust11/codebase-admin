import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import {
  NOTIFICATION_EVENTS,
  NOTIFICATION_ROLES,
  NOTIFICATION_ROOMS,
  NOTIFICATION_MESSAGES,
} from '../constants/notification.constants';
import { NotificationData } from '../interfaces/notification.interface';
import { JoinRoomDto, LeaveRoomDto } from '../dtos/notification.dto';

@WebSocketGateway({
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
  },
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedClients: Map<string, Socket> = new Map();
  private userRoles: Map<string, string> = new Map(); // Lưu trữ role của user

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
    this.connectedClients.set(client.id, client);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    this.connectedClients.delete(client.id);
    this.userRoles.delete(client.id);
  }

  @SubscribeMessage(NOTIFICATION_EVENTS.JOIN_ROOM)
  handleJoinRoom(client: Socket, data: JoinRoomDto) {
    client.join(data.room);
    this.userRoles.set(client.id, data.role);
    console.log(`Client ${client.id} joined room: ${data.room} as ${data.role}`);
  }

  @SubscribeMessage(NOTIFICATION_EVENTS.LEAVE_ROOM)
  handleLeaveRoom(client: Socket, data: LeaveRoomDto) {
    client.leave(data.room);
    console.log(`Client ${client.id} left room: ${data.room}`);
  }

  // Thông báo khi có order mới cho đầu bếp
  notifyNewOrder(data: NotificationData) {
    this.server.to(NOTIFICATION_ROOMS.CHEF_ROOM).emit(NOTIFICATION_EVENTS.NEW_ORDER, {
      ...data,
      message: NOTIFICATION_MESSAGES.NEW_ORDER,
    });
  }

  // Thông báo khi món ăn đã sẵn sàng cho nhân viên phục vụ
  notifyFoodReady(data: NotificationData) {
    this.server.to(NOTIFICATION_ROOMS.WAITER_ROOM).emit(NOTIFICATION_EVENTS.FOOD_READY, {
      ...data,
      message: NOTIFICATION_MESSAGES.FOOD_READY,
    });
  }

  // Thông báo khi khách hàng thanh toán cho quản lý
  notifyPayment(data: NotificationData) {
    this.server.to(NOTIFICATION_ROOMS.MANAGER_ROOM).emit(NOTIFICATION_EVENTS.PAYMENT_RECEIVED, {
      ...data,
      message: NOTIFICATION_MESSAGES.PAYMENT_RECEIVED,
    });
  }

  // Phương thức để gửi thông báo đến tất cả clients trong một room cụ thể
  notifyRoom(room: string, event: string, data: NotificationData) {
    this.server.to(room).emit(event, data);
  }

  // Phương thức để gửi thông báo đến tất cả clients
  notifyAll(event: string, data: NotificationData) {
    this.server.emit(event, data);
  }
} 