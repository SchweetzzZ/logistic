import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { Embeddings } from '@langchain/core/embeddings';
import { HumanMessage, SystemMessage, type AIMessage, type BaseMessage, } from '@langchain/core/messages';
import type { Runnable } from '@langchain/core/runnables';
import { cosineSimilarity } from '@langchain/core/utils/math';
import { CHAT_MODEL, EMBEDDINGS, FALLBACK_CHAT_MODEL } from '../ai.constants';
import { AiProviderUnavailableError } from '../models/ai-provider.error';
import type { AskDto, AskResponseDto, SimilarityDto, SimilarityResponseDto, } from './dto/ai-debug.dto';

const DEFAULT_SYSTEM =
    'Você é o assistente do Logistics SaaS. Responda em português do Brasil, de forma curta e direta.';