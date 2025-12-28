import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export type HospitalUserRole = 'HOSPITAL_OWNER' | 'HOSPITAL_MANAGER' | 'RECEPTIONIST' | 'DOCTOR';

export interface HospitalUserAttributes {
  id: string;
  userId: string;
  hospitalId: string;
  role: HospitalUserRole;
  doctorId?: string | null;
  departmentId?: string | null; // receptionist scope (null = hospital-wide)
  createdAt?: Date;
  updatedAt?: Date;
}

export interface HospitalUserCreationAttributes
  extends Optional<HospitalUserAttributes, 'id' | 'doctorId' | 'createdAt' | 'updatedAt'> {}

class HospitalUser
  extends Model<HospitalUserAttributes, HospitalUserCreationAttributes>
  implements HospitalUserAttributes
{
  public id!: string;
  public userId!: string;
  public hospitalId!: string;
  public role!: HospitalUserRole;
  public doctorId!: string | null;
  public departmentId!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

HospitalUser.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
    },
    hospitalId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'hospitals', key: 'id' },
      onDelete: 'CASCADE',
    },
    role: {
      type: DataTypes.ENUM('HOSPITAL_OWNER', 'HOSPITAL_MANAGER', 'RECEPTIONIST', 'DOCTOR'),
      allowNull: false,
    },
    doctorId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'doctors', key: 'id' },
      onDelete: 'SET NULL',
    },
    departmentId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'departments', key: 'id' },
      onDelete: 'SET NULL',
    },
  },
  {
    sequelize,
    tableName: 'hospital_users',
    timestamps: true,
    indexes: [
      { fields: ['hospitalId'] },
      { fields: ['userId'] },
      { fields: ['departmentId'] },
      {
        fields: ['userId', 'hospitalId'],
        unique: true,
        name: 'hospital_users_userId_hospitalId_unique',
      },
    ],
  }
);

export default HospitalUser;


