import si from 'systeminformation';
import { io, Socket } from 'socket.io-client';

interface GPUMetric {
  utilization: number;
  temperature: number;
  vramUsedGB: number;
  powerDrawW?: number;
}

class GPUReporter {
  private socket: Socket;
  private gpuId: string;
  private interval: NodeJS.Timeout | null = null;

  constructor(apiUrl: string, gpuId: string) {
    this.gpuId = gpuId;
    this.socket = io(apiUrl, {
      transports: ['websocket'],
      auth: {
        gpuId,
      },
    });

    this.socket.on('connect', () => {
      console.log('Connected to platform');
      this.startReporting();
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from platform');
      this.stopReporting();
    });
  }

  private async getGPUMetrics(): Promise<GPUMetric> {
    try {
      const gpu = await si.graphics();
      
      // Get first GPU (in production, you'd filter by specific GPU)
      const gpuData = gpu.controllers[0];
      
      return {
        utilization: gpuData.utilizationGpu || 0,
        temperature: gpuData.temperatureGpu || 0,
        vramUsedGB: (gpuData.memoryUsed || 0) / 1024, // Convert MB to GB
        powerDrawW: gpuData.powerDraw || undefined,
      };
    } catch (err) {
      console.error('Failed to get GPU metrics:', err);
      return {
        utilization: 0,
        temperature: 0,
        vramUsedGB: 0,
      };
    }
  }

  private async reportMetrics() {
    const metrics = await this.getGPUMetrics();
    
    this.socket.emit('gpu:metrics', {
      gpuId: this.gpuId,
      ...metrics,
      timestamp: new Date().toISOString(),
    });
  }

  private startReporting() {
    if (this.interval) return;
    
    // Report every 5 seconds
    this.interval = setInterval(() => {
      this.reportMetrics();
    }, 5000);
  }

  private stopReporting() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}

export default GPUReporter;
