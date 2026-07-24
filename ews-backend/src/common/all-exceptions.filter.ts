import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * SECURITY: filter global supaya error yang TIDAK terduga (bukan HttpException
 * yang sengaja dilempar service, mis. error Prisma/DB, TypeError, dll) tidak
 * pernah membocorkan detail internal (stack trace, query SQL, nama
 * kolom/tabel) ke response HTTP — hanya "Internal server error" generik.
 * Detail lengkap tetap dicatat di log server untuk keperluan debugging.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionsFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = isHttpException
      ? exception.getResponse()
      : 'Internal server error';

    if (!isHttpException) {
      // Error tak terduga — log lengkap (server-side only), jangan pernah
      // dikirim ke client.
      this.logger.error(
        `${request.method} ${request.url} -> ${(exception as Error)?.message ?? exception}`,
        (exception as Error)?.stack,
      );
    }

    const body =
      typeof message === 'string'
        ? { statusCode: status, message }
        : { statusCode: status, ...message };

    response.status(status).json(body);
  }
}
