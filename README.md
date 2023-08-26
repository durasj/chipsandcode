# Chips and Code

<img src="./demo.gif" width="100%">

## Developing

This application is powered by [`SvelteKit`](https://kit.svelte.dev).

Once you've cloned the repository and installed dependencies by running `npm install`, start the development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To build static HTML files that can be served by any web server run:

```bash
npm run build
```

> You can preview the built app with `npm run preview`.

> The built app can be found in `/build`.

## Backend

The application works completely fine without any backend, but the ability to sign in and save the progress or content requires a backend.

Currently, this application uses Cloudflare to both distribute the website and power the backend using Cloudflare Pages.

To replicate the backend, you can log in using the wrangler:

```bash
npm run wrangler -- login
```

You need to change the account_id within `wrangler.toml` and sign up for Cloudflare Workers, see [documentation](https://developers.cloudflare.com/workers/get-started/guide#7-configure-your-project-for-deployment). Then, you can run:

```bash
# runs both backend and frontend
npm start
```

## Browser Support

Chips and Code is designed for and tested on the latest stable versions of Chrome, Firefox, Edge, and Safari. It does not support any version of Internet Explorer.
