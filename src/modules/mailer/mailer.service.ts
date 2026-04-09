import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport } from 'nodemailer';
import type { Transporter } from 'nodemailer';

import type { Env } from '@/app/config/env.schema.js';

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private readonly transporter: Transporter | null;
  private readonly from: string | undefined;
  private readonly appUrl: string | undefined;

  constructor(private readonly configService: ConfigService<Env, true>) {
    const host = this.configService.get('SMTP_HOST', { infer: true });
    const port = this.configService.get('SMTP_PORT', { infer: true });
    const user = this.configService.get('SMTP_USER', { infer: true });
    const pass = this.configService.get('SMTP_PASSWORD', { infer: true });

    this.from = this.configService.get('SMTP_FROM', { infer: true });
    this.appUrl = this.configService.get('APP_URL', { infer: true });

    if (host && port) {
      this.transporter = createTransport({
        host,
        port,
        auth: user && pass ? { user, pass } : undefined,
      });
    } else {
      this.transporter = null;
      this.logger.warn('SMTP not configured — emails will not be sent');
    }
  }

  async sendMail(to: string, subject: string, html: string): Promise<void> {
    if (!this.transporter) {
      this.logger.warn('Skipping email because SMTP is not configured');

      return;
    }

    await this.transporter.sendMail({
      from: this.from,
      to,
      subject,
      html,
    });
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    if (!this.appUrl) {
      throw new Error('APP_URL is required to send verification emails');
    }

    const verifyUrl = `${this.appUrl}/auth/verify-email?token=${token}`;

    const html = `
      <h1>Verify your email</h1>
      <p>Click the link below to verify your email address:</p>
      <p><a href="${verifyUrl}">${verifyUrl}</a></p>
      <p>This link expires in 24 hours.</p>
    `;

    await this.sendMail(email, 'Verify your email', html);
  }
}
