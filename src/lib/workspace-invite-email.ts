type ResendResponse = {
  id?: string;
  message?: string;
  name?: string;
};

type SendWorkspaceInviteEmailArgs = {
  to: string;
  workspaceName: string;
  invitedByName: string;
  signInUrl: string;
};

type SendWorkspaceMembershipAddedEmailArgs = {
  to: string;
  workspaceName: string;
  addedByName: string;
  appUrl: string;
};

const MAX_SEND_ATTEMPTS = 3;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getEmailConfig() {
  const resendApiKey = process.env.RESEND_API_KEY ?? "";
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? "";

  if (!resendApiKey || !fromEmail) {
    throw new Error("Missing RESEND_API_KEY or RESEND_FROM_EMAIL.");
  }

  return {
    resendApiKey,
    fromEmail,
  };
}

async function sendEmail(payload: { to: string; subject: string; html: string; text: string }) {
  const { resendApiKey, fromEmail } = getEmailConfig();
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_SEND_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [payload.to],
          subject: payload.subject,
          html: payload.html,
          text: payload.text,
        }),
      });

      const parsedBody = (await response.json().catch(() => ({}))) as ResendResponse;

      if (!response.ok) {
        const providerMessage = parsedBody?.message || parsedBody?.name || "Unknown provider error";
        const error = new Error(`Resend failed (${response.status}): ${providerMessage}`);
        if (response.status >= 500 && attempt < MAX_SEND_ATTEMPTS) {
          await sleep(150 * attempt);
          continue;
        }
        throw error;
      }

      if (!parsedBody?.id) {
        if (attempt < MAX_SEND_ATTEMPTS) {
          await sleep(150 * attempt);
          continue;
        }
        throw new Error("Resend accepted request without a delivery id.");
      }

      return parsedBody.id;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown email send error");
      if (attempt < MAX_SEND_ATTEMPTS) {
        await sleep(150 * attempt);
        continue;
      }
    }
  }

  throw lastError ?? new Error("Unable to send email via Resend.");
}

export async function sendWorkspaceInviteEmail({
  to,
  workspaceName,
  invitedByName,
  signInUrl,
}: SendWorkspaceInviteEmailArgs) {
  const safeWorkspace = escapeHtml(workspaceName);
  const safeInviter = escapeHtml(invitedByName);

  await sendEmail({
    to,
    subject: `You're invited to ${workspaceName} on Notably`,
    html: `<div style="font-family:Arial,sans-serif;line-height:1.5;color:#0f172a">
  <p>${safeInviter} invited you to collaborate in <strong>${safeWorkspace}</strong>.</p>
  <p><a href="${signInUrl}" style="display:inline-block;padding:10px 14px;border-radius:8px;background:#2563eb;color:white;text-decoration:none;font-weight:600">Sign in or create account</a></p>
  <p style="font-size:12px;color:#475569">Use this same email to access the workspace after account setup. If the button does not work, open this link:<br/>${signInUrl}</p>
</div>`,
    text: `${invitedByName} invited you to collaborate in ${workspaceName}.\n\nSign in or create account: ${signInUrl}`,
  });
}

export async function sendWorkspaceMembershipAddedEmail({
  to,
  workspaceName,
  addedByName,
  appUrl,
}: SendWorkspaceMembershipAddedEmailArgs) {
  const safeWorkspace = escapeHtml(workspaceName);
  const safeAdder = escapeHtml(addedByName);

  await sendEmail({
    to,
    subject: `You've been added to ${workspaceName} on Notably`,
    html: `<div style="font-family:Arial,sans-serif;line-height:1.5;color:#0f172a">
  <p>${safeAdder} added you to <strong>${safeWorkspace}</strong>.</p>
  <p><a href="${appUrl}" style="display:inline-block;padding:10px 14px;border-radius:8px;background:#2563eb;color:white;text-decoration:none;font-weight:600">Open Notably</a></p>
</div>`,
    text: `${addedByName} added you to ${workspaceName}.\n\nOpen Notably: ${appUrl}`,
  });
}
