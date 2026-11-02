# Recovered frontend regression tests

These tests were added after independently auditing deployed commit
`228ea05e95cab43bce93ce6ad28215bfff09e686`. They exercise existing application
functions and components. This change contains no application, dependency,
build, discovery, or deployment changes.

| Original contract | New regression | Red control |
| --- | --- | --- |
| [IQSS PR235](https://github.com/IQSS/voyages-frontend/pull/235): keep API table order on subsequent responses | `auditServerOrder.test.tsx` invokes the real processing hook and row projection with two responses | Restoring `useDataTableProcessingEffect.tsx` from `03cf141e` fails the second-response assertion. |
| [IQSS PR237](https://github.com/IQSS/voyages-frontend/pull/237): post-disembarkation standalone markers show their people count | `auditMapPopup.test.tsx` invokes the real popup helper for one person, four people, and an aggregated cluster | Restoring `handleHoverMarkerCluster.tsx` from `e1159a5c` fails both standalone cases; the cluster control still passes. |
| [SlaveVoyages PR12](https://github.com/SlaveVoyages/voyages-frontend/pull/12): sign-in action loading must not replace the form or discard its values/errors | `auditSignInState.test.tsx` renders the actual sign-in form and Redux reducer, stubbing only the external auth SDK | Reusing the bootstrap loading flag for authentication actions fails the retained-field/error assertion. |
| [IQSS PR250](https://github.com/IQSS/voyages-frontend/pull/250): contribution location interfaces must not merge with grid child interfaces | `auditGridLocationTypes.test.ts` compiles a strict, bidirectional assignment/key-isolation fixture | Restoring `InterfaceTypes.ts` from `3e49d868` produces four compiler diagnostics. |
| [IQSS PR231](https://github.com/IQSS/voyages-frontend/pull/231): a missing bibliography array must not crash a source cell | `auditHistoricalNavigation.test.tsx` renders the real table cell without the optional array | Restoring the original unguarded dereference fails the render. |
| [IQSS PR230](https://github.com/IQSS/voyages-frontend/pull/230): external sources navigate externally while published manifests open the document viewer | The same test invokes the real source cell and verifies both destinations | The controls distinguish the external URL, enclosing person, and document viewer. |
| [IQSS PR233](https://github.com/IQSS/voyages-frontend/pull/233): the Essays submenu exposes Indian Ocean posts in all three languages | The same test renders and expands the actual menu | Restoring the menu from `8f85cb77` fails all three language cases. |

`original-bug-replays.json` records all six red runs. Each exited 1 because of
the stated assertion; all twelve new cases pass on the unchanged deployed source.
Historical source was substituted only in a disposable local checkout and
restored immediately after each replay.

Run the new tests with:

```sh
npx vitest run src/tests/untils-test/audit*.test.*
```

Validation used the genuine locked `@slavevoyages/voyages-contribute` 0.6.12
package, verified against the lockfile tarball integrity and installed files.
The frontend suite plus all 18 control-owned spec files passed 721 tests across
62 files. Two existing Redux TODOs remain unchanged. The Vite production build
passed; the six new TypeScript test/fixture files pass ESLint with zero errors
or warnings.

Repository-wide lint and standalone type-checking remain non-green. The
previous exact-source lint comparison reported 7,351 errors / 627 warnings,
versus 8,073 / 640 on accepted pre-integration main. This audit's standalone
type-check found 39 diagnostics on deployed source and 58 on pre-integration
main using the same current dependencies (not the historical dependency tree).
Vite does not run that type-check. These test additions do not claim to resolve
that debt or verify every historical workflow in a live browser.
