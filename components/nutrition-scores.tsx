'use client';

import React from 'react';
import { Card } from '@/components/ui/card';

interface NutritionScoresProps {
  nutriScore?: { grade?: string; score?: number };
  novaGroup?: number;
  greenScore?: { grade?: string; score?: number };
}

const getScoreColor = (grade: string | undefined) => {
  if (!grade) return 'bg-gray-100 border-gray-300';
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
  if (!grade) return 'text-gray-500';
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
      return 'text-gray-500';
  }
};

const getNovaColor = (group: number | undefined) => {
  if (!group) return 'bg-gray-100 border-gray-300';
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
  if (!group) return 'text-gray-500';
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
      return 'text-gray-500';
  }
};

const getNovaDescription = (group: number | undefined) => {
  switch (group) {
    case 1:
      return 'Aliment brut ou peu transformé';
    case 2:
      return 'Ingrédients culinaires transformés';
    case 3:
      return 'Produit transformé';
    case 4:
      return 'Produit ultra-transformé';
    default:
      return undefined;
  }
};

const NutriScoreLogo = () => (
  <svg viewBox="0 0 160 90" className="h-12 w-12" aria-hidden="true">
    <rect x="0" y="0" width="160" height="90" rx="18" fill="#f6f6f6" />
    <g transform="translate(10,20)">
      <rect width="28" height="50" rx="8" fill="#0a7f42" />
      <rect x="32" width="28" height="50" rx="8" fill="#89c74a" />
      <rect x="64" width="28" height="50" rx="8" fill="#ffd93b" />
      <rect x="96" width="28" height="50" rx="8" fill="#f8a035" />
      <rect x="128" width="28" height="50" rx="8" fill="#eb5a46" />
      <g fill="#ffffff" fontFamily="'Inter', sans-serif" fontWeight="700" fontSize="22" textAnchor="middle" dominantBaseline="central">
        <text x="14" y="25">A</text>
        <text x="46" y="25">B</text>
        <text x="78" y="25" fill="#5c5c5c">C</text>
        <text x="110" y="25">D</text>
        <text x="142" y="25">E</text>
      </g>
    </g>
  </svg>
);

const NovaLogo = () => (
  <svg viewBox="0 0 96 96" className="h-12 w-12" aria-hidden="true">
    <defs>
      <radialGradient id="novaGradient" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#f5f5f5" />
        <stop offset="100%" stopColor="#d6e4ff" />
      </radialGradient>
    </defs>
    <circle cx="48" cy="48" r="44" fill="url(#novaGradient)" />
    <circle cx="48" cy="48" r="36" fill="#ffffff" stroke="#4263eb" strokeWidth="4" />
    <text x="48" y="53" textAnchor="middle" fontFamily="'Inter', sans-serif" fontWeight="700" fontSize="28" fill="#4263eb">
      NOVA
    </text>
  </svg>
);

const GreenScoreLogo = () => (
  <svg viewBox="0 0 96 96" className="h-12 w-12" aria-hidden="true">
    <defs>
      <linearGradient id="leafGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#9de27b" />
        <stop offset="100%" stopColor="#2f9e44" />
      </linearGradient>
    </defs>
    <circle cx="48" cy="48" r="44" fill="#e6f7ec" />
    <path
      d="M48 20c-17 0-30 13-30 32 0 12 6 22 16 28 1 0.6 2.3 0.4 3.1-0.5l10.9-11.7 10.9 11.7c0.8 0.9 2.1 1.1 3.1 0.5 10-5.5 16-16 16-28 0-19-13-32-30-32z"
      fill="url(#leafGradient)"
    />
    <path
      d="M48 24c-11 0-20 10-20 22 0 7.8 3.9 14.6 10.3 18.6l7-7.6c0.8-0.9 2.3-0.9 3.1 0l6.9 7.5C64 60.5 68 53.7 68 46 68 34 59 24 48 24z"
      fill="#ffffff"
      opacity="0.85"
    />
  </svg>
);

export function NutritionScores({
  nutriScore,
  novaGroup,
  greenScore,
}: NutritionScoresProps) {
  if (!nutriScore && !novaGroup && !greenScore) {
    return null;
  }

  const nutriGrade = nutriScore?.grade?.toUpperCase();
  const greenGrade = greenScore?.grade?.toUpperCase();

  const cards = [
    {
      key: 'nutri',
      title: 'Nutri-Score',
      grade: nutriGrade,
      value:
        typeof nutriScore?.score === 'number'
          ? `Score ${Math.round(nutriScore.score)} / 100`
          : undefined,
      subtitle: 'Qualité nutritionnelle globale',
      colorClass: getScoreColor(nutriGrade),
      textColor: getScoreTextColor(nutriGrade),
      logo: <NutriScoreLogo />,
    },
    {
      key: 'nova',
      title: 'NOVA Groupe',
      grade: novaGroup ? `${novaGroup}` : undefined,
      value: getNovaDescription(novaGroup),
      subtitle: 'Niveau de transformation',
      colorClass: getNovaColor(novaGroup),
      textColor: getNovaTextColor(novaGroup),
      logo: <NovaLogo />,
    },
    {
      key: 'green',
      title: 'Green Score',
      grade: greenGrade,
      value:
        typeof greenScore?.score === 'number'
          ? `Score ${Math.round(greenScore.score)} / 100`
          : undefined,
      subtitle: 'Impact environnemental',
      colorClass: getScoreColor(greenGrade),
      textColor: getScoreTextColor(greenGrade),
      logo: <GreenScoreLogo />,
    },
  ];

  return (
    <div className="my-6 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-200">
      <h3 className="text-lg font-semibold text-orange-900 mb-4">Scores Nutritionnels</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map((card) => (
          <Card key={card.key} className={`p-4 border-2 ${card.colorClass}`}>
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center justify-center">{card.logo}</div>
              <div className="text-center">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">{card.title}</p>
                <div className={`text-3xl font-bold ${card.textColor} mt-1`}>
                  {card.grade ?? '—'}
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  {card.value ?? 'Donnée non disponible'}
                </p>
                {card.subtitle && (
                  <p className="text-[11px] text-gray-400 mt-1">{card.subtitle}</p>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
