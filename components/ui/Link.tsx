"use client";

import { useTransitionRouter } from "./ViewTransitions";
import NextLink from "next/link";
import { ComponentProps, forwardRef, useCallback } from "react";
import { UrlObject } from "url";

const formatUrl = (url: string | UrlObject): string => {
  if (typeof url === 'string') return url;
  const pathname = url.pathname || '';
  const query = url.query;
  if (!query) return pathname;
  const queryString = typeof query === 'string'
    ? query
    : Object.entries(query)
        .map(([key, val]) => {
          if (Array.isArray(val)) {
            return val.map(v => `${encodeURIComponent(key)}=${encodeURIComponent(String(v))}`).join('&');
          }
          return `${encodeURIComponent(key)}=${encodeURIComponent(String(val))}`;
        })
        .join('&');
  return `${pathname}${queryString ? `?${queryString}` : ''}`;
};

export const Link = forwardRef<HTMLAnchorElement, ComponentProps<typeof NextLink>>(
  ({ href, as, replace, scroll, onClick, ...props }, ref) => {
    const router = useTransitionRouter();
    const handleTransition = useCallback(
      (e: React.MouseEvent<HTMLAnchorElement>) => {
        if (onClick) onClick(e);
        if (e.defaultPrevented) return;
        if ("startViewTransition" in document) {
          const isModified =
            e.metaKey ||
            e.ctrlKey ||
            e.shiftKey ||
            e.altKey ||
            (e.nativeEvent && e.nativeEvent.button === 1);
          if (isModified) return;

          e.preventDefault();
          const navigate = replace ? router.replace : router.push;
          navigate(formatUrl(as || href), {
            scroll: scroll ?? true,
          });
        }
      },
      [onClick, href, as, replace, scroll, router]
    );

    return (
      <NextLink
        ref={ref}
        href={href}
        as={as}
        replace={replace}
        scroll={scroll}
        onClick={handleTransition}
        {...props}
      />
    );
  }
);

Link.displayName = "Link";
export default Link;

