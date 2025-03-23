import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../services/prisma.service';
import { OpenAI } from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import * as Tesseract from 'tesseract.js';
import * as pdfParse from 'pdf-parse';

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

@Injectable()
export class DocumentService {
  constructor(private readonly prisma: PrismaService) {}

  async processOCR(filePath: string): Promise<{ text: string; type: 'pdf' | 'image' }> {
    try {
      const ext = path.extname(filePath).toLowerCase();
      let fullText = '';

      if (ext === '.pdf') {
        console.log('PDF detectado. Extraindo texto com pdf-parse...');
        const buffer = fs.readFileSync(filePath);
        const data = await pdfParse(buffer);
        fullText = data.text?.trim() ?? '';
        fullText = fullText.replace(/([a-z])([A-Z])/g, '$1 $2');
        if (!fullText) throw new Error('Nenhum texto extraído do PDF.');
        return { text: fullText, type: 'pdf' };
      }

      console.log('Imagem detectada. Realizando OCR com Tesseract...');
      const result = await Tesseract.recognize(filePath, 'por', {
        logger: m => console.log(m),
      });

      fullText = result.data?.text?.trim() ?? '';
      if (!fullText) throw new Error('Nenhum texto extraído da imagem.');
      return { text: fullText, type: 'image' };
    } catch (error) {
      console.error('Erro no OCR:', error);
      throw new InternalServerErrorException('Erro ao processar OCR: ' + error.message);
    }
  }

  async getLLMResponseWithFormattedText(text: string): Promise<{ formattedText: string; explanation: string }> {
    try {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const formatResponse = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'user',
            content: `O texto abaixo foi extraído de um PDF, mas está mal formatado (palavras grudadas, estrutura confusa). 
Corrija a estrutura, separe palavras corretamente e devolva o conteúdo reestruturado como se tivesse sido digitado manualmente, mantendo fidelidade ao original. Não explique, apenas corrija:\n\n${text}`,
          },
        ],
      });

      const formattedText = formatResponse.choices[0]?.message?.content?.trim() || '';

      const explanationResponse = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'user',
            content: `Explique ou forneça um contexto ao seguinte texto: Responda em português(pt-br):\n\n${formattedText}`,
          },
        ],
      });

      const explanation = explanationResponse.choices[0]?.message?.content?.trim() || '';

      return { formattedText, explanation };
    } catch (error) {
      console.error('Erro ao chamar o OpenAI:', error);
      throw new InternalServerErrorException('Erro ao obter resposta do LLM.');
    }
  }

  async getLLMResponse(text: string): Promise<string> {
    try {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'user',
            content: `Explique ou forneça um contexto ao seguinte texto: Responda em português(pt-br):\n\n${text}`,
          },
        ],
      });

      return response.choices[0]?.message?.content?.trim() || 'Nenhuma explicação disponível.';
    } catch (error) {
      console.error('Erro ao chamar o OpenAI:', error);
      throw new InternalServerErrorException('Erro ao obter resposta do LLM.');
    }
  }

  async saveDocument(userId: number, filename: string, text: string, explanation: string) {
    return this.prisma.document.create({
      data: { filename, extractedText: text, explanation, userId },
    });
  }

  async deleteDocument(id: number, userId: number) {
    return this.prisma.document.deleteMany({
      where: {
        id,
        userId,
      },
    });
  }

  async askAboutDocument(documentId: number, userId: number, question: string) {
    const document = await this.prisma.document.findFirst({
      where: { id: documentId, userId },
    });
  
    if (!document) {
      throw new Error("Document not found.");
    }
  
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  
    const prompt = `Com base no seguinte texto extraído de um documento:\n\n${document.extractedText}\n\nResponda à seguinte pergunta em português(pt-br): ${question}`;
  
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
    });
  
    return {
      answer: response.choices[0]?.message?.content?.trim() ?? "Nenhuma resposta gerada.",
    };
  }
  

  async getDocumentsByUser(userId: number) {
    return this.prisma.document.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
