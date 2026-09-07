---
summary: Spec-driven development did not invent the specification. It gave the specification a reader that regenerates the code from it, and that is a different claim entirely.
---

# Back to School: Why Did We Always Write Specifications, and What Changed When a Machine Started Reading Them?

When people talk about spec-driven development, you will often hear a story like this:

> Spec-driven development is a new practice invented for AI. Before coding agents arrived, nobody wrote the specification first. We wrote the code.

It sounds reasonable, but historically that is not quite what happened.

Writing the specification first is one of the oldest ideas in the industry, and it has been rediscovered roughly once a decade. What kept failing was never the writing. It was that the specification's only reader was a human being under no obligation to notice when the document stopped being true.

That is the part which changed.

## The Paper Everyone Cites as the Origin of Waterfall

In 1970, Winston Royce published a short paper on managing the development of large software systems. It is remembered as the origin of the waterfall model, which is unfortunate, because the word *waterfall* does not appear anywhere in it.

What the paper does contain is the sequential diagram everyone reproduces, followed immediately by Royce's own verdict: he believed in the concept, but considered the implementation it describes risky and an invitation to failure.

It also contains this, about the early phase of a project:

> During the early phase of software development the documentation is the specification and is the design.

Not *describes* the design. **Is** the design. The claim that the specification is the primary artefact is not a 2025 claim. It is close to the oldest claim in the field, and it sits in the paper we cite when we want to make fun of writing things down.

The lifecycle that grew out of it is the one every engineer recognises:

```
    SOFTWARE DEVELOPMENT LIFECYCLE        "SDLC"

            ┌──────────────────────────────┐
    PRD ───►│  PLANNING & DESIGN           │
            └───────────────┬──────────────┘
                            │
     ╭╌╌ cycle ╌╌╌╌╌╌╌╌╌╌╌╌╌│╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╮
     ╎                      ▼                  ╎
     ╎      ┌──────────────────────────────┐   ╎
     ╎   ┌─►│  IMPLEMENT                   │   ╎
     ╎   │  └───────────────┬──────────────┘   ╎
     ╎   │                  │                  ╎
     ╎   │                  ▼                  ╎
     ╎   │  ┌──────────────────────────────┐   ╎
     ╎   │  │  TESTING / QA                │   ╎
     ╎   │  └───────────────┬──────────────┘   ╎
     ╎   └──────────────────┤ tests fail       ╎
     ╰╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌│╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╯
                            ▼
            ┌──────────────────────────────┐
            │  DEPLOYMENT                  │
            │  dev → staging → production  │
            └───────────────┬──────────────┘
                            │
                            ▼
            ┌──────────────────────────────┐
            │  MAINTENANCE                 │
            └──────────────────────────────┘
```

## Why the Document Always Lost

If the idea was right in 1970, the obvious question is why the documents were so consistently bad.

David Parnas and Paul Clements gave the honest answer in 1986, in a paper called *A Rational Design Process: How and Why to Fake It*. The argument is exactly what the title says. You will never actually follow a rational design process, because information arrives out of order and you change your mind halfway. What you can do is produce, afterwards, the documentation you would have produced if you had.

Parnas also set an acceptance criterion for a requirements document that is stricter than most teams realise:

> everything you need to know to write software that is acceptable to the customer, and no more

Organised for reference, not for reading front to back.

Notice what is absent from all of this: any mechanism. Nothing checked that the document still matched the program. A specification and its implementation could drift apart for years, and the only thing that noticed was a new hire, once, painfully.

## Making a Specification Enforceable

Two families of fix followed, and they went in opposite directions.

The first moved the specification inside the program. Bertrand Meyer's Design by Contract, published in 1992, expresses a routine's preconditions and postconditions as a contract between caller and supplier, with blame assigned mechanically: break the precondition and the fault is the caller's. Meyer was explicit that documentation should not be a product maintained separately from the code.

The second made prose itself precise. RFC 2119, in 1997, fixed the meaning of MUST, SHOULD and MAY so that two independent implementers would read a protocol the same way — and then warned, in its own closing section, that the keywords must be used with care and sparingly. Twenty years later RFC 8174 had to narrow it again: the words are normative only when capitalised.

Both fixes worked. Neither made the whole specification executable. A contract covers an interface, not an intent. A normative keyword makes a sentence unambiguous, not a system.

## Test First, Then Behaviour First

The next attempt was to make the specification run.

Kent Beck's test-driven development is usually summarised as test, then code. His own canonical description starts a step earlier: with a written list of the scenarios the change must satisfy, before a single test exists. The specification precedes the test, not just the code.

Dan North renamed the vocabulary in 2006 for a specific reason — the word *test* was the thing stopping people from understanding the practice. Called *behaviour*, the same questions started answering themselves. Gojko Adzic later packaged the collaborative version as Specification by Example, aiming at documentation that stays alive because it executes.

