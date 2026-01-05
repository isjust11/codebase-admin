import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as dotenv from 'dotenv';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
//config env
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // Enable CORS
  // Hỗ trợ nhiều origins: web client và mobile app
  // CLIENT_URL: URL của web client (ví dụ: http://localhost:3000)
  // MOBILE_ORIGINS: Danh sách origins của mobile app, phân cách bởi dấu phẩy
  // (ví dụ: http://localhost:8080,http://192.168.1.100:8080,capacitor://localhost)
  const clientUrl = process.env.CLIENT_URL;
  const mobileOrigins = process.env.MOBILE_ORIGINS 
    ? process.env.MOBILE_ORIGINS.split(',').map(url => url.trim())
    : [];
  
  // Tạo danh sách origins: web client + mobile origins
  const allowedOrigins: string[] = [];
  if (clientUrl) {
    allowedOrigins.push(clientUrl);
  }
  allowedOrigins.push(...mobileOrigins);
  
  // Nếu không có origin nào được cấu hình, cho phép tất cả (chỉ dùng cho development)
  const corsOptions = {
    origin: allowedOrigins.length > 0 
      ? allowedOrigins 
      : (process.env.NODE_ENV === 'production' ? false : '*'),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true,
    exposedHeaders: ['Authorization'],
  };
  
  app.enableCors(corsOptions);

  // Enable validation pipe globally
  // app.useGlobalPipes(new ValidationPipe({
  //   whitelist: true, // Loại bỏ các thuộc tính không có trong DTO
  //   forbidNonWhitelisted: true, // Từ chối request nếu có thuộc tính không được phép
  //   transform: true, // Tự động transform dữ liệu
  //   validateCustomDecorators: true, // Validate custom decorators
  // }));

  // Cấu hình phục vụ file tĩnh
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Codebase Admin API')
    .setDescription('Codebase Admin API Documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger-ui', app, document);
  
  app.useWebSocketAdapter(new IoAdapter(app));

  await app.listen(process.env.PORT ?? 4200,'0.0.0.0');
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
