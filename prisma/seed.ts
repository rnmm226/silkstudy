import { PrismaClient, BudgetPeriod, BudgetScope, CoverageScope, CoverageType, DeadlineType, EligibilityResult, OpportunityStatus, OpportunityType, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding DEMO catalog and baseline profile data...');

  await prisma.factSource.deleteMany();
  await prisma.source.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.helpRequest.deleteMany();
  await prisma.document.deleteMany();
  await prisma.application.deleteMany();
  await prisma.matchExplanation.deleteMany();
  await prisma.matchResult.deleteMany();
  await prisma.fitScore.deleteMany();
  await prisma.eligibilityEvaluation.deleteMany();
  await prisma.eligibilityRuleVersion.deleteMany();
  await prisma.eligibilityRule.deleteMany();
  await prisma.deadline.deleteMany();
  await prisma.applicationCycle.deleteMany();
  await prisma.scholarshipDetail.deleteMany();
  await prisma.programDetail.deleteMany();
  await prisma.opportunity.deleteMany();
  await prisma.university.deleteMany();
  await prisma.studentBudget.deleteMany();
  await prisma.studentPreference.deleteMany();
  await prisma.academicRecord.deleteMany();
  await prisma.student.deleteMany();
  await prisma.user.deleteMany();

  const sourceA = await prisma.source.create({
    data: {
      url: 'https://example.com/demo/scholarship-official',
      title: 'DEMO Official Scholarship Page',
      publisher: 'DEMO Publisher',
      sourceType: 'OFFICIAL_DEMO',
      verificationStatus: 'VERIFIED',
      verifiedAt: new Date('2025-01-15T00:00:00.000Z')
    }
  });

  const sourceB = await prisma.source.create({
    data: {
      url: 'https://example.com/demo/scholarship-admission',
      title: 'DEMO Admission Portal',
      publisher: 'DEMO Portal',
      sourceType: 'PORTAL_DEMO',
      verificationStatus: 'VERIFIED',
      verifiedAt: new Date('2025-01-18T00:00:00.000Z')
    }
  });

  const generalSource = await prisma.source.create({
    data: {
      url: 'https://example.com/demo/eligibility-policy',
      title: 'DEMO Eligibility Guidance',
      publisher: 'DEMO Policy Team',
      sourceType: 'POLICY_DEMO',
      verificationStatus: 'VERIFIED',
      verifiedAt: new Date('2025-01-20T00:00:00.000Z')
    }
  });

  const userA = await prisma.user.create({
    data: {
      email: 'student.complete@example.com',
      role: UserRole.STUDENT
    }
  });

  const userB = await prisma.user.create({
    data: {
      email: 'student.missing@example.com',
      role: UserRole.STUDENT
    }
  });

  const studentComplete = await prisma.student.create({
    data: {
      userId: userA.id,
      firstName: 'Amina',
      lastName: 'Benali',
      dateOfBirth: new Date('2002-05-14T00:00:00.000Z'),
      nationality: 'TUNISIAN',
      currentCountry: 'Tunisia',
      phone: '+21622123456'
    }
  });

  const studentMissing = await prisma.student.create({
    data: {
      userId: userB.id,
      firstName: 'Youssef',
      lastName: 'Messaoud',
      nationality: 'TUNISIAN',
      currentCountry: 'Tunisia'
    }
  });

  await prisma.academicRecord.create({
    data: {
      studentId: studentComplete.id,
      institutionName: 'Université de Tunis El Manar',
      degreeLevel: 'Bachelor',
      fieldOfStudy: 'Computer Science',
      gradeValue: 3.8,
      gradeScale: 4,
      startDate: new Date('2019-09-01T00:00:00.000Z'),
      endDate: new Date('2023-06-30T00:00:00.000Z')
    }
  });

  await prisma.studentPreference.create({
    data: {
      studentId: studentComplete.id,
      targetDegreeLevel: 'Master',
      fieldsOfInterest: ['Computer Science', 'Artificial Intelligence'],
      preferredCountries: ['France', 'Italy'],
      preferredLanguages: ['English', 'French'],
      studyModes: ['FULL_TIME', 'HYBRID']
    }
  });

  await prisma.studentBudget.create({
    data: {
      studentId: studentComplete.id,
      amount: 6000,
      currency: 'EUR',
      period: BudgetPeriod.YEARLY,
      scope: BudgetScope.TOTAL_COST
    }
  });

  await prisma.studentPreference.create({
    data: {
      studentId: studentMissing.id,
      targetDegreeLevel: 'Master',
      fieldsOfInterest: ['Data Science'],
      preferredCountries: ['France'],
      preferredLanguages: ['English'],
      studyModes: ['FULL_TIME']
    }
  });

  const university = await prisma.university.create({
    data: {
      nameI18n: 'DEMO Institute of Technology',
      country: 'France',
      city: 'Paris',
      websiteUrl: 'https://example.com/demo-university',
      descriptionI18n: 'DEMO university data only; not an official catalog source.',
      status: 'PUBLISHED'
    }
  });

  const fullFundedScholarship = await prisma.opportunity.create({
    data: {
      type: OpportunityType.SCHOLARSHIP,
      universityId: university.id,
      nameI18n: 'DEMO Full Tuition + Living Scholarship',
      descriptionI18n: 'DEMO scholarship record illustrating FULL tuition and FULL living coverage.',
      status: OpportunityStatus.PUBLISHED
    }
  });

  const fullTuitionOnlyScholarship = await prisma.opportunity.create({
    data: {
      type: OpportunityType.SCHOLARSHIP,
      universityId: university.id,
      nameI18n: 'DEMO Full Tuition Only Scholarship',
      descriptionI18n: 'DEMO scholarship with FULL tuition but NO living support.',
      status: OpportunityStatus.PUBLISHED
    }
  });

  const partialTuitionScholarship = await prisma.opportunity.create({
    data: {
      type: OpportunityType.SCHOLARSHIP,
      universityId: university.id,
      nameI18n: 'DEMO Partial Tuition Scholarship',
      descriptionI18n: 'DEMO scholarship with PARTIAL tuition support.',
      status: OpportunityStatus.PUBLISHED
    }
  });

  const livingOnlyScholarship = await prisma.opportunity.create({
    data: {
      type: OpportunityType.SCHOLARSHIP,
      universityId: university.id,
      nameI18n: 'DEMO Living Support Scholarship',
      descriptionI18n: 'DEMO scholarship providing living support only.',
      status: OpportunityStatus.PUBLISHED
    }
  });

  const unknownCoverageScholarship = await prisma.opportunity.create({
    data: {
      type: OpportunityType.SCHOLARSHIP,
      universityId: university.id,
      nameI18n: 'DEMO Unknown Coverage Scholarship',
      descriptionI18n: 'DEMO scholarship with UNKNOWN coverage status pending verification.',
      status: OpportunityStatus.PUBLISHED
    }
  });

  const programOpportunity = await prisma.opportunity.create({
    data: {
      type: OpportunityType.PROGRAM,
      universityId: university.id,
      nameI18n: 'DEMO MSc in AI',
      descriptionI18n: 'DEMO program used for testing catalog matching.',
      status: OpportunityStatus.PUBLISHED
    }
  });

  const scholarshipDetailA = await prisma.scholarshipDetail.create({
    data: {
      opportunityId: fullFundedScholarship.id,
      tuitionCoverageType: CoverageType.FULL,
      livingCoverageType: CoverageType.FULL,
      accommodationCoverageType: CoverageType.FULL,
      transportCoverageType: CoverageType.PARTIAL,
      insuranceCoverageType: CoverageType.FULL,
      visaCoverageType: CoverageType.UNKNOWN,
      applicationFeeCoverageType: CoverageType.NONE,
      monthlyStipendAmount: 1200,
      monthlyStipendCurrency: 'EUR',
      oneTimeFundingAmount: 3000,
      oneTimeFundingCurrency: 'EUR',
      coverageScope: CoverageScope.FULL,
      fundingBody: 'DEMO Scholarship Fund',
      renewable: true
    }
  });

  const scholarshipDetailB = await prisma.scholarshipDetail.create({
    data: {
      opportunityId: fullTuitionOnlyScholarship.id,
      tuitionCoverageType: CoverageType.FULL,
      livingCoverageType: CoverageType.NONE,
      accommodationCoverageType: CoverageType.NONE,
      transportCoverageType: CoverageType.NONE,
      insuranceCoverageType: CoverageType.NONE,
      visaCoverageType: CoverageType.NONE,
      applicationFeeCoverageType: CoverageType.NONE,
      monthlyStipendAmount: null,
      monthlyStipendCurrency: null,
      oneTimeFundingAmount: null,
      oneTimeFundingCurrency: null,
      coverageScope: CoverageScope.PARTIAL,
      fundingBody: 'DEMO Funding Office',
      renewable: false
    }
  });

  const scholarshipDetailC = await prisma.scholarshipDetail.create({
    data: {
      opportunityId: partialTuitionScholarship.id,
      tuitionCoverageType: CoverageType.PARTIAL,
      livingCoverageType: CoverageType.NONE,
      accommodationCoverageType: CoverageType.NONE,
      transportCoverageType: CoverageType.NONE,
      insuranceCoverageType: CoverageType.NONE,
      visaCoverageType: CoverageType.NONE,
      applicationFeeCoverageType: CoverageType.NONE,
      monthlyStipendAmount: null,
      monthlyStipendCurrency: null,
      oneTimeFundingAmount: null,
      oneTimeFundingCurrency: null,
      coverageScope: CoverageScope.PARTIAL,
      fundingBody: 'DEMO Sponsor',
      renewable: true
    }
  });

  const scholarshipDetailD = await prisma.scholarshipDetail.create({
    data: {
      opportunityId: livingOnlyScholarship.id,
      tuitionCoverageType: CoverageType.NONE,
      livingCoverageType: CoverageType.FULL,
      accommodationCoverageType: CoverageType.FULL,
      transportCoverageType: CoverageType.NONE,
      insuranceCoverageType: CoverageType.NONE,
      visaCoverageType: CoverageType.NONE,
      applicationFeeCoverageType: CoverageType.NONE,
      monthlyStipendAmount: 850,
      monthlyStipendCurrency: 'EUR',
      oneTimeFundingAmount: null,
      oneTimeFundingCurrency: null,
      coverageScope: CoverageScope.PARTIAL,
      fundingBody: 'DEMO Living Support Office',
      renewable: true
    }
  });

  const scholarshipDetailE = await prisma.scholarshipDetail.create({
    data: {
      opportunityId: unknownCoverageScholarship.id,
      tuitionCoverageType: CoverageType.UNKNOWN,
      livingCoverageType: CoverageType.UNKNOWN,
      accommodationCoverageType: CoverageType.UNKNOWN,
      transportCoverageType: CoverageType.UNKNOWN,
      insuranceCoverageType: CoverageType.UNKNOWN,
      visaCoverageType: CoverageType.UNKNOWN,
      applicationFeeCoverageType: CoverageType.UNKNOWN,
      monthlyStipendAmount: null,
      monthlyStipendCurrency: null,
      oneTimeFundingAmount: null,
      oneTimeFundingCurrency: null,
      coverageScope: CoverageScope.UNKNOWN,
      fundingBody: 'DEMO Review Pending',
      renewable: null
    }
  });

  await prisma.programDetail.create({
    data: {
      opportunityId: programOpportunity.id,
      degreeLevel: 'Master',
      fieldOfStudy: 'Artificial Intelligence',
      languagesOfInstruction: ['English'],
      durationMonths: 24,
      studyMode: 'FULL_TIME'
    }
  });

  const firstCycle = await prisma.applicationCycle.create({
    data: {
      opportunityId: fullFundedScholarship.id,
      name: '2026 Intake',
      academicYear: '2026',
      term: 'Fall',
      opensAt: new Date('2025-09-01T00:00:00.000Z'),
      closesAt: new Date('2025-12-15T00:00:00.000Z'),
      status: 'OPEN'
    }
  });

  const secondCycle = await prisma.applicationCycle.create({
    data: {
      opportunityId: fullFundedScholarship.id,
      name: '2027 Intake',
      academicYear: '2027',
      term: 'Fall',
      opensAt: new Date('2026-09-01T00:00:00.000Z'),
      closesAt: new Date('2026-12-15T00:00:00.000Z'),
      status: 'DRAFT'
    }
  });

  await prisma.deadline.create({
    data: {
      applicationCycleId: firstCycle.id,
      type: DeadlineType.APPLICATION,
      dueAt: new Date('2025-12-15T23:59:00.000Z'),
      timezone: 'Europe/Paris',
      sourceId: sourceA.id,
      verificationStatus: 'VERIFIED',
      verifiedAt: new Date('2025-01-15T00:00:00.000Z')
    }
  });

  await prisma.deadline.create({
    data: {
      applicationCycleId: secondCycle.id,
      type: DeadlineType.APPLICATION,
      dueAt: new Date('2026-12-15T23:59:00.000Z'),
      timezone: 'Europe/Paris',
      sourceId: sourceB.id,
      verificationStatus: 'VERIFIED',
      verifiedAt: new Date('2025-01-18T00:00:00.000Z')
    }
  });

  await prisma.factSource.createMany({
    data: [
      { sourceId: sourceA.id, entityType: 'scholarship_detail', entityId: scholarshipDetailA.id, factKey: 'tuition_coverage_type' },
      { sourceId: sourceB.id, entityType: 'scholarship_detail', entityId: scholarshipDetailA.id, factKey: 'tuition_coverage_type' },
      { sourceId: sourceA.id, entityType: 'scholarship_detail', entityId: scholarshipDetailA.id, factKey: 'living_coverage_type' },
      { sourceId: sourceB.id, entityType: 'scholarship_detail', entityId: scholarshipDetailA.id, factKey: 'living_coverage_type' }
    ]
  });

  const eligibilityRule = await prisma.eligibilityRule.create({
    data: {
      opportunityId: fullFundedScholarship.id,
      activeVersionId: null
    }
  });

  const ruleVersion = await prisma.eligibilityRuleVersion.create({
    data: {
      eligibilityRuleId: eligibilityRule.id,
      versionNumber: 1,
      schemaVersion: '1',
      conditions: {
        schema_version: '1',
        operator: 'AND',
        conditions: [
          {
            field: 'student.nationality',
            operator: 'IN',
            value: ['TUNISIAN', 'FRENCH']
          },
          {
            field: 'student.degree_level',
            operator: 'EQ',
            value: 'Bachelor'
          },
          {
            field: 'student.gpa',
            operator: 'GTE',
            value: 3.0
          }
        ]
      },
      sourceId: generalSource.id,
      publishedAt: new Date('2025-02-01T00:00:00.000Z')
    }
  });

  await prisma.eligibilityRule.update({
    where: { id: eligibilityRule.id },
    data: { activeVersionId: ruleVersion.id }
  });

  const matchedEligible = await prisma.eligibilityEvaluation.create({
    data: {
      studentId: studentComplete.id,
      eligibilityRuleVersionId: ruleVersion.id,
      result: EligibilityResult.ELIGIBLE,
      reasons: [{ result: 'PASS', field: 'student.nationality', message: 'Student nationality accepted.' }],
      profileSnapshotHash: 'demo-complete-profile-hash'
    }
  });

  const matchedIneligible = await prisma.eligibilityEvaluation.create({
    data: {
      studentId: studentMissing.id,
      eligibilityRuleVersionId: ruleVersion.id,
      result: EligibilityResult.INELIGIBLE,
      reasons: [{ result: 'FAIL', field: 'student.gpa', message: 'Missing GPA prevents eligibility determination.' }],
      profileSnapshotHash: 'demo-missing-profile-hash'
    }
  });

  const unknownEvaluation = await prisma.eligibilityEvaluation.create({
    data: {
      studentId: studentMissing.id,
      eligibilityRuleVersionId: ruleVersion.id,
      result: EligibilityResult.UNKNOWN,
      reasons: [{ result: 'UNKNOWN', field: 'student.gpa', message: 'GPA missing; result is UNKNOWN.' }],
      profileSnapshotHash: 'demo-unknown-profile-hash'
    }
  });

  const fitScore = await prisma.fitScore.create({
    data: {
      studentId: studentComplete.id,
      opportunityId: fullFundedScholarship.id,
      eligibilityEvaluationId: matchedEligible.id,
      totalScore: 92.5,
      components: { budget: 25, fieldMatch: 20, language: 15, country: 12, funding: 20.5 }
    }
  });

  await prisma.matchResult.create({
    data: {
      studentId: studentComplete.id,
      opportunityId: fullFundedScholarship.id,
      eligibilityEvaluationId: matchedEligible.id,
      fitScoreId: fitScore.id,
      rank: 1,
      reasons: [{ factor: 'FULL funding', contribution: 20.5, value: 'strong match' }]
    }
  });

  await prisma.application.create({
    data: {
      studentId: studentComplete.id,
      opportunityId: fullFundedScholarship.id,
      applicationCycleId: firstCycle.id,
      status: 'DRAFT',
      notes: 'DEMO application created for testing.'
    }
  });

  await prisma.notification.create({
    data: {
      userId: userA.id,
      type: 'DEADLINE_REMINDER',
      relatedDeadlineId: null,
      relatedApplicationId: null,
      channel: 'EMAIL',
      status: 'PENDING',
      scheduledFor: new Date('2025-12-10T09:00:00.000Z')
    }
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: userA.id,
      action: 'DEMO_SEED',
      entityType: 'opportunity',
      entityId: fullFundedScholarship.id,
      reason: 'Development demo data created by seed script.',
      metadata: { note: 'DEMO only; not official.' }
    }
  });

  console.log('Seed complete. Created demo users, scholarships, cycles, deadlines, provenance, evaluation examples, and a base profile set.');
  console.log('Demo coverage cases include FULL tuition + FULL living, FULL tuition only, PARTIAL tuition, living only, and UNKNOWN coverage.');
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
