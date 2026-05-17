import nodemailer from "nodemailer";

import { env } from "@/env";

type SendEmailParams = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !SMTP_FROM) {
    throw new Error(
      "Missing SMTP env vars. Set SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_FROM."
    );
  }

  const port = SMTP_PORT ?? 587;
  const secure = port === 465;

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  return transporter;
}

export async function sendEmail({ to, subject, text, html }: SendEmailParams) {
  const transport = getTransporter();

  await transport.sendMail({
    from: env.SMTP_FROM!,
    to,
    subject,
    text,
    html,
  });
}

export async function sendVerificationEmail(
  {
    user,
    url,
  }: {
    user: { email: string | null };
    url: string;
    token?: string;
  },
  _request: unknown
) {
  const to = user.email;
  if (!to) throw new Error("sendVerificationEmail: user email is missing.");

  // Avoid awaiting where BetterAuth supports it (timing attack mitigation),
  // but still keep this helper async for a consistent interface.
  await sendEmail({
    to,
    subject: "Verify your email address",
    text: `Click the link to verify your email: ${url}`,
  });
}

export function isSmtpConfigured(): boolean {
  return Boolean(
    env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS && env.SMTP_FROM,
  );
}

export async function sendWorkspaceInviteEmail({
  to,
  workspaceName,
  workspaceSlug,
  role,
  teamName,
  expiresAt,
}: {
  to: string;
  workspaceName: string;
  workspaceSlug: string;
  role: string;
  teamName: string | null;
  expiresAt: Date;
}) {
  if (!isSmtpConfigured()) {
    throw new Error("sendWorkspaceInviteEmail: SMTP is not configured.");
  }

  const onboardingUrl = `${env.NEXT_PUBLIC_URL}/onboarding`;
  const teamLine = teamName
    ? `Default team after you join: ${teamName}\n`
    : "";

  const text = [
    `You have been invited to join the workspace "${workspaceName}" (${workspaceSlug}) on Partha.`,
    "",
    `Role: ${role}`,
    teamLine,
    `This invite expires on ${expiresAt.toLocaleString()}.`,
    "",
    `Sign in or sign up using this email address (${to}), then open:`,
    onboardingUrl,
    "",
    "You will see your pending invite there and can accept it to access this workspace only.",
  ].join("\n");

  const html = [
    `<p>You have been invited to join the workspace <strong>${escapeHtml(workspaceName)}</strong> (<code>${escapeHtml(workspaceSlug)}</code>) on Partha.</p>`,
    `<p><strong>Role:</strong> ${escapeHtml(role)}</p>`,
    teamName
      ? `<p><strong>Default team after you join:</strong> ${escapeHtml(teamName)}</p>`
      : "",
    `<p>This invite expires on <strong>${escapeHtml(expiresAt.toLocaleString())}</strong>.</p>`,
    `<p>Sign in or sign up using this email address, then open your pending invites:</p>`,
    `<p><a href="${escapeHtml(onboardingUrl)}">${escapeHtml(onboardingUrl)}</a></p>`,
    "<p>You will only get access to this workspace when you accept the invite.</p>",
  ]
    .filter(Boolean)
    .join("\n");

  await sendEmail({
    to,
    subject: `Invitation to ${workspaceName}`,
    text,
    html,
  });
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export async function sendResetPasswordEmail(
  {
    user,
    url,
  }: {
    user: { email: string | null };
    url: string;
    token?: string;
  },
  _request: unknown
) {
  const to = user.email;
  if (!to) throw new Error("sendResetPasswordEmail: user email is missing.");

  await sendEmail({
    to,
    subject: "Reset your password",
    text: `Click the link to reset your password: ${url}`,
  });
}

