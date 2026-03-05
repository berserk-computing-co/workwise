import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFilesTable1772400000000 implements MigrationInterface {
    name = 'AddFilesTable1772400000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "files" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "project_id" uuid NOT NULL, "s3_key" text NOT NULL, "file_name" text NOT NULL, "content_type" text NOT NULL, "size_bytes" bigint NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6c16b6df40546ea08d4f97f4be7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_files_project" ON "files" ("project_id") `);
        await queryRunner.query(`ALTER TABLE "files" ADD CONSTRAINT "FK_files_project_id" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "files" DROP CONSTRAINT "FK_files_project_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_files_project"`);
        await queryRunner.query(`DROP TABLE "files"`);
    }
}
