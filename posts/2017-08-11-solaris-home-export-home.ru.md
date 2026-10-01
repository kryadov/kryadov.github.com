---
summary: Почему в Solaris домашние папки живут в /export/home, а не в /home, и почему /home недоступен для записи.
---

# Oracle Solaris 10/11: /home and /export/home

Заметка на память о идее Sun-a иметь примонтированными на конкретной машине-сервере все свои и не-свои home-папки. По сути это ответ на 3 вопроса "почему в Solaris":

1. home-папки создаются в /export/home, а не в /home как в большинстве других Unix/Linux?
2. иногда в /home есть sym-линки на некоторые home-папки в /export/home
3. почему "/home is not writeable"

Собственно развернутый ответ здесь: [https://docs.oracle.com/cd/E23824\_01/html/821-1454/rfsrefer-75.html](https://docs.oracle.com/cd/E23824_01/html/821-1454/rfsrefer-75.html)

---

*Впервые опубликовано в [ЖЖ](https://ryadov.livejournal.com/4701.html).*
