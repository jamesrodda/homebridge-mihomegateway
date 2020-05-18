import { BasicCredentialHandler } from 'typed-rest-client/Handlers';

export class EnergenieAuthenticationHandler extends BasicCredentialHandler {

  constructor(
    username: string,
    private readonly tokenAccessor: () => string) {
    super(username, '');
  }

  prepareRequest(options: any): void {
    super.password = this.tokenAccessor();

    if (super.password === '') {
      throw 'Ensure auth() is called before making requests';
    }

    super.prepareRequest(options);
  }
}