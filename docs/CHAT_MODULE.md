# Chat Module Contract

Reusable NestJS chat module in `codebase-admin` for **green_vietnam** and other UI apps.

- Namespace Socket.IO: `/chat`
- Tenant header: `X-App-Id` (default `green_vietnam`)
- Auth: Bearer JWT (REST) / `handshake.auth.token` (WS)

## REST API

Base path: `/chat` — all routes require JWT.

| Method | Path | Body / Query | Description |
|--------|------|--------------|-------------|
| GET | `/chat/conversations` | `?cursor=&limit=` | Inbox (cursor = `{iso}_{id}`) |
| POST | `/chat/conversations/dm` | `{ peerUserId }` | Get or create DM |
| POST | `/chat/conversations/group` | `{ title, memberIds, refType?, refId? }` | Create group |
| POST | `/chat/conversations/:id/members` | `{ memberIds }` | Add members (admin) |
| GET | `/chat/conversations/:id/messages` | `?beforeId=&limit=` | Cursor history (newest page, ascending items) |
| POST | `/chat/conversations/:id/messages` | `{ clientMsgId, body?, kind?, attachments? }` | Send via REST |
| PATCH | `/chat/conversations/:id/read` | `{ lastReadMessageId }` | Mark read |
| DELETE | `/chat/messages/:id` | — | Soft-delete own message |

### Headers

```
Authorization: Bearer <accessToken>
X-App-Id: green_vietnam
```

### Inbox item shape

```json
{
  "id": 1,
  "type": "dm",
  "appId": "green_vietnam",
  "title": null,
  "lastMessagePreview": "Xin chào",
  "lastMessageAt": "2026-07-16T10:00:00.000Z",
  "unreadCount": 2,
  "role": "member",
  "peer": { "id": 9, "fullName": "An", "picture": "...", "username": "an" }
}
```

### Message shape

```json
{
  "id": 100,
  "conversationId": 1,
  "senderId": 3,
  "kind": "text",
  "body": "Hello",
  "attachments": null,
  "clientMsgId": "uuid-v4",
  "createdAt": "2026-07-16T10:00:00.000Z",
  "deletedAt": null
}
```

**Idempotency:** unique `(conversationId, senderId, clientMsgId)`. Retrying the same `clientMsgId` returns the existing message without duplicating.

## Socket.IO (`/chat`)

### Connect

```js
io(BASE_URL + '/chat', {
  auth: { token: accessToken, appId: 'green_vietnam' },
  transports: ['websocket'],
});
```

### Rooms

| Room | Purpose |
|------|---------|
| `user:{userId}` | Auto-joined on connect — inbox / presence |
| `conv:{conversationId}` | Join via `chat.conv.join` to receive live messages |

### Events

| Event | Direction | Payload |
|-------|-----------|---------|
| `chat.conv.join` | C→S | `{ conversationId }` |
| `chat.conv.leave` | C→S | `{ conversationId }` |
| `chat.message.send` | C→S | `{ conversationId, clientMsgId, body?, kind?, attachments? }` |
| `chat.message.ack` | S→C | `{ clientMsgId, message, created }` |
| `chat.message.new` | S→C | `message` |
| `chat.typing` | C↔S | `{ conversationId, userId?, isTyping }` |
| `chat.read` | C→S | `{ conversationId, lastReadMessageId }` |
| `chat.read.update` | S→C | `{ conversationId, userId, lastReadMessageId }` |
| `chat.presence` | S→C | `{ userId, online }` |
| `chat.conv.updated` | S→C | `{ conversationId, lastMessage?, unreadCount?, lastReadMessageId? }` |
| `chat.error` | S→C | `{ message, clientMsgId? }` |

### Optimistic UI flow

1. Client appends local message with `clientMsgId`.
2. Emit `chat.message.send`.
3. On `chat.message.ack`, replace local id with server `message.id`.
4. On ack timeout, retry same `clientMsgId` (server dedupes).

## Domain integration

Other modules (e.g. campaigns) can inject `ChatService`:

```ts
await chatService.ensureGroupForRef({
  appId: 'green_vietnam',
  refType: 'campaign',
  refId: String(campaignId),
  title: campaignTitle,
  creatorUserId: userId,
  memberIds: [],
});
```

## Infra

- MySQL tables: `chat_conversation`, `chat_conversation_member`, `chat_message`, `chat_message_receipt`
- Redis (`REDIS_URL`): Socket.IO adapter + presence + unread counters
- Without Redis: single-instance in-memory fallback
- Offline members: FCM push (`NotificationType.CHAT`)

```bash
docker compose up -d redis
# .env
REDIS_URL=redis://localhost:6379
```

## Flutter client

See `green_vietnam/lib/chat/` for repository + socket + optimistic controller skeleton.
