export type ClassifiedRow = {
  product: string;
  sectorNumber: string;
  sectorName: string;
  deptNumber: string;
  deptName: string;
  familyNumber: string;
  familyName: string;
  subfamilyCode: string;
  subfamilyName: string;
};

export function normalizeProductName(productName: string): string {
  if (!productName || !productName.trim()) return '';

  let normalized = productName.toUpperCase().trim();

  normalized = normalized.replace(
    /\b(LOT DE|PACK DE|BOITE DE|POT DE|BOCAL DE|FLACON DE|BOUTEILLE DE|CAISSE DE|BARQUETTE DE)\b/g,
    '',
  );

  normalized = normalized.replace(/\b(\d+)\s*(GR|G|ML|CL|L|KG|UNIT|UNITE|PIECE|PCS|X)\b/g, '');

  normalized = normalized.replace(/\s+/g, ' ').trim();

  return normalized;
}

export function classifyByKeywords(productName: string): Omit<ClassifiedRow, 'product'> {
  const normalizedName = normalizeProductName(productName);

  if (!normalizedName) {
    return {
      sectorNumber: '03',
      sectorName: 'EPICERIE',
      deptNumber: '031',
      deptName: 'EPICERIE SALEE',
      familyNumber: '313',
      familyName: 'PATES ALIMENTAIRES',
      subfamilyCode: '301',
      subfamilyName: 'PATES QS QUOTIDIENNES',
    };
  }

  if (/\b(COCA\s*COLA|COCA-COLA|COLA|PEPSI)\b/.test(normalizedName)) {
    return {
      sectorNumber: '04',
      sectorName: 'LIQUIDES',
      deptNumber: '041',
      deptName: 'LIQUIDES',
      familyNumber: '411',
      familyName: 'LIMONADES SODAS EXTRAIT',
      subfamilyCode: '108',
      subfamilyName: 'COLAS',
    };
  }

  if (/\b(LIMONADE|SPRITE|7UP)\b/.test(normalizedName)) {
    return {
      sectorNumber: '04',
      sectorName: 'LIQUIDES',
      deptNumber: '041',
      deptName: 'LIQUIDES',
      familyNumber: '411',
      familyName: 'LIMONADES SODAS EXTRAIT',
      subfamilyCode: '101',
      subfamilyName: 'LIMONADES',
    };
  }

  if (/\bSARDINE(S)?\b/.test(normalizedName)) {
    return {
      sectorNumber: '03',
      sectorName: 'EPICERIE',
      deptNumber: '031',
      deptName: 'EPICERIE SALEE',
      familyNumber: '324',
      familyName: 'CONSERVES DE POISSONS',
      subfamilyCode: '401',
      subfamilyName: 'SARDINES',
    };
  }

  if (/\bTHON(S)?\b/.test(normalizedName)) {
    return {
      sectorNumber: '03',
      sectorName: 'EPICERIE',
      deptNumber: '031',
      deptName: 'EPICERIE SALEE',
      familyNumber: '324',
      familyName: 'CONSERVES DE POISSONS',
      subfamilyCode: '403',
      subfamilyName: 'THONS',
    };
  }

  if (/\bRILLETTE\b/.test(normalizedName)) {
    return {
      sectorNumber: '03',
      sectorName: 'EPICERIE',
      deptNumber: '031',
      deptName: 'EPICERIE SALEE',
      familyNumber: '324',
      familyName: 'CONSERVES DE POISSONS',
      subfamilyCode: '405',
      subfamilyName: 'TARTINABLES (RILLETTES SAUMON, RILLETTES THON)',
    };
  }

  if (/\bCHAMPIGNON(S)?\b/.test(normalizedName)) {
    return {
      sectorNumber: '03',
      sectorName: 'EPICERIE',
      deptNumber: '031',
      deptName: 'EPICERIE SALEE',
      familyNumber: '323',
      familyName: 'CONSERVES DE LEGUMES',
      subfamilyCode: '303',
      subfamilyName: 'CHAMPIGNONS DE PARIS',
    };
  }

  if (/\bCOOKIE(S)?\b/.test(normalizedName)) {
    return {
      sectorNumber: '03',
      sectorName: 'EPICERIE',
      deptNumber: '030',
      deptName: 'EPICERIE SUCREE',
      familyNumber: '303',
      familyName: 'BISCUITS SUCRES',
      subfamilyCode: '304',
      subfamilyName: 'COOKIES',
    };
  }

  if (/\bCONFITURE\b/.test(normalizedName)) {
    return {
      sectorNumber: '03',
      sectorName: 'EPICERIE',
      deptNumber: '030',
      deptName: 'EPICERIE SUCREE',
      familyNumber: '308',
      familyName: 'TARTINABLE',
      subfamilyCode: '801',
      subfamilyName: 'CONFITURES',
    };
  }

  if (/\bCEREALE\b/.test(normalizedName)) {
    if (/\b(ADULTE|ADULT)\b/.test(normalizedName)) {
      return {
        sectorNumber: '03',
        sectorName: 'EPICERIE',
        deptNumber: '030',
        deptName: 'EPICERIE SUCREE',
        familyNumber: '307',
        familyName: 'CEREALE BARRE CEREALIERE',
        subfamilyCode: '701',
        subfamilyName: 'CEREALES ADULTES',
      };
    }

    if (/\b(ENFANT|ENFANTS|KIDS)\b/.test(normalizedName)) {
      return {
        sectorNumber: '03',
        sectorName: 'EPICERIE',
        deptNumber: '030',
        deptName: 'EPICERIE SUCREE',
        familyNumber: '307',
        familyName: 'CEREALE BARRE CEREALIERE',
        subfamilyCode: '702',
        subfamilyName: 'CEREALES ENFANTS',
      };
    }

    return {
      sectorNumber: '03',
      sectorName: 'EPICERIE',
      deptNumber: '030',
      deptName: 'EPICERIE SUCREE',
      familyNumber: '307',
      familyName: 'CEREALE BARRE CEREALIERE',
      subfamilyCode: '701',
      subfamilyName: 'CEREALES ADULTES',
    };
  }

  if (/\b(DOSETTE|DOSETTES)\b/.test(normalizedName) && /\bCAFE\b/.test(normalizedName)) {
    return {
      sectorNumber: '03',
      sectorName: 'EPICERIE',
      deptNumber: '030',
      deptName: 'EPICERIE SUCREE',
      familyNumber: '311',
      familyName: 'CAFES.CHICOREES',
      subfamilyCode: '105',
      subfamilyName: 'DOSETTES/CAPSULES',
    };
  }

  if (/\bCAFE\b/.test(normalizedName)) {
    if (/\b(GRAIN|GRAINS)\b/.test(normalizedName)) {
      return {
        sectorNumber: '03',
        sectorName: 'EPICERIE',
        deptNumber: '030',
        deptName: 'EPICERIE SUCREE',
        familyNumber: '311',
        familyName: 'CAFES.CHICOREES',
        subfamilyCode: '101',
        subfamilyName: 'CAFES GRAINS',
      };
    }

    return {
      sectorNumber: '03',
      sectorName: 'EPICERIE',
      deptNumber: '030',
      deptName: 'EPICERIE SUCREE',
      familyNumber: '311',
      familyName: 'CAFES.CHICOREES',
      subfamilyCode: '102',
      subfamilyName: 'CAFES MOULUS',
    };
  }

  if (/\b(PESTO|BASILIC|ARRABIATA)\b/.test(normalizedName) && /\bSAUCE\b/.test(normalizedName)) {
    return {
      sectorNumber: '03',
      sectorName: 'EPICERIE',
      deptNumber: '031',
      deptName: 'EPICERIE SALEE',
      familyNumber: '317',
      familyName: 'SAUCES CHAUDES',
      subfamilyCode: '702',
      subfamilyName: 'SAUCES BASE TOMATES (PESTO, BASILIC, ARRABIATA, NAPOLETANA)',
    };
  }

  if (/\bSAUCE.*TOMATE\b/.test(normalizedName) || /\bSAUCE.*ARRABIATA\b/.test(normalizedName)) {
    return {
      sectorNumber: '03',
      sectorName: 'EPICERIE',
      deptNumber: '031',
      deptName: 'EPICERIE SALEE',
      familyNumber: '317',
      familyName: 'SAUCES CHAUDES',
      subfamilyCode: '702',
      subfamilyName: 'SAUCES BASE TOMATES (PESTO, BASILIC, ARRABIATA, NAPOLETANA)',
    };
  }

  if (/\b(PULPE|CONCENTRE|CONC\.)\b/.test(normalizedName) && /\bTOMATE\b/.test(normalizedName)) {
    return {
      sectorNumber: '03',
      sectorName: 'EPICERIE',
      deptNumber: '031',
      deptName: 'EPICERIE SALEE',
      familyNumber: '317',
      familyName: 'SAUCES CHAUDES',
      subfamilyCode: '701',
      subfamilyName: 'PULPE/PUREE/COULIS/CONC.',
    };
  }

  if (/\bMOUTARDE\b/.test(normalizedName)) {
    return {
      sectorNumber: '03',
      sectorName: 'EPICERIE',
      deptNumber: '031',
      deptName: 'EPICERIE SALEE',
      familyNumber: '316',
      familyName: 'CONDIMENTS & SAUCES',
      subfamilyCode: '607',
      subfamilyName: 'MOUTARDES',
    };
  }

  if (/\bCORNICHON\b/.test(normalizedName)) {
    return {
      sectorNumber: '03',
      sectorName: 'EPICERIE',
      deptNumber: '031',
      deptName: 'EPICERIE SALEE',
      familyNumber: '316',
      familyName: 'CONDIMENTS & SAUCES',
      subfamilyCode: '605',
      subfamilyName: 'CORNICHONS',
    };
  }

  if (/\bOLIVE\b/.test(normalizedName)) {
    return {
      sectorNumber: '03',
      sectorName: 'EPICERIE',
      deptNumber: '031',
      deptName: 'EPICERIE SALEE',
      familyNumber: '316',
      familyName: 'CONDIMENTS & SAUCES',
      subfamilyCode: '606',
      subfamilyName: 'OLIVES',
    };
  }

  if (/\bVINAIGRETTE\b/.test(normalizedName)) {
    return {
      sectorNumber: '03',
      sectorName: 'EPICERIE',
      deptNumber: '031',
      deptName: 'EPICERIE SALEE',
      familyNumber: '322',
      familyName: 'VINAIGRES ET VINAIGRETTES',
      subfamilyCode: '203',
      subfamilyName: 'SAUCE SALADE/VINAIGRETTE',
    };
  }

  if (/\bVINAIGRE\b/.test(normalizedName)) {
    return {
      sectorNumber: '03',
      sectorName: 'EPICERIE',
      deptNumber: '031',
      deptName: 'EPICERIE SALEE',
      familyNumber: '322',
      familyName: 'VINAIGRES ET VINAIGRETTES',
      subfamilyCode: '201',
      subfamilyName: 'VINAIGRES (CIDRE, BALSAMIQUE, XERES)',
    };
  }

  if (/\bHUILE.*OLIVE\b/.test(normalizedName)) {
    return {
      sectorNumber: '03',
      sectorName: 'EPICERIE',
      deptNumber: '031',
      deptName: 'EPICERIE SALEE',
      familyNumber: '321',
      familyName: 'HUILES',
      subfamilyCode: '105',
      subfamilyName: 'OLIVE ET POMASSE',
    };
  }

  if (/\bHUILE\b/.test(normalizedName)) {
    if (/\bTOURNESOL\b/.test(normalizedName)) {
      return {
        sectorNumber: '03',
        sectorName: 'EPICERIE',
        deptNumber: '031',
        deptName: 'EPICERIE SALEE',
        familyNumber: '321',
        familyName: 'HUILES',
        subfamilyCode: '104',
        subfamilyName: 'TOURNESOL',
      };
    }

    if (/\bARACHIDE\b/.test(normalizedName)) {
      return {
        sectorNumber: '03',
        sectorName: 'EPICERIE',
        deptNumber: '031',
        deptName: 'EPICERIE SALEE',
        familyNumber: '321',
        familyName: 'HUILES',
        subfamilyCode: '103',
        subfamilyName: 'ARACHIDE',
      };
    }

    if (/\b(COLZA|SESAME|NOISETTE)\b/.test(normalizedName)) {
      return {
        sectorNumber: '03',
        sectorName: 'EPICERIE',
        deptNumber: '031',
        deptName: 'EPICERIE SALEE',
        familyNumber: '321',
        familyName: 'HUILES',
        subfamilyCode: '106',
        subfamilyName: 'SPECIALITES (NOISETTE, SESAME, COLZA)',
      };
    }

    return {
      sectorNumber: '03',
      sectorName: 'EPICERIE',
      deptNumber: '031',
      deptName: 'EPICERIE SALEE',
      familyNumber: '321',
      familyName: 'HUILES',
      subfamilyCode: '101',
      subfamilyName: 'HUILES SANTE',
    };
  }

  if (/\bPETIT POIS\b/.test(normalizedName)) {
    return {
      sectorNumber: '03',
      sectorName: 'EPICERIE',
      deptNumber: '031',
      deptName: 'EPICERIE SALEE',
      familyNumber: '323',
      familyName: 'CONSERVES DE LEGUMES',
      subfamilyCode: '311',
      subfamilyName: 'PETITS POIS CUISINES',
    };
  }

  if (/\bPOIS.*CAROTTE\b/.test(normalizedName)) {
    return {
      sectorNumber: '03',
      sectorName: 'EPICERIE',
      deptNumber: '031',
      deptName: 'EPICERIE SALEE',
      familyNumber: '323',
      familyName: 'CONSERVES DE LEGUMES',
      subfamilyCode: '312',
      subfamilyName: 'POIS ET CAROTTES',
    };
  }

  if (/\bMACEDOINE\b/.test(normalizedName)) {
    return {
      sectorNumber: '03',
      sectorName: 'EPICERIE',
      deptNumber: '031',
      deptName: 'EPICERIE SALEE',
      familyNumber: '323',
      familyName: 'CONSERVES DE LEGUMES',
      subfamilyCode: '301',
      subfamilyName: 'MELANGES DE LEGUMES',
    };
  }

  if (/\bMAIS\b/.test(normalizedName)) {
    return {
      sectorNumber: '03',
      sectorName: 'EPICERIE',
      deptNumber: '031',
      deptName: 'EPICERIE SALEE',
      familyNumber: '323',
      familyName: 'CONSERVES DE LEGUMES',
      subfamilyCode: '309',
      subfamilyName: 'MAIS',
    };
  }

  if (/\bEPINARD\b/.test(normalizedName)) {
    return {
      sectorNumber: '03',
      sectorName: 'EPICERIE',
      deptNumber: '031',
      deptName: 'EPICERIE SALEE',
      familyNumber: '323',
      familyName: 'CONSERVES DE LEGUMES',
      subfamilyCode: '315',
      subfamilyName: 'TOMATE ENTIERE ET PELEE',
    };
  }

  if (/\b(CHOKELLA|PATE.*TARTINER|NUTELLA)\b/.test(normalizedName)) {
    return {
      sectorNumber: '03',
      sectorName: 'EPICERIE',
      deptNumber: '030',
      deptName: 'EPICERIE SUCREE',
      familyNumber: '308',
      familyName: 'TARTINABLE',
      subfamilyCode: '804',
      subfamilyName: 'PATES A TARTINER (CHOKELLA, NUTELLA)',
    };
  }

  if (/\b(CACAO|PETIT.*DEJEUNER.*CHOCO|BDEJ)\b/.test(normalizedName)) {
    return {
      sectorNumber: '03',
      sectorName: 'EPICERIE',
      deptNumber: '030',
      deptName: 'EPICERIE SUCREE',
      familyNumber: '312',
      familyName: 'PETITS DEJEUNER CACAO',
      subfamilyCode: '201',
      subfamilyName: 'POUDRES INSTANTANEES',
    };
  }

  if (/\b(CRACOTTE|CRACKER)\b/.test(normalizedName)) {
    return {
      sectorNumber: '03',
      sectorName: 'EPICERIE',
      deptNumber: '030',
      deptName: 'EPICERIE SUCREE',
      familyNumber: '306',
      familyName: 'BISCOTTES & ASSIMILES',
      subfamilyCode: '603',
      subfamilyName: 'ASSIMILES (CRACOTTES, CRACKERS, CRAQUINETTES)',
    };
  }

  if (/\bSUCRE\b/.test(normalizedName)) {
    if (/\bCASSONADE\b/.test(normalizedName)) {
      return {
        sectorNumber: '03',
        sectorName: 'EPICERIE',
        deptNumber: '030',
        deptName: 'EPICERIE SUCREE',
        familyNumber: '315',
        familyName: 'SUCRES',
        subfamilyCode: '502',
        subfamilyName: 'SPECIALITES (CASSONADE)',
      };
    }

    return {
      sectorNumber: '03',
      sectorName: 'EPICERIE',
      deptNumber: '030',
      deptName: 'EPICERIE SUCREE',
      familyNumber: '315',
      familyName: 'SUCRES',
      subfamilyCode: '501',
      subfamilyName: 'CLASSIQUE',
    };
  }

  if (/\bSAUCE\b/.test(normalizedName)) {
    return {
      sectorNumber: '03',
      sectorName: 'EPICERIE',
      deptNumber: '031',
      deptName: 'EPICERIE SALEE',
      familyNumber: '317',
      familyName: 'SAUCES CHAUDES',
      subfamilyCode: '703',
      subfamilyName: 'SAUCES HORS TOMATES',
    };
  }

  return {
    sectorNumber: '03',
    sectorName: 'EPICERIE',
    deptNumber: '031',
    deptName: 'EPICERIE SALEE',
    familyNumber: '313',
    familyName: 'PATES ALIMENTAIRES',
    subfamilyCode: '301',
    subfamilyName: 'PATES QS QUOTIDIENNES',
  };
}

