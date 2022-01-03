# Chips And Code

<img src="./demo.gif" width="100%">

## Developing

This application is powered by [`SvelteKit`](https://kit.svelte.dev).

Once you've cloned the repository and installed dependencies with `npm install`, start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

```bash
npm run build
```

> You can preview the built app with `npm run preview`.

## Backend

The application works completely fine without any backend, but the ability to sign in and save the progress or content requires a backend.

Currently, this application uses Cloudflare to both distribute the website and power the backend using Cloudflare Pages and Workers, respectively.

To replicate the backend, you can log-in using the wrangler:

```bash
npm run wrangler -- login
```

To build the backend, run:

```bash
npm run backend:build
```

You need to change the account_id within `wrangler.toml` and sign up for Cloudflare Workers, see [documentation](https://developers.cloudflare.com/workers/get-started/guide#7-configure-your-project-for-deployment). Then, you can run:

```bash
# runs local code in dev mode on real Cloudflare nodes
npm run backend:dev

# or - publishes backend to Cloudflare
npm run backend:publish
```

## Browser Support

ChipsAndCode is designed for and tested on the latest stable versions of Chrome, Firefox, Edge, and Safari. It does not support any version of Internet Explorer.
