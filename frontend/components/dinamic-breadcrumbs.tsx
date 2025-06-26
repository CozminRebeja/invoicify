// frontend/components/custom/dynamic-breadcrumb.tsx
'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Breadcrumb,
  BreadcrumbEllipsis, // Import the ellipsis component
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
// Home icon import is no longer needed unless you want it elsewhere
// import { Home } from "lucide-react";

const MAX_VISIBLE_SEGMENTS = 3; // Adjust this number to control when the ellipsis appears

export function DynamicBreadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  const capitalize = (s: string) => {
    if (!s) return '';
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  const renderSegments = () => {
    if (segments.length <= MAX_VISIBLE_SEGMENTS) {
      // If the path is short enough, render all segments
      return segments.map((segment, index) => {
        const href = `/${segments.slice(0, index + 1).join('/')}`;
        const isLast = index === segments.length - 1;
        return (
          <React.Fragment key={href}>
            <BreadcrumbItem>
              {isLast ? (
                <BreadcrumbPage>{capitalize(segment)}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={href}>{capitalize(segment)}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {index < segments.length - 1 && <BreadcrumbSeparator />}
          </React.Fragment>
        );
      });
    }

    // If the path is too long, render with an ellipsis
    // Show the first segment, an ellipsis, and the last two segments
    const firstSegment = segments[0];
    const lastTwoSegments = segments.slice(-2);

    return (
      <>
        {/* First Segment */}
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href={`/${firstSegment}`}>{capitalize(firstSegment)}</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />

        {/* Ellipsis */}
        <BreadcrumbItem>
          <BreadcrumbEllipsis />
        </BreadcrumbItem>
        <BreadcrumbSeparator />

        {/* Last Two Segments */}
        {lastTwoSegments.map((segment, index) => {
          const segmentIndex = segments.length - 2 + index;
          const href = `/${segments.slice(0, segmentIndex + 1).join('/')}`;
          const isLast = segmentIndex === segments.length - 1;
          return (
            <React.Fragment key={href}>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{capitalize(segment)}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={href}>{capitalize(segment)}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </React.Fragment>
          );
        })}
      </>
    );
  };

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {segments.length > 0 && <BreadcrumbSeparator />}
        {renderSegments()}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
