import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Chat module tables. With synchronize:true these are also auto-created;
 * migration kept for environments that prefer migrationsRun only.
 */
export class CreateChatTables1752681600000 implements MigrationInterface {
  name = 'CreateChatTables1752681600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS chat_conversation (
        id BIGINT NOT NULL AUTO_INCREMENT,
        type ENUM('dm', 'group') NOT NULL,
        appId VARCHAR(64) NOT NULL DEFAULT 'green_vietnam',
        title VARCHAR(255) NULL,
        dmKey VARCHAR(64) NULL,
        refType VARCHAR(64) NULL,
        refId VARCHAR(64) NULL,
        lastMessageId BIGINT NULL,
        lastMessageAt DATETIME NULL,
        lastMessagePreview VARCHAR(500) NULL,
        createdAt DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updatedAt DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (id),
        UNIQUE KEY IDX_chat_conv_app_dm (appId, dmKey),
        KEY IDX_chat_conv_ref (appId, refType, refId),
        KEY IDX_chat_conv_last (appId, lastMessageAt)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS chat_conversation_member (
        id BIGINT NOT NULL AUTO_INCREMENT,
        conversationId BIGINT NOT NULL,
        userId INT NOT NULL,
        appId VARCHAR(64) NOT NULL DEFAULT 'green_vietnam',
        role ENUM('member', 'admin') NOT NULL DEFAULT 'member',
        lastReadMessageId BIGINT NULL,
        mutedUntil DATETIME NULL,
        joinedAt DATETIME NULL,
        createdAt DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updatedAt DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (id),
        UNIQUE KEY UQ_chat_member_conv_user (conversationId, userId),
        KEY IDX_chat_member_user_app (userId, appId),
        CONSTRAINT FK_chat_member_conv FOREIGN KEY (conversationId)
          REFERENCES chat_conversation(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS chat_message (
        id BIGINT NOT NULL AUTO_INCREMENT,
        conversationId BIGINT NOT NULL,
        senderId INT NOT NULL,
        kind ENUM('text', 'image', 'file', 'system') NOT NULL DEFAULT 'text',
        body TEXT NULL,
        attachments JSON NULL,
        clientMsgId VARCHAR(64) NOT NULL,
        createdAt DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        deletedAt DATETIME NULL,
        PRIMARY KEY (id),
        UNIQUE KEY UQ_chat_msg_idempotent (conversationId, senderId, clientMsgId),
        KEY IDX_chat_msg_conv_id (conversationId, id),
        KEY IDX_chat_msg_sender (senderId),
        CONSTRAINT FK_chat_msg_conv FOREIGN KEY (conversationId)
          REFERENCES chat_conversation(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS chat_message_receipt (
        id BIGINT NOT NULL AUTO_INCREMENT,
        messageId BIGINT NOT NULL,
        userId INT NOT NULL,
        status ENUM('delivered', 'read') NOT NULL,
        at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (id),
        UNIQUE KEY UQ_chat_receipt_msg_user (messageId, userId),
        KEY IDX_chat_receipt_user_status (userId, status),
        CONSTRAINT FK_chat_receipt_msg FOREIGN KEY (messageId)
          REFERENCES chat_message(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS chat_message_receipt`);
    await queryRunner.query(`DROP TABLE IF EXISTS chat_message`);
    await queryRunner.query(`DROP TABLE IF EXISTS chat_conversation_member`);
    await queryRunner.query(`DROP TABLE IF EXISTS chat_conversation`);
  }
}
