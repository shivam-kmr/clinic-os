import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface DepartmentConfigAttributes {
  id: string;
  hospitalId: string;
  departmentId: string;

  // Department-specific behavior (can differ across departments)
  bookingMode: 'TOKEN_ONLY' | 'TIME_SLOT_ONLY' | 'BOTH' | null;

  // Appointment rules (overrides)
  defaultConsultationDuration?: number | null;
  bufferTimeBetweenAppointments?: number | null;
  arrivalWindowBeforeAppointment?: number | null;

  // Queue/token rules (overrides)
  tokenResetFrequency?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'NEVER' | null;
  maxQueueLength?: number | null;
  tokenPrefix?: string | null;

  createdAt?: Date;
  updatedAt?: Date;
}

export interface DepartmentConfigCreationAttributes
  extends Optional<DepartmentConfigAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class DepartmentConfig
  extends Model<DepartmentConfigAttributes, DepartmentConfigCreationAttributes>
  implements DepartmentConfigAttributes
{
  public id!: string;
  public hospitalId!: string;
  public departmentId!: string;

  public bookingMode!: 'TOKEN_ONLY' | 'TIME_SLOT_ONLY' | 'BOTH' | null;

  public defaultConsultationDuration?: number | null;
  public bufferTimeBetweenAppointments?: number | null;
  public arrivalWindowBeforeAppointment?: number | null;

  public tokenResetFrequency?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'NEVER' | null;
  public maxQueueLength?: number | null;
  public tokenPrefix?: string | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

DepartmentConfig.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    hospitalId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'hospitals', key: 'id' },
      onDelete: 'CASCADE',
    },
    departmentId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'departments', key: 'id' },
      onDelete: 'CASCADE',
    },
    bookingMode: {
      type: DataTypes.ENUM('TOKEN_ONLY', 'TIME_SLOT_ONLY', 'BOTH'),
      allowNull: true,
      defaultValue: null,
    },
    defaultConsultationDuration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Overrides hospital default consultation duration (minutes)',
    },
    bufferTimeBetweenAppointments: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Overrides hospital default buffer time (minutes)',
    },
    arrivalWindowBeforeAppointment: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Overrides hospital default arrival window (minutes)',
    },
    tokenResetFrequency: {
      type: DataTypes.ENUM('DAILY', 'WEEKLY', 'MONTHLY', 'NEVER'),
      allowNull: true,
      comment: 'Overrides hospital default token reset frequency',
    },
    maxQueueLength: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Overrides hospital default max queue length (soft limit)',
    },
    tokenPrefix: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Optional token prefix override for this department',
    },
  },
  {
    sequelize,
    tableName: 'department_configs',
    timestamps: true,
    indexes: [
      { fields: ['hospitalId'] },
      { fields: ['departmentId'], unique: true },
      { fields: ['hospitalId', 'departmentId'], unique: true, name: 'department_configs_hospital_department_unique' },
    ],
  }
);

export default DepartmentConfig;



