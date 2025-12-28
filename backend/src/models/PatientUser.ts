import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface PatientUserAttributes {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  phone?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PatientUserCreationAttributes
  extends Optional<PatientUserAttributes, 'id' | 'phone' | 'createdAt' | 'updatedAt'> {}

class PatientUser
  extends Model<PatientUserAttributes, PatientUserCreationAttributes>
  implements PatientUserAttributes
{
  public id!: string;
  public email!: string;
  public passwordHash!: string;
  public firstName!: string;
  public lastName!: string;
  public phone?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

PatientUser.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'patient_users',
    timestamps: true,
    indexes: [
      {
        fields: ['email'],
        unique: true,
      },
    ],
  }
);

export default PatientUser;



