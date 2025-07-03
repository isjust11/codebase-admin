import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreatePaymentTable1710669600003 implements MigrationInterface {
    name = 'CreatePaymentTable1710669600003'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "payment",
                columns: [
                    {
                        name: "id",
                        type: "int",
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: "increment",
                    },
                    {
                        name: "userId",
                        type: "int",
                    },
                    {
                        name: "amount",
                        type: "decimal",
                        precision: 10,
                        scale: 2,
                    },
                    {
                        name: "currency",
                        type: "varchar",
                        length: "3",
                        default: "'VND'",
                    },
                    {
                        name: "paymentMethod",
                        type: "enum",
                        enum: ["stripe", "vnpay", "momo", "zalopay", "cash"],
                        default: "'stripe'",
                    },
                    {
                        name: "status",
                        type: "enum",
                        enum: ["pending", "completed", "failed", "refunded", "cancelled"],
                        default: "'pending'",
                    },
                    {
                        name: "transactionId",
                        type: "varchar",
                        isNullable: true,
                    },
                    {
                        name: "paymentIntentId",
                        type: "varchar",
                        isNullable: true,
                    },
                    {
                        name: "gatewayResponse",
                        type: "text",
                        isNullable: true,
                    },
                    {
                        name: "description",
                        type: "varchar",
                        isNullable: true,
                    },
                    {
                        name: "metadata",
                        type: "text",
                        isNullable: true,
                    },
                    {
                        name: "failureReason",
                        type: "varchar",
                        isNullable: true,
                    },
                    {
                        name: "createdAt",
                        type: "timestamp",
                        default: "CURRENT_TIMESTAMP",
                    },
                    {
                        name: "updatedAt",
                        type: "timestamp",
                        default: "CURRENT_TIMESTAMP",
                        onUpdate: "CURRENT_TIMESTAMP",
                    },
                    {
                        name: "completedAt",
                        type: "timestamp",
                        isNullable: true,
                    },
                ],
            }),
            true
        );

        await queryRunner.createForeignKey(
            "payment",
            new TableForeignKey({
                columnNames: ["userId"],
                referencedColumnNames: ["id"],
                referencedTableName: "user",
                onDelete: "CASCADE",
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable("payment");
        const foreignKey = table?.foreignKeys.find(fk => fk.columnNames.indexOf("userId") !== -1);
        if (foreignKey) {
            await queryRunner.dropForeignKey("payment", foreignKey);
        }
        await queryRunner.dropTable("payment");
    }
} 