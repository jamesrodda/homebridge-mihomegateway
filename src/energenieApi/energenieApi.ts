import { RestClient, IRestResponse } from 'typed-rest-client';
import { SubDevice, UserProfile } from './models';
import { ApiResponse, ApiStatus } from './apiTypes';
import { HttpCodes, HttpClient } from 'typed-rest-client/HttpClient';
import { Logger } from 'homebridge';
import { EnergenieAuthenticationHandler } from './energenieAuthenticationHandler';
import { BasicCredentialHandler } from 'typed-rest-client/Handlers';
import { IHttpClientResponse } from 'typed-rest-client/Interfaces';
import { getUrl } from 'typed-rest-client/Util';
import { UnauthorisedError } from './errors';

export class EnergenieApi {
  private readonly restClient: RestClient;
  private readonly httpClient: HttpClient;
  private readonly userAgent = 'homebridge-mihomegateway';
  private token = '';

  constructor(
    private readonly logger: Logger,
    private readonly username: string,
    private readonly password: string,
    private readonly baseUrl: string,
  ) {

    this.restClient = new RestClient(this.userAgent, baseUrl, [
      new EnergenieAuthenticationHandler(username, () => this.token),
    ]);

    this.httpClient = this.restClient.client;
  }

  public async auth(): Promise<void> {
    const authClient = new RestClient(this.userAgent, this.baseUrl, [
      new BasicCredentialHandler(this.username, this.password),
    ]);

    const profile = await this.getUserProfile(authClient);

    this.token = profile.api_key;
  }

  public async getUserProfile(client?: RestClient): Promise<UserProfile> {
    const getUserProfileClient = client || this.restClient;

    return this.makeRestRequest(() => getUserProfileClient.get<ApiResponse<UserProfile>>('users/profile', {}),
      'getUserProfile');
  }

  public async getSubDevices(): Promise<SubDevice[]> {
    return this.makeRestRequest(() => this.restClient.create<ApiResponse<SubDevice[]>>('subdevices/list', {}),
      'getSubDevices');
  }

  public toggleSocketPower(id: number, value: boolean): Promise<void> {
    const params = `params={ "id": ${id} }`;
    const action = value ? 'power_on' : 'power_off';
    const url = getUrl('subdevices' + action, this.baseUrl);

    return this.makeHttpRequest(() => this.httpClient.post(url, params),
      `toggleSocketPower/${action}`);
  }

  public getSubdeviceInfo(id: number): Promise<SubDevice> {
    const params = `params={ "id": ${id} }`;
    const url = getUrl('subdevices/show', this.baseUrl);

    return this.makeHttpRequest(() => this.httpClient.post(url, params),
      'getSubDeviceInfo');
  }

  private async makeRestRequest<T>(action: () => Promise<IRestResponse<ApiResponse<T>>>, actionName: string): Promise<T> {
    try {
      const response = await action();

      this.handleHttpResponse(response.statusCode, actionName);

      return this.handleApiResponse(response.result, actionName);
    } catch (e) {
      if (e instanceof UnauthorisedError) {
        await this.auth();
        return this.makeRestRequest(action, actionName);
      }

      throw e;
    }
  }

  private async makeHttpRequest<T>(action: () => Promise<IHttpClientResponse>, actionName: string): Promise<T> {
    try {
      const response = await action();

      this.handleHttpResponse(response.message.statusCode, actionName);

      const body: ApiResponse<T> = JSON.parse(await response.readBody());
      this.logger.debug(`Response from ${actionName}`, body);

      return this.handleApiResponse(body, actionName);
    } catch (e) {
      if (e instanceof UnauthorisedError) {
        await this.auth();
        return this.makeHttpRequest(action, actionName);
      }

      throw e;
    }
  }

  private handleHttpResponse(statusCode: number | undefined, actionName: string): void {
    if (statusCode !== HttpCodes.OK) {
      throw this.getHttpError(actionName, statusCode);
    }
  }

  private handleApiResponse<T>(response: ApiResponse<T> | null, actionName: string): T {
    this.logger.debug(`Response from ${actionName}`, response);

    if (response === null) {
      throw this.getApiError(actionName, undefined);
    }

    switch (response.status) {
      case ApiStatus.SUCCESS:
        return response.data;
      case ApiStatus.ACCESSDENIED:
        throw new UnauthorisedError(`Access denied when trying to call ${actionName}`);
      default:
        throw this.getApiError(actionName, response.status);
    }
  }

  private getHttpError(method: string, statusCode: HttpCodes | undefined): string {
    return `Unexpected statusCode from ${method}: ${statusCode || 'unknown'}`;
  }

  private getApiError(method: string, statusCode: ApiStatus | undefined): string {
    throw `Energenie API status did not indicate success when calling ${method}: ${statusCode || 'unknown'}`;
  }
}