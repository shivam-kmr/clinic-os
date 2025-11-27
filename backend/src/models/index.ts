import sequelize from '../config/database';
import Hospital from './Hospital';
import User from './User';
import Department from './Department';
import Doctor from './Doctor';
import Patient from './Patient';
import PatientUser from './PatientUser';
import PatientHospital from './PatientHospital';
import HospitalConfig from './HospitalConfig';
import Appointment from './Appointment';
import Visit from './Visit';
import VisitHistory from './VisitHistory';

// Define associations
Hospital.hasMany(User, { foreignKey: 'hospitalId', as: 'users' });
User.belongsTo(Hospital, { foreignKey: 'hospitalId', as: 'hospital' });

Hospital.hasMany(Department, { foreignKey: 'hospitalId', as: 'departments' });
Department.belongsTo(Hospital, { foreignKey: 'hospitalId', as: 'hospital' });

Hospital.hasMany(Doctor, { foreignKey: 'hospitalId', as: 'doctors' });
Doctor.belongsTo(Hospital, { foreignKey: 'hospitalId', as: 'hospital' });

Hospital.hasMany(Patient, { foreignKey: 'hospitalId', as: 'patients' });
Patient.belongsTo(Hospital, { foreignKey: 'hospitalId', as: 'hospital' });

Hospital.hasOne(HospitalConfig, { foreignKey: 'hospitalId', as: 'config' });
HospitalConfig.belongsTo(Hospital, { foreignKey: 'hospitalId', as: 'hospital' });

Department.hasMany(Doctor, { foreignKey: 'departmentId', as: 'doctors' });
Doctor.belongsTo(Department, { foreignKey: 'departmentId', as: 'department' });

User.hasOne(Doctor, { foreignKey: 'userId', as: 'doctor' });
Doctor.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Patient.hasMany(Appointment, { foreignKey: 'patientId', as: 'appointments' });
Appointment.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });

Patient.hasMany(Visit, { foreignKey: 'patientId', as: 'visits' });
Visit.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });

Hospital.hasMany(Appointment, { foreignKey: 'hospitalId', as: 'appointments' });
Appointment.belongsTo(Hospital, { foreignKey: 'hospitalId', as: 'hospital' });

Hospital.hasMany(Visit, { foreignKey: 'hospitalId', as: 'visits' });
Visit.belongsTo(Hospital, { foreignKey: 'hospitalId', as: 'hospital' });

Department.hasMany(Appointment, { foreignKey: 'departmentId', as: 'appointments' });
Appointment.belongsTo(Department, { foreignKey: 'departmentId', as: 'department' });

Department.hasMany(Visit, { foreignKey: 'departmentId', as: 'visits' });
Visit.belongsTo(Department, { foreignKey: 'departmentId', as: 'department' });

Doctor.hasMany(Appointment, { foreignKey: 'doctorId', as: 'appointments' });
Appointment.belongsTo(Doctor, { foreignKey: 'doctorId', as: 'doctor' });

Doctor.hasMany(Visit, { foreignKey: 'doctorId', as: 'visits' });
Visit.belongsTo(Doctor, { foreignKey: 'doctorId', as: 'doctor' });

Appointment.hasOne(Visit, { foreignKey: 'appointmentId', as: 'visit' });
Visit.belongsTo(Appointment, { foreignKey: 'appointmentId', as: 'appointment' });

Visit.hasOne(VisitHistory, { foreignKey: 'visitId', as: 'history' });
VisitHistory.belongsTo(Visit, { foreignKey: 'visitId', as: 'visit' });

Doctor.hasMany(VisitHistory, { foreignKey: 'doctorId', as: 'visitHistory' });
VisitHistory.belongsTo(Doctor, { foreignKey: 'doctorId', as: 'doctor' });

Department.hasMany(VisitHistory, { foreignKey: 'departmentId', as: 'visitHistory' });
VisitHistory.belongsTo(Department, { foreignKey: 'departmentId', as: 'department' });

Patient.hasMany(VisitHistory, { foreignKey: 'patientId', as: 'visitHistory' });
VisitHistory.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });

// PatientUser associations
PatientUser.hasMany(PatientHospital, { foreignKey: 'patientUserId', as: 'hospitalAccounts' });
PatientHospital.belongsTo(PatientUser, { foreignKey: 'patientUserId', as: 'patientUser' });

Hospital.hasMany(PatientHospital, { foreignKey: 'hospitalId', as: 'patientAccounts' });
PatientHospital.belongsTo(Hospital, { foreignKey: 'hospitalId', as: 'hospital' });

Patient.hasOne(PatientHospital, { foreignKey: 'patientId', as: 'patientUserAccount' });
PatientHospital.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });

export {
  sequelize,
  Hospital,
  User,
  Department,
  Doctor,
  Patient,
  PatientUser,
  PatientHospital,
  HospitalConfig,
  Appointment,
  Visit,
  VisitHistory,
};

