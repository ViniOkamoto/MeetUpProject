import * as Yup from 'yup';
import { isBefore, parseISO, startOfDay, endOfDay, subHours } from 'date-fns';
import { Op } from 'sequelize';
import Meetup from '../models/Meetup';
import User from '../models/User';
import File from '../models/File';

class MeetupController {
  async index(req, res) {
    const { date, page = 1 } = req.query;
    const where = {};
    if (date) {
      const searchDate = parseISO(date);
      where.date = {
        [Op.between]: [startOfDay(searchDate), endOfDay(searchDate)],
      };
    }
    const meetups = await Meetup.findAll({
      where,
      order: ['date'],
      limit: 20,
      offset: (page - 1) * 20,
      attributes: ['id', 'title', 'description', 'location', 'date', 'past'],
      include: [
        {
          model: User,
          attributes: ['id', 'name'],
        },
        {
          model: File,
          attributes: ['id', 'path', 'url'],
        },
      ],
    });
    return res.json(meetups);
  }

  async store(req, res) {
    const schema = await Yup.object().shape({
      file_id: Yup.number().required(),
      title: Yup.string().required(),
      description: Yup.string()
        .required()
        .max(50),
      location: Yup.string().required(),
      date: Yup.date().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    if (isBefore(parseISO(req.body.date), new Date())) {
      return res.status(400).json({ error: 'Meetup date invalid' });
    }
    const user_id = req.userId;
    const meetup = await Meetup.create({
      ...req.body,
      user_id,
    });

    return res.json(meetup);
  }

  async update(req, res) {
    const schema = await Yup.object().shape({
      file_id: Yup.number().required(),
      title: Yup.string().required(),
      description: Yup.string()
        .required()
        .max(50),
      location: Yup.string().required(),
      date: Yup.date().required(),
    });
    const meetup = await Meetup.findByPk(req.params.id);
    const user_id = req.userId;

    if (meetup.user_id !== user_id) {
      return res
        .status(400)
        .json({ error: 'You must be the meetup organizer to update it' });
    }

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    if (isBefore(parseISO(req.body.date), new Date())) {
      return res.status(400).json({ error: 'Meetup date invalid' });
    }
    if (meetup.past) {
      return res.status(400).json({ error: "You can't update past meetups" });
    }
    await meetup.update(req.body);

    return res.json(meetup);
  }

  async delete(req, res) {
    const meetup = await Meetup.findByPk(req.params.id);
    if (meetup.user_id !== req.userId) {
      return res.status(401).json({
        error: "You don't have permission to cancel this meetup.",
      });
    }
    const dateWithSub = subHours(meetup.date, 2);
    // 13:00 is the meetup date, less 2 hours = 11h;
    // if dateWithsub is before than new Date that is the current time, the user can't delete the meetup
    if (isBefore(dateWithSub, new Date())) {
      return res.status(401).json({
        error: 'You can only cancel meetups 2 hours in advance.',
      });
    }
    if (meetup.past) {
      return res.status(401).json({ error: "You can't delete past meetups" });
    }

    await meetup.destroy();

    return res.send();
  }
}

export default new MeetupController();
