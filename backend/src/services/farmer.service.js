import prisma from '../config/db.js';

/**
 * Get aggregated dashboard metrics for the farmer
 */
export const getDashboardMetrics = async (farmerId) => {
  const farmer = await prisma.user.findUnique({
    where: { id: parseInt(farmerId) },
    select: { name: true, location: true }
  });

  if (!farmer) throw new Error("Farmer not found");

  const [activeJobs, totalBookings, paymentsResult] = await Promise.all([
    prisma.booking.count({
      where: { 
        farmerId: parseInt(farmerId),
        status: { in: ['SCHEDULED', 'ASSIGNED', 'IN_PROGRESS'] }
      }
    }),
    prisma.booking.count({
      where: { 
        farmerId: parseInt(farmerId)
      }
    }),
    prisma.payment.aggregate({
      where: {
        booking: { farmerId: parseInt(farmerId) }
      },
      _sum: { amount: true }
    })
  ]);

  return {
    name: farmer.name,
    location: farmer.location || 'Unknown Location',
    active_jobs: activeJobs,
    total_bookings: totalBookings,
    total_paid: paymentsResult._sum.amount || 0
  };
};

/**
 * Get recent activity for the farmer (latest 5 bookings)
 */
export const getRecentActivity = async (farmerId) => {
  const bookings = await prisma.booking.findMany({
    where: { farmerId: parseInt(farmerId) },
    include: {
      service: { select: { name: true } }
    },
    orderBy: { createdAt: 'desc' },
    take: 5
  });

  return bookings.map(b => ({
    service_type: b.service?.name || 'Unknown',
    land_size: b.landSize,
    status: b.status,
    created_at: b.createdAt
  }));
};

/**
 * Get upcoming jobs for the farmer (scheduled or dispatched)
 */
export const getUpcomingJobs = async (farmerId) => {
  const bookings = await prisma.booking.findMany({
    where: { 
      farmerId: parseInt(farmerId),
      status: { in: ['SCHEDULED', 'ASSIGNED'] }
    },
    include: {
      service: { select: { name: true } }
    },
    orderBy: { createdAt: 'asc' }
  });

  return bookings.map(b => ({
    service_type: b.service?.name || 'Unknown',
    date: b.createdAt,
    status: b.status
  }));
};