Each move pushes the primary artefact one step further upstream:

```
step      TRAD            TDD             SDD
     ╔════════════╗  ┌────────────┐  ┌────────────┐
1st  ║    CODE    ║  │    TEST    │  │    SPEC    │
     ╚═════╤══════╝  └─────┬──────┘  └─────┬──────┘
           ▼               ▼               ▼
     ┌────────────┐  ╔════════════╗  ┌────────────┐
2nd  │    DOCS    │  ║    CODE    ║  │  DESIGN /  │
     └────────────┘  ╚════════════╝  │REQUIREMENTS│
                                     └─────┬──────┘
                                           ▼
                                     ┌────────────┐
3rd                                  │ IMPLEMENT  │
                                     └─────┬──────┘
                                           ▼
                                     ╔════════════╗
4th                                  ║    CODE    ║
                                     ╚════════════╝

╔══╗ = CODE:  1st in TRAD, 2nd in TDD, LAST in SDD.
```

But a test is an example, not a rule. It tells you what happens for these inputs. It cannot forbid a design that has not been written yet, and it carries no record of *why* the expected value is what it is.

## Writing the Press Release First

There is a non-technical branch of the same idea. Amazon's working-backwards practice, described publicly by Werner Vogels in 2006, requires writing the press release and the FAQ for a product before the product exists.

That is a specification whose reader is a decision-maker rather than a compiler. Its purpose is not to generate anything. It is to make a bad idea cheap to reject, on paper, before anyone builds it.

Hold on to that one, because it is the mechanism the current tooling actually runs on.

## The Prompt Is a Specification You Throw Away

Now the modern part.

Vibe coding — talking to a model until the output looks right — is a genuinely good way to work. It is fast, it is pleasant, and for a throwaway script or an exploratory change it is hard to beat.

```
                    VIBE CODING
                    ───────────

        ┌─────────────────────────────────┐
        │         User w/ prompt          │
        └────────────────┬────────────────┘
                         │
                         ▼
        ┌─────────────────────────────────┐
        │        AI generates code        │
        └────────────────┬────────────────┘
                         │
                         ▼
        ┌─────────────────────────────────┐
   ┌───▶│           EDIT PROMPT           │   ?
   │    └────────────────┬────────────────┘
   │                     │  regenerate
   │                     ▼
   │    ┌─────────────────────────────────┐
   │    │             AI CODE             │   ?
   │    └───┬────────────┬────────────────┘
   │        │            │
   └────────┘ not right  │  looks right
                         ▼
        ┌─────────────────────────────────┐
        │          Desired State          │
        └─────────────────────────────────┘

   ?  you cannot tell why the model decided what it did
   ?  you do not know how many turns the loop will take
```

But look at what that loop keeps and what it throws away. The code is committed. The prompt that produced it is not. The reasoning is not. Run the same prompt a hundred times and you get a hundred defensible programs, with no record of which constraint made the model settle on this one. The intent never reaches the repository.

## The Reader Changed

Spec-driven development puts the review stages back, and puts them before anything is built.

```
                      SPEC CODING
                      ───────────

       ┌────────────────────────────────┐
       │          Prompt Spec           │
       └────────────────┬───────────────┘
                        │
                        ▼
       ┌────────────────────────────────┐
       │          Requirements          │◀────┐
       └────────────────┬───────────────┘     │
                        │                     │
              happy? ───┴─── no ──▶ EDIT ─────┘
                        │
                       yes
                        ▼
       ┌────────────────────────────────┐
       │             Design             │◀────┐
       └────────────────┬───────────────┘     │
                        │                     │
              happy? ───┴─── no ──▶ EDIT ─────┘
                        │
                       yes
                        ▼
       ┌────────────────────────────────┐
       │           Implement            │
       └────────────────────────────────┘
              code · tests · docs
```

The prompt describes behaviour and constraints rather than an implementation. It produces a requirements document, which is reviewed and either approved or edited. Approved requirements become a design, reviewed the same way. Only then does the agent write code.

This is Amazon's mechanism — reject it cheaply, on paper — applied to a generator instead of a product committee. The gates are affordable precisely because nothing has been built yet.

And here is the actual novelty, which is not that we started writing specifications.

> For fifty years a specification's only reader was a colleague who could quietly ignore it. Now the reader regenerates the code from it.

Staleness stops being a documentation problem and becomes a build problem. That is the first time in the history of the practice that keeping the document true has been in anybody's immediate self-interest.

## What the Specification Costs

That is the strongest case for it. An honest account has to include the bill.

Spec-driven development does not remove ambiguity. It relocates it. Ambiguity in code is findable — a machine executes it and tells you. Ambiguity in prose is findable only by a careful reader, and a specification precise enough to eliminate it has become a program written in the least suitable language available.

