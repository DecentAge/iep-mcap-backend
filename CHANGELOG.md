# Changelog

## [Unreleased]

## [0.4.1] - 2026-07-06
### Added
- XIN support: persist the daily XIN reference price from the ieUnit API as a time series, with one-time CoinGecko (BTC/USD) backfill of historical data.
- `/api/v1/xin/history` endpoint exposing the daily XIN price history with optional date-range filtering.
- Cron now fetches CoinMarketCap currencies and the XIN price independently via `Promise.allSettled`, plus startup backfill and initial price fetch.

### Changed
- Migrated to Node 22; updated dependencies; added integration tests; reproducible npm ci builds.
- Mount routes under a configurable `publicPath` base path; updated sanity checks and logging.

## [0.3.x and earlier]

# Release 0.3.3

# Release 0.3.2
- added readme

# Release 0.3.1
- dockerized project
- upgrade dependencies
- added ci/cd gitlab config
- dont start server on fixed ip
- added npm dependency envsub