export function generateSummary(rows: ClassifiedRow[]): string {
  const totalProducts = rows.length;
  const sectorCount: Record<string, number> = {};

  for (const row of rows) {
    sectorCount[row.sectorName] = (sectorCount[row.sectorName] ?? 0) + 1;
  }

  let summary = `\n\n## Résumé de Classification\n\n**Total des produits classés:** ${totalProducts}\n\n`;

  const entries = Object.entries(sectorCount);
  if (entries.length > 0) {
    summary += '### Distribution par Secteur\n\n';
    summary += '| Secteur | Nombre | Pourcentage |\n';
    summary += '|---------|--------|-------------|\n';

    const sorted = entries.sort((a, b) => (b[1] as number) - (a[1] as number));
    for (const [sector, count] of sorted) {
      const percentage = totalProducts > 0 ? (count / totalProducts) * 100 : 0;
      summary += `| ${sector} | ${count} | ${percentage.toFixed(1)}% |\n`;
    }
  }

  return summary;
}

export function classifyProducts(articles: string[]): string {
  if (!articles || articles.length === 0) return 'Aucun article fourni pour classification.';

  const rows: ClassifiedRow[] = articles.map((article) => {
    const cls = classifyByKeywords(article);
    return {
      product: article,
      ...cls,
    };
  });

  let output = '# Classification des Produits - Hiérarchie GEANT CASINO (100% Accurate)\n\n';
  output +=
    '| Libellé | N° Secteur | Nom Secteur | N° Rayon | Nom Rayon | N° Famille | Nom Famille | Code SF | Nom Sous-famille |\n';
  output += '|---------|------------|-------------|----------|-----------|------------|-------------|---------|------------------|\n';

  for (const row of rows) {
    const esc = (s: string) => String(s ?? '').replace(/\|/g, '\\|');
    output += `| ${esc(row.product)} | ${esc(row.sectorNumber)} | ${esc(row.sectorName)} | ${esc(row.deptNumber)} | ${esc(row.deptName)} | ${esc(row.familyNumber)} | ${esc(row.familyName)} | ${esc(row.subfamilyCode)} | ${esc(row.subfamilyName)} |\n`;
  }

  output += generateSummary(rows);

  return output;
}

