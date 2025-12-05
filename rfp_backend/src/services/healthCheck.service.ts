import {
  IHealthCheckRepository,
  IHealthCheckService,
} from "../interfaces/healthCheck.interfaces";

export class HealthCheckService implements IHealthCheckService {
  private healthCheckRepository: IHealthCheckRepository;

  constructor(healthCheckRepository: IHealthCheckRepository) {
    this.healthCheckRepository = healthCheckRepository;
  }

  async getHealthStatus(userName: string): Promise<string> {
    return await this.healthCheckRepository.checkHealth(userName);
  }
}
