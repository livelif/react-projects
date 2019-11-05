import Sequelize, { Model } from 'sequelize';
import User from './User';
import File from './File';

class Appointment extends Model {
  static init(sequelize) {
    super.init(
      {
        date: Sequelize.STRING,
        canceled_at: Sequelize.STRING,
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
      attributes: ['id', 'date'],
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
}

export default Appointment;
