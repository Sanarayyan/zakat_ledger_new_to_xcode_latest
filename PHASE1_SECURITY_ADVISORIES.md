# Phase 1 development-tool advisory evidence

> Resolution, 9 November 2026: removed the unused `@capacitor/assets` development dependency and its transitive vulnerable tree. Clean ARM64 `npm ci` succeeded; full `npm audit --json` reports zero vulnerabilities. No forced fixes, overrides or audit suppression were used. Existing icons/splash assets were retained. The ten-node evidence below is historical and explains what was removed. See `PHASE1_SHARED_CORRECTIONS_REPORT.md` for current checks and remaining release blockers.

Reviewed 6 November 2026. Read-only npm audit; no dependency changes were made during acceptance review.

The audit reports **10 vulnerable package nodes: 1 critical, 3 high, 6 moderate**. Parent-package entries inherit findings from dependencies; these are not ten independent exploits. `npm audit --omit=dev` reports zero current findings. This describes npm dependencies, not a full Android/iOS SDK or Python security audit.

All ten paths begin at the development-only `@capacitor/assets@3.0.5`. The separately installed main `@capacitor/cli@8.6.0` is not the vulnerable nested `@capacitor/cli@5.7.8`.

| Package | Installed vulnerable instance | Severity | What can happen / actual reach | Recommended resolution |
|---|---|---|---|---|
| @capacitor/assets | 3.0.5 | High | Icon/splash generator inherits the older CLI, image-decoder and Xcode-editor findings. No repository script or source invokes it; manual developer use remains possible. | Remove it if the external asset workflow does not need it; otherwise test a major upgrade and review its remaining dependency tree. |
| @capacitor/cli | 5.7.8 under @capacitor/assets | High | Old nested CLI inherits archive extraction and file-pattern traversal issues. Main app CLI is 8.6.0. | Remove/replace the asset tool’s old CLI chain; do not downgrade the main CLI. |
| @trapezedev/project | 7.1.11 | Moderate | Project-file editing inherits xcode/uuid finding. | Remove/replace this chain or use an upstream-compatible patched project editor. |
| glob | 9.3.5 under @capacitor/assets | Moderate | Cancellation can leave filesystem traversal running; inherits minimatch issue too. Requires an affected traversal path/input. | Use a parent chain compatible with patched glob (advisory identifies 14.0.2+); a forced major override requires API tests. |
| minimatch | 8.0.7 under @capacitor/assets | Moderate | Crafted file patterns can amplify CPU/memory work. No phone runtime pattern API was found through this chain. | Upgrade the parent chain to a compatible patched matcher; advisory identifies 11.0.1+. |
| rimraf | 4.4.1 under @capacitor/assets | Moderate | Inherits glob traversal/matching issues; no separate rimraf advisory in this audit. | Resolve parent-chain glob/minimatch versions. |
| sharp | 0.32.6 | High | The generator decodes icons/splash images; native libvips/libheif/librsvg findings make untrusted image input a developer/CI risk. | Use a compatible asset generator with sharp >=0.35.5, or remove the generator. Version 4.0.0 metadata requests ^0.35.5. |
| tar | 6.2.1 under @capacitor/assets | Critical | Malicious archives can exhaust CPU/disk; additional path traversal, overwrite and parser findings affect this instance. Extraction helper is present in the nested CLI. No application request path into it was found. | Remove the old nested CLI/toolchain or replace with a compatible patched version. Critical advisory alone is patched in 7.5.19; other audit findings extend through 7.5.20, so do not stop at 7.5.19. |
| uuid | 7.0.3 through xcode 3.0.1 | Moderate | Advisory concerns v3/v5/v6 with caller-supplied buffers. Inspected xcode generateUuid uses v4() with no buffer, so that call does not meet the described trigger. Installed dependency remains flagged. | Replace/update the parent project-editing tool. Do not force an untested major uuid override. |
| xcode | 3.0.1 through @trapezedev/project | Moderate | Inherits uuid finding. This npm package edits Xcode project files; it is not Apple’s Xcode IDE. | Replace/update the parent project-editing chain or remove unused asset tooling. |

## Critical finding and exposure decision

The critical node is tar 6.2.1 in the **build-tool dependency tree**, not Capacitor Android/iOS 8.6.0. The upstream description is a decompression/parser denial of service: a crafted archive can consume excessive storage and CPU. That is a real CI/developer risk if untrusted archives reach extraction. Other tar findings include file-write escapes, which can affect a build machine’s integrity. No malicious archive was extracted in this review.

I did not find a normal web build, app runtime, or package.json script invoking this nested extraction helper. That reduces the observed exposure; it does not justify shipping an unresolved critical dependency through a privileged signing/build environment. Use trusted assets only and keep this old generator out of signing jobs until removed or replaced.

The smallest candidate is removal of the currently unreferenced dev dependency if the owner confirms it is not part of a manual asset workflow. Otherwise, @capacitor/assets 4.0.0 drops its direct old CLI dependency and requests patched sharp; its metadata still references @trapezedev/project ^7.0.10, so a major upgrade must not be represented as proof that every finding disappears. Rerun the full audit and asset-generation tests after any approved fix.

## Exact audit evidence

