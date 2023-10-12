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
  buyer: {
    readonly ip: string | undefined;
    readonly country: string | undefined;
    readonly continent: string | undefined;
    readonly city: string | undefined;
    readonly isEuCountry: boolean;
    readonly latitude: string | undefined;
    readonly longitude: string | undefined;
    readonly region: string | undefined;
    readonly regionCode: string | undefined;
    readonly timezone: string | undefined;
  };
  readonly shopId: string | undefined;
  readonly storefrontId: string | undefined;
  readonly deploymentId: string | undefined;
};

export function getOxygenEnv(request: Request): OxygenEnv {
  return Object.freeze({
    buyer: {
      ip: request.headers.get('oxygen-buyer-ip') ?? undefined,
      country: request.headers.get('oxygen-buyer-country') ?? undefined,
      continent: request.headers.get('oxygen-buyer-continent') ?? undefined,
      city: request.headers.get('oxygen-buyer-city') ?? undefined,
      isEuCountry: Boolean(request.headers.get('oxygen-buyer-is-eu-country')),
      latitude: request.headers.get('oxygen-buyer-latitude') ?? undefined,
      longitude: request.headers.get('oxygen-buyer-longitude') ?? undefined,
      region: request.headers.get('oxygen-buyer-region') ?? undefined,
      regionCode: request.headers.get('oxygen-buyer-region-code') ?? undefined,
      timezone: request.headers.get('oxygen-buyer-timezone') ?? undefined,
    },
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
