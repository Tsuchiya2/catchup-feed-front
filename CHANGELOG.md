# Changelog

## [1.6.0](https://github.com/Tsuchiya2/catchup-feed-frontend/compare/catchup-feed-web-v1.5.1...catchup-feed-web-v1.6.0) (2026-01-10)


### Features

* **deps:** upgrade Next.js 16.1.1, React 19.2.3, migrate to [@serwist](https://github.com/serwist)… ([4ef5f70](https://github.com/Tsuchiya2/catchup-feed-frontend/commit/4ef5f704a2b9b66dbe43401e37a67066cab05ed9))
* **deps:** upgrade Next.js 16.1.1, React 19.2.3, migrate to @serwist/next ([9318a78](https://github.com/Tsuchiya2/catchup-feed-frontend/commit/9318a7816b5eeff4657d2d846141dc370354b1fe))


### Bug Fixes

* add .npmrc for legacy-peer-deps and format API endpoints ([a990275](https://github.com/Tsuchiya2/catchup-feed-frontend/commit/a9902750742881e5e16e63cb3933d654780daedf))
* address CodeRabbit review feedback ([c234895](https://github.com/Tsuchiya2/catchup-feed-frontend/commit/c23489540c0e8b7f6d78a8af3e4cc04de7f1ce15))
* **ci:** add --legacy-peer-deps for Next.js 16 peer dependency conflicts ([8839082](https://github.com/Tsuchiya2/catchup-feed-frontend/commit/88390827f54f14ad78e986daaffa9706e539b3fd))
* **vercel:** use webpack build for Serwist compatibility ([c2827ec](https://github.com/Tsuchiya2/catchup-feed-frontend/commit/c2827ec2b9f73cb39b10e7ea71e63c8f5666df18))

## [1.5.1](https://github.com/Tsuchiya2/catchup-feed-frontend/compare/catchup-feed-web-v1.5.0...catchup-feed-web-v1.5.1) (2026-01-10)


### Bug Fixes

* **test:** wrap window.dispatchEvent in act() for PWAInstallPrompt tests ([98f83a0](https://github.com/Tsuchiya2/catchup-feed-frontend/commit/98f83a09c2fe656d35b245706a662d7896a24cbf))
* **test:** wrap window.dispatchEvent in act() for PWAInstallPrompt tests ([d84f327](https://github.com/Tsuchiya2/catchup-feed-frontend/commit/d84f327188d68848dcb99d60daad558398a869ea))

## [1.5.0](https://github.com/Tsuchiya2/catchup-feed-frontend/compare/catchup-feed-web-v1.4.0...catchup-feed-web-v1.5.0) (2026-01-10)


### Features

* **sources:** ADMIN_USERによるSource削除機能を追加 ([fd7142a](https://github.com/Tsuchiya2/catchup-feed-frontend/commit/fd7142a108542bc0114de383cddbc5b4a59973ba))


### Bug Fixes

* **sources:** address CodeRabbitAI review comments for delete performance tests ([3e82ee8](https://github.com/Tsuchiya2/catchup-feed-frontend/commit/3e82ee8fd36ff8a9b1bdd7f83be715b940008b1c))
* **sources:** fix performance measurement timing in delete E2E test ([ff0ff50](https://github.com/Tsuchiya2/catchup-feed-frontend/commit/ff0ff5008b0e5f515a1f62b4d52669ca971bf23d))
* **sources:** resolve TypeScript compilation errors ([d16afdc](https://github.com/Tsuchiya2/catchup-feed-frontend/commit/d16afdc8df2d9667a034d52e3a8d58fa1b84caf9))

## [1.4.0](https://github.com/Tsuchiya2/catchup-feed-frontend/compare/catchup-feed-web-v1.3.0...catchup-feed-web-v1.4.0) (2026-01-09)


### Features

* **search:** filter Articles page source dropdown to show active sou… ([a3a64fa](https://github.com/Tsuchiya2/catchup-feed-frontend/commit/a3a64fa4fdcd0faca43e79fc7fd5c66d6672b30f))
* **search:** filter Articles page source dropdown to show active sources only ([d74111c](https://github.com/Tsuchiya2/catchup-feed-frontend/commit/d74111c3af44851b3972a57a152804024f36a4f5))

## [1.3.0](https://github.com/Tsuchiya2/catchup-feed-frontend/compare/catchup-feed-web-v1.2.0...catchup-feed-web-v1.3.0) (2026-01-05)


### Features

* add active/inactive toggle for sources (admin only) ([08ec16b](https://github.com/Tsuchiya2/catchup-feed-frontend/commit/08ec16ba4b4c02ca9c660ca16ce7733add461961))
* add active/inactive toggle for sources (admin only) ([e41d98a](https://github.com/Tsuchiya2/catchup-feed-frontend/commit/e41d98a28efd955ce30c9cd3ac2cc43ec120a6bd))
* add GitHub Actions CI and fix various issues ([80db2f0](https://github.com/Tsuchiya2/catchup-feed-frontend/commit/80db2f0ffb7efbdb5a231633696ab3902960c808))
* add GitHub Actions CI and fix various issues ([25404e0](https://github.com/Tsuchiya2/catchup-feed-frontend/commit/25404e04959974568db491aadf5249ca6cbe7683))
* add mock API endpoint for article search ([71b55cf](https://github.com/Tsuchiya2/catchup-feed-frontend/commit/71b55cffcc08e1213e7ac2d80d63e841bc4ba098))
* add PWA support, token refresh, and observability infrastructure ([6323098](https://github.com/Tsuchiya2/catchup-feed-frontend/commit/6323098695213af54295400f88966728143c889c))
* add source creation dialog for admin users ([e39c22b](https://github.com/Tsuchiya2/catchup-feed-frontend/commit/e39c22b85581f49d2c5e118106d7d9de509d2ef2))
* add source creation dialog for admin users ([9fe1737](https://github.com/Tsuchiya2/catchup-feed-frontend/commit/9fe173759ec9c414b13df88ec2521715dfee6afb))
* add source_name field support for article API response ([#1](https://github.com/Tsuchiya2/catchup-feed-frontend/issues/1)) ([62766d3](https://github.com/Tsuchiya2/catchup-feed-frontend/commit/62766d3811abcafa6421beae673fd175224dc5cb))
* add source_name field support for article API response ([#1](https://github.com/Tsuchiya2/catchup-feed-frontend/issues/1)) ([382a3ac](https://github.com/Tsuchiya2/catchup-feed-frontend/commit/382a3ac3fbd6e1a30cf40d18a6315ae7bbfc6503))
* ADMIN_USERによるSource編集機能を追加 ([9b83226](https://github.com/Tsuchiya2/catchup-feed-frontend/commit/9b83226da7298d54dd5c22449f8caef6ce141382))
* ADMIN_USERによるSource編集機能を追加 ([e7a9a5d](https://github.com/Tsuchiya2/catchup-feed-frontend/commit/e7a9a5df1f20b3449c3f262c9af8f0e9f8f4d508))
* apply cyber/tech theme UI based on brand logo ([ff5c203](https://github.com/Tsuchiya2/catchup-feed-frontend/commit/ff5c20343bd4a55aa3315dd2af6e7f7dfe93e394))
* apply cyber/tech theme UI based on brand logo ([69bca6e](https://github.com/Tsuchiya2/catchup-feed-frontend/commit/69bca6e67c1336672387f372a603f98eb06571ff))
* implement project improvements phase 1-3 ([f5f905f](https://github.com/Tsuchiya2/catchup-feed-frontend/commit/f5f905fa4a8fa7012fb500023bcf7f85e8440f6c))
* migrate Tailwind config from JS to CSS-first approach ([19c6cde](https://github.com/Tsuchiya2/catchup-feed-frontend/commit/19c6cde3c8b684b10ac5ab03f1a846fc5cea7a5b))
* remove Today quick filter button from DateRangePicker ([530410a](https://github.com/Tsuchiya2/catchup-feed-frontend/commit/530410a91d7f70754f261aa87ea99e5b6d6d8863))
* remove Today quick filter button from DateRangePicker ([b46e755](https://github.com/Tsuchiya2/catchup-feed-frontend/commit/b46e75572a4effa21872aa2d699e871e26563003))
* replace header logo text with custom icon ([078cc97](https://github.com/Tsuchiya2/catchup-feed-frontend/commit/078cc971cf8c72d43bb19c6c54ea78e2263b49a9))
* replace header logo text with custom icon ([5273ba5](https://github.com/Tsuchiya2/catchup-feed-frontend/commit/5273ba539851711c0492554880d4c0199e5573f9))
* replace landing page logo text with custom icon ([c5dd50a](https://github.com/Tsuchiya2/catchup-feed-frontend/commit/c5dd50a6fa3bd0b47c3b051f716a1269eb0999e1))
* replace landing page logo text with custom icon ([bbd21ac](https://github.com/Tsuchiya2/catchup-feed-frontend/commit/bbd21acc2a2b073c3c49ffe5b8e9578bc45eb7cd))
* **security:** implement CSRF protection with Double Submit Cookie p… ([cc15fba](https://github.com/Tsuchiya2/catchup-feed-frontend/commit/cc15fba1f870b4c513660e87c20c91de339791fe))
* **security:** implement CSRF protection with Double Submit Cookie pattern ([ef062ea](https://github.com/Tsuchiya2/catchup-feed-frontend/commit/ef062ea3f664793c14e8909fa317a1657d1399ff))


### Bug Fixes

* address CodeRabbit review feedback ([4ab7f58](https://github.com/Tsuchiya2/catchup-feed-frontend/commit/4ab7f5896e98c84ed8accf77fb2ced621bf8cd5a))
* address CodeRabbit review feedback ([5f981b5](https://github.com/Tsuchiya2/catchup-feed-frontend/commit/5f981b560c31d89cfad1c48c5ff3f094b2779db4))
* **api:** use /articles/search endpoint for date filtering ([2a14307](https://github.com/Tsuchiya2/catchup-feed-frontend/commit/2a1430755fdc9b5b3e15e7a0fa4d9ea5b19f75c7))
* **api:** use /articles/search endpoint for date filtering ([6ef307f](https://github.com/Tsuchiya2/catchup-feed-frontend/commit/6ef307f8dc8eb385484f42d24d11fb8075a759ed))
* **api:** use real backend API for article search instead of mock ([84f77e8](https://github.com/Tsuchiya2/catchup-feed-frontend/commit/84f77e8e94a28554773da0458b51b11e244ba35e))
* **api:** use real backend API for article search instead of mock ([fc9eacd](https://github.com/Tsuchiya2/catchup-feed-frontend/commit/fc9eacd8ff8a49c5cd2c9a246cf4065f3e25377a))
* handle 204 No Content responses in API client ([c9182d2](https://github.com/Tsuchiya2/catchup-feed-frontend/commit/c9182d22f232ba09a5ce7091592bbe5263fd9ec3))
* handle 204 No Content responses in API client ([69ebfba](https://github.com/Tsuchiya2/catchup-feed-frontend/commit/69ebfbad82279613ca15d5b6abf9b5811cc26609))
* improve Add Source form and fix API client tests ([78ff8f2](https://github.com/Tsuchiya2/catchup-feed-frontend/commit/78ff8f20a58edc861796f2715acf510702a58927))
* **lint:** add storybook-static to eslintignore ([91da754](https://github.com/Tsuchiya2/catchup-feed-frontend/commit/91da754cad0e49c78c827b8372237f40833204bc))
* **lint:** resolve Prettier and ESLint formatting issues ([43aa94b](https://github.com/Tsuchiya2/catchup-feed-frontend/commit/43aa94bf173bc91fde50d8d626b26f84dd5c4c13))
* remove extra blank line in terms page to fix prettier error ([dec3686](https://github.com/Tsuchiya2/catchup-feed-frontend/commit/dec3686fa5b4e0225f3599598644958bb0ccff9d))
* remove obsolete tailwind.config.ts mount from compose.yml ([6a33f55](https://github.com/Tsuchiya2/catchup-feed-frontend/commit/6a33f55e5d6dc4f2ae85ddbcd010f0cfe05af34e))
* remove obsolete tailwind.config.ts mount from compose.yml ([77c486a](https://github.com/Tsuchiya2/catchup-feed-frontend/commit/77c486ae568e93c8b5dc254312bfb9e4757c3a16))
* remove out-of-scope settings changes ([00766e3](https://github.com/Tsuchiya2/catchup-feed-frontend/commit/00766e3d51d8f48f06a1309fd3173cd6e22f0655))
* replace radix-ui Select with native select in Pagination ([75c7496](https://github.com/Tsuchiya2/catchup-feed-frontend/commit/75c74965e0066f3b650999b4cff38f4498fab68a))
* replace radix-ui Select with native select in Pagination ([d0b6212](https://github.com/Tsuchiya2/catchup-feed-frontend/commit/d0b62120b219e82942e1fdf1c62794cff9a17cf3))
* **test:** add explicit toBeDefined() checks per CodeRabbit review ([c110a99](https://github.com/Tsuchiya2/catchup-feed-frontend/commit/c110a99dd3189208b35ef85a04f09645b56ba062))
* **test:** add non-null assertions for array access in article tests ([2441580](https://github.com/Tsuchiya2/catchup-feed-frontend/commit/2441580f8656fc68deac90d4ca962f05539244b8))
* **test:** resolve CI test and type check failures ([11a0d5e](https://github.com/Tsuchiya2/catchup-feed-frontend/commit/11a0d5eae1cb0c8ed23144160df30497a853cb2e))
* **tests:** resolve lint and TypeScript errors in CSRF test files ([f5c3d0a](https://github.com/Tsuchiya2/catchup-feed-frontend/commit/f5c3d0ada46344e0129413a85c77e320c9c5585c))
* **tests:** resolve TypeScript errors in useUpdateSource tests ([84652ef](https://github.com/Tsuchiya2/catchup-feed-frontend/commit/84652ef330315a7dc54ac727ec4f7ff9ba1afd62))
* update og:url to pulse.catchup-feed.com ([b0319d0](https://github.com/Tsuchiya2/catchup-feed-frontend/commit/b0319d0464135af6af6499ae5d5a3fed01cb2b4c))
* update og:url to pulse.catchup-feed.com ([ecfe31c](https://github.com/Tsuchiya2/catchup-feed-frontend/commit/ecfe31c3b95b3f054c1adbf951cc60d7d4d3dcf1))


### Code Refactoring

* remove duplicate feed URL link test ([f2f301f](https://github.com/Tsuchiya2/catchup-feed-frontend/commit/f2f301f06e03c82d6d813adcdd1bce1a6afc1d50))


### Documentation

* add requirements document and README ([0f5a094](https://github.com/Tsuchiya2/catchup-feed-frontend/commit/0f5a0943806c41b82ccdaf927fcf8fef0132ccdb))
* improve project presentation for portfolio ([850f672](https://github.com/Tsuchiya2/catchup-feed-frontend/commit/850f6727ac58444ed2c1b3cc50b781615a3eb68a))
* improve project presentation for portfolio ([c3988e1](https://github.com/Tsuchiya2/catchup-feed-frontend/commit/c3988e18a193a6564c1c140e9310e7fb90a51260))


### Miscellaneous

* improve project security, testing, and configuration ([e160c16](https://github.com/Tsuchiya2/catchup-feed-frontend/commit/e160c161243d969bb5b7e3011fa6aa170e19a36f))
* improve project security, testing, and configuration ([7b3361e](https://github.com/Tsuchiya2/catchup-feed-frontend/commit/7b3361e2a7456b3a2e67f8d5567c07bfd2aa44fd))
* **main:** release 0.2.0 ([1ae4267](https://github.com/Tsuchiya2/catchup-feed-frontend/commit/1ae4267db5366b7249635afd298e0f9b5d5a9f2f))
* **main:** release 0.2.0 ([cc73243](https://github.com/Tsuchiya2/catchup-feed-frontend/commit/cc73243156d2cc2832b6cf690758e9bcf12554d7))
* **main:** release 0.3.0 ([c4659b1](https://github.com/Tsuchiya2/catchup-feed-frontend/commit/c4659b10400ac7021d256f960197743ca750b558))
* **main:** release 0.3.0 ([7409f45](https://github.com/Tsuchiya2/catchup-feed-frontend/commit/7409f455d3c027cfc8c83b0d2472de0bff3ce7c4))
* **main:** release 0.4.0 ([46256ef](https://github.com/Tsuchiya2/catchup-feed-frontend/commit/46256efadcb23cf93ed941f2e7661813abf1ab56))
* **main:** release 0.4.0 ([fdf5a81](https://github.com/Tsuchiya2/catchup-feed-frontend/commit/fdf5a8196aa598ca0c18ea6e898693eff4fb945d))
* **main:** release 0.5.0 ([eb4de95](https://github.com/Tsuchiya2/catchup-feed-frontend/commit/eb4de9597da072f83a1c3f0dbf561f99a98734ed))
* **main:** release 0.5.0 ([1741082](https://github.com/Tsuchiya2/catchup-feed-frontend/commit/1741082ee279f8fffbf8d2620d74edffc6d5a9ae))
* **main:** release 0.6.0 ([1ef4701](https://github.com/Tsuchiya2/catchup-feed-frontend/commit/1ef4701265d163410ce9dbea6a23f4197bee5990))
* **main:** release 0.6.0 ([8df1bb0](https://github.com/Tsuchiya2/catchup-feed-frontend/commit/8df1bb0fe07422340a5d69ceec0dbbc37cf9abc8))
* **main:** release 0.6.1 ([f05886b](https://github.com/Tsuchiya2/catchup-feed-frontend/commit/f05886bd631daaa68c0a06ebec24e0b1693bb910))
* **main:** release 0.6.1 ([6cf1ebd](https://github.com/Tsuchiya2/catchup-feed-frontend/commit/6cf1ebdbd8b84348a301e9602862653fc3e7f107))
* **main:** release 0.7.0 ([1b80b0f](https://github.com/Tsuchiya2/catchup-feed-frontend/commit/1b80b0f76b052468fe9609b299cb0fc045a5d35c))
* **main:** release 0.7.0 ([00e3cfe](https://github.com/Tsuchiya2/catchup-feed-frontend/commit/00e3cfe4fe7264b60773486acb630aca24605f09))
* **main:** release 0.8.0 ([308e5ef](https://github.com/Tsuchiya2/catchup-feed-frontend/commit/308e5ef558ed9127e19c8c9da0aa65ee1cb81243))
* **main:** release 0.8.0 ([b7d869a](https://github.com/Tsuchiya2/catchup-feed-frontend/commit/b7d869adc3ce221b002d6460a2b0b60b8df23bc5))
* **main:** release 0.9.0 ([7fe6a0e](https://github.com/Tsuchiya2/catchup-feed-frontend/commit/7fe6a0ed756d83c3937bf0b83ccd38be3d699d05))
* **main:** release 0.9.0 ([755d123](https://github.com/Tsuchiya2/catchup-feed-frontend/commit/755d12356e46ff6ec0ea819ecb2e69fc53dc9279))
* **main:** release 1.0.1 ([00e3f1d](https://github.com/Tsuchiya2/catchup-feed-frontend/commit/00e3f1d66dbe51516342fcc3f36e4a152fd9614a))
* **main:** release 1.0.1 ([290f171](https://github.com/Tsuchiya2/catchup-feed-frontend/commit/290f171f69ded98ccbba41b276aa0aab802dc8ba))
* **main:** release 1.0.2 ([debe4bd](https://github.com/Tsuchiya2/catchup-feed-frontend/commit/debe4bd1aebb9bf0eb68be58664a29843646c143))
* **main:** release 1.0.2 ([a238ee0](https://github.com/Tsuchiya2/catchup-feed-frontend/commit/a238ee095d7905302a6d32ecad91c62f00687bc7))
* **main:** release 1.0.3 ([a672448](https://github.com/Tsuchiya2/catchup-feed-frontend/commit/a67244880f70d2ca5f12a401080323fd3adaf7d3))
* **main:** release 1.0.3 ([10c9912](https://github.com/Tsuchiya2/catchup-feed-frontend/commit/10c991221c9a7f33ff2514d5dd6dc05f6db0fa24))
* **main:** release 1.1.0 ([585b683](https://github.com/Tsuchiya2/catchup-feed-frontend/commit/585b6834729b9c6321154f768ad1b5cde642e80c))
* **main:** release 1.1.0 ([fbbae4d](https://github.com/Tsuchiya2/catchup-feed-frontend/commit/fbbae4d6d394c18757b8f2ef91d845b9b4c2cd67))
* **main:** release 1.2.0 ([36f2485](https://github.com/Tsuchiya2/catchup-feed-frontend/commit/36f2485e85285dc405ea9d3546ee55ebbc44a451))
* **main:** release 1.2.0 ([3868d8d](https://github.com/Tsuchiya2/catchup-feed-frontend/commit/3868d8d579465b4b65ce0dd36d38f8b58509992b))

## [1.2.0](https://github.com/Tsuchiya2/catchup-feed-front/compare/v1.1.0...v1.2.0) (2025-12-23)


### Features

* **security:** implement CSRF protection with Double Submit Cookie p… ([cc15fba](https://github.com/Tsuchiya2/catchup-feed-front/commit/cc15fba1f870b4c513660e87c20c91de339791fe))
* **security:** implement CSRF protection with Double Submit Cookie pattern ([ef062ea](https://github.com/Tsuchiya2/catchup-feed-front/commit/ef062ea3f664793c14e8909fa317a1657d1399ff))


### Bug Fixes

* address CodeRabbit review feedback ([4ab7f58](https://github.com/Tsuchiya2/catchup-feed-front/commit/4ab7f5896e98c84ed8accf77fb2ced621bf8cd5a))
* **tests:** resolve lint and TypeScript errors in CSRF test files ([f5c3d0a](https://github.com/Tsuchiya2/catchup-feed-front/commit/f5c3d0ada46344e0129413a85c77e320c9c5585c))

## [1.1.0](https://github.com/Tsuchiya2/catchup-feed-front/compare/v1.0.3...v1.1.0) (2025-12-22)


### Features

* add PWA support, token refresh, and observability infrastructure ([6323098](https://github.com/Tsuchiya2/catchup-feed-front/commit/6323098695213af54295400f88966728143c889c))


### Bug Fixes

* address CodeRabbit review feedback ([5f981b5](https://github.com/Tsuchiya2/catchup-feed-front/commit/5f981b560c31d89cfad1c48c5ff3f094b2779db4))
* **lint:** add storybook-static to eslintignore ([91da754](https://github.com/Tsuchiya2/catchup-feed-front/commit/91da754cad0e49c78c827b8372237f40833204bc))
* **lint:** resolve Prettier and ESLint formatting issues ([43aa94b](https://github.com/Tsuchiya2/catchup-feed-front/commit/43aa94bf173bc91fde50d8d626b26f84dd5c4c13))
* **test:** resolve CI test and type check failures ([11a0d5e](https://github.com/Tsuchiya2/catchup-feed-front/commit/11a0d5eae1cb0c8ed23144160df30497a853cb2e))

## [1.0.3](https://github.com/Tsuchiya2/catchup-feed-front/compare/v1.0.2...v1.0.3) (2025-12-16)


### Bug Fixes

* **api:** use /articles/search endpoint for date filtering ([2a14307](https://github.com/Tsuchiya2/catchup-feed-front/commit/2a1430755fdc9b5b3e15e7a0fa4d9ea5b19f75c7))
* **api:** use /articles/search endpoint for date filtering ([6ef307f](https://github.com/Tsuchiya2/catchup-feed-front/commit/6ef307f8dc8eb385484f42d24d11fb8075a759ed))
* remove out-of-scope settings changes ([00766e3](https://github.com/Tsuchiya2/catchup-feed-front/commit/00766e3d51d8f48f06a1309fd3173cd6e22f0655))

## [1.0.2](https://github.com/Tsuchiya2/catchup-feed-front/compare/v1.0.1...v1.0.2) (2025-12-16)


### Bug Fixes

* **api:** use real backend API for article search instead of mock ([84f77e8](https://github.com/Tsuchiya2/catchup-feed-front/commit/84f77e8e94a28554773da0458b51b11e244ba35e))
* **api:** use real backend API for article search instead of mock ([fc9eacd](https://github.com/Tsuchiya2/catchup-feed-front/commit/fc9eacd8ff8a49c5cd2c9a246cf4065f3e25377a))
* **test:** add explicit toBeDefined() checks per CodeRabbit review ([c110a99](https://github.com/Tsuchiya2/catchup-feed-front/commit/c110a99dd3189208b35ef85a04f09645b56ba062))
* **test:** add non-null assertions for array access in article tests ([2441580](https://github.com/Tsuchiya2/catchup-feed-front/commit/2441580f8656fc68deac90d4ca962f05539244b8))

## [1.0.1](https://github.com/Tsuchiya2/catchup-feed-front/compare/v1.0.0...v1.0.1) (2025-12-16)


### Bug Fixes

* update og:url to pulse.catchup-feed.com ([b0319d0](https://github.com/Tsuchiya2/catchup-feed-front/commit/b0319d0464135af6af6499ae5d5a3fed01cb2b4c))
* update og:url to pulse.catchup-feed.com ([ecfe31c](https://github.com/Tsuchiya2/catchup-feed-front/commit/ecfe31c3b95b3f054c1adbf951cc60d7d4d3dcf1))

## [0.9.0](https://github.com/Tsuchiya2/catchup-feed-front/compare/v0.8.0...v0.9.0) (2025-12-14)


### Features

* add source creation dialog for admin users ([e39c22b](https://github.com/Tsuchiya2/catchup-feed-front/commit/e39c22b85581f49d2c5e118106d7d9de509d2ef2))
* add source creation dialog for admin users ([9fe1737](https://github.com/Tsuchiya2/catchup-feed-front/commit/9fe173759ec9c414b13df88ec2521715dfee6afb))


### Bug Fixes

* improve Add Source form and fix API client tests ([78ff8f2](https://github.com/Tsuchiya2/catchup-feed-front/commit/78ff8f20a58edc861796f2715acf510702a58927))

## [0.8.0](https://github.com/Tsuchiya2/catchup-feed-front/compare/v0.7.0...v0.8.0) (2025-12-12)


### Features

* remove Today quick filter button from DateRangePicker ([530410a](https://github.com/Tsuchiya2/catchup-feed-front/commit/530410a91d7f70754f261aa87ea99e5b6d6d8863))
* remove Today quick filter button from DateRangePicker ([b46e755](https://github.com/Tsuchiya2/catchup-feed-front/commit/b46e75572a4effa21872aa2d699e871e26563003))

## [0.7.0](https://github.com/Tsuchiya2/catchup-feed-front/compare/v0.6.1...v0.7.0) (2025-12-12)


### Features

* add mock API endpoint for article search ([71b55cf](https://github.com/Tsuchiya2/catchup-feed-front/commit/71b55cffcc08e1213e7ac2d80d63e841bc4ba098))

## [0.6.1](https://github.com/Tsuchiya2/catchup-feed-front/compare/v0.6.0...v0.6.1) (2025-12-11)


### Bug Fixes

* remove extra blank line in terms page to fix prettier error ([dec3686](https://github.com/Tsuchiya2/catchup-feed-front/commit/dec3686fa5b4e0225f3599598644958bb0ccff9d))
* remove obsolete tailwind.config.ts mount from compose.yml ([6a33f55](https://github.com/Tsuchiya2/catchup-feed-front/commit/6a33f55e5d6dc4f2ae85ddbcd010f0cfe05af34e))
* remove obsolete tailwind.config.ts mount from compose.yml ([77c486a](https://github.com/Tsuchiya2/catchup-feed-front/commit/77c486ae568e93c8b5dc254312bfb9e4757c3a16))

## [0.6.0](https://github.com/Tsuchiya2/catchup-feed-front/compare/v0.5.0...v0.6.0) (2025-12-08)


### Features

* add GitHub Actions CI and fix various issues ([80db2f0](https://github.com/Tsuchiya2/catchup-feed-front/commit/80db2f0ffb7efbdb5a231633696ab3902960c808))
* add GitHub Actions CI and fix various issues ([25404e0](https://github.com/Tsuchiya2/catchup-feed-front/commit/25404e04959974568db491aadf5249ca6cbe7683))

## [0.5.0](https://github.com/Tsuchiya2/catchup-feed-front/compare/v0.4.0...v0.5.0) (2025-12-08)


### Features

* apply cyber/tech theme UI based on brand logo ([ff5c203](https://github.com/Tsuchiya2/catchup-feed-front/commit/ff5c20343bd4a55aa3315dd2af6e7f7dfe93e394))

## [0.4.0](https://github.com/Tsuchiya2/catchup-feed-front/compare/v0.3.0...v0.4.0) (2025-12-07)


### Features

* replace landing page logo text with custom icon ([c5dd50a](https://github.com/Tsuchiya2/catchup-feed-front/commit/c5dd50a6fa3bd0b47c3b051f716a1269eb0999e1))

## [0.3.0](https://github.com/Tsuchiya2/catchup-feed-front/compare/v0.2.0...v0.3.0) (2025-12-07)


### Features

* replace header logo text with custom icon ([078cc97](https://github.com/Tsuchiya2/catchup-feed-front/commit/078cc971cf8c72d43bb19c6c54ea78e2263b49a9))
* replace header logo text with custom icon ([5273ba5](https://github.com/Tsuchiya2/catchup-feed-front/commit/5273ba539851711c0492554880d4c0199e5573f9))

## [0.2.0](https://github.com/Tsuchiya2/catchup-feed-front/compare/v0.1.0...v0.2.0) (2025-12-07)


### Features

* add active/inactive toggle for sources (admin only) ([08ec16b](https://github.com/Tsuchiya2/catchup-feed-front/commit/08ec16ba4b4c02ca9c660ca16ce7733add461961))
* add active/inactive toggle for sources (admin only) ([e41d98a](https://github.com/Tsuchiya2/catchup-feed-front/commit/e41d98a28efd955ce30c9cd3ac2cc43ec120a6bd))
* add source_name field support for article API response ([#1](https://github.com/Tsuchiya2/catchup-feed-front/issues/1)) ([62766d3](https://github.com/Tsuchiya2/catchup-feed-front/commit/62766d3811abcafa6421beae673fd175224dc5cb))


### Bug Fixes

* handle 204 No Content responses in API client ([c9182d2](https://github.com/Tsuchiya2/catchup-feed-front/commit/c9182d22f232ba09a5ce7091592bbe5263fd9ec3))
* handle 204 No Content responses in API client ([69ebfba](https://github.com/Tsuchiya2/catchup-feed-front/commit/69ebfbad82279613ca15d5b6abf9b5811cc26609))
* replace radix-ui Select with native select in Pagination ([75c7496](https://github.com/Tsuchiya2/catchup-feed-front/commit/75c74965e0066f3b650999b4cff38f4498fab68a))
* replace radix-ui Select with native select in Pagination ([d0b6212](https://github.com/Tsuchiya2/catchup-feed-front/commit/d0b62120b219e82942e1fdf1c62794cff9a17cf3))
