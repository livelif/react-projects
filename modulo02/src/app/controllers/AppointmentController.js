import * as Yup from 'yup';
import { startOfHour, parseISO, isBefore } from 'date-fns';

import Appointment from '../models/Appointment';
import User from '../models/User';

class AppointmentController {
  async index(req, res) {
    const { userId } = req;
    const appointments = await Appointment.getAllAppointmentsOf(userId);
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

    const appointment = await Appointment.create({
      user_id: req.userId, //midler de auth setou
      provider_id,
      date,
    });

    return res.json(appointment);
  }

  static isHourPast(hourStart) {
    if (isBefore(hourStart, new Date())) {
      return true;
    }
    return false;
  }
}

export default new AppointmentController();
