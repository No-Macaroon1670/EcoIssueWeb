"""Structural check for the data/*.js files, which nothing else validates.

    python tools/lint_syntax.py

Every other tool in this directory reads the data files with regular expressions. That
is fine for pulling out links and nodes, and it has one bad property: a regex parser
cannot tell a broken file from a shorter one. A commit that deleted the opening line of
a helper left data/regions.js syntactically invalid, and lint_links.py still reported
clean, because its regexes simply matched what was left. The only thing that noticed was
the browser refusing to define ECO_REGIONS.

Four checks, all exit 1:

1. Brackets balance. A state machine walks the file tracking whether it is in code, a
   line comment, a block comment, or a single, double or template string, and matches
   (), [] and {} only in code. That distinction matters here: the prose in these files
   is full of apostrophes and backticks -- `arid`, "the reef that shields them" -- and a
   naive counter trips over every one of them.

2. Every helper call is well formed. Each call's real argument list is extracted by
   walking to the matching paren, then checked for arity and for the leading arguments
   being single-quoted strings.

3. No helper call sits inside a comment, which is what a stray /* leaves behind.

4. The REGIONS list and the region() calls agree with each other.

Checks 2 to 4 exist because of what an adversarial pass found. The original check 2
counted call sites and compared the total to how many the tools' regex matched, and that
is weak in three separate ways. A whole-file total can be masked -- one extra call site
and one malformed entry cancel out. A regex anchored at the start of a call cannot see
the end of it, so splitting a flags array in two, c('Djibouti','DJI','lower',
['coastal','arid'],['lowlying','reef']), matched, balanced, and silently dropped half
the flags. And a deleted call is not a malformed one: removing the single line
region('Asia'); leaves a valid file in which fifty countries inherit the previous
continent and the whole of Asia vanishes from the picker.

Deliberately limited to data/*.js. src/*.js contains regex literals, which cannot be
distinguished from division without parsing expressions properly, and those files are
executed by the browser on every load anyway. The data files are the ones where a break
can sit unnoticed behind a regex.
"""
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, os.pardir, "data")

PAIRS = {")": "(", "]": "[", "}": "{"}
OPENERS = set(PAIRS.values())

# Which helpers each file calls: helper -> (min args, max args, leading quoted args).
#
# Keyed by file rather than by helper name, because `s(` is overloaded: in solutions.js
# it is s(id, label, cat, summary, how, search) and in regions.js it is
# s(name, parent, flags). One pattern for both would fail on whichever it was not
# written for -- and it did, on all 24 solutions, the first time this ran.
#
# schema.js is absent on purpose. It DEFINES l, n, s and k rather than calling them, so
# every "call site" there is a function signature with bare identifiers.
CALLS = {
    "links": {"l": (4, 5, 3)},
    "nodes": {"n": (7, 7, 3)},
    "solutions": {"s": (6, 6, 3)},
    "regions": {"c": (4, 4, 3), "s": (3, 3, 2), "region": (1, 1, 1)},
    "keywords": {"k": (2, 2, 1)},
}

QUOTED = re.compile(r"^'(?:[^'\\]|\\.)*'$")


def calls_for(name):
    for prefix, table in CALLS.items():
        if name.startswith(prefix):
            return table
    return {}


def check_calls(code, table):
    """Validate every helper call individually. Returns a list of messages.

    The first version of this counted call sites and compared the total to how many
    the tools' regex matched, which was wrong in two ways an adversarial pass found.
    A whole-file comparison can be masked -- one extra call site and one malformed
    entry cancel out and the total still agrees. And a regex that only checks the
    START of a call cannot see the end of it: splitting a flags array in two,
    c('Djibouti', 'DJI', 'lower', ['coastal','arid'], ['lowlying','reef']), matched
    the pattern, balanced its brackets, and silently dropped half the flags.
    Extracting each call's real argument list and checking arity catches both.
    """
    out = []
    for helper, (lo, hi, nquoted) in table.items():
        for m in re.finditer(rf"^[ \t]*{helper}\(", code, re.M):
            line = code.count("\n", 0, m.start()) + 1
            args, _ = split_args(code, m.end() - 1)
            args = [a.strip() for a in args]
            if not (lo <= len(args) <= hi):
                want = f"{lo}" if lo == hi else f"{lo}-{hi}"
                out.append(f"{line}  {helper}() takes {want} arguments, got {len(args)}")
                continue
            for i in range(min(nquoted, len(args))):
                if QUOTED.match(args[i]):
                    continue
                if args[i][:1] in ('"', "`"):
                    out.append(f"{line}  {helper}() argument {i + 1} is quoted with "
                               f"{args[i][0]} ; every tool here parses '...' only, so "
                               f"this entry would be skipped without an error")
                else:
                    out.append(f"{line}  {helper}() argument {i + 1} should be a "
                               f"quoted string, got `{args[i][:30]}`")
    return out


