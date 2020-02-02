import * as Yup from 'yup';
import { startOfHour, parseISO, isBefore, format, subHours } from 'date-fns';
import { pt } from 'date-fns/locale/pt-BR';
import Appointment from '../models/Appointment';
import User from '../models/User';
import File from '../models/File';
import Notification from '../schemas/Notification';
import Mail from '../../lib/Mail';

class AppointmentController {
  async index(req, res) {
    const { page = 1 } = req.query;
    const appointments = await Appointment.findAll({
      where: { user_id: req.userId, canceled_at: null },
      order: ['date'],
      attributes: ['id', 'date'],
      offset: (page - 1) * 20,
      include: [
        {
          model: User,
          as: 'provider',
          attributes: ['id', 'name'],
          include: [
            {
              model: File,
              as: 'avatar',
              attributes: ['id', 'path', 'url'],
            },
          ],
        },
      ],
    });

    return res.json(appointments);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      provider_id: Yup.number().required(),
      date: Yup.date().required(),
    });
    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const { provider_id, date } = req.body;

    /**
     * Check if provider_id is a provider
     */

    const isProvider = await User.findOne({
      where: { id: provider_id, provider: true },
    });

    if (!isProvider) {
      return res
        .status(401)
        .json({ error: 'You can only create appointments with providers' });
    }

    const hourStart = startOfHour(parseISO(date));

    /**
     * Check for past dates
     */

    if (isBefore(hourStart, new Date())) {
      return res.status(400).json({ error: 'Past date is not allowed' });
    }

    /**
     * Check data avalability
     */
    const checkAvailability = await Appointment.findOne({
      where: {
        provider_id,
        canceled_at: null,
        date: hourStart,
      },
    });

    if (checkAvailability) {
      return res
        .status(400)
        .json({ error: 'Appointment date is not available' });
    }

    const appointment = await Appointment.create({
      user_id: req.userId,
      provider_id,
      date: hourStart,
    });

    /**
     * Notify Provider
     */
    const formattedDate = format(
      hourStart,
      "'dia' dd 'de' MMMM', às 'H:mm'h'",
      { locale: pt }
    );

    const user = await User.findByPk(req.userId);

    await Notification.create({
      content: `Novo agendamento de ${user.name} para ${formattedDate}`,
      user: provider_id,
    });

    return res.json(appointment);
  }

  async destroy(req, res) {
    const appoiment = await Appointment.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'provider',
          attributes: ['name', 'email'],
        },
        {
          model: User,
          as: 'user',
          attributes: ['name'],
        },
      ],
    });

    if (appoiment.user_id !== req.userId) {
      return res.send(401).json({
        error: 'You do not have permission to cancel this appoinment.',
      });
    }
    const dateWithSub = subHours(appoiment.date, 2);

    if (isBefore(dateWithSub, new Date())) {
      return res.send(401).json({
        error: 'You can only cancel appointments 2 hours in advance.',
      });
    }

    appoiment.canceled_at = new Date();

    await appoiment.save();

    await Mail.sendMail({
      to: `${appoiment.provider.name} <${appoiment.provider.email}>`,
      subject: 'Agedamento cancelado',
      template: 'cancellation',
      context: {
        provider: appoiment.provider.name,
        user: appoiment.user.name,
        date: format(appoiment.date, "'dia' dd 'de' MMMM', às 'H:mm'h'", {
          locale: pt,
        }),
      },
    });

    return res.json(appoiment);
  }
}

export default new AppointmentController();
