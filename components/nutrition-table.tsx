'use client';

import React from 'react';

interface NutritionTableProps {
  nutrients?: Record<string, string | number>;
  className?: string;
}

const nutritionKeys = [
  'calories', 'énergie', 'energy',
  'protéines', 'protein', 'proteins',
  'graisses', 'lipides', 'fat', 'fats',
  'glucides', 'carbohydrates', 'carbs',
  'sucres', 'sugar', 'sugars',
  'sodium', 'sel', 'salt',
  'fibres', 'fiber', 'fibers', 'fibres alimentaires',
  'calcium', 'fer', 'iron', 'magnésium', 'potassium',
  'vitamine', 'vitamin',
];

const isPercentage = (value: string | number): boolean => {
  const strValue = String(value).toLowerCase();
  return strValue.includes('%');
};

const isCriticalPercentage = (value: string | number): boolean => {
  const strValue = String(value);
  const match = strValue.match(/(\d+(?:[.,]\d+)?)\s*%/);
  if (!match) return false;
  const percentage = parseFloat(match[1].replace(',', '.'));
  return percentage >= 30;
};

export function NutritionTable({
  nutrients,
  className = '',
}: NutritionTableProps) {
  if (!nutrients) return null;

  const nutritionData: Array<[string, string | number]> = [];

  Object.entries(nutrients).forEach(([key, value]) => {
    const lowerKey = key.toLowerCase();
    if (nutritionKeys.some(nKey => lowerKey.includes(nKey)) && value) {
      nutritionData.push([key, value]);
    }
  });

  if (nutritionData.length === 0) return null;

  return (
    <div className={`my-6 overflow-x-auto ${className}`}>
      <div className="min-w-full inline-block align-middle">
        <table className="w-full border-collapse rounded-lg overflow-hidden shadow-sm">
          <thead>
            <tr className="bg-orange-500 text-white">
              <th className="px-6 py-3 text-left text-sm font-semibold">Nutriment</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Valeur</th>
            </tr>
          </thead>
          <tbody>
            {nutritionData.map((item, index) => {
              const [key, value] = item;
              const isAlternate = index % 2 === 0;
              const isCritical = isCriticalPercentage(value);
              const cleanKey = key.replace(/[_-]/g, ' ').trim();
              const cleanValue = String(value);

              return (
                <tr
                  key={`${key}-${index}`}
                  className={`border-b border-gray-200 ${
                    isAlternate ? 'bg-white' : 'bg-gray-50'
                  } hover:bg-orange-50 transition-colors`}
                >
                  <td className="px-6 py-3 text-sm font-medium text-gray-700">
                    {cleanKey}
                  </td>
                  <td
                    className={`px-6 py-3 text-sm font-semibold ${
                      isCritical && isPercentage(value)
                        ? 'text-red-600'
                        : 'text-gray-900'
                    }`}
                  >
                    {cleanValue}
                    {isCritical && isPercentage(value) && (
                      <span className="ml-2 text-red-600">⚠️</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {nutritionData.some(([_, v]) => isCriticalPercentage(v) && isPercentage(v)) && (
        <p className="text-xs text-gray-500 mt-2">
          ⚠️ <span className="text-red-600 font-semibold">Valeurs en rouge</span> indiquent un pourcentage ≥ 30%
        </p>
      )}
    </div>
  );
}
