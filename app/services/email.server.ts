/**
 * 邮件服务
 * 支持 MailChannels 和 Resend API
 */

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * 使用 MailChannels 发送邮件
 * MailChannels 是 Cloudflare Workers 的官方邮件服务
 */
export async function sendEmailViaMailChannels(
  options: EmailOptions,
  fromEmail: string = 'mail@aincfh.dpdns.org',
  fromName: string = 'A.T. Field'
): Promise<boolean> {
  try {
    // MailChannels 需要从 Cloudflare Workers 环境发送
    // 这里返回一个 fetch 请求到 MailChannels API
    const response = await fetch('https://api.mailchannels.net/tx/v1/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: options.to }],
          },
        ],
        from: {
          email: fromEmail,
          name: fromName,
        },
        subject: options.subject,
        content: [
          {
            type: 'text/html',
            value: options.html,
          },
          ...(options.text
            ? [
              {
                type: 'text/plain',
                value: options.text,
              },
            ]
            : []),
        ],
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Failed to send email via MailChannels:', error);
    return false;
  }
}

/**
 * 使用 Resend API 发送邮件
 * 需要设置 RESEND_API_KEY 环境变量
 */
export async function sendEmailViaResend(
  options: EmailOptions,
  apiKey: string,
  fromEmail: string = 'mail@aincfh.dpdns.org'
): Promise<boolean> {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Failed to send email via Resend:', error);
    return false;
  }
}

/**
 * 发送验证码邮件
 */
export async function sendVerificationCodeEmail(
  email: string,
  code: string,
  useMailChannels: boolean = true,
  resendApiKey?: string
): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .code-box { background: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0; border-radius: 8px; }
        .footer { margin-top: 30px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>验证码</h2>
        <p>您的验证码是：</p>
        <div class="code-box">${code}</div>
        <p>验证码有效期为 5 分钟，请勿泄露给他人。</p>
        <div class="footer">
          <p>此邮件由 A.T. Field 系统自动发送，请勿回复。</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `您的验证码是：${code}，有效期为 5 分钟。`;

  if (useMailChannels) {
    return await sendEmailViaMailChannels({
      to: email,
      subject: '【A.T. Field】验证码',
      html,
      text,
    });
  } else if (resendApiKey) {
    return await sendEmailViaResend(
      {
        to: email,
        subject: '【A.T. Field】验证码',
        html,
        text,
      },
      resendApiKey
    );
  }

  return false;
}

