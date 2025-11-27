import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface VisitAttributes {
  id: string;
  hospitalId: string;
  patientId: string;
  appointmentId: string | null; // null for walk-ins
  doctorId: string;
  departmentId: string;
  tokenNumber: number;
  status:
    | 'WAITING'
    | 'CHECKED_IN'
    | 'IN_PROGRESS'
    | 'ON_HOLD'
    | 'COMPLETED'
    | 'CANCELLED'
    | 'NO_SHOW'
    | 'SKIPPED'
    | 'CARRYOVER';
  priority: 'NORMAL' | 'VIP' | 'URGENT';
  checkedInAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
  estimatedWaitTime: number | null; // minutes
  isCarryover: boolean; // true if from previous day
  createdAt?: Date;
  updatedAt?: Date;
}

export interface VisitCreationAttributes
  extends Optional<
    VisitAttributes,
    | 'id'
    | 'appointmentId'
    | 'status'
    | 'priority'
    | 'startedAt'
    | 'completedAt'
    | 'estimatedWaitTime'
    | 'isCarryover'
    | 'createdAt'
    | 'updatedAt'
  > {}

class Visit
  extends Model<VisitAttributes, VisitCreationAttributes>
  implements VisitAttributes
{
  public id!: string;
  public hospitalId!: string;
  public patientId!: string;
  public appointmentId!: string | null;
  public doctorId!: string;
  public departmentId!: string;
  public tokenNumber!: number;
  public status!: 'WAITING' | 'CHECKED_IN' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW' | 'SKIPPED' | 'CARRYOVER';
  public priority!: 'NORMAL' | 'VIP' | 'URGENT';
  public checkedInAt!: Date;
  public startedAt!: Date | null;
  public completedAt!: Date | null;
  public estimatedWaitTime!: number | null;
  public isCarryover!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Visit.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    hospitalId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'hospitals',
        key: 'id',
      },
    },
    patientId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'patients',
        key: 'id',
      },
    },
    appointmentId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'appointments',
        key: 'id',
      },
    },
    doctorId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'doctors',
        key: 'id',
      },
    },
    departmentId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'departments',
        key: 'id',
      },
    },
    tokenNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(
        'WAITING',
        'CHECKED_IN',
        'IN_PROGRESS',
        'ON_HOLD',
        'COMPLETED',
        'CANCELLED',
        'NO_SHOW',
        'SKIPPED',
        'CARRYOVER'
      ),
      defaultValue: 'WAITING',
    },
    priority: {
      type: DataTypes.ENUM('NORMAL', 'VIP', 'URGENT'),
      defaultValue: 'NORMAL',
    },
    checkedInAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    startedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    estimatedWaitTime: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Estimated wait time in minutes',
    },
    isCarryover: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'True if patient was not served on previous day',
    },
  },
  {
    sequelize,
    tableName: 'visits',
    timestamps: true,
    indexes: [
      {
        fields: ['hospitalId'],
      },
      {
        fields: ['doctorId', 'status'],
      },
      {
        fields: ['departmentId', 'status'],
      },
      {
        fields: ['patientId'],
      },
      {
        fields: ['appointmentId'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['checkedInAt'],
      },
    ],
  }
);

export default Visit;

