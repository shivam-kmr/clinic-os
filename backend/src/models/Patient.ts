import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface PatientAttributes {
  id: string;
  hospitalId: string;
  phone?: string;
  email?: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: Date;
  address?: string;
  emergencyContact?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PatientCreationAttributes
  extends Optional<
    PatientAttributes,
    'id' | 'phone' | 'email' | 'dateOfBirth' | 'address' | 'emergencyContact' | 'createdAt' | 'updatedAt'
  > {}

class Patient
  extends Model<PatientAttributes, PatientCreationAttributes>
  implements PatientAttributes
{
  public id!: string;
  public hospitalId!: string;
  public phone?: string;
  public email?: string;
  public firstName!: string;
  public lastName!: string;
  public dateOfBirth?: Date;
  public address?: string;
  public emergencyContact?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Patient.init(
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
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isEmail: true,
      },
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    dateOfBirth: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    emergencyContact: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'patients',
    timestamps: true,
    indexes: [
      {
        fields: ['hospitalId'],
      },
      {
        fields: ['hospitalId', 'phone'],
      },
      {
        fields: ['hospitalId', 'email'],
      },
    ],
  }
);

export default Patient;

