import * as Yup from 'yup';
import { addMonths, parseISO, format } from 'date-fns';
import Enrollment from '../models/Enrollment';
import Student from '../models/Student';
import Plan from '../models/Plan';
import Mail from '../../lib/Mail';

class EnrollmentController {
  async index(req, res) {
    const enrollments = await Enrollment.findAll();

    return res.json(enrollments);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      student_id: Yup.number()
        .integer()
        .required(),
      plan_id: Yup.number()
        .integer()
        .required(),
      start_date: Yup.date().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const { student_id, plan_id, start_date } = req.body;

    /**
     * check if student_id exists
     */
    const student = await Student.findByPk(student_id);

    if (!student) {
      return res.status(401).json({ error: 'Student not found' });
    }

    /**
     * check if plan_id exists
     */
    const plan = await Plan.findByPk(plan_id);

    if (!plan) {
      return res.status(401).json({ error: 'Plan not found' });
    }

    const price = plan.calculateTotalPrice();
    const parsedStartDate = parseISO(start_date);
    const parsedEndDate = addMonths(parsedStartDate, plan.duration);

    const enrollment = await Enrollment.create({
      student_id,
      plan_id,
      start_date: parsedStartDate,
      price,
      end_date: parsedEndDate,
    });

    Mail.sendMail({
      to: `${student.name} <${student.email}>`,
      subject: `Gympoint - ${plan.title} Plan Enrollment`,
      template: 'enrollment',
      context: {
        studentName: student.name,
        totalMonths: plan.duration,
        planTitle: plan.title,
        startDate: format(parsedStartDate, 'MM/dd/yyyy'),
        endDate: format(parsedEndDate, 'MM/dd/yyyy'),
        price: price.toFixed(2),
      },
    });

    return res.json(enrollment);
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      student_id: Yup.number().integer(),
      plan_id: Yup.number().integer(),
      start_date: Yup.date(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const { id } = req.params;

    /**
     * check if id exists
     */
    const enrollment = await Enrollment.findByPk(id);

    if (!enrollment) {
      return res.status(401).json({ error: 'Enrollment not found' });
    }

    const { student_id, plan_id, start_date } = req.body;

    /**
     * check if student_id exists
     */
    const student = await Student.findByPk(student_id);

    if (!student) {
      return res.status(401).json({ error: 'Student not found' });
    }

    /**
     * check if plan_id exists
     */
    const plan = await Plan.findByPk(plan_id);

    if (!plan) {
      return res.status(401).json({ error: 'Plan not found' });
    }

    const price = plan.calculateTotalPrice();
    const parsedStartDate = parseISO(start_date);
    const parsedEndDate = addMonths(parsedStartDate, plan.duration);

    await enrollment.update({
      student_id,
      plan_id,
      start_date: parsedStartDate,
      price,
      end_date: parsedEndDate,
    });

    return res.json(enrollment);
  }

  async delete(req, res) {
    const { id } = req.params;
    const enrollment = await Enrollment.findByPk(id);

    if (!enrollment) {
      return res.status(400).json({ error: 'Enrollment not found' });
    }

    await Enrollment.destroy({ where: { id } });

    return res.status(204).json();
  }
}

export default new EnrollmentController();
