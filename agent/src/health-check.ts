import si from 'systeminformation';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  gpu: {
    available: boolean;
    temperature: number;
    utilization: number;
  };
  system: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
  };
}

class HealthCheck {
  async checkHealth(): Promise<HealthStatus> {
    try {
      const [gpu, cpu, mem, fs] = await Promise.all([
        si.graphics(),
        si.currentLoad(),
        si.mem(),
        si.fsSize(),
      ]);

      const gpuData = gpu.controllers[0];
      const diskUsage = fs[0] ? (fs[0].used / fs[0].size) * 100 : 0;

      return {
        status: this.determineStatus(gpuData, cpu, mem, diskUsage),
        gpu: {
          available: !!gpuData,
          temperature: gpuData?.temperatureGpu || 0,
          utilization: gpuData?.utilizationGpu || 0,
        },
        system: {
          cpuUsage: cpu.currentLoad || 0,
          memoryUsage: (mem.used / mem.total) * 100,
          diskUsage,
        },
      };
    } catch (err) {
      console.error('Health check failed:', err);
      return {
        status: 'unhealthy',
        gpu: { available: false, temperature: 0, utilization: 0 },
        system: { cpuUsage: 0, memoryUsage: 0, diskUsage: 0 },
      };
    }
  }

  private determineStatus(
    gpu: any,
    cpu: any,
    mem: any,
    diskUsage: number
  ): 'healthy' | 'degraded' | 'unhealthy' {
    if (!gpu) return 'unhealthy';
    
    const temp = gpu.temperatureGpu || 0;
    const cpuLoad = cpu.currentLoad || 0;
    const memUsage = (mem.used / mem.total) * 100;

    if (temp > 85 || cpuLoad > 90 || memUsage > 90 || diskUsage > 90) {
      return 'unhealthy';
    }
    if (temp > 75 || cpuLoad > 75 || memUsage > 75 || diskUsage > 75) {
      return 'degraded';
    }
    return 'healthy';
  }
}

export default HealthCheck;
