import { Injectable, ConflictException, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../services/prisma.service'; 
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken'; 

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  // Função para criar um novo usuário
  async createUser(createUserDto: CreateUserDto) {
    const { name, email, password } = createUserDto;

    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new ConflictException('Email já está em uso');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      const user = await this.prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
        },
      });

      const { password: _, ...result } = user; 
      return result;
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Erro ao criar usuário');
    }
  }

  // Função para fazer login do usuário
  async login(email: string, password: string) {
    
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('E-mail ou senha incorretos');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('E-mail ou senha incorretos');
    }

    const secret = process.env.JWT_SECRET || 'default_secret'; 
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      secret, 
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
    );
    

    return {
      message: 'Login bem-sucedido',
      token, 
    };
  }
}
