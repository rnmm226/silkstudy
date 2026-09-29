import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/src/modules/auth/auth.config';
import { redirect } from 'next/navigation';
import { db } from '@/src/infrastructure/database';
import ProfileClient from './profile-client';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'My Profile' };

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/auth/login');

  const student = await db.student.findFirst({
    where: { userId: session.user.id, deletedAt: null },
    select: {
      id: true, firstName: true, lastName: true,
      dateOfBirth: true, nationality: true, currentCountry: true, phone: true,
    },
  });

  const [academicRecords, preferences, budget] = await Promise.all([
    student
      ? db.academicRecord.findMany({
          where: { studentId: student.id },
          orderBy: { startDate: 'desc' },
        })
      : [],
    student
      ? db.studentPreference.findFirst({ where: { studentId: student.id } })
      : null,
    student
      ? db.studentBudget.findFirst({ where: { studentId: student.id } })
      : null,
  ]);

  return (
    <ProfileClient
      student={student
        ? {
            ...student,
            dateOfBirth: student.dateOfBirth?.toISOString() ?? null,
          }
        : null}
      academicRecords={academicRecords.map((r) => ({
        ...r,
        gradeValue: r.gradeValue ?? null,
        gradeScale: r.gradeScale ?? null,
        startDate: r.startDate?.toISOString() ?? null,
        endDate: r.endDate?.toISOString() ?? null,
      }))}
      preferences={preferences
        ? {
            targetDegreeLevel: preferences.targetDegreeLevel,
            fieldsOfInterest: preferences.fieldsOfInterest,
            preferredCountries: preferences.preferredCountries,
            preferredLanguages: preferences.preferredLanguages,
            studyModes: preferences.studyModes,
          }
        : null}
      budget={budget
        ? {
            amount: Number(budget.amount),
            currency: budget.currency,
            period: budget.period,
            scope: budget.scope,
          }
        : null}
    />
  );
}
