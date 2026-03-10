import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
} from "@nestjs/common";
import { FilesService } from "./files.service.js";
import { CreateFileDto } from "./dto/create-file.dto.js";

@Controller("files")
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post()
  @HttpCode(201)
  async create(@Body() dto: CreateFileDto) {
    return this.filesService.create(dto);
  }

  @Get("project/:projectId")
  async findAllByProject(@Param("projectId") projectId: string) {
    return this.filesService.findAllByProject(projectId);
  }

  @Get(":id/download")
  async getDownloadUrl(@Param("id") id: string) {
    return this.filesService.getDownloadUrl(id);
  }

  @Delete(":id")
  @HttpCode(204)
  async remove(@Param("id") id: string) {
    return this.filesService.remove(id);
  }
}
