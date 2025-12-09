import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdminDashboard from "@/components/admin/admin-dashboard";

type MockRow = Record<string, unknown>;
type DataStore = {
  products: MockRow[];
  events: MockRow[];
  themes: MockRow[];
};

type UpdateCall = {
  table: keyof DataStore;
  payload: Record<string, unknown>;
  column: string;
  value: unknown;
};

type SupabaseClientMock = {
  auth: {
    getSession: ReturnType<typeof vi.fn>;
    signOut: ReturnType<typeof vi.fn>;
  };
  storage: {
    from: (
      bucket: string
    ) => {
      upload: ReturnType<typeof vi.fn>;
      getPublicUrl: ReturnType<typeof vi.fn>;
    };
  };
  from: (table: keyof DataStore) => {
    select: () => {
      order: () => Promise<{ data: MockRow[] }>;
      single: () => Promise<{ data: MockRow | null }>;
    };
    insert: (rows: MockRow[] | MockRow) => {
      select: () => {
        single: () => Promise<{ data: MockRow; error: null }>;
      };
    };
    update: (payload: Record<string, unknown>) => {
      eq: (column: string, value: unknown) => Promise<{
        data: null;
        error: null;
      }>;
      select: () => Promise<{ data: MockRow | null }>;
      single: () => Promise<{ data: MockRow | null }>;
    };
    delete: () => {
      eq: () => Promise<{ data: null; error: null }>;
    };
    eq: () => Promise<{ data: null; error: null }>;
  };
};

let supabaseMock: SupabaseClientMock;

vi.mock("@/lib/supabase/browser-client", () => ({
  getSupabaseBrowserClient: () => supabaseMock,
}));

function createSupabaseMock(initialData: Partial<DataStore>) {
  const data: DataStore = {
    products: initialData.products ?? [],
    events: initialData.events ?? [],
    themes: initialData.themes ?? [],
  };

  const updateCalls: UpdateCall[] = [];

  const supabase: SupabaseClientMock = {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { user: { id: "user-1" } } },
      }),
      signOut: vi.fn(),
    },
    storage: {
      from: () => ({
        upload: vi.fn().mockResolvedValue({
          data: { path: "products/test.jpg" },
          error: null,
        }),
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: "https://example.com/public/image.jpg" },
        }),
      }),
    },
    from: (table: keyof DataStore) => {
      if (!data[table]) {
        data[table] = [];
      }

      return {
        select: () => ({
          order: async () => ({ data: data[table] }),
          single: async () => ({ data: data[table][0] ?? null }),
        }),
        insert: (rows: MockRow[] | MockRow) => {
          const row = Array.isArray(rows) ? rows[0] : rows;
          data[table]!.push(row);
          return {
            select: () => ({
              single: async () => ({ data: row, error: null }),
            }),
          };
        },
        update: (payload: Record<string, unknown>) => ({
          eq: async (column: string, value: unknown) => {
            data[table] = data[table]!.map((row) => {
              if (row[column] === value) {
                return { ...row, ...payload };
              }
              return row;
            });
            updateCalls.push({ table, payload, column, value });
            return { data: null, error: null };
          },
          select: async () => ({ data: data[table]![0] ?? null }),
          single: async () => ({ data: data[table]![0] ?? null }),
        }),
        delete: () => ({
          eq: async () => ({ data: null, error: null }),
        }),
        eq: async () => ({ data: null, error: null }),
      };
    },
  };

  return { supabase, data, updateCalls };
}

describe("AdminDashboard themes", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("submits a theme request tied to an event and omits auto-enable", async () => {
    const { supabase } = createSupabaseMock({
      events: [
        {
          id: "event-1",
          title: "Fall Launch",
          description: null,
          status: "published",
          starts_at: null,
          ends_at: null,
          created_at: null,
          updated_at: null,
        },
      ],
      themes: [],
    });
    supabaseMock = supabase;

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        theme: { id: "theme-1", title: "Neon", status: "building" },
      }),
    });
    global.fetch = fetchMock;

    render(<AdminDashboard />);

    await userEvent.type(
      await screen.findByLabelText(/theme title/i),
      "Neon storefront"
    );
    await userEvent.type(
      screen.getByLabelText(/notes for codex/i),
      "Bright green accents"
    );

    await userEvent.click(
      screen.getByRole("button", { name: /request theme/i })
    );

    await waitFor(() =>
      expect(
        screen.getByText(/queued with status building/i)
      ).toBeInTheDocument()
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/themes",
      expect.objectContaining({
        method: "POST",
      })
    );

    const body = JSON.parse(
      (fetchMock.mock.calls[0][1] as RequestInit).body as string
    );
    expect(body.eventId).toBe("event-1");
    expect(body.title).toBe("Neon storefront");
    expect(body.notes).toContain("Bright green");
    expect(body.enable).toBeUndefined();
  });

  it("allows enabling and disabling a theme from the event card", async () => {
    const { supabase, updateCalls } = createSupabaseMock({
      events: [
        {
          id: "event-1",
          title: "Winter Gala",
          description: null,
          status: "published",
          starts_at: null,
          ends_at: null,
          created_at: null,
          updated_at: null,
        },
      ],
      themes: [
        {
          id: "theme-1",
          event_id: "event-1",
          title: "Frosted",
          notes: "Icy gradients",
          status: "ready",
          enabled: false,
          issue_number: 42,
          issue_url: "https://example.com",
          created_at: null,
          updated_at: null,
        },
      ],
    });
    supabaseMock = supabase;
    global.fetch = vi.fn();

    render(<AdminDashboard />);

    const enableButton = await screen.findByRole("button", { name: /enable/i });
    await userEvent.click(enableButton);

    await waitFor(() => {
      expect(updateCalls[0]).toMatchObject({
        table: "themes",
        payload: { enabled: true },
      });
    });

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /disable/i })
      ).toBeInTheDocument()
    );

    await userEvent.click(screen.getByRole("button", { name: /disable/i }));

    await waitFor(() => {
      expect(updateCalls[1]).toMatchObject({
        table: "themes",
        payload: { enabled: false },
      });
    });

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /enable/i })
      ).toBeInTheDocument()
    );
  });
});
