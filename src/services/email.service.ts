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

  async sendPinEmail(email: string, pin: string, fullName: string) {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Mã PIN xác thực</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #4CAF50;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 5px 5px 0 0;
          }
          .content {
            background-color: #f9f9f9;
            padding: 30px;
            border-radius: 0 0 5px 5px;
          }
          .pin-code {
            background-color: #fff;
            border: 2px solid #4CAF50;
            border-radius: 10px;
            padding: 20px;
            text-align: center;
            margin: 20px 0;
          }
          .pin-number {
            font-size: 32px;
            font-weight: bold;
            color: #4CAF50;
            letter-spacing: 5px;
          }
          .warning {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            color: #856404;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            color: #666;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Mã PIN xác thực tài khoản</h1>
        </div>
        <div class="content">
          <p>Xin chào <strong>${fullName}</strong>,</p>
          <p>Cảm ơn bạn đã đăng ký tài khoản. Để hoàn tất quá trình đăng ký, vui lòng sử dụng mã PIN sau:</p>
          
          <div class="pin-code">
            <div class="pin-number">${pin}</div>
          </div>
          
          <div class="warning">
            <strong>Lưu ý:</strong> Mã PIN này có hiệu lực trong 10 phút. Vui lòng không chia sẻ mã này với bất kỳ ai.
          </div>
          
          <p>Nếu bạn không thực hiện đăng ký này, vui lòng bỏ qua email này.</p>
        </div>
        <div class="footer">
          <p>Trân trọng,<br>Đội ngũ Sổ Tay Nam Dược</p>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: this.configService.get<string>('EMAIL_USER'),
      to: email,
      subject: 'Mã PIN xác thực tài khoản - Sổ Tay Nam Dược',
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