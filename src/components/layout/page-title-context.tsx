import { createContext, useContext, useEffect, useState } from 'react';

const PageTitleContext = createContext<(title: string) => void>(() => {});

export function PageTitleProvider({
  children,
  onTitleChange,
}: {
  children: React.ReactNode;
  onTitleChange: (title: string) => void;
}) {
  return <PageTitleContext.Provider value={onTitleChange}>{children}</PageTitleContext.Provider>;
}

/** Call from a page component to set the header title. */
export function usePageTitle(title: string) {
  const setTitle = useContext(PageTitleContext);
  useEffect(() => {
    setTitle(title);
  }, [title, setTitle]);
}

export function usePageTitleState(initial: string) {
  return useState(initial);
}
