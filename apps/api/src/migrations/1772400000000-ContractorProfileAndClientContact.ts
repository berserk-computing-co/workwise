import { MigrationInterface, QueryRunner } from 'typeorm';

export class ContractorProfileAndClientContact1772400000000 implements MigrationInterface {
  name = 'ContractorProfileAndClientContact1772400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "organizations" ADD "phone" text`);
    await queryRunner.query(`ALTER TABLE "organizations" ADD "website" text`);
    await queryRunner.query(
      `ALTER TABLE "organizations" ADD "license_number" text`,
    );
    await queryRunner.query(`ALTER TABLE "organizations" ADD "logo_url" text`);
    await queryRunner.query(
      `ALTER TABLE "organizations" ADD "email_domain" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizations" ADD "email_from_address" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizations" ADD "resend_domain_id" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizations" ADD "domain_verified" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(`ALTER TABLE "projects" ADD "client_email" text`);
    await queryRunner.query(`ALTER TABLE "projects" ADD "client_phone" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "projects" DROP COLUMN "client_phone"`,
    );
    await queryRunner.query(
      `ALTER TABLE "projects" DROP COLUMN "client_email"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizations" DROP COLUMN "domain_verified"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizations" DROP COLUMN "resend_domain_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizations" DROP COLUMN "email_from_address"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizations" DROP COLUMN "email_domain"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizations" DROP COLUMN "logo_url"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizations" DROP COLUMN "license_number"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organizations" DROP COLUMN "website"`,
    );
    await queryRunner.query(`ALTER TABLE "organizations" DROP COLUMN "phone"`);
  }
}
