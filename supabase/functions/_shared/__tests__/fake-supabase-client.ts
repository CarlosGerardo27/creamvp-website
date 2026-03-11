// @ts-nocheck
type EqFilter = { type: "eq"; column: string; value: unknown };
type GteFilter = { type: "gte"; column: string; value: unknown };
type QueryFilter = EqFilter | GteFilter;

type FakeTableRow = Record<string, unknown>;

export type FakeDbState = {
  blog_posts: FakeTableRow[];
  blog_post_tags: FakeTableRow[];
  blog_faqs: FakeTableRow[];
  categories: FakeTableRow[];
  authors: FakeTableRow[];
  tags: FakeTableRow[];
  cms_api_request_log: FakeTableRow[];
};

type QueryResult = {
  data: unknown;
  error: { message: string; code?: string } | null;
  count?: number | null;
};

let generatedCounter = 0;

function nextId(prefix: string): string {
  generatedCounter += 1;
  return `${prefix}-${generatedCounter}`;
}

function asIsoDate(value: unknown): number {
  const timestamp = Date.parse(String(value ?? ""));
  return Number.isFinite(timestamp) ? timestamp : Number.NaN;
}

function cloneRows(rows: FakeTableRow[] | undefined): FakeTableRow[] {
  return (rows ?? []).map((row) => ({ ...row }));
}

export function createFakeDbState(seed: Partial<FakeDbState> = {}): FakeDbState {
  return {
    blog_posts: cloneRows(seed.blog_posts),
    blog_post_tags: cloneRows(seed.blog_post_tags),
    blog_faqs: cloneRows(seed.blog_faqs),
    categories: cloneRows(seed.categories),
    authors: cloneRows(seed.authors),
    tags: cloneRows(seed.tags),
    cms_api_request_log: cloneRows(seed.cms_api_request_log),
  };
}

export function createFakeSupabaseClient(state: FakeDbState) {
  return {
    __state: state,
    from(table: keyof FakeDbState) {
      return new FakeQueryBuilder(state, table);
    },
  };
}

class FakeQueryBuilder {
  private state: FakeDbState;
  private table: keyof FakeDbState;
  private operation: "select" | "insert" | "update" | "delete" | null = null;
  private filters: QueryFilter[] = [];
  private payload: unknown = null;
  private singleMode: "single" | "maybe-single" | null = null;
  private selectOptions: Record<string, unknown> | null = null;
  private orderConfig: { column: string; ascending: boolean } | null = null;

  constructor(state: FakeDbState, table: keyof FakeDbState) {
    this.state = state;
    this.table = table;
  }

  select(_columns?: string, options?: Record<string, unknown>) {
    if (!this.operation) {
      this.operation = "select";
    }
    this.selectOptions = options ?? null;
    return this;
  }

  insert(payload: unknown) {
    this.operation = "insert";
    this.payload = payload;
    return this;
  }

  update(payload: Record<string, unknown>) {
    this.operation = "update";
    this.payload = payload;
    return this;
  }

  delete() {
    this.operation = "delete";
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push({ type: "eq", column, value });
    return this;
  }

  gte(column: string, value: unknown) {
    this.filters.push({ type: "gte", column, value });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orderConfig = { column, ascending: options?.ascending ?? true };
    return this;
  }

  single() {
    this.singleMode = "single";
    return this.execute();
  }

  maybeSingle() {
    this.singleMode = "maybe-single";
    return this.execute();
  }

  then(onFulfilled: (value: QueryResult) => unknown, onRejected?: (reason: unknown) => unknown) {
    return this.execute().then(onFulfilled, onRejected);
  }

  private async execute(): Promise<QueryResult> {
    const operation = this.operation ?? "select";
    if (operation === "insert") {
      return this.executeInsert();
    }
    if (operation === "update") {
      return this.executeUpdate();
    }
    if (operation === "delete") {
      return this.executeDelete();
    }
    return this.executeSelect();
  }

  private applyFilters(rows: FakeTableRow[]): FakeTableRow[] {
    return rows.filter((row) =>
      this.filters.every((filter) => {
        const rowValue = row[filter.column];
        if (filter.type === "eq") {
          return rowValue === filter.value;
        }
        if (filter.type === "gte") {
          return asIsoDate(rowValue) >= asIsoDate(filter.value);
        }
        return true;
      }),
    );
  }

  private executeInsert(): QueryResult {
    const tableRows = this.state[this.table];
    const inputRows = Array.isArray(this.payload) ? this.payload : [this.payload];
    const nowIso = new Date().toISOString();
    const insertedRows = inputRows.map((row, index) => {
      const baseRow = { ...(row as Record<string, unknown>) };
      if (!baseRow.id) {
        baseRow.id = nextId(`${String(this.table)}-${index + 1}`);
      }
      if (!baseRow.updated_at) {
        baseRow.updated_at = nowIso;
      }
      return baseRow;
    });

    tableRows.push(...insertedRows);

    if (this.singleMode === "single") {
      return { data: insertedRows[0] ?? null, error: null };
    }
    return { data: insertedRows, error: null };
  }

  private executeUpdate(): QueryResult {
    const tableRows = this.state[this.table];
    const targets = this.applyFilters(tableRows);
    const patch = { ...(this.payload as Record<string, unknown>) };
    const nowIso = new Date().toISOString();

    for (const row of targets) {
      Object.assign(row, patch);
      if (!("updated_at" in patch)) {
        row.updated_at = nowIso;
      }
    }

    return { data: null, error: null };
  }

  private executeDelete(): QueryResult {
    const tableRows = this.state[this.table];
    const keepRows = tableRows.filter((row) => !this.applyFilters([row]).length);
    this.state[this.table] = keepRows;
    return { data: null, error: null };
  }

  private executeSelect(): QueryResult {
    let rows = this.applyFilters(this.state[this.table]);
    if (this.orderConfig) {
      const { column, ascending } = this.orderConfig;
      rows = rows.slice().sort((a, b) => {
        const aTime = asIsoDate(a[column]);
        const bTime = asIsoDate(b[column]);
        if (Number.isNaN(aTime) || Number.isNaN(bTime)) {
          const aValue = String(a[column] ?? "");
          const bValue = String(b[column] ?? "");
          return ascending ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        }
        return ascending ? aTime - bTime : bTime - aTime;
      });
    }

    if (this.selectOptions?.head === true && this.selectOptions?.count === "exact") {
      return { data: null, error: null, count: rows.length };
    }

    if (this.singleMode === "single") {
      if (!rows.length) {
        return { data: null, error: { message: "No rows found." } };
      }
      return { data: rows[0], error: null };
    }

    if (this.singleMode === "maybe-single") {
      return { data: rows[0] ?? null, error: null };
    }

    return { data: rows, error: null };
  }
}
