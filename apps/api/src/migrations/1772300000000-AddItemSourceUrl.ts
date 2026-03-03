import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddItemSourceUrl1772300000000 implements MigrationInterface {
  name = 'AddItemSourceUrl1772300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "items" ADD "source_url" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "items" DROP COLUMN "source_url"`);
  }
}
