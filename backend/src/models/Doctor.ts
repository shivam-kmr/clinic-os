import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface DoctorAttributes {
  id: string;
  hospitalId: string;
  userId: string;
  departmentId: string;
  employeeId?: string;
  specialization?: string;
  status: 'ACTIVE' | 'ON_LEAVE' | 'INACTIVE';
  consultationDuration?: number; // minutes, overrides hospital default
  dailyPatientLimit?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface DoctorCreationAttributes
  extends Optional<
    DoctorAttributes,
    'id' | 'employeeId' | 'specialization' | 'status' | 'consultationDuration' | 'dailyPatientLimit' | 'createdAt' | 'updatedAt'
  > {}

class Doctor
  extends Model<DoctorAttributes, DoctorCreationAttributes>
  implements DoctorAttributes
{
  public id!: string;
  public hospitalId!: string;
  public userId!: string;
  public departmentId!: string;
  public employeeId?: string;
  public specialization?: string;
  public status!: 'ACTIVE' | 'ON_LEAVE' | 'INACTIVE';
  public consultationDuration?: number;
  public dailyPatientLimit?: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Doctor.init(
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
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
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
    employeeId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    specialization: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('ACTIVE', 'ON_LEAVE', 'INACTIVE'),
      defaultValue: 'ACTIVE',
    },
    consultationDuration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Consultation duration in minutes, overrides hospital default',
    },
    dailyPatientLimit: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Maximum patients per day',
    },
  },
  {
    sequelize,
    tableName: 'doctors',
    timestamps: true,
    indexes: [
      {
        fields: ['hospitalId'],
      },
      {
        fields: ['userId'],
        unique: true,
      },
      {
        fields: ['departmentId'],
      },
    ],
  }
);

export default Doctor;

