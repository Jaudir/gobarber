export default {
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
  secure: '',
  default: {
    from: 'Equipe GoBarber <noreply@gobarber.com>',
  },
};

/** Emai server services
 * Amazon SES
 * Mailgun
 * Sparkpost
 * Mandril
 * Gmail
 *
 * Mailtrap (DEV)
 */
