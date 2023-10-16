import {useLocation} from '@remix-run/react';
import type {SelectedOption} from '@shopify/hydrogen/storefront-api-types';
import {useMemo} from 'react';

export function useVariantUrl(
  handle: string,
  selectedOptions: SelectedOption[],
) {
  const {pathname} = useLocation();

  return useMemo(() => {
    return getVariantUrl({
      handle,
      pathname,
      searchParams: new URLSearchParams(),
      selectedOptions,
    });
  }, [handle, selectedOptions, pathname]);
}

export function getVariantUrl({
  handle,
  pathname,
  searchParams,
  selectedOptions,
}: {
  handle: string;
  pathname: string;
  searchParams: URLSearchParams;
  selectedOptions: SelectedOption[];
}) {
  const match = /(\/[a-zA-Z]{2}-[a-zA-Z]{2}\/)/g.exec(pathname);
  const isLocalePathname = match && match.length > 0;

  const path = isLocalePathname
    ? `${match![0]}products/${handle}`
    : `/products/${handle}`;

  selectedOptions.forEach((option) => {
    searchParams.set(option.name, option.value);
  });

  const searchString = searchParams.toString();

  return path + (searchString ? '?' + searchParams.toString() : '');
}

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
