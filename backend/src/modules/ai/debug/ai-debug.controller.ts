import { Controller, Body, HttpCode, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags, } from '@nestjs/swagger';
import { Throttle } from "@nestjs/throttler";
import { JwtAuthGuard } from "src/modules/common/guards/jwt-auth.guard";
import { RolesGuard } from "src/modules/common/guards/roles.guard";
import { Roles } from "src/modules/common/decorators/roles.decorator";
import { Role } from "src/modules/common/enums/role.enum";
import { AiDebugService } from "./ai-debug.service";
import { DevOnlyGuard } from "src/modules/common/guards/dev-only.guard";
import { AskDto, AskResponseDto, SimilarityDto, SimilarityResponseDto, } from './dto/ai-debug.dto'

@ApiTags("AI (debug)")
@ApiBearerAuth()
@UseGuards(DevOnlyGuard, JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.MANAGER)
@Throttle({ default: { limit: 10, ttl: 60000 } })
@Controller("ai/debug")
export class AiDebugController {
    constructor(private readonly debugService: AiDebugService) { }

    @Post("ask")
    @HttpCode(200)
    @ApiOperation({ summary: 'Pergunta direta ao LLM (sem RAG, sem tools)' })
    @ApiOkResponse({ type: AskResponseDto })
    ask(@Body() dto: AskDto): Promise<AskResponseDto> {
        return this.debugService.ask(dto)
    }

    @Post('similarity')
    @HttpCode(200)
    @ApiOperation({
        summary: 'Ordena textos pela similaridade de significado com a consulta',
    })
    @ApiOkResponse({ type: SimilarityResponseDto })
    similarity(@Body() dto: SimilarityDto): Promise<SimilarityResponseDto> {
        return this.debugService.similarity(dto);
    }
}
