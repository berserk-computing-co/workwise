import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCurrentJobId1772094283000 implements MigrationInterface {
    name = 'AddCurrentJobId1772094283000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "projects" ADD "current_job_id" uuid`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "projects" DROP COLUMN "current_job_id"`);
    }
}
