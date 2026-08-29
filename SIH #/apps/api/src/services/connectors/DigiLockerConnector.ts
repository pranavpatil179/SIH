import { GovernmentConnector } from './ConnectorBase';

export class DigiLockerConnector extends GovernmentConnector {
  id = 'digilocker';
  name = 'DigiLocker';
  async authenticate() { return false; }
  async healthCheck() {
    return { status: 'unavailable', message: 'Live integration unavailable — credentials/API access required.', lastAttempted: new Date() };
  }
}
