# RedCard Frontend

RedCard Frontend is a React application for publishing, previewing, and printing Know Your Rights red cards across multiple languages. The app now uses a route split between a landing page (`/`), an operational red-card workspace (`/redcards`), language deep links (`/redcards/:code`), and a translation builder (`/builder`).

## Who This README Is For

- End users/operators: run the app, pick languages, print cards, and troubleshoot runtime issues.
- Contributors: understand routing, data flow, component boundaries, and backend contract usage.

## Route Map

- `/`: hero landing page with product overview and calls to action.
- `/redcards`: operational workspace for selecting languages and printing cards.
- `/redcards/:code`: same workspace, preselected language from URL (for example `/redcards/es-mx`).
- `/builder`: Red Card translation payload builder.

## What The Frontend Does

1. Loads language metadata and optional print config from backend APIs.
2. Uses route-aware language selection for red cards (`/redcards/:code` takes priority over stored selection).
3. Fetches card data for selected language with request cancellation to avoid stale race results.
4. Renders front/back card preview with source metadata, RTL support, and raw JSON expand/copy.
5. Supports two print engines:
   - backend PDF download
   - browser-native fold-sheet printing
6. Provides a builder workflow to author translation payload JSON from named Red Card statements (no backend submission yet).

## Home Hero (`/`)

The home route is now a dedicated hero page, not the operational tool. It contains:

- headline + summary
- primary CTA: `Go to Red Cards`
- secondary CTA: `Build a Red Card`
- supporting sections: how it works, print modes, trust/verification context, roadmap

Why this exists: users should first understand purpose and options before entering workflow-heavy screens.

## Red Cards Workspace (`/redcards` and `/redcards/:code`)

### Language Selection and Deep Links

- Language picker supports search + keyboard navigation.
- On `/redcards/:code`, the URL code is treated as primary selection input.
- If picker changes language, the app updates URL to `/redcards/<code>`.
- If route code is unknown, app stays on that URL and shows a friendly banner with a “Choose a language” recovery action.

Why this exists: deep links make sharing and reopening exact language contexts reliable for operators.

### Print Modes

- Backend PDF mode: output from `/api/render/{code}?cards_per_page=N&mode=<legacy|fold>`.
- Browser print mode: fold-format sheet preview + `window.print()` workflow.

Browser print guidance shown in UI:

- disable headers/footers
- scale 100%
- portrait orientation
- duplex and flip-edge notes

### Cards Per Page

- Backend layout options come from backend config by mode:
  - fold: fold_layouts (or fallback 4,5,6)
  - legacy: valid_layouts (or fallback 4,6,8,12)
- Browser mode options are fixed (`8,10,12` total cards).

### Preview and Content Safety

- Front/back flip preview.
- RTL-aware card rendering.
- Source attribution + verification badge display.
- Official/unofficial badge.
- Font support warnings when backend PDF cannot render language fonts.
- Friendly error messaging for API failures (`400/404/503/5xx`, including `font_not_available`).

## Translation Builder (`/builder`)

The builder is a frontend-only authoring tool for creating Red Card payload JSON using guided fields instead of manual JSON editing.

### Current Builder UX

- Desktop split layout:
  - left: language basics + statement inputs
  - right: live card preview + export actions
- Mobile/tablet layout stacks vertically.
- Inputs include:
  - language name
  - language code (normalized display)
  - RTL toggle
  - header
  - fixed statement set from Red Card schema
- Validation requires all core fields and required statements.

### Export Actions

- `Print From Browser`
- `Copy JSON`
- `Download JSON`
- `Reset Form`

Generated payload retains compatibility fields:

- `front.named_points`
- `front.bullets`

`front.bullets` is derived from named points and preserves the merge rule where card handoff + inside-home guidance become one final bullet.

### About Modal and Future Work

Builder includes an `About This Tool` modal that explains:

- current local usage
- future planned capabilities:
  - backend review submission
  - machine translation provider integration
  - duplicate-check against stored translations
  - optional caching layer

Note: advanced provider controls are currently not exposed in builder UI, but adapter architecture exists in code.

## State Persistence

The app uses localStorage keys:

