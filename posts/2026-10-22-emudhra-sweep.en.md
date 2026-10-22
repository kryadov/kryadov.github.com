---
summary: Browsers blocked the eight compromised eMudhra CAs within days; certifi, Node, Go and Docker images needed their own updates. What it took to fix that across all my repositories in one night, what Dependabot could not see, and the tool I left behind so the next incident takes less.
---

# Eight leaked CA keys and sixty-three repositories

On 17 October 2026 it turned out that the private keys of eight eMudhra intermediate certificate authorities could be recovered from their public certificates ([Help Net Security](https://www.helpnetsecurity.com/2026/10/21/emudhra-certificates-private-keys-compromised/), [The Hacker News](https://thehackernews.com/2026/10/eight-emudhra-ca-keys-compromised.html)). Six were TLS intermediates trusted by every major browser, two signed code for Windows. Within days Chrome, Firefox, Apple and Microsoft had blocked them.

That protects you in a browser. It does not protect a Python script calling `requests`, a Node service, a Go binary or anything in a Docker image: they carry their own list of trusted roots and, unlike a browser, rarely check revocation. So I went through every repository I own in one night. This is what that took, what surprised me, and what I left behind so that next time takes an hour instead of a night.

## TL;DR

- **Browsers fixed themselves; your code did not.** What needs updating is `certifi` (2026.10.19 or later), Node (22.23.4, 24.22.1, 26.12.1), Go (1.26.10, 1.27.3) and the `ca-certificates` inside your images.
- **Dependabot was off in 61 of my 63 repositories.** It is off by default. Turning it on is free and took one script.
- **Dependabot cannot read a UTF-16 `requirements.txt`**, which is what `pip freeze > requirements.txt` produces in Windows PowerShell. Five of my repositories showed zero alerts while Trivy found 10 to 42 vulnerable packages in each.
- **`node-version: 22` in GitHub Actions does not mean "the latest 22".** The runner served a cached 22.23.3 the day after 22.23.4 shipped. Add `check-latest: true`.
- **A green pull request means what its checks run.** In a repository whose tests run only on push, a Dependabot PR is green on a security scan alone; I merged one, and the deploy broke.
- **The result:** 33 repositories needed fixing; 24 are fixed, and the other 9 wait on a decision: a library with no fixed release, or a major upgrade I would not make blind.
- **The tool is public:** [repo-guard](https://github.com/kryadov/repo-guard) checks every repository weekly and keeps the report private.

## 1. Why the browser is not enough

A browser decides whom to trust from its own root store and, after an incident like this one, from a block list its vendor pushes within hours. Everything else trusts the store it was built with:

| Where | What carries the trust store | Fixed in |
|---|---|---|
| Python (`requests`, `httpx`, most SDKs) | `certifi` | [2026.10.19](https://github.com/certifi/python-certifi) (2026.10.18 removed the emSign roots, 2026.10.19 put back the unaffected ones) |
| Node.js | built into the binary | [22.23.4, 24.22.1, 26.12.1](https://nodejs.org/en/blog/vulnerability/october-2026-security-releases); 20 and older get nothing |
| Go | `crypto/x509` | [1.26.10, 1.27.3](https://go.dev/dl/), with a deny list for the eight keys |
| Docker images | the base image's `ca-certificates` | a rebuild on a fresh tag |

Two things make this worse than it looks. First, `certifi` is almost never a direct dependency: it comes with `requests` or `httpx`, nothing pins it, and an install can happily resolve to a cached old release. Second, the runtime version usually lives outside the dependency files, in `.nvmrc`, a `Dockerfile` or a CI workflow, where no vulnerability scanner looks.

## 2. One night, sixty-three repositories

I have 63 repositories of my own, not counting forks and archives: Python services, TypeScript sites, a few Java and Kotlin projects, demos from talks and some things from 2020 that I had forgotten about. The plan was simple:

1. **Inventory and scan.** List the repositories, read their state through the GitHub API, run a check for eMudhra-specific problems and [Trivy](https://github.com/aquasecurity/trivy) for everything with a known fix. Nothing changed yet.
2. **Fix in order of the last commit.** Bump only what security needs, to the smallest fixed release; run the tests before and after; scan again.
3. **Deliver.** Where there is CI with tests, a pull request that I merge only when the checks pass; elsewhere, a commit straight to the main branch.

Before any fixing, 26 repositories had an eMudhra problem: 15 pinned an old `certifi`, 10 pulled it in unpinned, one ran on an end-of-life Node. Once I turned Dependabot on, the count of repositories with open critical or high advisories rose to 33.

## 3. What I did not expect

**Dependabot was off almost everywhere.** In 61 of 63 repositories. It is not a paid feature: alerts and security updates are free for public and private repositories alike, they are simply off until someone turns them on. Turning them on is one API call per repository, plus the account setting "Automatically enable for new repositories" so that the next repository starts protected. Within an hour of turning it on, Dependabot had opened about a hundred pull requests.

**Five repositories were invisible to Dependabot.** Their `requirements.txt` files were UTF-16, as written by `pip freeze` redirected in Windows PowerShell. Dependabot reported no alerts for them; Trivy, which reads the encoding, found between 10 and 42 vulnerable packages in each. My own checker passed them too, at first, because it read the files as UTF-8. All five files are UTF-8 now.

**A bare Node major does not float on a CI runner.** I updated a site's lock file, and the new Astro release required Node 22.23.4. The workflow said `node-version: 22`, and the runner served its cached 22.23.3. The build failed; luckily the deploy step was skipped and the live site stayed as it was. `check-latest: true` in `actions/setup-node` fixed it, and it matters for this incident too: 22.23.3 is the release *without* the eMudhra fix.

**A frozen `requirements.txt` fights back.** Raise `aiohttp` and it wants a newer `yarl`, which another line pins; raise that and something else breaks. I ended up relaxing only the pins that block resolution, within their current major, and keeping a package at its version whenever its fix needed another major.

**"Green" means what the checks run.** Two of my sites run tests and the build only on push to the main branch; their pull requests get the security scan and nothing else. I merged a Dependabot group update there on a green check, and a 0.x library inside it broke four tests in the deploy run. I reverted it through a pull request ten minutes later.

**Some advisories have no fix at all.** `python-jose` and `ecdsa` have open advisories with no fixed release; ChromaDB has two critical code-injection advisories that cover every release up to 1.5.9, with no fixed version named. For those the answer is a different library or a different architecture, not a version bump.

**And some code is better archived than fixed.** Four projects from 2020 and 2021 on create-react-app carry 60 to 303 critical and high alerts each, and run CI on Node 10 to 14. Updating them "only for security" means a new toolchain, which is a rewrite.

## 4. What I left behind: repo-guard

The night's work would be wasted if the next incident started from zero. So the scripts became a small public tool, [repo-guard](https://github.com/kryadov/repo-guard):

- **Once a week** it lists every repository, reads its alerts, Dependabot pull requests, workflows and a few files through the API, and gives each repository a status: `needs-fix`, `pending-merge` (Dependabot already has a PR), `unknown` (alerts off), `ok` or `n/a`. Separately it lists what protection is missing.
- **New repositories get a pull request** with two files: a `security.yml` that runs Trivy on every push, pull request and week, and a `dependabot.yml` with a two-week cooldown.
- **Checks are plugins.** The eMudhra one reads `certifi` pins, `.nvmrc`, `engines`, `setup-node`, `FROM node:` and `go.mod`. The next incident is a new file, not a new tool.
- **Fixing stays manual,** with a Claude Code skill that encodes the routine above. An agent with write access to every repository, running unattended, is a risk I am not willing to take for this.

Two decisions in it are about not becoming the next incident:

- **The code is public, the report is not.** A list of unfixed vulnerabilities per repository is a map for an attacker, and it names private repositories. The weekly report goes to a private repository; the public workflow logs carry counts only.
- **The token has no way in from outside.** The workflow that holds a token with write access to every repository runs on a schedule or by hand, never on `pull_request`, and a test fails if that changes. Every action is pinned to a commit SHA. That last rule is not paranoia: on 19 March 2026 almost every version tag of `aquasecurity/trivy-action` was force-pushed to a commit that stole CI secrets for about twelve hours ([CVE-2026-33634](https://www.rapid7.com/db/vulnerabilities/cve-2026-33634/)). A tag can change under you; a SHA cannot. The two-week Dependabot cooldown exists for the same reason.

## 5. If you do one thing this week

1. Turn on Dependabot alerts and security updates for all your repositories, and the account setting for new ones.
2. Search your repositories for `certifi`, `.nvmrc`, `node-version:` and `FROM ` and make sure each is past the versions in the table above.
3. Add `check-latest: true` next to every `node-version:` in your workflows.
4. Run `file requirements*.txt`. If it says UTF-16, convert it, or Dependabot is not watching it.
5. Pin third-party actions to a commit SHA.