def strip_comments(text):
    """Remove comments but keep string contents intact.

    check_regions_declared needs the real continent names, which strip_noncode throws
    away -- it replaced every string with a placeholder, so the declared list and the
    called list were both lists of 'X' and trivially agreed with each other. That is
    why the first version of this check silently passed everything.
    """
    out = []
    i, n = 0, len(text)
    while i < n:
        ch = text[i]
        if ch == "/" and i + 1 < n and text[i + 1] == "/":
            while i < n and text[i] != "\n":
                i += 1
            continue
        if ch == "/" and i + 1 < n and text[i + 1] == "*":
            end = text.find("*/", i + 2)
            if end < 0:
                break
            out.append("\n" * text.count("\n", i, end))
            i = end + 2
            continue
        if ch in "'\"`":
            quote = ch
            out.append(ch)
            i += 1
            while i < n:
                if text[i] == "\\":
                    out.append(text[i:i + 2])
                    i += 2
                    continue
                out.append(text[i])
                if text[i] == quote:
                    i += 1
                    break
                i += 1
            continue
        out.append(ch)
        i += 1
    return "".join(out)


def check_regions_declared(code):
    """Every entry in the REGIONS list must have a matching region() call, and vice versa.

    Deleting one line -- region('Asia'); -- leaves a perfectly valid file in which every
    Asian country silently inherits the previous continent, and tree() then drops the
    whole continent for having no children. Nothing else here would notice, because a
    deleted call is not a malformed one.
    """
    m = re.search(r"const REGIONS = \[([^\]]*)\]", code)
    if not m:
        return []
    declared = re.findall(r"'([^']+)'", m.group(1))
    called = [a for a in re.findall(r"^[ \t]*region\(\s*'([^']+)'\s*\)", code, re.M)]
    out = []
    for r in declared:
        if r not in called:
            out.append(f"REGIONS lists '{r}' but nothing calls region('{r}')")
    for r in called:
        if r not in declared:
            out.append(f"region('{r}') is called but '{r}' is not in the REGIONS list")
    return out


def balance(text):
    """Return a list of (line, message) for unbalanced or unterminated structure."""
    stack, problems = [], []
    line = 1
    i, n = 0, len(text)
    while i < n:
        ch = text[i]
        if ch == "\n":
            line += 1
            i += 1
            continue
        # comments
        if ch == "/" and i + 1 < n:
            if text[i + 1] == "/":
                while i < n and text[i] != "\n":
                    i += 1
                continue
            if text[i + 1] == "*":
                end = text.find("*/", i + 2)
                if end < 0:
                    problems.append((line, "unterminated /* block comment"))
                    return problems
                line += text.count("\n", i, end)
                i = end + 2
                continue
        # strings: the prose here is full of apostrophes and backticks, so the escape
        # handling is load-bearing rather than decorative
        if ch in "'\"`":
            quote, start_line = ch, line
            i += 1
            while i < n:
                if text[i] == "\\":
                    i += 2
                    continue
                if text[i] == "\n":
                    line += 1
                    if quote != "`":
                        problems.append((start_line, f"unterminated {quote} string"))
                        break
                if text[i] == quote:
                    i += 1
                    break
                i += 1
            else:
                problems.append((start_line, f"unterminated {quote} string"))
            continue
        if ch in OPENERS:
            stack.append((ch, line))
        elif ch in PAIRS:
            if not stack:
                problems.append((line, f"stray closing {ch}"))
            elif stack[-1][0] != PAIRS[ch]:
                op, opline = stack[-1]
                problems.append((line, f"closing {ch} does not match {op} opened on line {opline}"))
                stack.pop()
            else:
                stack.pop()
        i += 1
    for op, opline in stack:
        problems.append((opline, f"{op} opened here is never closed"))
    return problems


