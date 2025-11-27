import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface AppointmentAttributes {
  id: string;
  hospitalId: string;
  patientId: string;
  departmentId: string | null; // null if doctorId is specified
  doctorId: string | null; // null if departmentId is specified
  scheduledAt: Date;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'NO_SHOW' | 'COMPLETED';
  bookingType: 'ONLINE' | 'WALK_IN';
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AppointmentCreationAttributes
  extends Optional<
    AppointmentAttributes,
    'id' | 'departmentId' | 'doctorId' | 'status' | 'notes' | 'createdAt' | 'updatedAt'
  > {}

class Appointment
  extends Model<AppointmentAttributes, AppointmentCreationAttributes>
  implements AppointmentAttributes
{
  public id!: string;
  public hospitalId!: string;
  public patientId!: string;
  public departmentId!: string | null;
  public doctorId!: string | null;
  public scheduledAt!: Date;
  public status!: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'NO_SHOW' | 'COMPLETED';
  public bookingType!: 'ONLINE' | 'WALK_IN';
  public notes?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Appointment.init(
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
    departmentId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'departments',
        key: 'id',
      },
    },
    doctorId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'doctors',
        key: 'id',
      },
    },
    scheduledAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'CONFIRMED', 'CANCELLED', 'NO_SHOW', 'COMPLETED'),
      defaultValue: 'PENDING',
    },
    bookingType: {
      type: DataTypes.ENUM('ONLINE', 'WALK_IN'),
      allowNull: false,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'appointments',
    timestamps: true,
    indexes: [
      {
        fields: ['hospitalId'],
      },
      {
        fields: ['patientId'],
      },
      {
        fields: ['doctorId'],
      },
      {
        fields: ['departmentId'],
      },
      {
        fields: ['doctorId', 'scheduledAt'],
      },
      {
        fields: ['scheduledAt'],
      },
    ],
  }
);

export default Appointment;

