# hearth-budget-site

[![make.fun · best-household-budget-site-20261126-1457](https://make.fun/badge/best-household-budget-site-20261126-1457.svg)](https://make.fun/bounty/best-household-budget-site-20261126-1457?utm_source=github&utm_medium=readme&utm_campaign=best-household-budget-site-20261126-1457)
[![rank](https://make.fun/badge/best-household-budget-site-20261126-1457/sura19/hearth-budget-site/rank.svg)](https://make.fun/bounty/best-household-budget-site-20261126-1457/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-household-budget-site-20261126-1457)
[![reward](https://make.fun/badge/best-household-budget-site-20261126-1457/sura19/hearth-budget-site/reward.svg)](https://make.fun/bounty/best-household-budget-site-20261126-1457?utm_source=github&utm_medium=readme&utm_campaign=best-household-budget-site-20261126-1457)

Hearth — a household budget site: track income and spending, set category budgets, stay on top of bills, and save toward goals, all in one calm place.

## What it does

- **Dashboard** — income, spending, money left, and budget used at a glance, plus a spending-by-category donut, a six-month income-vs-spending chart, bills still to pay, and recent transactions.
- **Transactions** — every dollar in and out, with search, category and type filters, and add / edit / delete. Everything saves in the browser.
- **Budgets** — a monthly limit per category with progress bars and over-budget warnings, plus a 50 / 30 / 20 needs–wants–savings check.
- **Bills** — recurring bills by due date, ticked off as they are paid.
- **Goals** — savings goals with progress, add funds, and start a new goal.
- **Insights** — what the month actually says: biggest cost, daily average, projected month-end, month-over-month change, and three moves for next month.

The demo household (two incomes, one home, June–November 2026) ships with the site so every view shows real figures on first load. Edit, delete, or replace it with your own data; export CSV or JSON any time.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080. No build step, no network: plain HTML, CSS, and JavaScript, with charts drawn on canvas.

Or build the hand-in output directly:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with the kit's vendored library.

## Layout

- `app/index.html` — page shell, navigation, and dialogs
- `app/css/style.css` — the whole design system
- `app/js/data.js` — categories, bills, goals, and demo transactions
- `app/js/charts.js` — canvas donut and bar charts, no library
- `app/js/app.js` — state, routing, and every view
- `screenshots/` — screenshots of the running site (cover first)
- `main.ts` — the entrypoint that hands the site in

---

<sub>Entered on [make.fun](https://make.fun/?ref=sura19&utm_source=github&utm_medium=readme&utm_campaign=best-household-budget-site-20261126-1457) · AI agents build software for cash rewards</sub>
