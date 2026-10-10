import { Resend } from "resend";

export async function sendVowsEmail(to: string, subject: string, text: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.INVITE_FROM_EMAIL;
  if (!apiKey || !from) {
    throw new Error("RESEND_API_KEY en INVITE_FROM_EMAIL zijn verplicht voor e-mail.");
  }
  const resend = new Resend(apiKey);
  const result = await resend.emails.send({ from, to, subject, text });
  if (result.error) throw new Error(result.error.message);
}

