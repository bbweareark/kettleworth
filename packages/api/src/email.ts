import { Resend } from "resend";

let resend: Resend | null = null;
export async function sendEmail(msg: { to: string; subject: string; text: string; html?: string }): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.log(`\n[email:dev] To: ${msg.to}\nSubject: ${msg.subject}\n\n${msg.text}\n`);
    return;
  }
  resend ??= new Resend(key);
  await resend.emails.send({ from: process.env.EMAIL_FROM ?? "Kettleworth <hello@kettleworth.app>", to: msg.to, subject: msg.subject, text: msg.text, html: msg.html });
}
