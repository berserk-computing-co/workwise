import { MigrationInterface, QueryRunner } from "typeorm";

export class AlignSchemaWithPlan1771576300000 implements MigrationInterface {
    name = 'AlignSchemaWithPlan1771576300000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // companies table changes
        await queryRunner.query(`ALTER TABLE "companies" DROP COLUMN "markup_percentage"`);
        await queryRunner.query(`ALTER TABLE "companies" ADD "hourly_rate" numeric(10,2) NOT NULL DEFAULT '85.00'`);
        await queryRunner.query(`ALTER TABLE "companies" ADD "burden_multiplier" numeric(4,2) NOT NULL DEFAULT '1.50'`);
        await queryRunner.query(`ALTER TABLE "companies" ADD "overhead_multiplier" numeric(4,2) NOT NULL DEFAULT '1.25'`);
        await queryRunner.query(`ALTER TABLE "companies" ADD "profit_margin" numeric(4,2) NOT NULL DEFAULT '0.20'`);
        await queryRunner.query(`ALTER TABLE "companies" ADD "tax_rate" numeric(4,2) NOT NULL DEFAULT '0.00'`);

        // estimates table changes
        await queryRunner.query(`ALTER TABLE "estimates" DROP COLUMN "customer_address"`);
        await queryRunner.query(`ALTER TABLE "estimates" DROP COLUMN "subtotal"`);
        await queryRunner.query(`ALTER TABLE "estimates" DROP COLUMN "markup_percentage"`);
        await queryRunner.query(`ALTER TABLE "estimates" ADD "job_site_address" text NOT NULL DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE "estimates" ADD "trade_category" text NOT NULL DEFAULT 'plumbing'`);
        await queryRunner.query(`ALTER TABLE "estimates" ADD "property_type" text`);
        await queryRunner.query(`ALTER TABLE "estimates" ADD "city" text`);
        await queryRunner.query(`ALTER TABLE "estimates" ADD "state" text`);
        await queryRunner.query(`ALTER TABLE "estimates" ADD "material_subtotal" numeric(12,2) DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "estimates" ADD "labor_hours" numeric(8,2) DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "estimates" ADD "labor_subtotal" numeric(12,2) DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "estimates" ADD "overhead_amount" numeric(12,2) DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "estimates" ADD "profit_amount" numeric(12,2) DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "estimates" ADD "tax_amount" numeric(12,2) DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "estimates" ADD "property_year_built" integer`);
        await queryRunner.query(`ALTER TABLE "estimates" ADD "property_sqft" integer`);
        await queryRunner.query(`ALTER TABLE "estimates" ADD "property_bedrooms" integer`);
        await queryRunner.query(`ALTER TABLE "estimates" ADD "property_bathrooms" numeric(3,1)`);
        await queryRunner.query(`ALTER TABLE "estimates" ADD "property_valuation" numeric(12,2)`);
        await queryRunner.query(`ALTER TABLE "estimates" ADD "property_data_json" jsonb`);

        // estimate_sections table changes
        await queryRunner.query(`ALTER TABLE "estimate_sections" ADD "labor_hours" numeric(8,2) DEFAULT '0'`);

        // line_items table changes
        await queryRunner.query(`ALTER TABLE "line_items" ADD "contractor_modified" boolean DEFAULT false`);

