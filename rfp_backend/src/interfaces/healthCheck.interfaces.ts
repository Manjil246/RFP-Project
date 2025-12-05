export interface IHealthCheckService {
  getHealthStatus(name: string): Promise<string>;
}

export interface IHealthCheckRepository {
  checkHealth(name: string): Promise<string>;
}
