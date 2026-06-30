'use client';

import React, {
  createContext,
  useContext,
  useCallback,
  useState,
  useEffect,
  useRef,
  useTransition,
  useMemo
} from 'react';
import { usePathname, useRouter } from 'next/navigation';

const ViewTransitionsContext = createContext<React.Dispatch<React.SetStateAction<(() => void) | null>> | null>(null);

export function ViewTransitions({ children }: { children: React.ReactNode }) {
  const [finishViewTransition, setFinishViewTransition] = useState<(() => void) | null>(null);

  useEffect(() => {
    if (finishViewTransition) {
      finishViewTransition();
      setFinishViewTransition(null);
    }
  }, [finishViewTransition]);

  const pathname = usePathname();
  const currentPathname = useRef(pathname);
  const [pendingTransition, setPendingTransition] = useState<{
    promise: Promise<void>;
    resolve: () => void;
  } | null>(null);

  useEffect(() => {
    if (!('startViewTransition' in document)) {
      return;
    }

    const onPopState = () => {
      let resolveTransition: () => void = () => {};
      const promise = new Promise<void>((resolve) => {
        resolveTransition = resolve;
      });

      (document as any).startViewTransition(() => {
        return promise;
      });

      setPendingTransition({ promise, resolve: resolveTransition });
    };

    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('popstate', onPopState);
    };
  }, []);

  useEffect(() => {
    if (pendingTransition && currentPathname.current !== pathname) {
      pendingTransition.resolve();
      setPendingTransition(null);
    }
    currentPathname.current = pathname;
  }, [pathname, pendingTransition]);

  return (
    <ViewTransitionsContext.Provider value={setFinishViewTransition}>
      {children}
    </ViewTransitionsContext.Provider>
  );
}

export function useTransitionRouter() {
  const router = useRouter();
  const setFinishViewTransition = useContext(ViewTransitionsContext);
  const [, startReactTransition] = useTransition();

  const triggerTransition = useCallback((cb: () => void) => {
    if ('startViewTransition' in document && setFinishViewTransition) {
      (document as any).startViewTransition(() => {
        return new Promise<void>((resolve) => {
          startReactTransition(() => {
            cb();
            setFinishViewTransition(() => resolve);
          });
        });
      });
    } else {
      cb();
    }
  }, [setFinishViewTransition]);

  const push = useCallback((href: string, options?: any) => {
    triggerTransition(() => router.push(href, options));
  }, [triggerTransition, router]);

  const replace = useCallback((href: string, options?: any) => {
    triggerTransition(() => router.replace(href, options));
  }, [triggerTransition, router]);

  return useMemo(() => ({
    ...router,
    push,
    replace
  }), [router, push, replace]);
}
