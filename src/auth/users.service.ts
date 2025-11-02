import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User } from './user.entity';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async createUser(authCredentialsDto: AuthCredentialsDto): Promise<User> {
    const { username, password } = authCredentialsDto;

    const saltRounds: number = 10; //hash with bCrypt and salt
    const hashedPassword: string = await bcrypt.hash(password, saltRounds);

    const user = this.usersRepository.create({
      username,
      password: hashedPassword,
    });

    try {
      return await this.usersRepository.save(user);
    } catch (err: unknown) {
      // Postgres unique violation
      if (
        err &&
        typeof err === 'object' &&
        'code' in err &&
        err.code === '23505' // error message postgres duplicates
      ) {
        throw new ConflictException('Username already exists');
      }
      throw new InternalServerErrorException();
    }
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { username },
    });
  }
}
