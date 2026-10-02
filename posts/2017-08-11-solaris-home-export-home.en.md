---
summary: Why Solaris keeps home directories in /export/home rather than /home, and why /home is not writeable.
---

# Oracle Solaris 10/11: /home and /export/home

A note to self on Sun's idea of having every home directory (a machine's own and everyone else's) mounted on any given server. In effect it answers three "why does Solaris…" questions:

1. Why are home directories created in /export/home rather than /home, as on most other Unix and Linux systems?
2. Why does /home sometimes contain symlinks to some of the home directories in /export/home?
3. Why is "/home not writeable"?

The full answer is here: [https://docs.oracle.com/cd/E23824\_01/html/821-1454/rfsrefer-75.html](https://docs.oracle.com/cd/E23824_01/html/821-1454/rfsrefer-75.html)

---

*Originally published in Russian on [LiveJournal](https://ryadov.livejournal.com/4701.html).*
