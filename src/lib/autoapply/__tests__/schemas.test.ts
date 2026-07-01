import { describe, expect, it } from "vitest";

import {
  ApplicationCreateSchema,
  APPLICATION_STATUSES,
  ProfileUpdateSchema,
} from "@/lib/autoapply/schemas";

describe("ProfileUpdateSchema", () => {
  it("accepts a valid profile payload", () => {
    const result = ProfileUpdateSchema.safeParse({
      fullName: "Ada Lovelace",
      email: "ada@example.com",
      phone: "+1 555 0100",
      location: "London",
      linkedinUrl: "https://www.linkedin.com/in/ada",
      currentTitle: "Engineer",
      yearsExperience: 5,
      resumeUrl: "https://example.com/resume.pdf",
      defaultAnswers: { work_authorization: "Yes" },
    });
    expect(result.success).toBe(true);
  });

  it("accepts an empty object (all fields optional)", () => {
    expect(ProfileUpdateSchema.safeParse({}).success).toBe(true);
  });

  it("normalizes a blank email to null", () => {
    const result = ProfileUpdateSchema.parse({ email: "   " });
    expect(result.email).toBeNull();
  });

  it("rejects an invalid email", () => {
    const result = ProfileUpdateSchema.safeParse({ email: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("rejects out-of-range yearsExperience", () => {
    expect(ProfileUpdateSchema.safeParse({ yearsExperience: 200 }).success).toBe(
      false,
    );
    expect(ProfileUpdateSchema.safeParse({ yearsExperience: -1 }).success).toBe(
      false,
    );
  });
});

describe("ApplicationCreateSchema", () => {
  const base = {
    jobTitle: "Senior Engineer",
    company: "Acme Corp",
    status: "applied" as const,
  };

  it("accepts valid input and defaults source to linkedin", () => {
    const result = ApplicationCreateSchema.parse(base);
    expect(result.source).toBe("linkedin");
    expect(result.jobTitle).toBe("Senior Engineer");
  });

  it("requires a job title and company", () => {
    expect(
      ApplicationCreateSchema.safeParse({ ...base, jobTitle: "" }).success,
    ).toBe(false);
    expect(
      ApplicationCreateSchema.safeParse({ ...base, company: "" }).success,
    ).toBe(false);
  });

  it("rejects an invalid status enum value", () => {
    const result = ApplicationCreateSchema.safeParse({
      ...base,
      status: "not_a_status",
    });
    expect(result.success).toBe(false);
  });

  it("accepts every declared status", () => {
    for (const status of APPLICATION_STATUSES) {
      expect(
        ApplicationCreateSchema.safeParse({ ...base, status }).success,
      ).toBe(true);
    }
  });
});
