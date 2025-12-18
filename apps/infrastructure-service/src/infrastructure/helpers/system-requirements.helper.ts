import { type ServerInfo } from "@axion/contracts";

export type SystemRequirementsInput = {
  services: number;
  averageCpuCores?: number;
  averageMemoryMb?: number;
  averageDiskGb?: number;
  replicas?: number;
  overheadPercent?: number;
  serverInfo?: ServerInfo;
};

export type SystemRequirementsResult = {
  requiredCpuCores: number;
  requiredMemoryMb: number;
  requiredDiskGb: number;
  recommendedServers: number;
  fitsCurrentServer?: boolean;
  headroomPercent?: number;
  notes: string[];
};

const BYTES_IN_MB = 1024 * 1024;

/**
 * Простая оценка системных требований проекта.
 * Использует усредненные показатели на сервис и коэффициент overhead.
 */
export function calculateSystemRequirements(
  input: SystemRequirementsInput
): SystemRequirementsResult {
  const services = Math.max(1, input.services);
  const replicas = Math.max(1, input.replicas ?? 1);
  const overhead = Math.max(0, input.overheadPercent ?? 0.2); // 20% запас по умолчанию

  const avgCpu = Math.max(0.1, input.averageCpuCores ?? 0.5); // cores per service
  const avgMem = Math.max(64, input.averageMemoryMb ?? 512); // MB per service
  const avgDisk = Math.max(256, input.averageDiskGb ?? 1024); // MB per service

  const totalUnits = services * replicas;
  const cpuBase = totalUnits * avgCpu;
  const memBase = totalUnits * avgMem;
  const diskBase = totalUnits * avgDisk;

  const requiredCpuCores = round(cpuBase * (1 + overhead), 2);
  const requiredMemoryMb = round(memBase * (1 + overhead), 0);
  const requiredDiskGb = round(diskBase * (1 + overhead), 0);

  const notes: string[] = [];

  let fitsCurrentServer: boolean | undefined;
  let headroomPercent: number | undefined;
  let recommendedServers = 1;

  if (input.serverInfo) {
    const availableCpu = input.serverInfo.cpuCores || 0;
    const availableMemMb =
      (input.serverInfo.availableMemory || 0) / BYTES_IN_MB;

    if (availableCpu <= 0 || availableMemMb <= 0) {
      notes.push(
        "Server info is missing CPU or memory details; fit check skipped."
      );
    } else {
      const cpuHeadroom = availableCpu - requiredCpuCores;
      const memHeadroom = availableMemMb - requiredMemoryMb;

      fitsCurrentServer = cpuHeadroom >= 0 && memHeadroom >= 0;
      headroomPercent = Math.min(
        cpuHeadroom / Math.max(requiredCpuCores, 1),
        memHeadroom / Math.max(requiredMemoryMb, 1)
      );

      // Подсказка сколько серверов потребуется при равномерном распределении
      const cpuServers = Math.ceil(
        requiredCpuCores / Math.max(availableCpu, 0.1)
      );
      const memServers = Math.ceil(
        requiredMemoryMb / Math.max(availableMemMb, 1)
      );
      recommendedServers = Math.max(cpuServers, memServers);
    }

    if (!input.serverInfo.dockerInstalled) {
      notes.push(
        "Docker is not installed; install before scheduling workloads."
      );
    }
  } else {
    recommendedServers = Math.ceil((totalUnits * avgCpu) / 4); // грубая оценка при отсутствии данных
    notes.push(
      "Server info not provided; recommendations use default capacity (4 cores/server)."
    );
  }

  return {
    requiredCpuCores,
    requiredMemoryMb,
    requiredDiskGb,
    recommendedServers,
    fitsCurrentServer,
    headroomPercent,
    notes,
  };
}

function round(value: number, precision: number) {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}







