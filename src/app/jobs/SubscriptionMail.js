import Mail from '../../lib/Mail';

class SubscriptionMail {
  get key() {
    return 'SubscriptionMail';
  }

  async handle({ data }) {
    console.log('a fila executou');
    const { organizer, meetup, user } = data;
    await Mail.sendMail({
      to: `${organizer.name} <${organizer.email}>`,
      subject: `Nova inscrição realizada no evento ${meetup.title}`,
      template: 'subscription',
      context: {
        organizer: organizer.name,
        meetup: meetup.title,
        user: user.name,
        email: user.email,
      },
    });
  }
}

export default new SubscriptionMail();