### @capacitor/assets

Severity: high. Paths: `node_modules/@capacitor/assets`.

- Inherited from `@capacitor/cli`.
- Inherited from `@trapezedev/project`.
- Inherited from `sharp`.

### @capacitor/cli

Severity: high. Paths: `node_modules/@capacitor/assets/node_modules/@capacitor/cli`.

- Inherited from `rimraf`.
- Inherited from `tar`.

### @trapezedev/project

Severity: moderate. Paths: `node_modules/@trapezedev/project`.

- Inherited from `xcode`.

### glob

Severity: moderate. Paths: `node_modules/@capacitor/assets/node_modules/glob`.

- [Glob: AbortSignal cancellation bypass allows post-timeout filesystem traversal](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4); affected range `>=9.0.0 <=14.0.1`.
- Inherited from `minimatch`.

### minimatch

Severity: moderate. Paths: `node_modules/@capacitor/assets/node_modules/minimatch`.

- [minimatch has potential denial of service via globparts amplification](https://github.com/advisories/GHSA-g3hv-75wg-m249); affected range `>=7.0.0 <11.0.1`.

### rimraf

Severity: moderate. Paths: `node_modules/@capacitor/assets/node_modules/rimraf`.

- Inherited from `glob`.

### sharp

Severity: high. Paths: `node_modules/sharp`.

- [sharp inherited vulnerabilities in libvips: CVE-2026-33327, CVE-2026-33328, CVE-2026-35590, CVE-2026-35591](https://github.com/advisories/GHSA-f88m-g3jw-g9cj); affected range `<0.35.0`.
- [sharp: Vulnerabilities in libheif: GHSA-g89c-p67h-r497 and GHSA-2jg2-4ch7-h545](https://github.com/advisories/GHSA-rgj7-g3m4-5g8c); affected range `<0.35.4`.
- [sharp : Vulnerability in librsvg dependency CVE-2026-96889](https://github.com/advisories/GHSA-wq5f-xc86-pv6w); affected range `<0.35.5`.

### tar

Severity: critical. Paths: `node_modules/@capacitor/assets/node_modules/tar`.

- [node-tar Vulnerable to Arbitrary File Creation/Overwrite via Hardlink Path Traversal](https://github.com/advisories/GHSA-34x7-hfp2-rc4v); affected range `<7.5.7`.
- [node-tar is Vulnerable to Arbitrary File Overwrite and Symlink Poisoning via Insufficient Path Sanitization](https://github.com/advisories/GHSA-8qq5-rm4j-mr97); affected range `<=7.5.2`.
- [Arbitrary File Read/Write via Hardlink Target Escape Through Symlink Chain in node-tar Extraction](https://github.com/advisories/GHSA-83g3-92jg-28cx); affected range `<7.5.8`.
- [tar has Hardlink Path Traversal via Drive-Relative Linkpath](https://github.com/advisories/GHSA-qffp-2rhf-9h96); affected range `<=7.5.9`.
- [node-tar Symlink Path Traversal via Drive-Relative Linkpath](https://github.com/advisories/GHSA-9ppj-qmqm-q256); affected range `<=7.5.10`.
- [Race Condition in node-tar Path Reservations via Unicode Ligature Collisions on macOS APFS](https://github.com/advisories/GHSA-r6q2-hw4h-h46w); affected range `<=7.5.3`.
- [node-tar applies PAX size override to intermediary GNU long-name/long-link headers, causing tar parser interpretation differential (file smuggling)](https://github.com/advisories/GHSA-vmf3-w455-68vh); affected range `<=7.5.15`.
- [node-tar: Process crash via PAX numeric path type confusion](https://github.com/advisories/GHSA-w8wr-v893-vjvp); affected range `<=7.5.17`.
- [node-tar: Decompression/parse DoS via unlimited input](https://github.com/advisories/GHSA-23hp-3jrh-7fpw); affected range `<=7.5.18`.
- [node-tar: Negative tar entry size causes infinite loop in archive replace](https://github.com/advisories/GHSA-8x88-c5mf-7j5w); affected range `<=7.5.17`.
- [node-tar: Uncaught Exception DoS via NUL byte in PAX path/linkpath records](https://github.com/advisories/GHSA-gvwx-54wh-qm9j); affected range `<=7.5.16`.
- [node-tar: Uncontrolled recursion in mapHas/filesFilter allows uncatchable stack-overflow DoS via crafted long-path tar with member selection](https://github.com/advisories/GHSA-r292-9mhp-454m); affected range `<=7.5.20`.

### uuid

Severity: moderate. Paths: `node_modules/uuid`.

- [uuid: Missing buffer bounds check in v3/v5/v6 when buf is provided](https://github.com/advisories/GHSA-w5hq-g745-h8pq); affected range `<11.1.1`.

### xcode

Severity: moderate. Paths: `node_modules/xcode`.

- Inherited from `uuid`.

## Acceptance action

Do not silently suppress these warnings or use npm audit fix --force. Resolve the dependency tree in a separately reviewable Phase 1 correction, rerun clean installation on the actual build architecture, run the full audit, regenerate disposable icons/splash screens if tooling is retained, and verify native builds. No fix was applied in this review.
