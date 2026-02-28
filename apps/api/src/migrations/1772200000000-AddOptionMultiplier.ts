import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOptionMultiplier1772200000000 implements MigrationInterface {
    name = 'AddOptionMultiplier1772200000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "options" ADD "multiplier" decimal(8,4) NOT NULL DEFAULT 1.0`);
        await queryRunner.query(`UPDATE "options" SET "multiplier" = 1.0`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "options" DROP COLUMN "multiplier"`);
    }
}
