import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

/**
 * Junction table to link PatientUser with Hospital
 * A patient can have accounts at multiple hospitals
 */
export interface PatientHospitalAttributes {
  id: string;
  patientUserId: string;
  hospitalId: string;
  patientId: string; // Link to Patient record for this hospital
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PatientHospitalCreationAttributes
  extends Optional<PatientHospitalAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class PatientHospital
  extends Model<PatientHospitalAttributes, PatientHospitalCreationAttributes>
  implements PatientHospitalAttributes
{
  public id!: string;
  public patientUserId!: string;
  public hospitalId!: string;
  public patientId!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

PatientHospital.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    patientUserId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'patient_users',
        key: 'id',
      },
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
  },
  {
    sequelize,
    tableName: 'patient_hospitals',
    timestamps: true,
    indexes: [
      {
        fields: ['patientUserId', 'hospitalId'],
        unique: true, // One account per hospital per patient user
      },
      {
        fields: ['hospitalId'],
      },
      {
        fields: ['patientId'],
      },
    ],
  }
);

export default PatientHospital;



