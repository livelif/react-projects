import * as Yup from 'yup';
import { startOfHour, parseISO, isBefore, format, subHours } from 'date-fns';
import pt from 'date-fns/locale/pt';
import Appointment from '../models/Appointment';
import User from '../models/User';
import Notification from '../schemas/Notification';

import CancellationMail from '../jobs/CancellationMail';
import Queue from '../../lib/Queue';

class AppointmentController {
  async index(req, res) {
    const { userId } = req;
    const { page = 1 } = req.query;
    const appointments = await Appointment.getAppointments(userId, page);
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
    if (!(await User.isUserProvider(provider_id))) {
      return res
        .status(401)
        .json({ error: 'You can only create appointments with providers' });
    }

    const hourStart = startOfHour(parseISO(date));

    if (AppointmentController.isHourPast(hourStart)) {
      return res.status(400).json({ error: 'Past dates are not permitted' });
    }

    if (await Appointment.checkDateAvailability(provider_id, hourStart)) {
      return res
        .status(400)
        .json({ error: 'Appointment date is not available' });
    }

    if (req.userId === provider_id) {
      return res.status(400).json({ error: 'User cant be provider' });
    }

    const appointment = await Appointment.create({
      user_id: req.userId,
      provider_id,
      date,
    });

    AppointmentController.notifyAppointmentOfUserToProvider(
      provider_id,
      req.userId,
      hourStart
    );

    return res.json(appointment);
  }

  async delete(req, res) {
    const appointment = await Appointment.findByPk(req.params.id, {
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

    if (appointment.user_id !== req.userId) {
      return res.status(401).json({
        error: "You don't have permission to cancel this appointment",
      });
    }

    const dateWithSub = subHours(appointment.date, 2);

    if (isBefore(dateWithSub, new Date())) {
      return res
        .status(401)
        .json({ error: 'You can only cancel appointments 2 hours in advance' });
    }

    appointment.canceled_at = new Date();

    Queue.add(CancellationMail.key, {
      appointment,
    });

    await appointment.save();

    return res.json(appointment);
  }

  static async notifyAppointmentOfUserToProvider(
    provider_id,
    userId,
    hourStart
  ) {
    const user = await User.getUserUsingPrimaryKey(userId);
    // eslint-disable-next-line prettier/prettier
    const formattedDate = format(
      hourStart,
      "'dia' dd  'de' MMMM', ' as H:mm'h'",
      // eslint-disable-next-line prettier/prettier
      { locale: pt }
    );
    await Notification.create({
      content: `Novo agendamento de ${user.name}  para o dia ${formattedDate}`,
      user: provider_id,
    });
  }

  static isHourPast(hourStart) {
    if (isBefore(hourStart, new Date())) {
      return true;
    }
    return false;
  }
}

export default new AppointmentController();
