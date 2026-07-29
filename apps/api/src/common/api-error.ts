import { HttpException, HttpStatus } from "@nestjs/common";

export class ApiError extends HttpException {
  constructor(code: string, message: string, status: HttpStatus = HttpStatus.BAD_REQUEST) {
    super({ success: false, error: { code, message, details: null } }, status);
  }
}