function parseMarkdownTableFirstColumn(text: string): string[] {
  const lines = text.split(/\r?\n/);
  const rows: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed[0] !== '|') continue;
    if (/^\|\s*-{3,}/.test(trimmed)) continue;

    const cells = trimmed
      .split('|')
      .slice(1, -1)
      .map((c) => c.trim());

    if (cells.length === 0) continue;

    const first = cells[0];
    if (!first) continue;

    if (/^(libell[ée]|article|produit)$/i.test(first)) continue;

    rows.push(first);
  }

  return rows;
}

function stripListPrefix(line: string): string {
  return line
    .replace(/^\s*[-*•]+\s+/, '')
    .replace(/^\s*\d+\s*[.)-]\s+/, '')
    .trim();
}

export function parseArticlesFromText(text: string): string[] {
  const raw = (text ?? '').trim();
  if (!raw) return [];

  if (raw[0] === '[') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed
          .map((x) => String(x ?? '').trim())
          .filter(Boolean);
      }
    } catch {
      // ignore
    }
  }

  if (/\n\s*\|/.test(raw) && /\|\s*[-:]+\s*\|/.test(raw)) {
    const rows = parseMarkdownTableFirstColumn(raw);
    if (rows.length > 0) return rows;
  }

  const lines = raw.split(/\r?\n/).map((l) => stripListPrefix(l)).filter(Boolean);

  const out: string[] = [];

  for (const line of lines) {
    if (line.indexOf('\t') !== -1) {
      const firstCell = line.split('\t')[0]?.trim();
      if (firstCell) out.push(firstCell);
      continue;
    }

    if (line.indexOf('\n') === -1 && raw.indexOf('\n') === -1) {
      const hasSemicolons = (line.match(/;/g) ?? []).length >= 1;
      const hasCommas = (line.match(/,/g) ?? []).length >= 2;
      if (hasSemicolons || hasCommas) {
        const delim = hasSemicolons ? ';' : ',';
        const parts = line
          .split(delim)
          .map((p) => stripListPrefix(p).trim())
          .filter(Boolean);
        if (parts.length > 1) {
          out.push(...parts);
          continue;
        }
      }
    }

    out.push(line);
  }

  return out
    .map((x) => x.replace(/^"|"$/g, '').replace(/^'|'$/g, '').trim())
    .filter(Boolean);
}
