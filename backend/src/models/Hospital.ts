import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface HospitalAttributes {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  subdomain?: string; // e.g., "regencyhospital" for regencyhospital.clinicos.com
  customDomain?: string; // e.g., "regencyhospital.com"
  customDomainVerified: boolean; // DNS verification status
  status: 'ACTIVE' | 'SUSPENDED';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface HospitalCreationAttributes
  extends Optional<HospitalAttributes, 'id' | 'status' | 'createdAt' | 'updatedAt'> {}

class Hospital
  extends Model<HospitalAttributes, HospitalCreationAttributes>
  implements HospitalAttributes
{
  public id!: string;
  public name!: string;
  public address?: string;
  public phone?: string;
  public email?: string;
  public subdomain?: string;
  public customDomain?: string;
  public customDomainVerified!: boolean;
  public status!: 'ACTIVE' | 'SUSPENDED';
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Hospital.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
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
    subdomain: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
      validate: {
        is: /^[a-z0-9-]+$/, // Only lowercase letters, numbers, and hyphens
        len: [3, 63], // Subdomain length constraints
      },
    },
    customDomain: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
      validate: {
        is: /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/i, // Domain validation
      },
    },
    customDomainVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    status: {
      type: DataTypes.ENUM('ACTIVE', 'SUSPENDED'),
      defaultValue: 'ACTIVE',
    },
  },
  {
    sequelize,
    tableName: 'hospitals',
    timestamps: true,
    indexes: [
      {
        fields: ['subdomain'],
        unique: true,
      },
      {
        fields: ['customDomain'],
        unique: true,
      },
    ],
  }
);

export default Hospital;

