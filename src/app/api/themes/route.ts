import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/auth-helpers-nextjs";
import { Octokit } from "@octokit/rest";
import type { Database, ThemeStatus } from "@/lib/types";

type ThemeRequestBody = {
  eventId?: string;
  title?: string;
  notes?: string;
};

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      {
        error:
          "Missing Supabase configuration. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
      },
      { status: 500 }
    );
  }

  const cookieStore = await cookies();
  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookies) {
        try {
          cookies.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch (error) {
          console.error("Failed to set Supabase cookies", error);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { eventId, title, notes } =
    (await request.json()) as ThemeRequestBody;

  if (!eventId || !title) {
    return NextResponse.json(
      { error: "Event and title are required to request a theme." },
      { status: 400 }
    );
  }

  const { data: eventRow } = await supabase
    .from("events")
    .select("id,title")
    .eq("id", eventId)
    .single();

  if (!eventRow) {
    return NextResponse.json(
      { error: "Selected event does not exist." },
      { status: 404 }
    );
  }

  const token =
    process.env.GITHUB_TOKEN ||
    process.env.GITHUB_PAT ||
    process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
  const rawRepoOwner = process.env.GITHUB_REPO_OWNER;
  const rawRepoName = process.env.GITHUB_REPO_NAME;

  const slugFromName = rawRepoName?.includes("/")
    ? rawRepoName.split("/")
    : undefined;
  const slugFromOwner = rawRepoOwner?.includes("/")
    ? rawRepoOwner.split("/")
    : undefined;

  const repoOwner = slugFromName?.[0] ?? slugFromOwner?.[0] ?? rawRepoOwner;
  const repo = slugFromName?.[1] ?? slugFromOwner?.[1] ?? rawRepoName;

  if (!token || !repoOwner || !repo) {
    return NextResponse.json(
      {
        error:
          "Missing GitHub configuration. Set GITHUB_TOKEN and provide owner/repo via GITHUB_REPO_OWNER + GITHUB_REPO_NAME (or a combined slug in either variable).",
      },
      { status: 500 }
    );
  }

  const initialStatus: ThemeStatus = "requested";
  const { data: insertedTheme, error: insertError } = await supabase
    .from("themes")
    .insert([
      {
        event_id: eventId,
        title,
        notes: notes?.trim() || null,
        enabled: false,
        status: initialStatus,
      },
    ])
    .select()
    .single();

  if (insertError || !insertedTheme) {
    console.error("Failed to create theme row", insertError);
    return NextResponse.json(
      { error: "Failed to create theme entry." },
      { status: 500 }
    );
  }

  try {
    const octokit = new Octokit({ auth: token });
    const issueBodyLines = [
      notes?.trim() || "Generate a new storefront theme for the event.",
      "",
      `Event: ${eventRow.title}`,
      `Event ID: ${eventRow.id}`,
      `Theme ID: ${insertedTheme.id}`,
    ];
    const issue = await octokit.issues.create({
      owner: repoOwner,
      repo,
      title,
      body: issueBodyLines.join("\n"),
      labels: ["codex-request", "theme"],
    });

    const { data: updatedTheme } = await supabase
      .from("themes")
      .update({
        status: "building",
        issue_number: issue.data.number,
        issue_url: issue.data.html_url ?? null,
      })
      .eq("id", insertedTheme.id)
      .select()
      .single();

    return NextResponse.json({
      theme: updatedTheme ?? insertedTheme,
      issue: issue.data,
    });
  } catch (error) {
    console.error("GitHub issue creation failed", error);
    await supabase
      .from("themes")
      .update({ status: "failed" })
      .eq("id", insertedTheme.id);

    return NextResponse.json(
      { error: "Failed to create GitHub issue for theme." },
      { status: 500 }
    );
  }
}
