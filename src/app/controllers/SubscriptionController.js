import { format } from 'date-fns';
import pt from 'date-fns/locale/pt';
import Meetup from '../models/Meetup';
import User from '../models/User';
import Subscription from '../models/Subscription';
import Notification from '../schemas/Notification';
import Queue from '../../lib/Queue';
import SubscriptionMail from '../jobs/SubscriptionMail';

class SubscriptionController {
  async store(req, res) {
    const user = await User.findByPk(req.userId);
    const meetup = await Meetup.findByPk(req.params.meetupId, {
      include: [User],
    });
    if (!meetup) {
      return res
        .status(404)
        .json({ error: "The meetup you're searching doesn't exists" });
    }
    if (meetup.user_id === req.userId) {
      return res
        .status(400)
        .json({ error: "Can't subscribe to you own meetups" });
    }

    if (meetup.past) {
      return res.status(400).json({ error: "Can't subscribe to past meetups" });
    }

    const checkDate = await Subscription.findOne({
      where: {
        user_id: user.id,
      },
      include: [
        {
          model: Meetup,
          required: true,
          where: {
            date: meetup.date,
          },
        },
      ],
    });

    if (checkDate) {
      return res
        .status(400)
        .json({ error: "Can't subscribe to two meetups at the same time" });
    }

    const subscription = await Subscription.create({
      user_id: user.id,
      meetup_id: meetup.id,
    });
    /**
     * Notificar organizador do evento
     */
    const formattedDate = format(
      meetup.date,
      "'dia' dd 'de' MMMM', às' H:mm'h'",
      { locale: pt }
      // pt will help us to translate MMMM in portuguese.
    );
    await Notification.create({
      content: `O usuário ${user.name} confirmou presença no seu evento no ${formattedDate}`,
      user: meetup.user_id,
    });
    /**
     * Enviar um email ao organizador que alguém se inscreveu no seu MeetUp
     */
    const organizer = await User.findByPk(meetup.user_id);
    await Queue.add(SubscriptionMail.key, {
      organizer,
      meetup,
      user,
    });
    return res.json(subscription);
  }
}

export default new SubscriptionController();
