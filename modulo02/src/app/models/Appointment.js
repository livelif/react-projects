import Sequelize, { Model, Op } from 'sequelize';
import { startOfDay, endOfDay, parseISO, isBefore, subHours } from 'date-fns';
import User from './User';
import File from './File';

class Appointment extends Model {
  static init(sequelize) {
    super.init(
      {
        date: Sequelize.STRING,
        canceled_at: Sequelize.DATE,
        past: {
          type: Sequelize.VIRTUAL,
          get() {
            return isBefore(this.date, new Date());
          },
        },
        cancelable: {
          type: Sequelize.VIRTUAL,
          get() {
            return isBefore(new Date(), subHours(this.date, 2));
          },
        },
      },
      {
        sequelize,
      }
    );
  }

  static associate(models) {
    this.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    this.belongsTo(models.User, { foreignKey: 'provider_id', as: 'provider' });
  }

  static async checkDateAvailability(provider_id, hourStart) {
    const appointment = await Appointment.findOne({
      where: {
        provider_id,
        canceled_at: null,
        date: hourStart,
      },
    });

    if (appointment) {
      return true;
    }

    return false;
  }

  static async getAppointments(user_id, numberPage) {
    const appointment = await Appointment.findAll({
      where: {
        user_id,
        canceled_at: null,
      },
      order: ['date'],
      attributes: ['id', 'date', 'past', 'cancelable'],
      limit: 20,
      offset: (numberPage - 1) * 20,
      include: [
        {
          model: User,
          as: 'provider',
          attributes: ['id', 'name'],
          include: [
            {
              model: File,
              as: 'avatar',
              attributes: ['id', 'url'],
            },
          ],
        },
      ],
    });

    return appointment;
  }

  static async findAllAppointmentsOf(userId, onDate) {
    const parsedDate = parseISO(onDate);

    const appointments = await Appointment.findAll({
      where: {
        provider_id: userId,
        canceled_at: null,
        date: {
          [Op.between]: [startOfDay(parsedDate), endOfDay(parsedDate)],
        },
      },
      order: ['date'],
    });

    if (appointments) {
      console.log('appointments empty');
    }
    return appointments;
  }
}

export default Appointment;
