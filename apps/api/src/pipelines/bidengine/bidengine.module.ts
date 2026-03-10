import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BidEngineController } from "./bidengine.controller.js";
import { BidEngineProcessor } from "./bidengine.processor.js";
import { MaterialPricingAgentService } from "./agents/web-pricing-agent.service.js";
import { LaborPricingAgentService } from "./agents/labor-pricing-agent.service.js";
import { PricingFanOutService } from "./agents/pricing-fan-out.service.js";
import { ScopeDecompositionStep } from "./steps/scope-decomposition.step.js";
import { WebPriceResolutionStep } from "./steps/web-price-resolution.step.js";
import { OptionGenerationStep } from "./steps/option-generation.step.js";
import { CalculationStep } from "./steps/calculation.step.js";
import { Project } from "../../projects/entities/project.entity.js";
import { ProjectsModule } from "../../projects/projects.module.js";
import { PipelineModule } from "../../pipeline/pipeline.module.js";
import { UsersModule } from "../../users/users.module.js";
import { FilesModule } from "../../files/files.module.js";

@Module({
  imports: [
    BullModule.registerQueue({ name: "project-generation" }),
    TypeOrmModule.forFeature([Project]),
    ProjectsModule,
    UsersModule,
    PipelineModule,
    FilesModule,
  ],
  controllers: [BidEngineController],
  providers: [
    BidEngineProcessor,
    MaterialPricingAgentService,
    LaborPricingAgentService,
    PricingFanOutService,
    ScopeDecompositionStep,
    WebPriceResolutionStep,
    OptionGenerationStep,
    CalculationStep,
  ],
  exports: [BullModule, PipelineModule],
})
export class BidEngineModule {}
