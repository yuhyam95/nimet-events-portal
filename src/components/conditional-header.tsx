"use client";

import { usePathname } from 'next/navigation';
import { Header } from './header';

export function ConditionalHeader() {
  const pathname = usePathname();
  
  // Hide header on admin login page only
  if (pathname === '/admin/login') {
    return null;
  }
  
  return <Header />;
}
