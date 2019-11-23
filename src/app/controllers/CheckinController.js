import { Op } from 'sequelize';
import { subWeeks } from 'date-fns';
import Checkin from '../models/Checkin';
import Student from '../models/Student';

class CheckinController {
  async index(req, res) {
    const { id } = req.params;

    /**
     * check if id exists
     */
    const student = await Student.findByPk(id);

    if (!student) {
      return res.status(401).json({ error: 'Student not found' });
    }

    const checkins = await Checkin.findAll({
      where: {
        student_id: id,
      },
    });

    return res.json(checkins);
  }

  async store(req, res) {
    const { id } = req.params;

    /**
     * check if id exists
     */
    const student = await Student.findByPk(id);

    if (!student) {
      return res.status(401).json({ error: 'Student not found' });
    }

    /**
     * check if student has more than 5 checkins in the week
     */
    const oneWeekAgoDate = subWeeks(new Date(), 1);
    const checkinsWithinOneWeekAgo = await Checkin.findAll({
      where: {
        student_id: id,
        created_at: {
          [Op.gte]: oneWeekAgoDate,
        },
      },
    });

    if (checkinsWithinOneWeekAgo.length >= 5) {
      return res.status(401).json({
        error:
          'Student does not able to check in more than 5 times in the week',
      });
    }

    const checkin = await Checkin.create({
      student_id: id,
    });

    return res.json(checkin);
  }
}

export default new CheckinController();