Martin Fowler worked through this in 2003 under a different name, *UML as programming language*, and reached the conclusion that raising the level of abstraction does not exempt you from the work of programming.

Three further costs, none of them hypothetical:

- the gate you cannot run: forty pages generated in twenty seconds, reviewed once by one tired human. Generation became free; reading did not;
- specification rot is now active rather than passive. A stale wiki page is ignored. A stale specification is fed back to the agent and instructs the next regeneration;
- the specification becomes a defect source in its own right. The team behind one of the leading tools publishes exactly this, and treats ambiguity in requirements as a bug class with its own analysis pass.

## Finally: The Primary Artefact

Strip away the tooling and the claim is a simple one about primacy. The primary artefact is the file you edit when you want the behaviour to change, the file the reviewer argues about, the file whose history somebody reads a year later. GitHub's Spec Kit states the ambition without hedging: the specification is the primary artefact, and code is its expression.

What that looks like in practice is smaller than the rhetoric:

```
┌────────────────────────────────┬────────────────────────────────┐
│ VIBE CODING                    │ SPEC CODING                    │
├────────────────────────────────┼────────────────────────────────┤
│ "need /login for users auth"   │ Feature: User Auth             │
│                                │  ├─ Endpoint: /login POST      │
│ one sentence of intent         │  ├─ Accepts: {user, pass}      │
│ → ~30 valid ways to build it   │  ├─ Fails: 400 if missing user │
│                                │  └─ Tests: valid creds → 200   │
├────────────────────────────────┼────────────────────────────────┤
│  ┌─→ AI generates code ──┐     │  spec ─┬─→ implementation      │
│  │                       │     │        ├─→ tests               │
│  └──── edit the prompt ←─┘     │        └─→ docs                │
│                                │                                │
│  loop until it looks right     │  one reading, not thirty       │
└────────────────────────────────┴────────────────────────────────┘
```

Where the industry has actually landed is worth noticing. The three-document shape — requirements, design, tasks — is real and convergent, and EARS, the requirements notation one popular tool adopted, comes from Rolls-Royce in 2009 and has nothing to do with AI. But Thoughtworks still files spec-driven development under *Assess*, noting the definition is unsettled. The first academic attempt to define it, in 2026, opens by admitting there is no shared vocabulary yet. And the format the ecosystem genuinely standardised on is `AGENTS.md` — a file of instructions, not a specification.

## Conclusion

If we simplify the progression, it looks something like this:

**Documentation as the Specification**  
↓  
**Documentation Rot**  
↓  
**Faking the Rational Process**  
↓  
**Design by Contract**  
↓  
**Normative Prose**  
↓  
**Executable Examples**  
↓  
**Approval Before Implementation**  
↓  
**A Machine as the Second Implementer**  
↓  
**Regeneration From the Text**  
↓  
**Spec-Driven Development**

So the most accurate way to tell the story is this:

> Spec-driven development did not appear because engineers rediscovered the value of writing things down. Writing things down was always the recommended practice, and it always decayed, because the only reader could afford to ignore it. What changed is that the specification acquired a reader which builds the system from it, and a document that gets executed is a document somebody finally has a reason to keep true. Whether that reason survives contact with forty pages nobody has time to review is the open question, not the settled one.

## Further Reading

- Winston W. Royce — Managing the Development of Large Software Systems (1970)  
  https://web.archive.org/web/2018id_/http://www-scf.usc.edu/~csci201/lectures/Lecture11/royce1970.pdf

- David L. Parnas and Paul C. Clements — A Rational Design Process: How and Why to Fake It (1986)  
  https://users.ece.utexas.edu/~perry/education/SE-Intro/fakeit.pdf

- Bertrand Meyer — Applying "Design by Contract" (1992)  
  https://se.inf.ethz.ch/~meyer/publications/computer/contract.pdf

- Scott Bradner — RFC 2119: Key Words for Use in RFCs to Indicate Requirement Levels  
  https://www.rfc-editor.org/rfc/rfc2119.txt

- Kent Beck — Canon TDD  
  https://newsletter.kentbeck.com/p/canon-tdd

- Dan North — Introducing BDD  
  https://dannorth.net/blog/introducing-bdd/

- Werner Vogels — Working Backwards  
  https://www.allthingsdistributed.com/2006/11/working_backwards.html

- Gojko Adzic — Specification by Example  
  https://gojko.net/books/specification-by-example/

- Martin Fowler — UmlAsProgrammingLanguage  
  https://martinfowler.com/bliki/UmlAsProgrammingLanguage.html

- GitHub — Spec Kit: the spec-driven development methodology  
  https://github.com/github/spec-kit/blob/main/spec-driven.md

- Alistair Mavin — EARS: Easy Approach to Requirements Syntax  
  https://alistairmavin.com/ears/

- Thoughtworks Technology Radar — Spec-driven development  
  https://www.thoughtworks.com/radar/techniques/spec-driven-development
