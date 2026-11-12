import { ServiceUnavailableException } from '@nestjs/common';

// Falhas passageiras do provedor: vale tentar de novo mais tarde
const TRANSIENT_STATUSES = new Set([408, 429, 500, 502, 503, 504]);

/**
 * Lê o status HTTP de um erro do provedor.
 * O LangChain (@langchain/google) usa `statusCode`; o SDK @google/genai usa `status`.
 */
export function getErrorStatus(error: unknown): number | undefined {
    if (typeof error !== 'object' || error === null) return undefined;
    const candidate =
        'statusCode' in error
            ? error.statusCode
            : 'status' in error
                ? error.status
                : undefined;
    return typeof candidate === 'number' ? candidate : undefined;
}

export function isTransientError(error: unknown): boolean {
    const status = getErrorStatus(error);
    return status !== undefined && TRANSIENT_STATUSES.has(status);
}

/**
 * Lançado quando o provedor continua indisponível depois dos retries e do fallback.
 * Por ser HttpException, o AllExceptionsFilter responde 503 em vez de 500.
 */
export class AiProviderUnavailableError extends ServiceUnavailableException {
    constructor(
        readonly upstreamStatus: number | undefined,
        cause: unknown,
    ) {
        super(
            'O assistente de IA está indisponível no momento. Tente novamente em instantes.',
            { cause },
        );
    }

    /** Erro transitório vira 503; os demais (chave inválida, request errado) sobem como estão. */
    static wrapIfTransient(error: unknown): unknown {
        return isTransientError(error)
            ? new AiProviderUnavailableError(getErrorStatus(error), error)
            : error;
    }
}