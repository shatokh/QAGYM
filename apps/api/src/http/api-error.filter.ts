import {
  ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { HttpAdapterHost } from "@nestjs/core";
import {
  ApiException,
  type ApiErrorResponse,
} from "./api-exception";

@Catch()
export class ApiErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiErrorFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const context = host.switchToHttp();
    const status = this.getStatus(exception);
    const body = this.getResponse(exception, status);

    if (!(exception instanceof HttpException)) {
      const trace = exception instanceof Error ? exception.stack : undefined;
      this.logger.error("Unhandled API error.", trace);
    }

    httpAdapter.reply(context.getResponse(), body, status);
  }

  private getStatus(exception: unknown): number {
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }

    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private getResponse(
    exception: unknown,
    status: number,
  ): ApiErrorResponse {
    if (exception instanceof ApiException) {
      return exception.getResponse() as ApiErrorResponse;
    }

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      return {
        error: {
          code: "INTERNAL_ERROR",
          message: "Internal server error.",
          details: [],
        },
      };
    }

    return {
      error: {
        code: status === HttpStatus.NOT_FOUND ? "NOT_FOUND" : "REQUEST_ERROR",
        message: "Request failed.",
        details: [],
      },
    };
  }
}
