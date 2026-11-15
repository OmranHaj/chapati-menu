import { Catch, HttpException, type ArgumentsHost, type ExceptionFilter } from "@nestjs/common";
import type { Response } from "express";
import { logger } from "./logger";

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    if (exception instanceof HttpException) {
      response.status(exception.getStatus()).json({ error: exception.message });
      return;
    }
    const cause = exception && typeof exception === "object" && "cause" in exception ? exception.cause : exception;
    const code = cause && typeof cause === "object" && "code" in cause ? cause.code : undefined;
    if (code === "23505") {
      response.status(409).json({ error: "يوجد قسم بهذا الاسم مسبقاً" });
    } else if (code === "23503") {
      response.status(409).json({ error: "القسم مرتبط بمنتجات، انقلها أولاً" });
    } else {
      logger.error({ err: exception }, "API request failed");
      response.status(500).json({ error: "تعذّر إتمام العملية، حاول مرة أخرى" });
    }
  }
}
