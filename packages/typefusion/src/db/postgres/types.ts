import { Data, Effect } from "effect";

export type Nullable<T> = T | null;

/**
 * This is a simple wrapper class to represent a Postgres type that will be used to define a table.
 * It also provides a fluent API to set properties of the column (e.g. nullability).
 * You can easily create your own custom types by instantiating this class.
 *
 * @example
 * ```ts
 * const myCustomType = new PgType<Nullable<string>>("myCustomType");
 * ```
 */
export class PgType<T> {
  public _type: T;
  private _nullable: boolean;
  private _postgresType: string;
  constructor(postgresType: string) {
    // This is really more like a phantom type, it doesn't matter what it is at runtime
    this._type = "PgType" as T;
    this._nullable = true;
    this._postgresType = postgresType;
  }

  notNull(): PgType<Exclude<T, null>> {
    this._nullable = false;
    return this as PgType<Exclude<T, null>>;
  }

  nullable(): PgType<Nullable<T>> {
    this._nullable = true;
    return this as PgType<Nullable<T>>;
  }

  getNullable(): boolean {
    return this._nullable;
  }

  getPostgresType(): string {
    return this._postgresType;
  }

  // This is a bit of a hack to get the type of the underlying type
  getType(): T {
    return this._type;
  }

  toString(): string {
    return `${this._postgresType}${this._nullable ? " " : " NOT NULL"}`;
  }
}

export const pgType = {
  text: () => new PgType<Nullable<string>>("text"),
  integer: () => new PgType<Nullable<number>>("integer"),
  boolean: () => new PgType<Nullable<boolean>>("boolean"),
  date: () => new PgType<Nullable<Date>>("date"),
  dateTime: () => new PgType<Nullable<Date>>("timestamp"),
  bigint: () => new PgType<Nullable<bigint>>("bigint"),
  smallint: () => new PgType<Nullable<number>>("smallint"),
  real: () => new PgType<Nullable<number>>("real"),
  doublePrecision: () => new PgType<Nullable<number>>("double precision"),
  smallserial: () => new PgType<Nullable<number>>("smallserial"),
  serial: () => new PgType<Nullable<number>>("serial"),
  bigserial: () => new PgType<Nullable<bigint>>("bigserial"),
  numeric: () => new PgType<Nullable<number>>("numeric"),
  decimal: () => new PgType<Nullable<number>>("decimal"),
  money: () => new PgType<Nullable<number>>("money"),
  char: (n: number) => new PgType<Nullable<string>>(`char(${n})`),
  varchar: (n: number) => new PgType<Nullable<string>>(`varchar(${n})`),
  time: () => new PgType<Nullable<string>>("time"),
  interval: () => new PgType<Nullable<string>>("interval"),
  point: () => new PgType<Nullable<string>>("point"),
  line: () => new PgType<Nullable<string>>("line"),
  lseg: () => new PgType<Nullable<string>>("lseg"),
  box: () => new PgType<Nullable<string>>("box"),
  polygon: () => new PgType<Nullable<string>>("polygon"),
  circle: () => new PgType<Nullable<string>>("circle"),
  inet: () => new PgType<Nullable<string>>("inet"),
  cidr: () => new PgType<Nullable<string>>("cidr"),
  macaddr: () => new PgType<Nullable<string>>("macaddr"),
  tsvector: () => new PgType<Nullable<string>>("tsvector"),
  tsquery: () => new PgType<Nullable<string>>("tsquery"),
  uuid: () => new PgType<Nullable<string>>("uuid"),
  json: () => new PgType<Nullable<object>>("json"),
  jsonb: () => new PgType<Nullable<object>>("jsonb"),
  xml: () => new PgType<Nullable<string>>("xml"),
  bytea: () => new PgType<Nullable<Uint8Array>>("bytea"),
};

export class UnsupportedJSTypePostgresConversionError extends Data.TaggedError(
  "UnsupportedJSTypePostgresConversionError",
)<{
  cause: unknown;
  message: string;
}> {}

// People shouldn't really use this function, it's only useful for the simplest of types
export const valueToPostgresType = (value: unknown) =>
  Effect.gen(function* () {
    if (value === null || value === undefined) {
      return "TEXT";
    }
    if (value instanceof Date) {
      return "TIMESTAMP WITH TIME ZONE";
    }
    switch (typeof value) {
      case "object":
        return "JSONB";
      case "string":
        return "TEXT";
      case "bigint":
        return "BIGINT";
      case "number":
        if (Number.isInteger(value)) {
          // PostgreSQL INTEGER range: -2,147,483,648 to +2,147,483,647
          const MIN_INTEGER = -2147483648;
          const MAX_INTEGER = 2147483647;
          if (value >= MIN_INTEGER && value <= MAX_INTEGER) {
            return "INTEGER";
          }
          return "BIGINT";
        }
        return "DOUBLE PRECISION";
      case "boolean":
        return "BOOLEAN";
      default:
        return yield* Effect.fail(
          new UnsupportedJSTypePostgresConversionError({
            cause: null,
            message: `Unsupported type for value provided in script result: ${typeof value}`,
          }),
        );
    }
  });

export const postgresIdColumn = (type?: PgType<unknown>) => {
  const idType =
    type?.getPostgresType() || "BIGINT GENERATED ALWAYS AS IDENTITY";
  return `id ${idType} PRIMARY KEY` as const;
};
