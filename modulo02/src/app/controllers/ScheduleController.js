import Appointment from '../models/Appointment';
import User from '../models/User';

class ScheduleController {
  async index(req, res) {
    if (!User.isUserProvider(req.userId)) {
      return res.status(401).json({ error: 'User is not a provider' });
    }
    const { date } = req.query;
    const appointments = await Appointment.findAllAppointmentsOf(
      req.userId,
      date
    );
    return res.json({ appointments });
  }
}

export default new ScheduleController();
