import { format, parseISO } from 'date-fns';
import pt from 'date-fns/locale/pt';

import Mail from '../../lib/Mail';

class CancellationMail {
  get key() {
    return 'CancellationMail';
  }

  async handle({ data }) {
    const { appoiment } = data;
    Mail.sendMail({
      to: `${appoiment.provider.name} <${appoiment.provider.email}>`,
      subject: 'Agedamento cancelado',
      template: 'cancellation',
      context: {
        provider: appoiment.provider.name,
        user: appoiment.user.name,
        date: format(
          parseISO(appoiment.date),
          "'dia' dd 'de' MMMM', às 'H:mm'h'",
          {
            locale: pt,
          }
        ),
      },
    });
  }
}

export default new CancellationMail();
