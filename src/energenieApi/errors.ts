export class UnauthorisedError extends Error {
  constructor(message: string) {
    super(message);
  }
}