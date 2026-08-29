import { GovernmentConnector } from './ConnectorBase';

export class NSWSConnector extends GovernmentConnector {
  id = 'nsws';
  name = 'National Single Window System';
  async authenticate() { return false; }
  async healthCheck() {
    return { status: 'unavailable', message: 'Live integration unavailable — credentials/API access required.', lastAttempted: new Date() };
  }
}
