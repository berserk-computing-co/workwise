import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity.js';
import { UpdateUserDto } from './dto/update-user.dto.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findByAuthId(authId: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { authId } });
  }

  async findByAuthIdOrFail(authId: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { authId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async update(authId: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findByAuthIdOrFail(authId);
    Object.assign(user, dto);
    return this.userRepository.save(user);
  }
}
