import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { handleApiError } from '@/lib/api-response';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    const [
      totalUsers,
      totalStudents,
      totalCourses,
      publishedCourses,
      totalEnrollments,
      completedEnrollments,
      totalCertificates,
      payments
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.course.count(),
      prisma.course.count({ where: { published: true } }),
      prisma.enrollment.count(),
      prisma.enrollment.count({ where: { completed: true } }),
      prisma.certificate.count(),
      prisma.payment.findMany({ where: { status: 'SUCCESS' }, select: { amount: true, createdAt: true } })
    ]) as [number, number, number, number, number, number, number, { amount: number; createdAt: Date }[]];

    const revenue = payments.reduce((sum: number, p: { amount: number }) => sum + p.amount, 0);

    // Revenue grouped by month for the last 6 months, for a simple chart.
    const now = new Date();
    const months: { label: string; revenue: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleString('en-US', { month: 'short', year: '2-digit' });
      const monthRevenue = payments
        .filter((p: { createdAt: Date }) => p.createdAt.getFullYear() === d.getFullYear() && p.createdAt.getMonth() === d.getMonth())
        .reduce((sum: number, p: { amount: number }) => sum + p.amount, 0);
      months.push({ label, revenue: monthRevenue });
    }

    // Top courses by enrollment.
    const topCourses = await prisma.course.findMany({
      select: { title: true, _count: { select: { enrollments: true } } },
      orderBy: { enrollments: { _count: 'desc' } },
      take: 5
    });

    return NextResponse.json({
      totalUsers,
      totalStudents,
      totalCourses,
      publishedCourses,
      totalEnrollments,
      completedEnrollments,
      totalCertificates,
      totalPayments: payments.length,
      revenue,
      revenueByMonth: months,
      topCourses: topCourses.map((c: { title: string; _count: { enrollments: number } }) => ({
        title: c.title,
        enrollments: c._count.enrollments
      }))
    });
  } catch (err) {
    return handleApiError(err);
  }
}
