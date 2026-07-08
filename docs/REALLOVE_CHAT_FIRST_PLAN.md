# REALLOVE Chat-First Development Plan

Version: 1.0
Last updated: 2026-07-08
Owner: Product + Engineering

## 1. Product Goal
Build a dating app focused on real connection by forcing meaningful 2-way conversation before unlocking photos and deep profile information.

Core principle:
- Talk first.
- Build trust first.
- Unlock gradually with mutual consent.

## 2. Success Metrics (North Star + Guardrails)
North Star:
- Meaningful Conversation Rate (MCR): percentage of matched pairs reaching unlock level 1.

Guardrails:
- Message delivery success >= 99.9%.
- P50 send-to-receive latency < 300ms.
- P95 send-to-receive latency < 800ms.
- Message loss incidents = 0 in normal conditions.
- Report/abuse rate < 1.5% of active conversations.
- Crash-free sessions >= 99.7%.

## 3. Scope Priority (MVP)
In scope:
- 1-1 real-time chat (text first).
- Delivery/read receipts.
- Offline queue + reconnect sync.
- Anti-spam and basic safety moderation.
- Progressive unlock engine (bio -> first photo -> full profile).

Out of scope for MVP:
- Group chat.
- Voice/video call.
- Advanced recommendation ML.
- Public feed / social timeline.

## 4. Technical Architecture (MVP)
Recommended stack:
- Mobile app: Flutter.
- Backend API: NestJS.
- Main database: MySQL (reuse current ecosystem).
- Realtime + cache + rate limit: Redis.
- Object storage (future media): S3/MinIO.

Data flow:
1. Client sends message with idempotency key.
2. API persists message in MySQL (transaction-safe).
3. Event published via Redis for real-time fanout.
4. Receiver gets message via WebSocket.
5. Receiver ack updates delivery/read receipt.

## 5. Data Model Baseline
Tables:
- users (existing).
- conversations.
- conversation_participants.
- messages.
- message_receipts.
- user_blocks.
- unlock_progress.

Required indexes:
- messages (conversation_id, created_at, id).
- message_receipts unique (message_id, user_id, receipt_type).
- conversation_participants unique (conversation_id, user_id).
- user_blocks unique (blocker_id, blocked_id).

## 6. Unlock Rules (Conversation First)
Level 0 (Default):
- Minimal profile only, photos hidden.

Level 1 (Bio unlock):
- Each side sends >= 12 messages.
- Active on at least 2 separate days.
- Reply ratio on both sides >= 70%.

Level 2 (First photo unlock):
- Complete 3 guided prompts in chat.
- Both users tap "Continue getting to know".

Level 3 (Full profile unlock):
- Quality score reaches threshold.
- No active safety violation flags.
- Mutual consent to unlock full profile.

## 7. 12-Week Roadmap
Phase A (Weeks 1-2): Chat foundation
- Build conversation and message APIs.
- Build WebSocket gateway.
- Implement receipts (sent/delivered/read).
- Implement idempotency and retry.
- Implement cursor pagination.

Exit criteria:
- Stable 1-1 text chat.
- No duplicate or missing message in integration tests.

Phase B (Weeks 3-4): Smooth UX and reliability
- Optimistic UI and message state transitions.
- Typing indicator.
- Offline queue and auto resend.
- Reconnect and delta sync token.

Exit criteria:
- Works under unstable network simulation.
- P95 latency under target in staging.

Phase C (Weeks 5-6): Safety and control
- Rate limiting and spam detection.
- Link/phone masking in early conversation.
- In-chat block/report/mute.
- Basic moderation queue.

Exit criteria:
- Abuse/report flow operational.
- No critical safety blocker in beta.

Phase D (Weeks 7-9): Conversation quality + unlock engine
- Compute conversation quality score.
- Implement unlock levels and user prompts.
- Add unlock analytics dashboard.

Exit criteria:
- Unlock flow functioning end-to-end.
- A/B test config switchable by admin.

Phase E (Weeks 10-12): Production readiness
- Load test, failover test, chaos scenarios.
- Monitoring alerts and runbook.
- Closed beta -> fixes -> go-live checklist.

Exit criteria:
- SLO and safety metrics pass.
- Release sign-off from Product + Engineering + QA.

## 8. Sprint Plan Template (2-week sprint)
Sprint goals:
- G1: Core chat reliability.
- G2: Safety baseline.
- G3: Unlock readiness.

Backlog format:
- [P0] Must-have for release.
- [P1] Important, can slip if needed.
- [P2] Nice-to-have.

Definition of Ready (DoR):
- User story with acceptance criteria.
- API contract documented.
- DB migration reviewed.
- Test cases drafted.

Definition of Done (DoD):
- Code merged with reviews.
- Unit + integration tests pass.
- Telemetry added.
- Security checks pass.
- Product acceptance passed.

## 9. QA and Testing Strategy
Test layers:
- Unit tests: message state machine, unlock rules.
- Integration tests: send/receive/ack/reconnect.
- E2E tests: chat flow + unlock flow.
- Performance tests: concurrent socket connections.

Mandatory scenarios:
- Duplicate send due to retry.
- Network drop while sending.
- Client reconnect with stale messages.
- Blocked user trying to message.
- Unlock transition race condition.

## 10. Operations and Monitoring
Dashboards:
- Delivery latency (P50/P95/P99).
- Send failure rate.
- Reconnect success rate.
- Spam/report volume.
- Unlock funnel conversion.

Alerts:
- Latency breach > 15 min.
- Delivery success drops below 99.5%.
- Spike in report rate > 2x baseline.

## 11. Risks and Mitigations
Risk: chat feels slow under peak load.
- Mitigation: Redis fanout + connection pooling + load test every sprint.

Risk: unlock rules too strict or too easy.
- Mitigation: feature flags + A/B testing + weekly tuning.

Risk: abuse patterns bypass basic filters.
- Mitigation: moderation queue + progressive policy updates.

## 12. Team Cadence
Weekly cadence:
- Monday: sprint planning + risk review.
- Daily: 15-minute standup with blockers.
- Wednesday: architecture checkpoint.
- Friday: demo + KPI review + release decision.

## 13. Launch Checklist
- Core chat SLO met.
- Safety flow validated.
- Unlock flow validated.
- Rollback plan documented.
- Incident runbook ready.
- On-call owner assigned.

## 14. Immediate Next 10 Working Days
Day 1-2:
- Finalize DB schema and migrations.
- Implement conversation/message APIs.

Day 3-4:
- Implement WebSocket gateway and auth handshake.
- Build message send + delivery ack.

Day 5-6:
- Add read receipt and cursor pagination.
- Build Flutter chat screen with optimistic UI.

Day 7-8:
- Implement offline queue and reconnect sync.
- Add basic spam/rate limit.

Day 9-10:
- Integration test pack + staging load test.
- Fix P0 bugs and re-test.

## 15. Tracking Board (copy into issue tracker)
- [ ] Chat API foundation completed.
- [ ] WebSocket real-time stable.
- [ ] Offline/reconnect stable.
- [ ] Safety controls enabled.
- [ ] Unlock level 1 live.
- [ ] Unlock level 2 live.
- [ ] Unlock level 3 live.
- [ ] Beta release passed.
- [ ] Production release approved.
