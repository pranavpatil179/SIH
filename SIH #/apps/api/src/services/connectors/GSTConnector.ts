import { GovernmentConnector } from './ConnectorBase';

export class GSTConnector extends GovernmentConnector {
  id = 'gst_nic';
  name = 'GST Verification (NIC)';
  async authenticate() { return false; }
  async healthCheck() {
    return { status: 'unavailable', message: 'Live integration unavailable — credentials/API access required.', lastAttempted: new Date() };
  }
}
