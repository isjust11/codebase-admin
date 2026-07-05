import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

/** Tên event realtime cho OCR. */
export const OCR_EVENTS = {
  JOB_UPDATED: 'ocr.job.updated',
  JOIN_JOB: 'ocr.join',
  LEAVE_JOB: 'ocr.leave',
} as const;

/** Payload realtime gửi cho client khi job thay đổi. */
export interface OcrJobUpdatePayload {
  jobId: number;
  status: string;
  processedPages?: number;
  totalPages?: number | null;
  error?: string | null;
  /** Trạng thái export PDF: processing | done | failed */
  exportStatus?: string | null;
  pdfUrl?: string | null;
  exportError?: string | null;
}

/**
 * Gateway realtime cho tiến độ OCR. Client (app/FE) join room theo jobId để
 * nhận cập nhật riêng cho job đó, tránh broadcast toàn hệ thống.
 */
@WebSocketGateway({
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
  },
})
export class OcrGateway {
  private readonly logger = new Logger(OcrGateway.name);

  @WebSocketServer()
  server: Server;

  private static roomForJob(jobId: number | string): string {
    return `ocr:job:${jobId}`;
  }

  @SubscribeMessage(OCR_EVENTS.JOIN_JOB)
  handleJoinJob(
    @MessageBody() data: { jobId: number | string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = OcrGateway.roomForJob(data?.jobId);
    client.join(room);
    this.logger.debug(`Client ${client.id} joined ${room}`);
  }

  @SubscribeMessage(OCR_EVENTS.LEAVE_JOB)
  handleLeaveJob(
    @MessageBody() data: { jobId: number | string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = OcrGateway.roomForJob(data?.jobId);
    client.leave(room);
    this.logger.debug(`Client ${client.id} left ${room}`);
  }

  /** Bắn cập nhật trạng thái job tới room của job đó. */
  emitJobUpdate(payload: OcrJobUpdatePayload): void {
    if (!this.server) {
      return;
    }
    this.server
      .to(OcrGateway.roomForJob(payload.jobId))
      .emit(OCR_EVENTS.JOB_UPDATED, payload);
  }
}
