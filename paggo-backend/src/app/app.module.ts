import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DocumentModule } from 'src/document/document.module';
import { DocumentController } from 'src/document/document.controller';
import { DocumentService } from 'src/document/document.service';
import { PrismaModule } from 'src/services/prisma.module';
import { UserModule } from 'src/users/user.module';
import { UserController } from 'src/users/user.controller';
import { UserService } from 'src/users/user.service';


@Module({
  imports: [DocumentModule, PrismaModule, UserModule],
  controllers: [AppController, DocumentController, UserController],
  providers: [AppService, DocumentService, UserService],
})
export class AppModule {}
