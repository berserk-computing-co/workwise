import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1771399324829 implements MigrationInterface {
    name = 'InitialSchema1771399324829'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "line_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "section_id" uuid NOT NULL, "description" text NOT NULL, "quantity" numeric(10,2) NOT NULL DEFAULT '1', "unit" text NOT NULL DEFAULT 'each', "unit_cost" numeric(10,2) NOT NULL DEFAULT '0', "extended_cost" numeric(12,2) NOT NULL DEFAULT '0', "sort_order" integer NOT NULL DEFAULT '0', "source" text NOT NULL DEFAULT 'ai_generated', "onebuild_source_id" text, "onebuild_match_score" real, "flagged" boolean NOT NULL DEFAULT false, "flag_reason" text, "is_optional" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6d227c876e374542dc9bb44dfb4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_dbd2787b357b8cbbea8c2858a9" ON "line_items" ("section_id") `);
        await queryRunner.query(`CREATE TABLE "estimate_sections" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "estimate_id" uuid NOT NULL, "name" text NOT NULL, "sort_order" integer NOT NULL DEFAULT '0', "subtotal" numeric(12,2) NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1e79347d15b23df6deaa8b30204" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_e02769ca248de4197ca44bd1a7" ON "estimate_sections" ("estimate_id") `);
        await queryRunner.query(`CREATE TABLE "estimate_options" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "estimate_id" uuid NOT NULL, "tier" text, "label" text, "description" text, "total" numeric(12,2) NOT NULL DEFAULT '0', "is_recommended" boolean NOT NULL DEFAULT false, "tier_details" jsonb NOT NULL DEFAULT '[]', "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_84928c42666536e5824f454ae5f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_db874c722d2162da67160385f0" ON "estimate_options" ("estimate_id") `);
        await queryRunner.query(`CREATE TABLE "estimates" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "company_id" uuid NOT NULL, "created_by" uuid NOT NULL, "status" text NOT NULL DEFAULT 'draft', "customer_name" text, "customer_email" text, "customer_phone" text, "customer_address" text, "project_description" text NOT NULL, "project_type" text, "zip_code" text NOT NULL, "subtotal" numeric(12,2) NOT NULL DEFAULT '0', "total" numeric(12,2) NOT NULL DEFAULT '0', "markup_percentage" numeric(4,2), "tax_rate" numeric(4,2), "internal_notes" text, "customer_notes" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_447af75b2f6025adf7f80703810" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_00d8efb3dc3984bbbe17d17b88" ON "estimates" ("company_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_63b625e34d9378444906300890" ON "estimates" ("status") `);
        await queryRunner.query(`CREATE TABLE "companies" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "phone" text, "email" text, "website" text, "license_number" text, "street" text, "city" text, "state" text, "zip_code" text NOT NULL, "markup_percentage" numeric(4,2), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_d4bc3e82a314fa9e29f652c2c22" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "auth0_id" text NOT NULL, "email" text NOT NULL, "first_name" text, "last_name" text, "phone" text, "company_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_2356e187b2a6e1490e4f06f7508" UNIQUE ("auth0_id"), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "line_items" ADD CONSTRAINT "FK_dbd2787b357b8cbbea8c2858a90" FOREIGN KEY ("section_id") REFERENCES "estimate_sections"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "estimate_sections" ADD CONSTRAINT "FK_e02769ca248de4197ca44bd1a7c" FOREIGN KEY ("estimate_id") REFERENCES "estimates"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "estimate_options" ADD CONSTRAINT "FK_db874c722d2162da67160385f05" FOREIGN KEY ("estimate_id") REFERENCES "estimates"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "estimates" ADD CONSTRAINT "FK_00d8efb3dc3984bbbe17d17b88d" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "estimates" ADD CONSTRAINT "FK_81482ffdb30c288b70403445af9" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_7ae6334059289559722437bcc1c" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_7ae6334059289559722437bcc1c"`);
        await queryRunner.query(`ALTER TABLE "estimates" DROP CONSTRAINT "FK_81482ffdb30c288b70403445af9"`);
        await queryRunner.query(`ALTER TABLE "estimates" DROP CONSTRAINT "FK_00d8efb3dc3984bbbe17d17b88d"`);
        await queryRunner.query(`ALTER TABLE "estimate_options" DROP CONSTRAINT "FK_db874c722d2162da67160385f05"`);
        await queryRunner.query(`ALTER TABLE "estimate_sections" DROP CONSTRAINT "FK_e02769ca248de4197ca44bd1a7c"`);
        await queryRunner.query(`ALTER TABLE "line_items" DROP CONSTRAINT "FK_dbd2787b357b8cbbea8c2858a90"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "companies"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_63b625e34d9378444906300890"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_00d8efb3dc3984bbbe17d17b88"`);
        await queryRunner.query(`DROP TABLE "estimates"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_db874c722d2162da67160385f0"`);
        await queryRunner.query(`DROP TABLE "estimate_options"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e02769ca248de4197ca44bd1a7"`);
        await queryRunner.query(`DROP TABLE "estimate_sections"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_dbd2787b357b8cbbea8c2858a9"`);
        await queryRunner.query(`DROP TABLE "line_items"`);
    }

}
