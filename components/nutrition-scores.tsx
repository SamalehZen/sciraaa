'use client';

import React from 'react';
import { Card } from '@/components/ui/card';

interface NutritionScoresProps {
  nutriScore?: { grade?: string; score?: number };
  novaGroup?: number;
  ecoScore?: { grade?: string; score?: number };
}

const getScoreColor = (grade: string | undefined) => {
  if (!grade) return 'bg-gray-100';
  const upperGrade = grade.toUpperCase();
  switch (upperGrade) {
    case 'A':
      return 'bg-green-100 border-green-300';
    case 'B':
      return 'bg-lime-100 border-lime-300';
    case 'C':
      return 'bg-yellow-100 border-yellow-300';
    case 'D':
      return 'bg-orange-100 border-orange-300';
    case 'E':
      return 'bg-red-100 border-red-300';
    default:
      return 'bg-gray-100 border-gray-300';
  }
};

const getScoreTextColor = (grade: string | undefined) => {
  if (!grade) return 'text-gray-700';
  const upperGrade = grade.toUpperCase();
  switch (upperGrade) {
    case 'A':
      return 'text-green-700';
    case 'B':
      return 'text-lime-700';
    case 'C':
      return 'text-yellow-700';
    case 'D':
      return 'text-orange-700';
    case 'E':
      return 'text-red-700';
    default:
      return 'text-gray-700';
  }
};

const getNovaColor = (group: number | undefined) => {
  if (!group) return 'bg-gray-100';
  switch (group) {
    case 1:
      return 'bg-green-100 border-green-300';
    case 2:
      return 'bg-lime-100 border-lime-300';
    case 3:
      return 'bg-orange-100 border-orange-300';
    case 4:
      return 'bg-red-100 border-red-300';
    default:
      return 'bg-gray-100 border-gray-300';
  }
};

const getNovaTextColor = (group: number | undefined) => {
  if (!group) return 'text-gray-700';
  switch (group) {
    case 1:
      return 'text-green-700';
    case 2:
      return 'text-lime-700';
    case 3:
      return 'text-orange-700';
    case 4:
      return 'text-red-700';
    default:
      return 'text-gray-700';
  }
};

export function NutritionScores({
  nutriScore,
  novaGroup,
  ecoScore,
}: NutritionScoresProps) {
  const hasScores = nutriScore || novaGroup || ecoScore;

  if (!hasScores) return null;

  return (
    <div className="my-6 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-200">
      <h3 className="text-lg font-semibold text-orange-900 mb-4">Scores Nutritionnels</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Nutri-Score */}
        {nutriScore && (
          <Card className={`p-4 border-2 ${getScoreColor(nutriScore.grade)}`}>
            <div className="flex flex-col items-center gap-3">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Nutri-score_logo.svg/800px-Nutri-score_logo.svg.png"
                alt="Nutri-Score"
                className="w-12 h-12 object-contain"
              />
              <div className="text-center">
                <p className="text-xs font-medium text-gray-600 mb-1">Nutri-Score</p>
                {nutriScore.grade && (
                  <div className={`text-3xl font-bold ${getScoreTextColor(nutriScore.grade)}`}>
                    {nutriScore.grade.toUpperCase()}
                  </div>
                )}
                {nutriScore.score !== undefined && (
                  <p className="text-xs text-gray-600 mt-1">{nutriScore.score}/100</p>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Nova Group */}
        {novaGroup && (
          <Card className={`p-4 border-2 ${getNovaColor(novaGroup)}`}>
            <div className="flex flex-col items-center gap-3">
              <img
                src="https://world.openfoodfacts.org/images/misc/nova-group.svg"
                alt="Nova Group"
                className="w-12 h-12 object-contain"
              />
              <div className="text-center">
                <p className="text-xs font-medium text-gray-600 mb-1">NOVA Groupe</p>
                <div className={`text-3xl font-bold ${getNovaTextColor(novaGroup)}`}>
                  {novaGroup}
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {novaGroup === 1 && 'Non transformé'}
                  {novaGroup === 2 && 'Transformé'}
                  {novaGroup === 3 && 'Transformé avancé'}
                  {novaGroup === 4 && 'Ultra-transformé'}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Eco-Score */}
        {ecoScore && (
          <Card className={`p-4 border-2 ${getScoreColor(ecoScore.grade)}`}>
            <div className="flex flex-col items-center gap-3">
              <img
                src="https://world.openfoodfacts.org/images/misc/ecoscore.svg"
                alt="Eco-Score"
                className="w-12 h-12 object-contain"
              />
              <div className="text-center">
                <p className="text-xs font-medium text-gray-600 mb-1">Eco-Score</p>
                {ecoScore.grade && (
                  <div className={`text-3xl font-bold ${getScoreTextColor(ecoScore.grade)}`}>
                    {ecoScore.grade.toUpperCase()}
                  </div>
                )}
                {ecoScore.score !== undefined && (
                  <p className="text-xs text-gray-600 mt-1">{ecoScore.score}/100</p>
                )}
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
