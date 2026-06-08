# Welcome to Typefusion!

> [!CAUTION]
> **Typefusion is deprecated and no longer maintained (June 2026).** This repository is archived (read-only) and the [`typefusion`](https://www.npmjs.com/package/typefusion) npm package is deprecated. Existing versions remain installable, but there will be no further updates.
>
> For SQL/analytics transformations, use [dbt](https://www.getdbt.com/). For TypeScript-native workflow orchestration, see [Effect](https://effect.website/)'s workflow primitives (`@effect/workflow`, `@effect/cluster`).
>
> Thanks to everyone who tried it out. — [@aniravi24](https://github.com/aniravi24)

<!-- TODO codecov badge -->

## Table of Contents

- [Welcome to Typefusion!](#welcome-to-typefusion)
  - [Table of Contents](#table-of-contents)
  - [Introduction](#introduction)
  - [Key Features](#key-features)
  - [Getting Started](#getting-started)
  - [Usage](#usage)
    - [CLI](#cli)
    - [Library](#library)
  - [Typefusion Ref](#typefusion-ref)
  - [Examples](#examples)
  - [Documentation](#documentation)
  - [Effect Integration](#effect-integration)
  - [Troubleshooting](#troubleshooting)
    - [The graph is empty when I run Typefusion](#the-graph-is-empty-when-i-run-typefusion)
  - [Contributing](#contributing)

## Introduction

Typefusion allows you to run TypeScript scripts and materialize the results into a database. It enables you to create complex workflows by allowing scripts to reference each other's results. Inspired by [Data Build Tool (DBT)](https://www.getdbt.com/).

## Key Features

- Execute TypeScript scripts and store results in your database
- Create complex workflows with script dependencies
- Type-safe references between scripts
- Flexible usage through CLI and library modes
- Automatic dependency resolution and execution order

## Getting Started

To begin using Typefusion, follow these steps:

1. Install Typefusion using your preferred package manager:

   ```sh
   npm install typefusion
   # or
   pnpm install typefusion
   # or
   yarn add typefusion
   # or
   bun add typefusion
   ```

2. Configure your database connection using one of these methods (PostgreSQL, MySQL, and Clickhouse are supported):

   - Set a full connection string in the `PG_DATABASE_URL` or `MYSQL_DATABASE_URL` or `CLICKHOUSE_DATABASE_URL` (and optionally `CLICKHOUSE_USER`, `CLICKHOUSE_PASSWORD`, and `CLICKHOUSE_DATABASE` if not using the defaults) environment variable.
   - Set individual environment variables: `PG_DATABASE`, `PG_HOST`, `PG_PORT`, `PG_PASSWORD`, and `PG_USER` (for postgres) or `MYSQL_DATABASE`, `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_PASSWORD`, and `MYSQL_USER` (for mysql) or `CLICKHOUSE_DATABASE`, `CLICKHOUSE_HOST`, `CLICKHOUSE_PORT`, `CLICKHOUSE_PASSWORD`, and `CLICKHOUSE_USER` (for clickhouse).

3. Create a directory for your scripts (e.g., `workflows`).

4. Write your TypeScript scripts in the created directory.

5. Compile your TypeScript scripts into your desired output directory (e.g. `scripts`). Typefusion runs on the compiled JavaScript output, so ensure you don't bundle your scripts to preserve the directory layout. Avoid outputting to directories like `dist` or `build` (see [Troubleshooting](#troubleshooting))

## Usage

After following the above instructions, create a script file in the directory, for example, `main.ts`:

```ts
// or mySqlType for mysql or clickhouseType for clickhouse
import { pgType, typefusionRef, TypefusionDbScript } from "typefusion";

const mainSchema = {
  id: pgType.integer().notNull(),
  name: pgType.text().notNull(),
  age: pgType.integer().notNull(),
  email: pgType.text().notNull(),
  address: pgType.text().notNull(),
};

export default {
  name: "main",
  schema: mainSchema,
  resultDatabase: "postgresql",
  run: async () => {
    console.log("running main");
    return {
      data: [
        {
          id: 1,
          name: "John Doe",
          age: 30,
          email: "john.doe@example.com",
          address: "123 Main St",
        },
      ],
    };
  },
} satisfies TypefusionDbScript<typeof mainSchema>;
```

**Warning:** Typefusion is native [ESM](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules) and does not provide a CommonJS export.

Typefusion can be used in two primary modes: CLI and library. Both modes offer similar functionality, allowing you to choose the most suitable approach for your project.

### CLI

The Typefusion CLI provides a convenient way to run your scripts from the command line. To use the CLI:

1. Add a script to your `package.json`:

   ```json
   "scripts": {
     "run-typefusion": "dotenv -- typefusion ./scripts"
   }
   ```

   This example assumes you're using `dotenv` for environment variable management and that your compiled scripts are in the `./scripts` directory.

2. Run your scripts:

   ```sh
   npm run run-typefusion
   ```

To explore all CLI options, run:

```sh
npm run typefusion --help
```

### Library

You can also use Typefusion as a library in your TypeScript projects:

```ts
import typefusion from "typefusion";

await typefusion({
  directory: "./scripts",
});
```

This approach allows for more programmatic control and integration with your existing TypeScript applications.

## Typefusion Ref

Typefusion Refs enable you to reference the results of one script in another, facilitating the creation of complex workflows. Here's an example:

```ts
// or mySqlType for mysql
import { pgType, typefusionRef, TypefusionDbScript } from "typefusion";
import main from "./main.js";

const smallSchema = {
  small: pgType.text().notNull(),
};

export default {
  name: "typefusion_ref",
  schema: smallSchema,
  resultDatabase: "postgresql",
  run: async () => {
    const result = await typefusionRef(main);
    console.log("typefusion ref main result", result);
    return {
      data: [
        {
          small: "smallString" as const,
        },
      ],
    };
  },
} satisfies TypefusionDbScript<typeof smallSchema>;
```

For cases where you only need the table name without fetching the full data, use the `typefusionRefTableName` function:

```ts
import { typefusionRefTableName } from "typefusion";
import main from "./main.js";

const tableName = await typefusionRefTableName(main);
console.log("typefusion ref table name", tableName); // Outputs: "main"
```

## Examples

To help you get started, we've provided several examples:

1. [Basic Usage](packages/typefusion/example/main.ts)
2. [Using Typefusion Ref](packages/typefusion/example/options/typefusion_pg_result.ts)

Find more examples in the [examples directory](packages/typefusion/example).

## Documentation

For detailed API documentation, visit the [reference docs](https://aniravi24.github.io/typefusion). The documentation is generated from JSDoc comments in the source code, providing comprehensive information on usage and features.

## Effect Integration

Typefusion is built with [Effect](https://effect.website). Refer to the reference docs for details on Effect-suffixed functions and their usage. Most of the time, you just need to suffix the types and functions with `Effect` to use them. For example, `typefusionRef` becomes `typefusionRefEffect`, `TypefusionDbScript` becomes `TypefusionDbScriptEffect`, and `run` becomes `runEffect`. The `typefusion` library export is `typefusionEffect`.

## Troubleshooting

### The graph is empty when I run Typefusion

This can happen because the library Typefusion depends on to generate the dependency graph ignores common build directories by default. For example, you cannot output scripts to `build`, `dist`, and several others ([full list here](https://github.com/antoine-coulon/skott/blob/main/packages/skott/src/modules/resolvers/base-resolver.ts#L95)).

---

If you encounter any other issues while using Typefusion:

1. Check the [GitHub Issues](https://github.com/aniravi24/typefusion/issues) to see if your problem has been reported or resolved.
2. Ensure you're using the latest version of Typefusion.
3. Verify your database connection settings and environment variables.
4. If the issue persists, please [open a new issue](https://github.com/aniravi24/typefusion/issues/new).

## Contributing

Contributions to Typefusion are welcome! To contribute:

1. Fork the repository and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. Ensure your code passes all tests and linting rules.
4. Open a pull request with the provided template.

If it's a larger change, please open an issue to discuss your proposed changes or feature additions.
