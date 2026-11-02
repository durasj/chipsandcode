import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
  DATABASE_URL: {
    schema: (value) => {
      // Rendering lessons and building the app do not require a database connection.
      if (!value) return undefined;
      if (!/^postgres(?:ql)?:\/\//.test(value))
        throw new Error('DATABASE_URL must be a Postgres URL');
      return value;
    },
  },
});
