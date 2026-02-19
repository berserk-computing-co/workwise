import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendBidEmail(
  to: string,
  projectName: string,
  pdfBuffer: Buffer
): Promise<void> {
  const slug = projectName.replace(/\s+/g, "-").toLowerCase();
  const { error } = await resend.emails.send({
    from: "Workwise <onboarding@resend.dev>",
    to,
    subject: `Your Workwise Bid: ${projectName}`,
    html: `<p>Your bid for <strong>${projectName}</strong> is attached.</p>`,
    attachments: [{ filename: `bid-${slug}.pdf`, content: pdfBuffer }],
  });

  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }
}
