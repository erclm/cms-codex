import { NextResponse } from "next/server";
import { Octokit } from "@octokit/rest";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/lib/types";

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
      // Keep Supabase auth cookies in sync with Next.js so API routes honor sessions.
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookies) {
        // Handle refresh token cookie updates when Supabase needs to set them
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

  const { title, body, labels } = (await request.json()) as {
    title?: string;
    body?: string;
    labels?: string[];
  };

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

  if (!title) {
    return NextResponse.json(
      { error: "Issue title is required." },
      { status: 400 }
    );
  }

  try {
    const octokit = new Octokit({ auth: token });
    const issue = await octokit.issues.create({
      owner: repoOwner,
      repo,
      title,
      body: body ?? "",
      labels: labels && labels.length > 0 ? labels : ["codex-request", "theme"],
    });

    return NextResponse.json({ issue: issue.data });
  } catch (error) {
    console.error("GitHub issue creation failed", error);
    return NextResponse.json(
      { error: "Failed to create GitHub issue" },
      { status: 500 }
    );
  }
}
