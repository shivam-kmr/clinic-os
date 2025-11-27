import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface VisitHistoryAttributes {
  id: string;
  visitId: string;
  hospitalId: string;
  patientId: string;
  doctorId: string;
  departmentId: string;
  tokenNumber: number;
  status: string;
  priority: 'NORMAL' | 'VIP' | 'URGENT';
  checkedInAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
  actualWaitTime: number | null; // minutes
  actualConsultationDuration: number | null; // minutes
  createdAt?: Date;
}

export interface VisitHistoryCreationAttributes
  extends Optional<VisitHistoryAttributes, 'id' | 'createdAt'> {}

class VisitHistory
  extends Model<VisitHistoryAttributes, VisitHistoryCreationAttributes>
  implements VisitHistoryAttributes
{
  public id!: string;
  public visitId!: string;
  public hospitalId!: string;
  public patientId!: string;
  public doctorId!: string;
  public departmentId!: string;
  public tokenNumber!: number;
  public status!: string;
  public priority!: 'NORMAL' | 'VIP' | 'URGENT';
  public checkedInAt!: Date;
  public startedAt!: Date | null;
  public completedAt!: Date | null;
  public actualWaitTime!: number | null;
  public actualConsultationDuration!: number | null;
  public readonly createdAt!: Date;
}

VisitHistory.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    visitId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'visits',
        key: 'id',
      },
    },
    hospitalId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    patientId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    doctorId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    departmentId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    tokenNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    priority: {
      type: DataTypes.ENUM('NORMAL', 'VIP', 'URGENT'),
      allowNull: false,
    },
    checkedInAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    startedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    actualWaitTime: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Actual wait time in minutes',
    },
    actualConsultationDuration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Actual consultation duration in minutes',
    },
  },
  {
    sequelize,
    tableName: 'visit_history',
    timestamps: true,
    updatedAt: false, // Only created, never updated
    indexes: [
      {
        fields: ['visitId'],
      },
      {
        fields: ['hospitalId'],
      },
      {
        fields: ['doctorId'],
      },
      {
        fields: ['departmentId'],
      },
      {
        fields: ['completedAt'],
      },
    ],
  }
);

export default VisitHistory;

