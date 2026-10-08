# @hoverboard/translations

Translations of Hoverboard's UI text. `packages/web` reads them by relative path, so this package has no dependencies.

| Path                 | Written by                                       |
| -------------------- | ------------------------------------------------ |
| `source/en.xlf`      | `npm --prefix packages/web run localize:extract` |
| `xliff/<locale>.xlf` | Crowdin                                          |

Do not edit `xliff/` by hand. Fix translations in Crowdin, so the next sync does not overwrite them.

Event content translations are not here. Each site keeps them in `packages/config/content/locales/<locale>/`.

`__tests__/` checks that every translated message exists in `source/en.xlf` and keeps its placeholders.
