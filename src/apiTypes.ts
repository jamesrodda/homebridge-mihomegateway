export interface ApiResponse<T> {
  status: ApiStatus;
  time: number;
  flags: any;
  data: T;
}

export declare const enum ApiStatus {
  SUCCESS = 'success',
  NOTFOUND = 'not-found',
  ACCESSDENIED = 'access-denied',
  PARAMETERERROR = 'parameter-error',
  VALIDATIONERROR = 'validation-error',
  MAINTENANCE = 'maintenance',
  INTERNALSERVERERROR = 'internal-server-error'
}