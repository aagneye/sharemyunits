import GPUReporter from './gpu-reporter';
import VMExecutor from './vm-executor';
import FirewallManager from './firewall-manager';
import HealthCheck from './health-check';
import { io, Socket } from 'socket.io-client';

const API_URL = process.env.API_URL || 'http://localhost:3001';
const GPU_ID = process.env.GPU_ID || '';

if (!GPU_ID) {
  console.error('GPU_ID environment variable is required');
  process.exit(1);
}

const socket: Socket = io(API_URL, {
  transports: ['websocket'],
  auth: {
    gpuId: GPU_ID,
    type: 'agent',
  },
});

const gpuReporter = new GPUReporter(API_URL, GPU_ID);
const vmExecutor = new VMExecutor();
const firewallManager = new FirewallManager();
const healthCheck = new HealthCheck();

socket.on('connect', () => {
  console.log('Agent connected to platform');
});

socket.on('vm:command', async (command: any) => {
  console.log('Received VM command:', command);
  const result = await vmExecutor.executeCommand(command);
  socket.emit('vm:result', { commandId: command.id, ...result });
});

// Periodic health checks
setInterval(async () => {
  const health = await healthCheck.checkHealth();
  socket.emit('health:status', { gpuId: GPU_ID, ...health });
}, 30000); // Every 30 seconds

console.log('GPU Agent started');
