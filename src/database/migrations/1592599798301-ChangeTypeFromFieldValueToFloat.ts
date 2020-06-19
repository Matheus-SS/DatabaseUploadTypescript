import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export default class ChangeTypeFromFieldValueToFloat1592599798301
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.changeColumn(
      'transactions',
      'value',
      new TableColumn({
        name: 'value',
        type: 'float',
        isNullable: false,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.changeColumn(
      'transactions',
      'value',
      new TableColumn({
        name: 'value',
        type: 'integer',
        isNullable: false,
      }),
    );
  }
}
