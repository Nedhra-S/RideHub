# RideHub - Bike & Riding Companion
Front End Design and Testing (CSI3029) - TH Assessment 1

## How to run (no installation needed)
1. Unzip the folder.
2. Double-click `index.html` (opens in Chrome / Edge / Firefox).
That's it. Data (rides, cart, goal) is saved in your browser's localStorage.

## Pages
| File | Page | Main features |
|---|---|---|
| index.html | Dashboard | stats, 7-day chart, monthly goal ring, maintenance tracker, pre-ride checklist, achievements, recent rides |
| routes.html | Routes | search, difficulty filter, sort, favourites, details dialog |
| tracking.html | Map & Tracking | GPS location, saved last-seen bike location, OpenStreetMap workshop search |
| gear.html | Gear Shop | category filter, sort, cart drawer, quantity controls, 10% discount over Rs 5,000 |
| ridelog.html | Ride Log | validated form, live avg speed, delete, CSV export |
| contact.html | Join the Club | validated sign-up form, success state, FAQ accordion |

All pages: responsive (mobile menu), light/dark theme toggle, keyboard-friendly, accessible labels.

## Project structure
```
index.html routes.html gear.html ridelog.html contact.html
css/styles.css          one stylesheet (CSS variables, grid, flexbox, media queries)
src/*.ts                TypeScript source (edit these)
js/*.js                 compiled JavaScript (what the browser loads)
screenshots/            test screenshots of every page
tsconfig.json
```

## Editing the TypeScript (optional)
Needs Node.js. Run `npm install -g typescript` once, then `tsc -p .` in this folder to rebuild `js/`.

## Tech
HTML5, CSS3, TypeScript (compiled to JavaScript), inline SVG charts, localStorage.
