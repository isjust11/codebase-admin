import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private appName: string;
  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.configService.get<string>('EMAIL_USER'),
        pass: this.configService.get<string>('EMAIL_PASSWORD'),
      },
    });
    this.appName = this.configService.get<string>('APP_NAME') || 'ReadBox Admin';
  }

  async sendVerificationEmail(email: string, token: string, fullName: string) {
    const verificationUrl = `${this.configService.get<string>('CLIENT_URL')}/verify-email?token=${token}`;

    // Đọc template HTML
    const templatePath = path.join(__dirname, '../templates/email/verification.html');
    let htmlContent = fs.readFileSync(templatePath, 'utf8');

    // Thay thế các biến trong template
    htmlContent = htmlContent
      .replace(/{{fullName}}/g, fullName)
      .replace(/{{verificationUrl}}/g, verificationUrl)
      .replace(/{{appName}}/g, this.appName || 'ReadBox Admin');

    const mailOptions = {
      from: this.configService.get<string>('EMAIL_USER'),
      to: email,
      subject: 'Xác thực tài khoản - ' + this.appName,
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

  async sendForgotPasswordEmail(email: string, pin: string, fullName: string, expiresIn: number) {

    const templatePath = path.join(__dirname, '../templates/email/forgot-password.html');
    let htmlContent = fs.readFileSync(templatePath, 'utf8');

    htmlContent = htmlContent
      .replace(/{{fullName}}/g, fullName)
      .replace(/{{pin}}/g, pin)
      .replace(/{{expiresIn}}/g, expiresIn.toString())
      .replace(/{{appName}}/g, this.appName || 'ReadBox Admin');

    const mailOptions = {
      from: this.configService.get<string>('EMAIL_USER'),
      to: email,
      subject: 'Mã PIN xác thực tài khoản - ' + this.appName,
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

  async sendPinEmail(email: string, pin: string, fullName: string) {
    const templatePath = path.join(__dirname, '../templates/email/verification-pin.html');
    let htmlContent = fs.readFileSync(templatePath, 'utf8');

    htmlContent = htmlContent
      .replace(/{{fullName}}/g, fullName)
      .replace(/{{pin}}/g, pin)
      .replace(/{{expiresIn}}/g, this.configService.get<string>('PIN_EXPIRES_IN') || '10')
      .replace(/{{appName}}/g, this.appName || 'ReadBox Admin');

    const subject = 'Mã PIN xác thực tài khoản - ' + this.appName;

    const mailOptions = {
      from: this.configService.get<string>('EMAIL_USER'),
      to: email,
      subject: subject,
      html: htmlContent,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (_error) {
      console.error('Error sending PIN email:', _error);
      throw _error;
    }
  }
} 