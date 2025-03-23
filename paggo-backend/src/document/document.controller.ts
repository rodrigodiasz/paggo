import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  InternalServerErrorException,
  Req,
  UseGuards,
  Get,
  Body,
  Delete,
  Param
} from '@nestjs/common';
import { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { join, extname } from 'path';
import * as fs from 'fs';
import { DocumentService } from './document.service';
import { JwtAuthGuard } from 'src/users/jwt-auth.guard';

@Controller('documents')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @UseGuards(JwtAuthGuard)
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: join(__dirname, '../../uploads'),
        filename: (_req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          callback(
            null,
            file.fieldname + '-' + uniqueSuffix + extname(file.originalname),
          );
        },
      }),
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    try {
      if (!file || !file.path) {
        console.error('Nenhum arquivo recebido ou caminho inválido:', file);
        throw new BadRequestException('Nenhum arquivo válido foi enviado.');
      }

      if (!fs.existsSync(file.path)) {
        throw new InternalServerErrorException(
          'Erro ao acessar o arquivo enviado.',
        );
      }

      const { text, type } = await this.documentService.processOCR(file.path);

      let finalExtractedText = '';
      let explanation = '';

      if (type === 'pdf') {
        const result =
          await this.documentService.getLLMResponseWithFormattedText(text);
        finalExtractedText = result.formattedText;
        explanation = result.explanation;
      } else {
        explanation = await this.documentService.getLLMResponse(text);
        finalExtractedText = text;
      }

      const savedDocument = await this.documentService.saveDocument(
        (req as any).user.userId,
        file.filename,
        finalExtractedText,
        explanation,
      );

      return { success: true, document: savedDocument };
    } catch (error) {
      throw new InternalServerErrorException(
        `Erro interno ao processar o documento: ${error.message}`,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteDocument(@Param('id') id: string, @Req() req: Request) {
    const userId = (req as any).user.userId;
    return this.documentService.deleteDocument(Number(id), userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/ask')
  async askAboutDocument(
    @Param('id') documentId: string,
    @Body() body: { question: string },
    @Req() req: Request,
  ) {
    const userId = (req as any).user.userId;
    const question = body.question;
  
    return this.documentService.askAboutDocument(
      Number(documentId),
      userId,
      question,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getUserDocuments(@Req() req: Request) {
    const userId = (req as any).user.userId;
    return await this.documentService.getDocumentsByUser(userId);
  }
}