- `selected-language`
- `selected-cards-per-page`
- `selected-print-method`
- `theme-preference`

On redcards deep-link routes, URL language code takes precedence over stored language.

## Backend Contract Used by Frontend

### Environment Variable

- `VITE_API_BASE` (default: `http://localhost:8000`)

### Endpoints

- `GET /api/languages`
- `GET /api/config`
- `GET /api/card/{code}`
- `GET /api/render/{code}?cards_per_page=N&mode=legacy|fold`

### Response Fields Consumed

`/api/languages` items:

- `code`
- `name`
- `fontSupported`
- `rtl`

`/api/card/{code}`:

- `name`, `code`, `rtl`, `official`
- `front.header` or `front.title`
- `front.bullets` or `front.points`
- `source.type`, `source.origin`, `source.url`, `source.verified`

`/api/config`:

- `valid_layouts`
- `default_cards_per_page`
- `fold_layouts`
- `default_fold_cards_per_page`
- `render_modes`
- `page_size`

### API Error Handling

Frontend maps error statuses to user-facing messages:

- `400` with `error_type: font_not_available`
- `404` language/card missing
- `503` service not ready
- `5xx` generic backend failure

## Getting Started

### Prerequisites

- Node.js 18+
- running backend service exposing API endpoints above

### Install

```bash
npm install
```

### Environment

Create `.env`:

```env
VITE_API_BASE=http://localhost:8000
```

### Development

```bash
npm run dev
```

### Production Build

```bash
npm run build
npm run preview
```

## Troubleshooting

### Invalid language URL

If `/redcards/<code>` shows an unavailable code banner, use `Choose a language` and reselect from the picker.

### PDF unavailable for selected language

If font support is missing (`fontSupported: false`), backend PDF may be disabled; use browser print fallback.

### Browser print output looks wrong

Disable browser headers/footers, set scale to 100%, use portrait orientation, and verify duplex settings.

## Project Structure

```text
redcard-frontend/
|-- src/
|   |-- components/
|   |   |-- HeroLanding.jsx
|   |   |-- CardPreview.jsx
|   |   |-- LanguagePicker.jsx
|   |   |-- LayoutPicker.jsx
|   |   |-- PdfDownloadButton.jsx
|   |   |-- FontWarning.jsx
|   |   |-- ThemeToggle.jsx
|   |   |-- TranslationPayloadBuilder.jsx
|   |   |-- ErrorBoundary.jsx
|   |   `-- LoadingSpinner.jsx
|   |-- features/
|   |   `-- translationBuilder/
|   |       |-- TranslationBuilderPage.jsx
|   |       |-- TranslationBuilder.css
|   |       |-- index.js
|   |       |-- adapters/
|   |       |   |-- contracts.js
|   |       |   `-- defaults.js
|   |       |-- components/
|   |       |   |-- BuilderHeader.jsx
|   |       |   |-- LanguageBasicsSection.jsx
|   |       |   |-- StatementsSection.jsx
|   |       |   |-- StatementRow.jsx
|   |       |   |-- LivePreviewSection.jsx
|   |       |   |-- ExportSection.jsx
|   |       |   `-- AdvancedSection.jsx
|   |       |-- hooks/
|   |       |   `-- useTranslationBuilderController.js
|   |       |-- selectors/
|   |       |   `-- builderSelectors.js
|   |       |-- state/
|   |       |   |-- builderReducer.js
|   |       |   `-- builderState.js
|   |       `-- utils/
|   |           `-- exportJson.js
|   |-- hooks/
|   |   |-- useLanguages.js
|   |   `-- useCard.js
|   |-- constants/
|   |   `-- redCardSchema.js
|   |-- services/
|   |   `-- translationProviders.js
|   |-- utils/
|   |   `-- redCardPayload.js
|   |-- App.jsx
|   |-- App.css
|   |-- api.js
|   |-- index.css
|   `-- main.jsx
```

## Limitations and Non-Goals

- Frontend does not submit builder translations to backend yet.
- Frontend does not manage translation approval or font pack provisioning.
- Browser print fidelity depends on user print-dialog settings and local printer behavior.

## License

MIT
