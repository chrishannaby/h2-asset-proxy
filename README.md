# Hydrogen Oxygen Proxy Assets Example

This example demonstrates how to proxy public assets from your Hydrogen build so they can be served from your primary domain when you are deploy to Oxygen. This example demomnstrates how to load a font file, but the same approach can be used for any public asset.

## 1. Add the oxygen utilities to app/utils.ts

### 1.1 getOxygenEnv

This utility extracts environment variables from the Oxygen request headers

```ts
export type OxygenEnv = {
  readonly shopId: string | undefined;
  readonly storefrontId: string | undefined;
  readonly deploymentId: string | undefined;
};

export function getOxygenEnv(request: Request): OxygenEnv {
  return Object.freeze({
    shopId: request.headers.get('oxygen-buyer-shop-id') ?? undefined,
    storefrontId:
      request.headers.get('oxygen-buyer-storefront-id') ?? undefined,
    deploymentId:
      request.headers.get('oxygen-buyer-deployment-id') ?? undefined,
  });
}
```

### 1.2 getOxygenAssetsUrl

This utility returns the assets CDN url for a given deployment

````ts
export type DevOxygenAssetsUrl = `http://localhost:${number}`;
export type ProdOxygenAssetsUrl =
  `https://cdn.shopify.com/oxygen/${string}/${string}/${string}`;

/**
 * A utility function that builds the Oxygen assets url from
 * the request oxygen headers. During dev mode the url will be simply localhost
 * @example
 * ```js
 * const oxygeAssetsUrl = getOxygenAssetsUrl(request)
 * -> (prod) https://cdn.shopify.com/oxygen/55145660472/1000001971/evns5kqde
 * -> (dev) http://localhost:3000
 * ```
 */
export function getOxygenAssetsUrl(
  request: Request,
): ProdOxygenAssetsUrl | DevOxygenAssetsUrl {
  const {shopId, storefrontId, deploymentId} = getOxygenEnv(request);
  const isDev = deploymentId === 'local';

  if (isDev) {
    const url = new URL(request.url);
    return `${url.origin}` as DevOxygenAssetsUrl;
  }

  return `https://cdn.shopify.com/oxygen/${shopId}/${storefrontId}/${deploymentId}` as ProdOxygenAssetsUrl;
}
````

## 2. Instanciate the Oxygen utilities

```ts
// server.ts
export default {
  async fetch(
    request: Request,
    env: Env,
    executionContext: ExecutionContext,
  ): Promise<Response> {
    try {
      //... other code

      // Get assets url
      const oxygenAssetsUrl = getOxygenAssetsUrl(request);

      /**
       * Create a Remix request handler and pass
       * Hydrogen's Storefront client to the loader context.
       */
      const handleRequest = createRequestHandler({
        build: remixBuild,
        mode: process.env.NODE_ENV,
        getLoadContext: () => ({
          session,
          storefront,
          cart,
          env,
          waitUntil,
          oxygenAssetsUrl, // expose the oxygen assets url to loaders and actions via the context
        }),
      });
}
```

## 3. Update the remix context environment types

```ts
// remix.env.dts

import type {DevOxygenAssetsUrl, ProdOxygenAssetsUrl} from './app/utils';

export interface AppLoadContext {
  env: Env;
  cart: HydrogenCart;
  storefront: Storefront;
  session: HydrogenSession;
  waitUntil: ExecutionContext['waitUntil'];
  oxygenAssetsUrl: DevOxygenAssetsUrl | ProdOxygenAssetsUrl;
}
```

## 4. Add a proxy route to load the assets from in this case we are using `/.cdn/` as the path

You should modify the cache headers to suit your requirements.

```ts
// app/routes/[.]cdn.$.tsx

import {type LoaderArgs} from '@shopify/remix-oxygen';

const cacheHeaders = {
  'Cache-Control': 'public, max-age=31536000',
  Vary: 'Accept-Encoding',
  'Oxygen-Full-Page-Cache-Enable': 'true',
};

export async function loader({request, context}: LoaderArgs) {
  const {oxygenAssetsUrl} = context;
  const {pathname, search} = new URL(request.url);
  const proxyPath = pathname.replace('/.cdn/', '');
  const proxyUrl = `${oxygenAssetsUrl}/${proxyPath}${search}`;
  const proxyResponse = await fetch(proxyUrl, {
    headers: request.headers,
  });

  if (!proxyResponse.ok) {
    return new Response(proxyResponse.body, {
      status: proxyResponse.status,
    });
  }

  return new Response(proxyResponse.body, {
    status: proxyResponse.status,
    headers: new Headers({
      ...proxyResponse.headers,
      ...cacheHeaders,
    }),
  });
}
```

## 5. Load assets from the proxy route

```tsx
// app/root.tsx

//... other code

export default function App() {
  const nonce = useNonce();
  const data = useLoaderData<typeof loader>();

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              @font-face {
                font-family: Inter;
                src: url(/.cdn/fonts/Inter-Regular.woff2);
                font-display: swap;
              }

              body {
                font-family: Inter, sans-serif;
              }`,
          }}
        />
        <Meta />
        <Links />
      </head>
      <body>
        <Layout {...data}>
          <Outlet />
        </Layout>
        <ScrollRestoration nonce={nonce} />
        <Scripts nonce={nonce} />
        <LiveReload nonce={nonce} />
      </body>
    </html>
  );
}
```

---

## Hydrogen

Hydrogen is Shopify’s stack for headless commerce. Hydrogen is designed to dovetail with [Remix](https://remix.run/), Shopify’s full stack web framework. This template contains a **minimal setup** of components, queries and tooling to get started with Hydrogen.

[Check out Hydrogen docs](https://shopify.dev/custom-storefronts/hydrogen)
[Get familiar with Remix](https://remix.run/docs/en/v1)

## What's included

- Remix
- Hydrogen
- Oxygen
- Shopify CLI
- ESLint
- Prettier
- GraphQL generator
- TypeScript and JavaScript flavors
- Minimal setup of components and routes

## Getting started

**Requirements:**

- Node.js version 16.14.0 or higher

```bash
npm create @shopify/hydrogen@latest
```

## Building for production

```bash
npm run build
```

## Local development

```bash
npm run dev
```
