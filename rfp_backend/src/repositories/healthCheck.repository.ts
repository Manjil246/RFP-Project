// The repository basically speaks with the database and is meant just for that
import { IHealthCheckRepository } from "../interfaces/healthCheck.interfaces";

export class HealthCheckRepository implements IHealthCheckRepository {
  constructor() {}

  async checkHealth(name: string): Promise<string> {
    console.log(`Checking health for ${name}`);
    return "<h1>Database is healthy</h1>";
  }
}
