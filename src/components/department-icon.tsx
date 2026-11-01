'use client';

import React from 'react';
import {
  Building2,
  Code2,
  Megaphone,
  Boxes,
  Palette,
  Users,
  TrendingUp,
  Headphones,
  GraduationCap,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';

/**
 * Maps a department name or slug to an appropriate Lucide icon component.
 * Ensures consistent, recognizable semantic icons across all views instead of avatar letters.
 */
export function getDepartmentIcon(nameOrSlug?: string | null): LucideIcon {
  if (!nameOrSlug) return Building2;
  const n = nameOrSlug.toLowerCase().trim();

  // Engineering / Development / Tech
  if (
    n.includes('engineer') ||
    n.includes('tech') ||
    n.includes('dev') ||
    n.includes('software') ||
    n.includes('code') ||
    n.includes('it') ||
    n.includes('backend') ||
    n.includes('frontend') ||
    n.includes('qa')
  ) {
    return Code2;
  }

  // Marketing / Growth / Campaign / Brand
  if (
    n.includes('market') ||
    n.includes('growth') ||
    n.includes('campaign') ||
    n.includes('seo') ||
    n.includes('brand') ||
    n.includes('promo') ||
    n.includes('social') ||
    n.includes('ad')
  ) {
    return Megaphone;
  }

  // Product / Operations / Ops
  if (
    n.includes('product') ||
    n.includes('ops') ||
    n.includes('operation') ||
    n.includes('process') ||
    n.includes('logistics') ||
    n.includes('strategy')
  ) {
    return Boxes;
  }

  // Design / Creative / UI / UX
  if (
    n.includes('design') ||
    n.includes('creative') ||
    n.includes('ui') ||
    n.includes('ux') ||
    n.includes('art') ||
    n.includes('visual')
  ) {
    return Palette;
  }

  // Sales / Revenue / Finance / Business
  if (
    n.includes('sale') ||
    n.includes('revenue') ||
    n.includes('finance') ||
    n.includes('business') ||
    n.includes('commercial') ||
    n.includes('accounting') ||
    n.includes('monetiz')
  ) {
    return TrendingUp;
  }

  // Human Resources / People / Talent / Recruitment
  if (
    n.includes('hr') ||
    n.includes('people') ||
    n.includes('talent') ||
    n.includes('recruit') ||
    n.includes('human')
  ) {
    return Users;
  }

  // Customer Support / CS / Service / Helpdesk
  if (
    n.includes('support') ||
    n.includes('cs') ||
    n.includes('service') ||
    n.includes('help') ||
    n.includes('ticket') ||
    n.includes('customer')
  ) {
    return Headphones;
  }

  // Education / Content / Curriculum / Academic / Tutor
  if (
    n.includes('edu') ||
    n.includes('academic') ||
    n.includes('content') ||
    n.includes('tutor') ||
    n.includes('curriculum') ||
    n.includes('kurikulum') ||
    n.includes('guru') ||
    n.includes('tryout')
  ) {
    return GraduationCap;
  }

  // Legal / Security / Compliance / Audit
  if (
    n.includes('legal') ||
    n.includes('security') ||
    n.includes('compliance') ||
    n.includes('audit') ||
    n.includes('risk')
  ) {
    return ShieldCheck;
  }

  return Building2;
}

export function DepartmentIcon({
  name,
  className,
  size = 18,
}: {
  name?: string | null;
  className?: string;
  size?: number;
}) {
  const Icon = getDepartmentIcon(name);
  return <Icon size={size} className={className} aria-hidden="true" />;
}
