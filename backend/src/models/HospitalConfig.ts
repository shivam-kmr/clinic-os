import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface BusinessHours {
  [key: string]: {
    start: string; // HH:mm format
    end: string; // HH:mm format
    isOpen: boolean;
  };
}

export interface HospitalConfigAttributes {
  id: string;
  hospitalId: string;
  bookingMode: 'TOKEN_ONLY' | 'TIME_SLOT_ONLY' | 'BOTH';
  defaultConsultationDuration: number; // minutes
  bufferTimeBetweenAppointments: number; // minutes
  arrivalWindowBeforeAppointment: number; // minutes, default 15
  businessHours: BusinessHours;
  tokenResetFrequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'NEVER';
  autoReassignOnLeave: boolean;
  maxQueueLength?: number; // soft limit
  createdAt?: Date;
  updatedAt?: Date;
}

export interface HospitalConfigCreationAttributes
  extends Optional<HospitalConfigAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class HospitalConfig
  extends Model<HospitalConfigAttributes, HospitalConfigCreationAttributes>
  implements HospitalConfigAttributes
{
  public id!: string;
  public hospitalId!: string;
  public bookingMode!: 'TOKEN_ONLY' | 'TIME_SLOT_ONLY' | 'BOTH';
  public defaultConsultationDuration!: number;
  public bufferTimeBetweenAppointments!: number;
  public arrivalWindowBeforeAppointment!: number;
  public businessHours!: BusinessHours;
  public tokenResetFrequency!: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'NEVER';
  public autoReassignOnLeave!: boolean;
  public maxQueueLength?: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

HospitalConfig.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    hospitalId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: {
        model: 'hospitals',
        key: 'id',
      },
    },
    bookingMode: {
      type: DataTypes.ENUM('TOKEN_ONLY', 'TIME_SLOT_ONLY', 'BOTH'),
      defaultValue: 'TOKEN_ONLY',
    },
    defaultConsultationDuration: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 15,
      comment: 'Default consultation duration in minutes',
    },
    bufferTimeBetweenAppointments: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 5,
      comment: 'Buffer time between appointments in minutes',
    },
    arrivalWindowBeforeAppointment: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 15,
      comment: 'Minutes before appointment time when patient can check in',
    },
    businessHours: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {
        monday: { start: '10:00', end: '18:00', isOpen: true },
        tuesday: { start: '10:00', end: '18:00', isOpen: true },
        wednesday: { start: '10:00', end: '18:00', isOpen: true },
        thursday: { start: '10:00', end: '18:00', isOpen: true },
        friday: { start: '10:00', end: '18:00', isOpen: true },
        saturday: { start: '10:00', end: '18:00', isOpen: true },
        sunday: { start: '10:00', end: '18:00', isOpen: false },
      },
    },
    tokenResetFrequency: {
      type: DataTypes.ENUM('DAILY', 'WEEKLY', 'MONTHLY', 'NEVER'),
      defaultValue: 'DAILY',
    },
    autoReassignOnLeave: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    maxQueueLength: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Soft limit for queue length',
    },
  },
  {
    sequelize,
    tableName: 'hospital_configs',
    timestamps: true,
  }
);

export default HospitalConfig;

