# World Bank indicator cache

Bulk CSV bundles from the World Bank Indicators API, one zip per indicator, each
covering every country and every year. Used by `tools/derive_flags.py`.

| file | indicator | meaning |
|---|---|---|
| `AG.CON.FERT.ZS.zip` | Fertilizer consumption | kg per hectare of **arable** land |
| `AG.LND.ARBL.ZS.zip` | Arable land | % of land area |
| `AG.LND.AGRI.ZS.zip` | Agricultural land | % of land area, **includes pasture** |
| `EN.URB.LCTY.zip` | Population in largest city | people |
| `NY.GDP.MINR.RT.ZS.zip` | Mineral rents | % of GDP |

Source: <https://data.worldbank.org>, CC BY 4.0. The agricultural series originate with
the FAO and are republished by the World Bank, which is easier to query than FAOSTAT.

## Why these are committed

They are 470 KB total and they make the derivation reproducible offline. That matters
more than it sounds: the per-country JSON endpoint returned HTTP 400 on `mrnev=1` and
then throttled into blanket timeouts after a burst of ~80 requests, which is what these
bundles replace. Five downloads, all countries, no rate limiting.

Refresh by deleting a file and re-running the fetch; each takes 30–150 s.

## Known measurement caveats

`AG.CON.FERT.ZS` is per hectare of **arable** land, so pastoral economies read
extremely high — Ireland 896 kg/ha against the Netherlands' 238, which inverts the truth
about which runs the more intensive system. `derive_flags.py` therefore uses it only as
an intensity axis and gates extent on `AG.LND.AGRI.ZS`, which counts pasture.

Mineral rents is an economic proxy and fails for large diversified economies: the United
States reads 0.1% of GDP and China 0.5%, though both are among the world's largest
mining nations in physical terms. Mining land area from Maus et al. 2022
(<https://doi.pangaea.de/10.1594/PANGAEA.942325>, CC BY-SA 4.0) is the right measure and
ships a per-country summary.
