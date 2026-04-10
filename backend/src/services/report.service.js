import prisma from '../config/db.js';

/**
 * Get revenue report based on time range
 */
export const getRevenueReport = async (range = '7d') => {
  const now = new Date();
  let startDate = new Date();

  if (range === '1y') {
    startDate.setFullYear(now.getFullYear() - 1);
  } else if (range === '30d') {
    startDate.setDate(now.getDate() - 30);
  } else {
    startDate.setDate(now.getDate() - 7);
  }

  const payments = await prisma.payment.findMany({
    where: {
      createdAt: { gte: startDate },
      status: 'full' // Only paid bookings contribute to revenue
    },
    select: {
      amount: true,
      createdAt: true
    },
    orderBy: { createdAt: 'asc' }
  });

  const totals = new Map();
  
  payments.forEach(p => {
    let label = '';
    const date = new Date(p.createdAt);
    
    if (range === '1y') {
      label = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date);
    } else {
      label = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date);
      if (range === '30d') {
        label = `${date.getDate()} ${new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date)}`;
      }
    }

    if (!totals.has(label)) {
      totals.set(label, 0);
    }
    totals.set(label, totals.get(label) + p.amount);
  });

  return {
    labels: Array.from(totals.keys()),
    data: Array.from(totals.values())
  };
};

/**
 * Get service usage distribution
 */
export const getServiceUsageReport = async () => {
  const result = await prisma.booking.groupBy({
    by: ['serviceId'],
    _count: {
      id: true
    }
  });

  const services = await prisma.service.findMany({
    select: { id: true, name: true }
  });

  const usage = result.map(u => {
    const service = services.find(s => s.id === u.serviceId);
    return {
      service: service ? service.name : 'Unknown',
      count: u._count.id
    };
  });

  return usage;
};

/**
 * Get fleet status and efficiency report
 */
export const getFleetReport = async () => {
  const [total, active, maintenance] = await Promise.all([
    prisma.tractor.count(),
    prisma.tractor.count({ where: { status: 'busy' } }),
    prisma.tractor.count({ where: { status: 'maintenance' } })
  ]);

  const efficiency = total > 0 ? (active / total) * 100 : 0;

  return {
    total,
    active,
    maintenance,
    efficiency: Math.round(efficiency)
  };
};

/**
 * Get farmer growth (registrations) per month
 */
export const getFarmerGrowthReport = async () => {
  const now = new Date();
  const startDate = new Date();
  startDate.setFullYear(now.getFullYear() - 1);

  const farmers = await prisma.user.findMany({
    where: {
      role: 'farmer',
      createdAt: { gte: startDate }
    },
    select: { createdAt: true },
    orderBy: { createdAt: 'asc' }
  });

  const growth = new Map();
  
  farmers.forEach(f => {
    const label = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(new Date(f.createdAt));
    if (!growth.has(label)) {
      growth.set(label, 0);
    }
    growth.set(label, growth.get(label) + 1);
  });

  return {
    labels: Array.from(growth.keys()),
    data: Array.from(growth.values())
  };
};
