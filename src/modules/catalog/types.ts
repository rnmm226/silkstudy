import type {
  Opportunity,
  University,
  ProgramDetail,
  ScholarshipDetail,
  ApplicationCycle,
  Deadline,
  Source,
  FactSource,
  OpportunityStatus,
  OpportunityType,
} from '@prisma/client';

/** Verification statuses used across catalog entities */
export type VerificationStatus =
  | 'VERIFIED'
  | 'NEEDS_REVIEW'
  | 'OUTDATED'
  | 'UNKNOWN';

/** Opportunity with all related catalog data attached */
export type OpportunityFull = Opportunity & {
  university: University | null;
  programDetail: ProgramDetail | null;
  scholarshipDetail: ScholarshipDetail | null;
  applicationCycles: (ApplicationCycle & { deadlines: Deadline[] })[];
};

/** Lightweight opportunity for list views */
export type OpportunityListItem = Pick<
  Opportunity,
  'id' | 'type' | 'nameI18n' | 'descriptionI18n' | 'status' | 'universityId' | 'createdAt' | 'updatedAt'
> & {
  university: Pick<University, 'id' | 'nameI18n' | 'country' | 'city'> | null;
  programDetail: Pick<ProgramDetail, 'degreeLevel' | 'fieldOfStudy' | 'languagesOfInstruction' | 'studyMode'> | null;
  scholarshipDetail: Pick<ScholarshipDetail, 'tuitionCoverageType' | 'livingCoverageType' | 'coverageScope'> | null;
  nextDeadline: { dueAt: Date; timezone: string; verificationStatus: string } | null;
};

export type { Opportunity, University, ProgramDetail, ScholarshipDetail, ApplicationCycle, Deadline, Source, FactSource, OpportunityStatus, OpportunityType };
