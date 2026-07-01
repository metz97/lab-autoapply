import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { jsonErr, jsonOk } from "@/lib/autoapply/api-response";
import { getProfileByUserId, upsertProfile } from "@/lib/autoapply/db";
import { requireApiSession } from "@/lib/autoapply/session-api";
import {
  ProfileUpdateSchema,
  profileRowToApi,
} from "@/lib/autoapply/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  const session = await requireApiSession();
  if (!session.ok) return session.response;

  try {
    const row = await getProfileByUserId(session.user.id);
    return jsonOk({ profile: profileRowToApi(row) });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load profile";
    return jsonErr(message, "db_error", 500);
  }
}

export async function PUT(req: Request): Promise<NextResponse> {
  const session = await requireApiSession();
  if (!session.ok) return session.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonErr("Invalid JSON body", "bad_request", 400);
  }

  try {
    const parsed = ProfileUpdateSchema.parse(body);
    const row = await upsertProfile(session.user.id, {
      full_name: parsed.fullName ?? null,
      email: parsed.email ?? null,
      phone: parsed.phone ?? null,
      location: parsed.location ?? null,
      linkedin_url: parsed.linkedinUrl ?? null,
      current_title: parsed.currentTitle ?? null,
      years_experience: parsed.yearsExperience ?? null,
      resume_url: parsed.resumeUrl ?? null,
      default_answers: parsed.defaultAnswers,
    });
    return jsonOk({ profile: profileRowToApi(row) });
  } catch (e) {
    if (e instanceof ZodError) {
      return jsonErr(e.message, "validation_error", 400);
    }
    const message = e instanceof Error ? e.message : "Failed to save profile";
    return jsonErr(message, "db_error", 500);
  }
}
