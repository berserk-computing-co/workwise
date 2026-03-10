import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'node:crypto';
import { File } from './entities/file.entity.js';
import { S3Service } from '../storage/s3.service.js';
import { CreateFileDto } from './dto/create-file.dto.js';

@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(File)
    private readonly fileRepo: Repository<File>,
    private readonly s3: S3Service,
  ) {}

  async create(dto: CreateFileDto) {
    const ext = dto.fileName.split('.').pop() ?? '';
    const s3Key = `projects/${dto.projectId}/files/${randomUUID()}${ext ? `.${ext}` : ''}`;

    const uploadUrl = await this.s3.getPresignedUploadUrl(
      s3Key,
      dto.contentType,
    );

    const file = this.fileRepo.create({
      projectId: dto.projectId,
      s3Key,
      fileName: dto.fileName,
      contentType: dto.contentType,
      sizeBytes: dto.sizeBytes,
    });
    await this.fileRepo.save(file);

    return { id: file.id, uploadUrl, s3Key };
  }

  async findAllByProject(projectId: string) {
    return this.fileRepo.find({
      where: { projectId },
      order: { createdAt: 'ASC' },
    });
  }

  async getDownloadUrl(id: string) {
    const file = await this.fileRepo.findOne({ where: { id } });
    if (!file) throw new NotFoundException('File not found');

    const downloadUrl = await this.s3.getPresignedDownloadUrl(file.s3Key);
    return {
      downloadUrl,
      fileName: file.fileName,
      contentType: file.contentType,
    };
  }

  async getBase64(file: File) {
    return this.s3.getObjectAsBase64(file.s3Key);
  }

  async remove(id: string) {
    const file = await this.fileRepo.findOne({ where: { id } });
    if (!file) throw new NotFoundException('File not found');

    await this.s3.deleteObject(file.s3Key);
    await this.fileRepo.remove(file);
  }
}
