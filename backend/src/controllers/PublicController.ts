import { Request, Response } from 'express';
import Hospital from '../models/Hospital';
import Department from '../models/Department';
import Doctor from '../models/Doctor';
import { errorHandler } from '../middleware/errorHandler';

export class PublicController {
  /**
   * GET /api/v1/public/hospital
   * Get public hospital information (for patient portal landing page)
   */
  static async getHospitalInfo(req: Request, res: Response): Promise<void> {
    try {
      const hospital = req.hospitalContext;

      if (!hospital) {
        res.status(404).json({
          error: {
            code: 'HOSPITAL_NOT_FOUND',
            message: 'Hospital not found',
          },
        });
        return;
      }

      // Get active departments
      const departments = await Department.findAll({
        where: {
          hospitalId: hospital.id,
          status: 'ACTIVE',
        },
        attributes: ['id', 'name', 'description'],
        order: [['name', 'ASC']],
      });

      // Get active doctors
      const doctors = await Doctor.findAll({
        where: {
          hospitalId: hospital.id,
          status: 'ACTIVE',
        },
        include: [
          {
            model: Department,
            as: 'department',
            attributes: ['id', 'name'],
            required: false,
          },
        ],
        attributes: ['id', 'firstName', 'lastName', 'specialization', 'qualifications'],
        order: [['firstName', 'ASC']],
      });

      res.json({
        hospital: {
          id: hospital.id,
          name: hospital.name,
          address: hospital.address,
          phone: hospital.phone,
          email: hospital.email,
        },
        departments,
        doctors,
      });
    } catch (error) {
      errorHandler(error as Error, req, res, () => {});
    }
  }
}

