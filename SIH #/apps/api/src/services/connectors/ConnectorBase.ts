export abstract class GovernmentConnector {
  abstract id: string;
  abstract name: string;
  abstract authenticate(): Promise<boolean>;
  abstract healthCheck(): Promise<any>;
}
