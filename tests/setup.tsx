import "@testing-library/jest-dom/vitest";
import type React from "react";

// Minimal mock for next/link to behave like a normal anchor in tests.
vi.mock("next/link", () => {
  type LinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
    children: React.ReactNode;
  };

  return {
    default: ({ href, children, ...props }: LinkProps) => (
      <a href={href} {...props}>
        {children}
      </a>
    ),
  };
});

// Mock for next/navigation router hooks used in client components.
vi.mock("next/navigation", async () => {
  const actual = await vi.importActual<typeof import("next/navigation")>(
    "next/navigation"
  );
  return {
    ...actual,
    useRouter: () => ({
      push: vi.fn(),
      replace: vi.fn(),
      refresh: vi.fn(),
      prefetch: vi.fn(),
    }),
  };
});
