# Third-party notices

Papyrus includes small adaptations of MIT-licensed open-source projects. The
original projects retain their copyright and license terms.

| Adaptation | Upstream release | Source commit | Papyrus boundary |
| --- | --- | --- | --- |
| Site Graph review | `starlight-site-graph@0.5.0` | `fed9ce0b3aa160255a673aa76aeea17166dcceb9` | Public component/integration reuse was tested and rejected: Astro 7 peer mismatch, `process is not defined` in Chromium, and an 816 KB graph chunk. Papyrus retains its lightweight local SVG renderer. |
| Markdown text | `starlight-md-txt@0.1.0` | `66dd11fac57d1e913ea40f371722651ed9928525` | AST cleaning and serialization adapted to the Papyrus posts collection and publication rules. |
| Base path | `starlight-base-path@0.2.1` | `e9b515561ab6c93d70cb21298e585ed0176f050a` | Remark and Astro 7 processor handling without Starlight route middleware. |
| Links validator | `starlight-links-validator@0.25.3` | `e9dc6783a19264773361edf6fdbfc0b6bfa766e0` | Portable URL, position, validation, and reporting behavior adapted to Papyrus routes; built-output validation remains complementary. |

The full upstream license texts are available in the linked repositories:

- <https://github.com/fevol/starlight-site-graph/blob/fed9ce0b3aa160255a673aa76aeea17166dcceb9/LICENSE>
- <https://github.com/max-ostapenko/starlight-md-txt/blob/66dd11fac57d1e913ea40f371722651ed9928525/LICENSE>
- <https://github.com/andriygm/starlight-base-path/blob/e9b515561ab6c93d70cb21298e585ed0176f050a/LICENSE>
- <https://github.com/HiDeoo/starlight-links-validator/blob/e9dc6783a19264773361edf6fdbfc0b6bfa766e0/LICENSE>