        // Create line_item_edits table
        await queryRunner.query(`CREATE TABLE "line_item_edits" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "estimate_id" uuid NOT NULL, "line_item_id" uuid, "user_id" uuid NOT NULL, "edit_type" text NOT NULL, "previous_value" jsonb, "new_value" jsonb, "section_name" text, "project_type" text, "zip_code" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_line_item_edits" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_line_item_edits_estimate" ON "line_item_edits" ("estimate_id") `);
        await queryRunner.query(`ALTER TABLE "line_item_edits" ADD CONSTRAINT "FK_line_item_edits_estimate" FOREIGN KEY ("estimate_id") REFERENCES "estimates"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "line_item_edits" ADD CONSTRAINT "FK_line_item_edits_line_item" FOREIGN KEY ("line_item_id") REFERENCES "line_items"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "line_item_edits" ADD CONSTRAINT "FK_line_item_edits_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop line_item_edits table
        await queryRunner.query(`ALTER TABLE "line_item_edits" DROP CONSTRAINT "FK_line_item_edits_user"`);
        await queryRunner.query(`ALTER TABLE "line_item_edits" DROP CONSTRAINT "FK_line_item_edits_line_item"`);
        await queryRunner.query(`ALTER TABLE "line_item_edits" DROP CONSTRAINT "FK_line_item_edits_estimate"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_line_item_edits_estimate"`);
        await queryRunner.query(`DROP TABLE "line_item_edits"`);

        // Revert line_items table changes
        await queryRunner.query(`ALTER TABLE "line_items" DROP COLUMN "contractor_modified"`);

        // Revert estimate_sections table changes
        await queryRunner.query(`ALTER TABLE "estimate_sections" DROP COLUMN "labor_hours"`);

        // Revert estimates table changes
        await queryRunner.query(`ALTER TABLE "estimates" DROP COLUMN "property_data_json"`);
        await queryRunner.query(`ALTER TABLE "estimates" DROP COLUMN "property_valuation"`);
        await queryRunner.query(`ALTER TABLE "estimates" DROP COLUMN "property_bathrooms"`);
        await queryRunner.query(`ALTER TABLE "estimates" DROP COLUMN "property_bedrooms"`);
        await queryRunner.query(`ALTER TABLE "estimates" DROP COLUMN "property_sqft"`);
        await queryRunner.query(`ALTER TABLE "estimates" DROP COLUMN "property_year_built"`);
        await queryRunner.query(`ALTER TABLE "estimates" DROP COLUMN "tax_amount"`);
        await queryRunner.query(`ALTER TABLE "estimates" DROP COLUMN "profit_amount"`);
        await queryRunner.query(`ALTER TABLE "estimates" DROP COLUMN "overhead_amount"`);
        await queryRunner.query(`ALTER TABLE "estimates" DROP COLUMN "labor_subtotal"`);
        await queryRunner.query(`ALTER TABLE "estimates" DROP COLUMN "labor_hours"`);
        await queryRunner.query(`ALTER TABLE "estimates" DROP COLUMN "material_subtotal"`);
        await queryRunner.query(`ALTER TABLE "estimates" DROP COLUMN "state"`);
        await queryRunner.query(`ALTER TABLE "estimates" DROP COLUMN "city"`);
        await queryRunner.query(`ALTER TABLE "estimates" DROP COLUMN "property_type"`);
        await queryRunner.query(`ALTER TABLE "estimates" DROP COLUMN "trade_category"`);
        await queryRunner.query(`ALTER TABLE "estimates" DROP COLUMN "job_site_address"`);
        await queryRunner.query(`ALTER TABLE "estimates" ADD "markup_percentage" numeric(4,2)`);
        await queryRunner.query(`ALTER TABLE "estimates" ADD "subtotal" numeric(12,2) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "estimates" ADD "customer_address" text`);

        // Revert companies table changes
        await queryRunner.query(`ALTER TABLE "companies" DROP COLUMN "tax_rate"`);
        await queryRunner.query(`ALTER TABLE "companies" DROP COLUMN "profit_margin"`);
        await queryRunner.query(`ALTER TABLE "companies" DROP COLUMN "overhead_multiplier"`);
        await queryRunner.query(`ALTER TABLE "companies" DROP COLUMN "burden_multiplier"`);
        await queryRunner.query(`ALTER TABLE "companies" DROP COLUMN "hourly_rate"`);
        await queryRunner.query(`ALTER TABLE "companies" ADD "markup_percentage" numeric(4,2)`);
    }

}