def strip_noncode(text):
    """The same walk, returning only the code, so call sites can be counted safely."""
    out = []
    i, n = 0, len(text)
    while i < n:
        ch = text[i]
        if ch == "/" and i + 1 < n and text[i + 1] == "/":
            while i < n and text[i] != "\n":
                i += 1
            continue
        if ch == "/" and i + 1 < n and text[i + 1] == "*":
            end = text.find("*/", i + 2)
            if end < 0:
                break
            out.append("\n" * text.count("\n", i, end))
            i = end + 2
            continue
        if ch in "'\"`":
            quote = ch
            # Keep the quote CHARACTER, not just the fact of a string. The tools parse
            # with '([^']+)' patterns, so a double-quoted argument is silently skipped
            # by them -- normalising every quote to a single one here would hide exactly
            # that defect from the argument check below.
            out.append(quote + "X" + quote)
            i += 1
            while i < n:
                if text[i] == "\\":
                    i += 2
                    continue
                if text[i] == quote:
                    i += 1
                    break
                if text[i] == "\n":
                    out.append("\n")
                i += 1
            continue
        out.append(ch)
        i += 1
    return "".join(out)


def split_args(text, i):
    """text[i] is the '(' of a call. Return (top-level argument strings, index past ')').

    Splits on commas that are not inside a nested bracket or a string, which is the
    whole point: the arguments here contain arrays, objects and prose full of commas.
    """
    depth, args, cur = 0, [], []
    i += 1
    n = len(text)
    while i < n:
        ch = text[i]
        if ch in "'\"`":
            quote = ch
            cur.append(ch)
            i += 1
            while i < n:
                if text[i] == "\\":
                    cur.append(text[i:i + 2])
                    i += 2
                    continue
                cur.append(text[i])
                if text[i] == quote:
                    i += 1
                    break
                i += 1
            continue
        if ch in "([{":
            depth += 1
        elif ch in ")]}":
            if ch == ")" and depth == 0:
                args.append("".join(cur))
                return args, i + 1
            depth -= 1
        if ch == "," and depth == 0:
            args.append("".join(cur))
            cur = []
            i += 1
            continue
        cur.append(ch)
        i += 1
    return args, i


# A helper call is `name('...', '...'` -- two quoted arguments. Prose does not look like
# that; across all twelve data files as they stand, this pattern appears inside a comment
# exactly zero times.
CALL_SHAPE = re.compile(r"\b([lnsck])\(\s*'[^']+'\s*,\s*'")


def commented_out_data(text):
    """Helper calls sitting inside comments, which usually means data was lost.

    Balance checking cannot find this, because the result is valid. A stray `/*` runs
    forward to the next `*/`, which in these files is never far, and quietly comments
    out whatever lay between -- entries, a sort call, anything. The file still parses,
    the browser still loads it, and the only symptom is that something is missing.

    The repo does deliberately leave removed links as comments, explaining why an edge
    is gone. Those are written as prose and never as literal call syntax, which is what
    makes this distinguishable.
    """
    out = []
    for m in re.finditer(r"/\*.*?\*/|//[^\n]*", text, re.S):
        for c in CALL_SHAPE.finditer(m.group(0)):
            out.append((text.count("\n", 0, m.start() + c.start()) + 1,
                        c.group(0).strip()))
    return out


def main():
    files = sorted(f for f in os.listdir(DATA) if f.endswith(".js"))
    failures = 0
    print(f"{len(files)} data files\n")
    for name in files:
        path = os.path.join(DATA, name)
        text = open(path, encoding="utf-8").read()

        for line, msg in balance(text):
            print(f"  UNBALANCED  {name}:{line}  {msg}")
            failures += 1

        for line, snippet in commented_out_data(text):
            print(f"  COMMENTED   {name}:{line}  a `{snippet}` call sits inside a "
                  f"comment -- data may have been lost to a stray /*")
            failures += 1

        code = strip_noncode(text)
        for msg in check_calls(code, calls_for(name)):
            print(f"  MALFORMED   {name}:{msg}")
            failures += 1
        for msg in check_regions_declared(strip_comments(text)):
            print(f"  STRUCTURE   {name}  {msg}")
            failures += 1

    if failures:
        print(f"\n{failures} problem(s). A data file that only ever gets regex-parsed "
              f"has no other syntax check.")
        return 1
    print("clean")
    return 0


if __name__ == "__main__":
    sys.exit(main())
