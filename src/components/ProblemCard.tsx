'use client';

import { AvalancheProblem, PROBLEM_LABELS, ProblemType } from '@/types/forecast';
import { AspectRose } from './AspectRose';

interface ProblemCardProps {
  problem: AvalancheProblem;
  index?: number;
  compact?: boolean;
}

export function ProblemCard({ problem, index = 1, compact = false }: ProblemCardProps) {
  const problemLabel = PROBLEM_LABELS[problem.type as ProblemType] || problem.type;

  if (compact) {
    return (
      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
        <div className="flex-shrink-0">
          <AspectRose rose={problem.aspect_elevation} size="sm" showLabels={false} />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-medium text-gray-900 truncate">
            #{index} {problemLabel}
          </div>
          <div className="text-xs text-gray-500">
            {problem.likelihood} • {problem.size}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <AspectRose rose={problem.aspect_elevation} size="md" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-900 text-white text-sm font-bold">
              {index}
            </span>
            <h3 className="text-lg font-semibold text-gray-900">{problemLabel}</h3>
          </div>
          <div className="mt-2 flex gap-4 text-sm">
            <div>
              <span className="text-gray-500">Likelihood:</span>{' '}
              <span className="font-medium">{problem.likelihood}</span>
            </div>
            <div>
              <span className="text-gray-500">Size:</span>{' '}
              <span className="font-medium">{problem.size}</span>
            </div>
          </div>
          {problem.details && (
            <p className="mt-2 text-sm text-gray-600">{problem.details}</p>
          )}
        </div>
      </div>
    </div>
  );
}
