import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.configService.get<string>('EMAIL_USER'),
        pass: this.configService.get<string>('EMAIL_PASSWORD'),
      },
    });
  }

  async sendVerificationEmail(email: string, token: string, fullName: string) {
    const verificationUrl = `${this.configService.get<string>('CLIENT_URL')}/verify-email?token=${token}`;
    
    // Đọc template HTML
    const templatePath = path.join(__dirname, '../templates/email/verification.html');
    let htmlContent = fs.readFileSync(templatePath, 'utf8');
    
    // Thay thế các biến trong template
    htmlContent = htmlContent
      .replace('{{fullName}}', fullName)
      .replace(/{{verificationUrl}}/g, verificationUrl);
    
    const mailOptions = {
      from: this.configService.get<string>('EMAIL_USER'),
      to: email,
      subject: 'Xác thực tài khoản Easy Order',
      html: htmlContent,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (_error) {
      console.error('Error sending verification email:', _error);
      throw _error;
    }
  }

  async sendForgotPasswordEmail(email: string, token: string, fullName: string) {
    const verificationUrl = `${this.configService.get<string>('CLIENT_URL')}/reset-password?token=${token}`;

    const templatePath = path.join(__dirname, '../templates/email/forgot-password.html');
    let htmlContent = fs.readFileSync(templatePath, 'utf8');

    htmlContent = htmlContent
      .replace('{{fullName}}', fullName)
      .replace(/{{verificationUrl}}/g, verificationUrl);

    const mailOptions = {
      from: this.configService.get<string>('EMAIL_USER'),
      to: email,
      subject: 'Khôi phục mật khẩu Easy Order',
      html: htmlContent,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (_error) {
      console.error('Error sending forgot password email:', _error);
      throw _error;
    }
  }
} 