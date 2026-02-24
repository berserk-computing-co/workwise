import { MigrationInterface, QueryRunner } from "typeorm";

export class CoreModels1771814086190 implements MigrationInterface {
    name = 'CoreModels1771814086190'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "section_id" uuid NOT NULL, "description" text NOT NULL, "quantity" numeric(10,2) NOT NULL DEFAULT '1', "unit" text NOT NULL DEFAULT 'each', "unit_cost" numeric(10,2) NOT NULL DEFAULT '0', "extended_cost" numeric(12,2) NOT NULL DEFAULT '0', "sort_order" integer NOT NULL DEFAULT '0', "source" text NOT NULL DEFAULT 'ai_generated', "source_data" jsonb NOT NULL DEFAULT '{}', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ba5885359424c15ca6b9e79bcf6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_items_section" ON "items" ("section_id") `);
        await queryRunner.query(`CREATE TABLE "sections" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "project_id" uuid NOT NULL, "name" text NOT NULL, "sort_order" integer NOT NULL DEFAULT '0', "subtotal" numeric(12,2) NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_f9749dd3bffd880a497d007e450" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_sections_project" ON "sections" ("project_id") `);
        await queryRunner.query(`CREATE TABLE "options" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "project_id" uuid NOT NULL, "tier" text NOT NULL, "label" text, "description" text, "total" numeric(12,2) NOT NULL DEFAULT '0', "is_recommended" boolean NOT NULL DEFAULT false, "overrides" jsonb NOT NULL DEFAULT '{}', "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_d232045bdb5c14d932fba18d957" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_d0771d42c2474351ba1578dbc0" ON "options" ("project_id") `);
        await queryRunner.query(`CREATE TABLE "projects" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "organization_id" uuid NOT NULL, "created_by" uuid NOT NULL, "status" text NOT NULL DEFAULT 'draft', "description" text NOT NULL, "category" text NOT NULL DEFAULT 'plumbing', "address" text NOT NULL, "zip_code" text NOT NULL, "city" text, "state" text, "client_name" text, "total" numeric(12,2) NOT NULL DEFAULT '0', "metadata" jsonb NOT NULL DEFAULT '{}', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_6271df0a7aed1d6c0691ce6ac50" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_projects_org" ON "projects" ("organization_id") `);
        await queryRunner.query(`CREATE TABLE "organizations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "zip_code" text NOT NULL, "settings" jsonb NOT NULL DEFAULT '{}', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6b031fcd0863e3f6b44230163f9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "auth_id" text NOT NULL, "email" text NOT NULL, "first_name" text, "last_name" text, "organization_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_32ddc1ae708e8261a870a6eb3e6" UNIQUE ("auth_id"), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "pipelines" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "project_id" uuid NOT NULL, "triggered_by" uuid NOT NULL, "status" text NOT NULL DEFAULT 'pending', "current_step" text, "steps" jsonb NOT NULL DEFAULT '[]', "errors" jsonb, "total_input_tokens" integer NOT NULL DEFAULT '0', "total_output_tokens" integer NOT NULL DEFAULT '0', "estimated_cost_cents" integer NOT NULL DEFAULT '0', "duration_ms" integer, "started_at" TIMESTAMP WITH TIME ZONE, "completed_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "version" integer NOT NULL, CONSTRAINT "PK_e38ea171cdfad107c1f3db2c036" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_pipelines_project" ON "pipelines" ("project_id") `);
        await queryRunner.query(`CREATE INDEX "idx_pipelines_status" ON "pipelines" ("status") `);
        await queryRunner.query(`ALTER TABLE "items" ADD CONSTRAINT "FK_7dfc06e7b45cfe015c3c64640cc" FOREIGN KEY ("section_id") REFERENCES "sections"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "sections" ADD CONSTRAINT "FK_46832696ad10cd7b64cd6563b60" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "options" ADD CONSTRAINT "FK_d0771d42c2474351ba1578dbc04" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "projects" ADD CONSTRAINT "FK_585c8ce06628c70b70100bfb842" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "projects" ADD CONSTRAINT "FK_8a7ccdb94bcc8635f933c8f8080" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_21a659804ed7bf61eb91688dea7" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "pipelines" ADD CONSTRAINT "FK_d2178c4de13e15180dcf301dbb8" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "pipelines" ADD CONSTRAINT "FK_0069e6a1a2a8aa2f584450d6145" FOREIGN KEY ("triggered_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pipelines" DROP CONSTRAINT "FK_0069e6a1a2a8aa2f584450d6145"`);
        await queryRunner.query(`ALTER TABLE "pipelines" DROP CONSTRAINT "FK_d2178c4de13e15180dcf301dbb8"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_21a659804ed7bf61eb91688dea7"`);
        await queryRunner.query(`ALTER TABLE "projects" DROP CONSTRAINT "FK_8a7ccdb94bcc8635f933c8f8080"`);
        await queryRunner.query(`ALTER TABLE "projects" DROP CONSTRAINT "FK_585c8ce06628c70b70100bfb842"`);
        await queryRunner.query(`ALTER TABLE "options" DROP CONSTRAINT "FK_d0771d42c2474351ba1578dbc04"`);
        await queryRunner.query(`ALTER TABLE "sections" DROP CONSTRAINT "FK_46832696ad10cd7b64cd6563b60"`);
        await queryRunner.query(`ALTER TABLE "items" DROP CONSTRAINT "FK_7dfc06e7b45cfe015c3c64640cc"`);
        await queryRunner.query(`DROP INDEX "public"."idx_pipelines_status"`);
        await queryRunner.query(`DROP INDEX "public"."idx_pipelines_project"`);
        await queryRunner.query(`DROP TABLE "pipelines"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "organizations"`);
        await queryRunner.query(`DROP INDEX "public"."idx_projects_org"`);
        await queryRunner.query(`DROP TABLE "projects"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d0771d42c2474351ba1578dbc0"`);
        await queryRunner.query(`DROP TABLE "options"`);
        await queryRunner.query(`DROP INDEX "public"."idx_sections_project"`);
        await queryRunner.query(`DROP TABLE "sections"`);
        await queryRunner.query(`DROP INDEX "public"."idx_items_section"`);
        await queryRunner.query(`DROP TABLE "items"`);
    }

}
