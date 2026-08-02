# Geospatial cache

Small extracts of open geodata, committed so the derivation tools run offline.

| file | source | licence |
|---|---|---|
| `ne_110m_admin_0_countries.geojson` | [Natural Earth](https://www.naturalearthdata.com/) 1:110m admin-0 | public domain |
| `global_mining_area_per_country_v2.csv` | Maus, V et al. (2022), *Global-scale mining polygons (Version 2)*, [PANGAEA](https://doi.org/10.1594/PANGAEA.942325) | CC BY-SA 4.0 |
| `koppen_geiger_0p1_1991_2020.tif` | Beck, H.E. et al. (2023), *High-resolution (1 km) Köppen-Geiger maps for 1901–2099*, [gloh2o.org/koppen](https://www.gloh2o.org/koppen/) | CC BY 4.0 |

## What is deliberately not here

`koppen_geiger_tif.zip`, the 130 MB source bundle, is gitignored. It is over GitHub's
100 MB per-file limit, and 71 of its 72 GeoTIFFs are future SSP scenarios or resolutions
nothing reads. Only the 0.1° observed-period grid is used, so that one file is extracted
and committed at 217 KB. Re-fetch the bundle from
<https://ndownloader.figshare.com/files/61012822> if another period or resolution is
ever wanted; `derive_climate.py` reads the extracted file first and falls back to the
bundle.

## Two traps worth knowing

**Open these TIFFs from memory, not by filename.** `Image.open(path)` on the
LZW-compressed Köppen GeoTIFFs hard-crashes the interpreter in this build — no
traceback, exit code 9 — because opening by name routes through libtiff, while
`Image.open(BytesIO(data))` uses PIL's own decoder. The bytes are identical either way.
`tifffile` cannot read them at all without the optional `imagecodecs` package.

**Natural Earth admin-1 is not as freely licensed as admin-0.** The country outlines
here are cleanly public domain, but the states-and-provinces layer was partly informed
by GADM, which forbids commercial use. Natural Earth's own guidance is to drop the
affected columns. This matters if the map ever renders subnational boundaries.
