import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { File } from "./entities/file.entity.js";
import { FilesService } from "./files.service.js";
import { FilesController } from "./files.controller.js";

@Module({
  imports: [TypeOrmModule.forFeature([File])],
  controllers: [FilesController],
  providers: [FilesService],
  exports: [TypeOrmModule, FilesService],
})
export class FilesModule {}
