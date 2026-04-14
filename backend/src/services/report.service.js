import prisma from '../config/db.js';

/**
 * Helper to get start date based on range
 */
const getStartDate = (range) => {
  const now = new Date();
  const startDate = new Date();
  if (range === '1y') {
    startDate.setFullYear(now.getFullYear() - 1);
  } else if (range === '30d') {
    startDate.setDate(now.getDate() - 30);
  } else {
    startDate.setDate(now.getDate() - 7);
  }
  return startDate;
};

/**
 * Get revenue report based on time range
 */
export const getRevenueReport = async (range = '7d') => {
  const startDate = getStartDate(range);

  const payments = await prisma.payment.findMany({
    where: {
      createdAt: { gte: startDate },
      status: 'full' 
    },
    select: {
      amount: true,
      createdAt: true
    },
    orderBy: { createdAt: 'asc' }
  });

  const totals = new Map();
  
  payments.forEach(p => {
    const date = new Date(p.createdAt);
    let label = '';
    
    if (range === '1y') {
      label = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date);
    } else if (range === '30d') {
      label = `${date.getDate()} ${new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date)}`;
    } else {
      label = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date);
    }

    totals.set(label, (totals.get(label) || 0) + p.amount);
  });

  return {
    labels: Array.from(totals.keys()),
    data: Array.from(totals.values())
  };
};

/**
 * Get service usage distribution
 */
export const getServiceUsageReport = async (range = '7d') => {
  const startDate = getStartDate(range);

  const result = await prisma.booking.groupBy({
    by: ['serviceId'],
    where: {
      createdAt: { gte: startDate }
    },
    _count: {
      id: true
    }
  });

  const services = await prisma.service.findMany({
    select: { id: true, name: true }
  });

  return result.map(u => {
    const service = services.find(s => s.id === u.serviceId);
    return {
      service: service ? service.name : 'Unknown',
      count: u._count.id
    };
  });
};

/**
 * Get bookings analytics (Total vs Completed)
 */
export const getBookingsAnalytics = async (range = '7d') => {
  const startDate = getStartDate(range);

  const bookings = await prisma.booking.findMany({
    where: { createdAt: { gte: startDate } },
    select: { status: true, createdAt: true }
  });

  const analytics = new Map();

  bookings.forEach(b => {
    const date = new Date(b.createdAt);
    let label = range === '1y' 
      ? new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date)
      : range === '30d' 
        ? `${date.getDate()} ${new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date)}`
        : new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date);

    if (!analytics.has(label)) {
      analytics.set(label, { total: 0, completed: 0 });
    }
    const current = analytics.get(label);
    current.total += 1;
    if (b.status === 'completed') current.completed += 1;
  });

  return {
    labels: Array.from(analytics.keys()),
    total: Array.from(analytics.values()).map(v => v.total),
    completed: Array.from(analytics.values()).map(v => v.completed)
  };
};

/**
 * Get operator performance report
 */
export const getOperatorPerformance = async (range = '7d') => {
  const startDate = getStartDate(range);

  const performance = await prisma.booking.groupBy({
    by: ['operatorId'],
    where: {
      status: 'completed',
      createdAt: { gte: startDate },
      operatorId: { not: null }
    },
    _count: {
      id: true
    }
  });

  const operatorIds = performance.map(p => p.operatorId);
  const operators = await prisma.user.findMany({
    where: { id: { in: operatorIds } },
    select: { id: true, name: true }
  });

  return performance.map(p => ({
    name: operators.find(o => o.id === p.operatorId)?.name || 'Unknown',
    completedJobs: p._count.id
  })).sort((a, b) => b.completedJobs - a.completedJobs).slice(0, 5);
};

/**
 * Get job status distribution
 */
export const getJobStatusDistribution = async (range = '7d') => {
  const startDate = getStartDate(range);

  const result = await prisma.booking.groupBy({
    by: ['status'],
    where: {
      createdAt: { gte: startDate }
    },
    _count: {
      id: true
    }
  });

  return result.map(r => ({
    status: r.status,
    count: r._count.id
  }));
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
 * Get farmer growth (registrations) per period
 */
export const getFarmerGrowthReport = async (range = '7d') => {
  const startDate = getStartDate(range);

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
    const date = new Date(f.createdAt);
    const label = range === '1y' 
      ? new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date)
      : range === '30d' 
        ? `${date.getDate()} ${new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date)}`
        : new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date);

    growth.set(label, (growth.get(label) || 0) + 1);
  });

  return {
    labels: Array.from(growth.keys()),
    data: Array.from(growth.values())
  };
};

/**
 * Get raw data for export
 */
export const getExportData = async (range = '7d') => {
  const startDate = getStartDate(range);

  const [bookings, payments, operators] = await Promise.all([
    prisma.booking.findMany({
      where: { createdAt: { gte: startDate } },
      include: { farmer: { select: { name: true } }, service: { select: { name: true } } }
    }),
    prisma.payment.findMany({
      where: { createdAt: { gte: startDate } },
      include: { booking: { select: { id: true, farmerId: true } } }
    }),
    prisma.user.findMany({
      where: { role: 'operator' },
      select: { id: true, name: true, phone: true, createdAt: true, operatorBookings: { where: { status: 'completed' } } }
    })
  ]);

  return {
    bookings: bookings.map(b => ({
      id: b.id,
      farmer: b.farmer.name,
      service: b.service.name,
      totalPrice: b.totalPrice,
      status: b.status,
      date: b.createdAt
    })),
    revenue: payments.map(p => ({
      id: p.id,
      bookingId: p.bookingId,
      amount: p.amount,
      method: p.method,
      date: p.createdAt
    })),
    operators: operators.map(o => ({
      id: o.id,
      name: o.name,
      phone: o.phone,
      completedJobs: o.operatorBookings.length,
      joined: o.createdAt
    }))
  };
};
