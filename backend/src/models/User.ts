import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface UserAttributes {
  id: string;
  hospitalId: string | null; // null for superadmin
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: 'SUPERADMIN' | 'HOSPITAL_OWNER' | 'HOSPITAL_MANAGER' | 'RECEPTIONIST' | 'DOCTOR';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserCreationAttributes
  extends Optional<UserAttributes, 'id' | 'hospitalId' | 'createdAt' | 'updatedAt'> {}

class User
  extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes
{
  public id!: string;
  public hospitalId!: string | null;
  public email!: string;
  public passwordHash!: string;
  public firstName!: string;
  public lastName!: string;
  public role!: 'SUPERADMIN' | 'HOSPITAL_OWNER' | 'RECEPTIONIST' | 'DOCTOR';
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    hospitalId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'hospitals',
        key: 'id',
      },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
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
    role: {
      type: DataTypes.ENUM('SUPERADMIN', 'HOSPITAL_OWNER', 'HOSPITAL_MANAGER', 'RECEPTIONIST', 'DOCTOR'),
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'users',
    timestamps: true,
    indexes: [
      {
        fields: ['hospitalId'],
      },
      {
        fields: ['email'],
        unique: true,
      },
    ],
  }
);

export default User;

