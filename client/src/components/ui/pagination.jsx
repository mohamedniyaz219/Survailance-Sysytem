import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from './button';

export function Pagination({
  page,
  totalPages,
  onPageChange,
  className
}) {
  if (!totalPages || totalPages <= 1) return null;

  const pages = [];
  const start = Math.max(1, page - 1);
  const end = Math.min(totalPages, page + 1);

  for (let i = start; i <= end; i += 1) {
    pages.push(i);
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Button
        variant="outline"
        size="sm"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        <ChevronLeft size={16} />
        Prev
      </Button>

      {start > 1 && (
        <Button variant="outline" size="sm" onClick={() => onPageChange(1)}>
          1
        </Button>
      )}

      {start > 2 && <span className="px-1 text-silver-500">...</span>}

      {pages.map((item) => (
        <Button
          key={item}
          variant={item === page ? 'default' : 'outline'}
          size="sm"
          onClick={() => onPageChange(item)}
        >
          {item}
        </Button>
      ))}

      {end < totalPages - 1 && <span className="px-1 text-silver-500">...</span>}

      {end < totalPages && (
        <Button variant="outline" size="sm" onClick={() => onPageChange(totalPages)}>
          {totalPages}
        </Button>
      )}

      <Button
        variant="outline"
        size="sm"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Next
        <ChevronRight size={16} />
      </Button>
    </div>
  );
}
