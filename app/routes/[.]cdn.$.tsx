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

  console.log('proxyUrl', proxyUrl);

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
