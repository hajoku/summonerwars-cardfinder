# Summoner Wars Card Finder

Search and filter all cards of Summoner Wars (Second Edition): deck symbol, faction, class, structure, attack type, play phase, ability/effect groups, cost, life and strength. List and table view.

**Live:** https://hajoku.github.io/summonerwars-cardfinder/

## Files

- `index.html`, `style.css`, `app.js`: the card finder
- `data/cards.json`: card data used by the page
- `data/units.csv`, `data/units_full.csv`, `data/events.csv`, `data/abilities.csv`: the same data as spreadsheets (units with ability names, units with full ability text, events, and every ability with its text and groups)
- `img/symbols/`: deck symbols

The page loads its data with `fetch`, so open it through a web server (e.g. GitHub Pages), not as a local file.

Unofficial fan-made reference. Not affiliated with or endorsed by Plaid Hat Games. Summoner Wars, card names, card texts, faction logos and deck symbols © Plaid Hat Games. Card data compiled from sw-zone.com and rulespal.com; it may contain errors — the printed cards are authoritative.
