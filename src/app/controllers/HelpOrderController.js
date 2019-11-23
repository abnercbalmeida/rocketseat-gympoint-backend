import * as Yup from 'yup';
import HelpOrder from '../models/HelpOrder';
import Student from '../models/Student';
import Mail from '../../lib/Mail';

class HelpOrderController {
  async index(req, res) {
    const { id } = req.params;

    /**
     * check if id exists
     */
    const student = await Student.findByPk(id);

    if (!student) {
      return res.status(401).json({ error: 'Student not found' });
    }

    const helpOrders = await HelpOrder.findAll({
      where: {
        student_id: id,
      },
    }).map(order => ({
      student_id: order.student_id,
      question: order.question,
      answer: order.answer,
      answer_at: order.answer_at,
    }));

    return res.json(helpOrders);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      question: Yup.string().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const { id } = req.params;

    /**
     * check if id exists
     */
    const student = await Student.findByPk(id);

    if (!student) {
      return res.status(401).json({ error: 'Student not found' });
    }

    const { question } = req.body;

    await HelpOrder.create({
      student_id: id,
      question,
    });

    return res.json({ student_id: id, question });
  }

  async unanswerdQuestions(req, res) {
    const unanswerdQuestion = await HelpOrder.findAll({
      where: {
        answer_at: null,
      },
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'name'],
        },
      ],
    });

    return res.json(unanswerdQuestion);
  }

  async answer(req, res) {
    const schema = Yup.object().shape({
      answer: Yup.string().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const { id } = req.params;

    /**
     * check if id exists
     */
    const helpOrder = await HelpOrder.findByPk(id);

    if (!helpOrder) {
      return res.status(401).json({ error: 'Help Order not found' });
    }

    const { answer } = req.body;
    const { question } = helpOrder;

    helpOrder.answer = answer;
    helpOrder.answer_at = new Date();
    helpOrder.save();

    const student = await Student.findByPk(helpOrder.student_id);

    Mail.sendMail({
      to: `${student.name} <${student.email}>`,
      subject: `Gympoint - Your question has been answered`,
      template: 'help_order_answer',
      context: {
        studentName: student.name,
        question,
        answer,
      },
    });

    return res.json(helpOrder);
  }
}

export default new HelpOrderController();
