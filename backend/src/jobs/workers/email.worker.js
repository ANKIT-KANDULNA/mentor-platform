const { Worker } = require('bullmq');
const { bullConnection } = require('../../redis/client');
const nodemailer = require('nodemailer');
const env = require('../../config/env');

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: false,
  auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
});

const sendEmail = async ({ to, subject, html }) => {
  await transporter.sendMail({
    from: `"Mentor Platform" <${env.SMTP_USER}>`,
    to, subject, html,
  });
};

const emailWorker = new Worker(
  'emailQueue',
  async (job) => {
    const { name, data } = job;
    console.log(`Processing email job: ${name}`, { jobId: job.id });

    switch (name) {
      case 'welcome':
        await sendEmail({
          to: data.email,
          subject: 'Welcome to Mentor Platform! 🎉',
          html: `<h1>Welcome!</h1><p>We are glad you joined Mentor Platform.</p>`,
        });
        break;

      case 'verification':
        await sendEmail({
          to: data.email,
          subject: 'Verify your email',
          html: `<h1>Verify Email</h1><p>Token: ${data.token}</p>`,
        });
        break;

      case 'session-reminder':
        for (const email of data.participants) {
          await sendEmail({
            to: email,
            subject: `Reminder: ${data.sessionTitle} starts in 10 minutes`,
            html: `<h1>Session Reminder</h1><p>Your session starts soon!</p>`,
          });
        }
        break;

      default:
        console.warn(`Unknown email job: ${name}`);
    }
  },
  {
    connection: bullConnection,
    concurrency: 5,
  }
);

emailWorker.on('completed', (job) => {
  console.log(`Email job completed: ${job.id}`);
});

emailWorker.on('failed', (job, err) => {
  console.error(`Email job failed: ${job?.id}`, { error: err.message });
});

module.exports = emailWorker;