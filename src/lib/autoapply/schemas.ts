import { z } from "zod";

export const APPLICATION_STATUSES = [
  "queued",
  "applied",
  "failed",
  "needs_review",
  "skipped",
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_RE = /^https?:\/\/\S+$/i;

function optionalEmailSchema() {
  return z
    .string()
    .max(320)
    .optional()
    .nullable()
    .transform((v) => (v?.trim() ? v.trim() : null))
    .refine((v) => v === null || EMAIL_RE.test(v), "Invalid email");
}

function optionalUrlSchema(max: number) {
  return z
    .string()
    .max(max)
    .optional()
    .nullable()
    .transform((v) => (v?.trim() ? v.trim() : null))
    .refine((v) => v === null || URL_RE.test(v), "Invalid URL");
}

export const ProfileUpdateSchema = z.object({
  fullName: z.string().max(200).optional().nullable(),
  email: optionalEmailSchema(),
  phone: z.string().max(50).optional().nullable(),
  location: z.string().max(200).optional().nullable(),
  linkedinUrl: optionalUrlSchema(500),
  currentTitle: z.string().max(200).optional().nullable(),
  yearsExperience: z.number().int().min(0).max(80).optional().nullable(),
  resumeUrl: optionalUrlSchema(2000),
  defaultAnswers: z.record(z.string(), z.string()).optional(),
});

export type ProfileUpdate = z.infer<typeof ProfileUpdateSchema>;

export const ApplicationCreateSchema = z.object({
  source: z.string().max(50).default("linkedin"),
  externalJobId: z.string().max(200).optional().nullable(),
  jobTitle: z.string().min(1).max(500),
  company: z.string().min(1).max(300),
  location: z.string().max(300).optional().nullable(),
  jobUrl: z
    .string()
    .max(2000)
    .optional()
    .nullable()
    .transform((v) => (v?.trim() ? v.trim() : null)),
  status: z.enum(APPLICATION_STATUSES),
  errorMessage: z.string().max(2000).optional().nullable(),
  appliedAt: z
    .string()
    .refine((v) => !Number.isNaN(Date.parse(v)), "Invalid datetime")
    .optional()
    .nullable(),
  screeningAnswers: z.record(z.string(), z.string()).optional().nullable(),
});

export type ApplicationCreate = z.infer<typeof ApplicationCreateSchema>;

export const ApplicationPatchSchema = z.object({
  status: z.enum(APPLICATION_STATUSES).optional(),
  errorMessage: z.string().max(2000).optional().nullable(),
  appliedAt: z
    .string()
    .refine((v) => !Number.isNaN(Date.parse(v)), "Invalid datetime")
    .optional()
    .nullable(),
  screeningAnswers: z.record(z.string(), z.string()).optional().nullable(),
});

export type ApplicationPatch = z.infer<typeof ApplicationPatchSchema>;

export const TokenIssueSchema = z.object({
  name: z.string().min(1).max(100).default("Extension"),
});

export type AutoApplyProfileRow = {
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  linkedin_url: string | null;
  current_title: string | null;
  years_experience: number | null;
  resume_url: string | null;
  default_answers: Record<string, string>;
  created_at: string;
  updated_at: string;
};

export type AutoApplyTokenRow = {
  id: string;
  user_id: string;
  token_hash: string;
  name: string;
  last_used_at: string | null;
  revoked_at: string | null;
  created_at: string;
};

export type AutoApplyApplicationRow = {
  id: string;
  user_id: string;
  source: string;
  external_job_id: string | null;
  job_title: string;
  company: string;
  location: string | null;
  job_url: string | null;
  status: ApplicationStatus;
  error_message: string | null;
  applied_at: string | null;
  screening_answers: Record<string, string> | null;
  created_at: string;
};

export function profileRowToApi(row: AutoApplyProfileRow | null) {
  if (!row) return null;
  return {
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    location: row.location,
    linkedinUrl: row.linkedin_url,
    currentTitle: row.current_title,
    yearsExperience: row.years_experience,
    resumeUrl: row.resume_url,
    defaultAnswers: row.default_answers ?? {},
    updatedAt: row.updated_at,
  };
}

export function applicationRowToApi(row: AutoApplyApplicationRow) {
  return {
    id: row.id,
    source: row.source,
    externalJobId: row.external_job_id,
    jobTitle: row.job_title,
    company: row.company,
    location: row.location,
    jobUrl: row.job_url,
    status: row.status,
    errorMessage: row.error_message,
    appliedAt: row.applied_at,
    screeningAnswers: row.screening_answers,
    createdAt: row.created_at,
  };
}
