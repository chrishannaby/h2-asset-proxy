import {type LoaderArgs} from '@shopify/remix-oxygen';

export async function loader({request, context}: LoaderArgs) {
  const {oxygenAssetsUrl} = context;
  const {pathname, search} = new URL(request.url);
  const proxyPath = pathname.replace('/.cdn/', '');
  const proxyUrl = `${oxygenAssetsUrl}/${proxyPath}${search}`;
  const proxyResponse = await fetch(proxyUrl, {
    headers: request.headers,
  });
  return new Response(proxyResponse.body, {
    status: proxyResponse.status,
    headers: new Headers({
      ...proxyResponse.headers,
      'Cache-Control': 'public, max-age=31536000',
      'Oxygen-Full-Page-Cache-Enable': 'true',
      Vary: 'Accept-Encoding',
    }),
  });
}
