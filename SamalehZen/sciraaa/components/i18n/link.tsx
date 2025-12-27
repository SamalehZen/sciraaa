"use client";

import Link, { LinkProps } from 'next/link';
import React from 'react';
import { useT } from '@/lib/i18n';
import { ensureLocalePath, isExternalOrSpecial } from '@/lib/i18n/path';

export function LocalizedLink({ href, ...props }: LinkProps & { children?: React.ReactNode }) {
  const { locale } = useT();
  const targetHref = typeof href === 'string' ? ensureLocalePath(href, locale) : href;
  return <Link href={targetHref} {...props} />;
}
