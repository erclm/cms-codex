export type ProductStatus = "draft" | "published";

export type Product = {
  id: string;
  name: string;
  slug: string | null;
  price_cents: number;
  status: ProductStatus;
  summary: string | null;
  description: string | null;
  image_url: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type EventStatus = "draft" | "published";

export type Event = {
  id: string;
  title: string;
  description: string | null;
  status: EventStatus;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type ThemeStatus = "requested" | "building" | "ready" | "failed";

export type Theme = {
  id: string;
  event_id: string;
  title: string;
  notes: string | null;
  status: ThemeStatus;
  enabled: boolean;
  issue_number: number | null;
  issue_url: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type Database = {
  public: {
    Tables: {
      products: {
        Row: Product;
        Insert: {
          name: string;
          price_cents: number;
          slug?: string | null;
          status?: ProductStatus;
          summary?: string | null;
          description?: string | null;
          image_url?: string | null;
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Product>;
        Relationships: [];
      };
      events: {
        Row: Event;
        Insert: {
          title: string;
          description?: string | null;
          status?: EventStatus;
          starts_at?: string | null;
          ends_at?: string | null;
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Event>;
        Relationships: [];
      };
      themes: {
        Row: Theme;
        Insert: {
          event_id: string;
          title: string;
          notes?: string | null;
          status?: ThemeStatus;
          enabled?: boolean;
          issue_number?: number | null;
          issue_url?: string | null;
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Theme>;
        Relationships: [
          {
            foreignKeyName: "themes_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
