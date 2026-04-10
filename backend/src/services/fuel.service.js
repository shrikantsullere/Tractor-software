import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const addFuelLog = async (operatorId, data) => {
  const { liters, cost, station, receiptUrl, tractorId } = data;

  if (!liters || liters <= 0) throw new Error("Invalid liters amount");
  if (!cost || cost <= 0) throw new Error("Invalid cost amount");
  if (!station) throw new Error("Station name is required");

  return await prisma.fuelLog.create({
    data: {
      operatorId,
      tractorId: tractorId ? parseInt(tractorId) : null,
      liters: parseFloat(liters),
      cost: parseFloat(cost),
      station,
      receiptUrl
    }
  });
};

export const getFuelHistory = async (operatorId) => {
  return await prisma.fuelLog.findMany({
    where: { operatorId },
    orderBy: { createdAt: 'desc' }
  });
};

export const getFuelSummary = async (operatorId) => {
  const logs = await prisma.fuelLog.findMany({
    where: { operatorId }
  });

  const total_cost = logs.reduce((sum, log) => sum + log.cost, 0);
  const total_liters = logs.reduce((sum, log) => sum + log.liters, 0);

  return {
    total_cost,
    total_liters
  };
};
