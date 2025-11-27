import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { VisitService } from '../services/VisitService';
import { QueueService } from '../services/QueueService';

export class VisitController {
  /**
   * Create walk-in visit
   * POST /api/v1/visits
   */
  static async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { patientId, departmentId, doctorId, priority } = req.body;

      if (!req.user?.hospitalId) {
        res.status(400).json({
          error: {
            code: 'BAD_REQUEST',
            message: 'Hospital context required',
          },
        });
        return;
      }

      const visit = await VisitService.createWalkInVisit({
        hospitalId: req.user.hospitalId,
        patientId,
        departmentId,
        doctorId,
        priority,
      });

      res.status(201).json({
        data: visit,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get visit by ID
   * GET /api/v1/visits/:id
   */
  static async getById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      if (!req.user?.hospitalId) {
        res.status(400).json({
          error: {
            code: 'BAD_REQUEST',
            message: 'Hospital context required',
          },
        });
        return;
      }

      const visit = await VisitService.getVisitById(req.user.hospitalId, id);

      if (!visit) {
        res.status(404).json({
          error: {
            code: 'VISIT_NOT_FOUND',
            message: 'Visit not found',
          },
        });
        return;
      }

      res.json({
        data: visit,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update visit status
   * PATCH /api/v1/visits/:id/status
   */
  static async updateStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;

      if (!req.user?.hospitalId) {
        res.status(400).json({
          error: {
            code: 'BAD_REQUEST',
            message: 'Hospital context required',
          },
        });
        return;
      }

      const visit = await VisitService.updateVisitStatus(
        req.user.hospitalId,
        id,
        status,
        notes
      );

      res.json({
        data: visit,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reassign visit
   * POST /api/v1/visits/:id/reassign
   */
  static async reassign(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { doctorId } = req.body;

      if (!req.user?.hospitalId) {
        res.status(400).json({
          error: {
            code: 'BAD_REQUEST',
            message: 'Hospital context required',
          },
        });
        return;
      }

      if (!doctorId) {
        res.status(400).json({
          error: {
            code: 'BAD_REQUEST',
            message: 'doctorId is required',
          },
        });
        return;
      }

      const visit = await QueueService.reassignVisit(
        req.user.hospitalId,
        id,
        doctorId
      );

      res.json({
        data: visit,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delay patient (move to end of queue)
   * POST /api/v1/visits/:id/delay
   */
  static async delay(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { doctorId } = req.body;

      if (!req.user?.hospitalId) {
        res.status(400).json({
          error: {
            code: 'BAD_REQUEST',
            message: 'Hospital context required',
          },
        });
        return;
      }

      if (!doctorId) {
        res.status(400).json({
          error: {
            code: 'BAD_REQUEST',
            message: 'doctorId is required',
          },
        });
        return;
      }

      await QueueService.delayPatient(req.user.hospitalId, doctorId, id);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

