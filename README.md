# ACNH — Catchable right now

A single-page landing that shows which fish, bugs, and sea creatures you can
catch *right now* in Animal Crossing: New Horizons (Northern hemisphere),
filtered by the current month and hour.

## Run

```bash
cd web
npm install
npm run dev
```

## Rebuild data

If you edit `Critters.xlsx` or want to refresh icons, re-run the build script:

```bash
git clone https://github.com/Norviah/acnh-images.git  # provides the icons
python3 -m pip install openpyxl
python3 scripts/build_data.py
```

It parses the spreadsheet and copies the matching icons into
`web/public/icons/{fish,bugs,sea}/<slug>.png`, then writes
`web/public/critters.json`.

## Credits

- **Timing / price / location data** comes from the community ACNH Critters
  tracker spreadsheet:
  [Google Sheets](https://docs.google.com/spreadsheets/d/1WjVJYD4kbS5LeeMlD7FhZCc-tDsJewk6yhKDCo_-eXM/edit?gid=0#gid=0).
  A copy of the sheet is checked in as `Critters.xlsx`.
- **Icons** come from [Norviah/acnh-images](https://github.com/Norviah/acnh-images),
  which bundles the ACNH item image dump. The upstream clone is gitignored;
  only the subset of icons this app uses is committed under `web/public/icons/`.
- **Visual design** (scrolling cloud background, scrolling white-triangle
  overlay, white rounded main panel, letter-spaced headings, per-section
  colored "info-boxes", two-tone blue card strips, color palette) is heavily
  inspired by [Tanuki Forest](https://www.tanukiforest.com/). The `sky.png`
  (clouds) and `triangles.png` textures under `web/public/textures/` come
  from their site.

All game assets belong to Nintendo.
