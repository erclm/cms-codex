import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import StorefrontNav from "@/components/storefront-nav";

let authChangeHandler:
  | ((event: string, session: Record<string, unknown> | null) => void)
  | null = null;
const getSessionMock = vi.fn();
const signOutMock = vi.fn();
const onAuthStateChangeMock = vi.fn((callback) => {
  authChangeHandler = callback;
  return { data: { subscription: { unsubscribe: vi.fn() } } };
});

vi.mock("@/lib/supabase/browser-client", () => ({
  getSupabaseBrowserClient: () => ({
    auth: {
      getSession: getSessionMock,
      onAuthStateChange: onAuthStateChangeMock,
      signOut: signOutMock,
    },
  }),
}));

describe("StorefrontNav", () => {
  beforeEach(() => {
    authChangeHandler = null;
    getSessionMock.mockReset();
    signOutMock.mockReset();
    onAuthStateChangeMock.mockClear();
  });

  it("exposes a labeled navigation region for accessibility", async () => {
    getSessionMock.mockResolvedValue({
      data: { session: null },
    });

    render(<StorefrontNav />);

    await waitFor(() => {
      expect(
        screen.getByRole("navigation", { name: /storefront navigation/i })
      ).toBeInTheDocument();
    });
  });

  it("shows login when unauthenticated", async () => {
    getSessionMock.mockResolvedValue({
      data: { session: null },
    });

    render(<StorefrontNav />);

    await waitFor(() => {
      expect(screen.getByText("Login")).toBeInTheDocument();
    });
    expect(screen.queryByText("Admin dashboard")).not.toBeInTheDocument();
    expect(screen.queryByText("Logout")).not.toBeInTheDocument();
  });

  it("shows admin and logout when authenticated", async () => {
    getSessionMock.mockResolvedValue({
      data: { session: { user: { id: "123" } } },
    });

    render(<StorefrontNav />);

    await waitFor(() => {
      expect(screen.getByText("Admin dashboard")).toBeInTheDocument();
    });
    expect(screen.getByText("Logout")).toBeInTheDocument();
    expect(screen.queryByText("Login")).not.toBeInTheDocument();
  });

  it("uses high-contrast styles for auth buttons", async () => {
    getSessionMock.mockResolvedValue({
      data: { session: { user: { id: "123" } } },
    });

    render(<StorefrontNav />);

    const adminButton = await screen.findByText("Admin dashboard");
    expect(adminButton).toHaveClass("bg-[var(--accent-strong)]");
    expect(adminButton).toHaveClass("text-[#0c1a26]");

    const logoutButton = screen.getByText("Logout");
    expect(logoutButton.textContent?.trim().length).toBeGreaterThan(0);
  });

  it("returns to guest state after logout click", async () => {
    getSessionMock.mockResolvedValue({
      data: { session: { user: { id: "123" } } },
    });

    render(<StorefrontNav />);

    await waitFor(() => {
      expect(screen.getByText("Logout")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText("Logout"));

    expect(signOutMock).toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.getByText("Login")).toBeInTheDocument();
    });
  });

  it("updates when auth state changes to guest", async () => {
    getSessionMock.mockResolvedValue({
      data: { session: { user: { id: "123" } } },
    });

    render(<StorefrontNav />);

    await waitFor(() => {
      expect(screen.getByText("Logout")).toBeInTheDocument();
    });

    // simulate auth change to guest
    act(() => {
      authChangeHandler?.("SIGNED_OUT", null);
    });

    await waitFor(() => {
      expect(screen.getByText("Login")).toBeInTheDocument();
    });
  });
});
