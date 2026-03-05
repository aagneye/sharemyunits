export type UserRole = 'BUYER' | 'HOST' | 'ADMIN';

export type GPUStatus = 'AVAILABLE' | 'IN_USE' | 'OFFLINE' | 'MAINTENANCE';

export type VMStatus = 'PROVISIONING' | 'RUNNING' | 'STOPPED' | 'TERMINATED' | 'FAILED';

export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

export type RentalStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED';

export interface User {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface GPU {
  id: string;
  hostId: string;
  name: string;
  model: string;
  vramGB: number;
  cudaCores?: number;
  memoryBandwidth?: number;
  baseClockMHz?: number;
  boostClockMHz?: number;
  pricePerHourUSD: number;
  status: GPUStatus;
  hostIP: string;
  proxmoxNode?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface VM {
  id: string;
  rentalId: string;
  gpuId: string;
  vmName: string;
  vmId?: number;
  ipAddress?: string;
  sshPort: number;
  status: VMStatus;
  provisionedAt?: Date;
  terminatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Rental {
  id: string;
  buyerId: string;
  gpuId: string;
  startTime: Date;
  endTime: Date;
  status: RentalStatus;
  totalCostUSD: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Payment {
  id: string;
  userId: string;
  rentalId?: string;
  stripePaymentId?: string;
  amountUSD: number;
  status: PaymentStatus;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface GPUMetric {
  id: string;
  gpuId: string;
  utilization: number;
  temperature: number;
  vramUsedGB: number;
  powerDrawW?: number;
  timestamp: Date;
}
