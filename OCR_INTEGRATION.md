# 🔍 Intégration PaddleOCR (PP-StructureV3)

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Vercel        │     │   Render         │     │   PaddleOCR     │
│   (Next.js)     │────▶│   (FastAPI)      │────▶│   PP-Structure  │
│                 │     │                  │     │                 │
│  /api/ocr       │     │  /ocr/extract    │     │  - OCR Text     │
│  pdf_ocr tool   │     │  /ocr/extract-   │     │  - Table Det.   │
│                 │     │   structured     │     │  - Layout Anal. │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

## Déploiement du Service OCR sur Render

### Option 1: Déploiement via Blueprint (Recommandé)

1. Connectez votre repo GitHub à Render
2. Render détectera automatiquement le fichier `render.yaml`
3. Cliquez sur "New Blueprint Instance"
4. Le service sera créé automatiquement

### Option 2: Déploiement Manuel

1. Allez sur [Render Dashboard](https://dashboard.render.com)
2. Cliquez sur "New" → "Web Service"
3. Connectez votre repo GitHub
4. Configurez:
   - **Name**: `hyper-ocr-service`
   - **Region**: Frankfurt (EU)
   - **Branch**: main
   - **Root Directory**: `ocr-service`
   - **Runtime**: Python 3
   - **Build Command**: 
     ```bash
     apt-get update && apt-get install -y poppler-utils libgl1-mesa-glx libglib2.0-0 && pip install -r requirements.txt
     ```
   - **Start Command**: `python main.py`
   - **Plan**: Free

5. Ajoutez la variable d'environnement:
   - `PORT`: `8765`

6. Cliquez sur "Create Web Service"

### Vérification du Déploiement

```bash
# Test du health check
curl https://hyper-ocr-service.onrender.com/health

# Réponse attendue:
# {"status":"healthy","service":"pp-structure-v3","version":"2.0.0"}
```

## Configuration Vercel

Ajoutez la variable d'environnement dans Vercel:

```
OCR_SERVICE_URL=https://hyper-ocr-service.onrender.com
```

## Utilisation

### Via l'Agent PDF → Excel

L'agent PDF to Excel utilise automatiquement l'OCR quand un PDF est uploadé:

1. Uploadez un PDF via l'interface
2. L'agent appelle automatiquement l'outil `pdf_ocr`
3. Le texte et les tableaux sont extraits
4. L'agent structure les données en tableaux Markdown

### Via l'API directe

```typescript
// Extraction depuis un fichier
const formData = new FormData();
formData.append('file', pdfFile);
formData.append('language', 'fr');

const response = await fetch('/api/ocr', {
  method: 'POST',
  body: formData,
});

const result = await response.json();
// {
//   success: true,
//   text: "...",
//   markdown: "...",
//   tables: [{ markdown: "...", html: "..." }],
//   pages: 2
// }
```

```typescript
// Extraction depuis une URL
const formData = new FormData();
formData.append('file_url', 'https://example.com/invoice.pdf');
formData.append('language', 'fr');

const response = await fetch('/api/ocr', {
  method: 'POST',
  body: formData,
});
```

## Endpoints du Service OCR

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/health` | GET | Health check |
| `/ocr/extract` | POST | Extraction simple (texte + tableaux markdown) |
| `/ocr/extract-structured` | POST | Extraction structurée (texte + tableaux + HTML) |
| `/ocr/extract-from-url` | POST | Extraction depuis une URL |

## Langues Supportées

- `fr` - Français (défaut)
- `en` - Anglais
- `de` - Allemand
- `es` - Espagnol
- `it` - Italien
- `pt` - Portugais
- `ar` - Arabe
- `ch` - Chinois

## Limitations (Plan Gratuit Render)

- **Spin-down**: Le service se met en veille après 15 min d'inactivité
- **Premier appel**: ~30-60 secondes pour le réveil
- **Mémoire**: 512 MB
- **CPU**: Partagé

### Solutions pour les limitations

1. **Ping régulier**: Configurez un cron job pour garder le service actif
2. **Upgrade**: Plan Starter ($7/mois) pour éviter le spin-down
3. **Cache**: Les modèles PaddleOCR sont pré-téléchargés au build

## Structure des Fichiers

```
ocr-service/
├── main.py           # Service FastAPI
├── requirements.txt  # Dépendances Python
└── build.sh          # Script de build (optionnel)

render.yaml           # Blueprint Render

app/api/ocr/
└── route.ts          # API Next.js (pont vers Render)

lib/
├── ocr-service.ts    # Utilitaires OCR
└── tools/
    └── pdf-ocr.ts    # Outil AI pour l'agent
```

## Troubleshooting

### Le service ne répond pas

```bash
# Vérifier les logs sur Render
# Dashboard → Service → Logs

# Test manuel
curl -X POST https://hyper-ocr-service.onrender.com/ocr/extract-from-url \
  -H "Content-Type: application/json" \
  -d '{"file_url": "https://example.com/test.pdf", "language": "fr"}'
```

### Erreur "Model not found"

Le service télécharge les modèles au premier démarrage. Attendez ~2-3 minutes.

### Timeout sur gros fichiers

- Le plan gratuit a un timeout de 30 secondes
- Pour les gros PDFs (>10 pages), considérez le plan Starter
