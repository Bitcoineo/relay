import { resend, FROM_EMAIL } from "@/lib/resend";
import VerificationEmail from "@/emails/verification";
import WelcomeEmail from "@/emails/welcome";
import MentionEmail from "@/emails/mention";

export async function sendVerificationEmail(
  email: string,
  name: string,
  token: string
): Promise<{ data: { id: string } | null; error: string | null }> {
  const verifyUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/verify?token=${token}`;

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "Verify your email — Relay",
      react: VerificationEmail({ name, verifyUrl }),
    });

    if (error) return { data: null, error: error.message };
    return { data, error: null };
  } catch {
    return { data: null, error: "Failed to send verification email" };
  }
}

export async function sendWelcomeEmail(
  email: string,
  name: string
): Promise<{ data: { id: string } | null; error: string | null }> {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "Welcome to Relay!",
      react: WelcomeEmail({ name }),
    });

    if (error) return { data: null, error: error.message };
    return { data, error: null };
  } catch {
    return { data: null, error: "Failed to send welcome email" };
  }
}

export async function sendMentionNotification(
  email: string,
  mentionedByName: string,
  channelName: string,
  messageContent: string,
  workspaceSlug: string,
  channelId: string
): Promise<{ data: { id: string } | null; error: string | null }> {
  const viewUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/${workspaceSlug}/${channelId}`;

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `${mentionedByName} mentioned you in #${channelName} — Relay`,
      react: MentionEmail({
        mentionedByName,
        channelName,
        messageContent,
        viewUrl,
      }),
    });

    if (error) return { data: null, error: error.message };
    return { data, error: null };
  } catch {
    return { data: null, error: "Failed to send mention notification" };
  }
}
