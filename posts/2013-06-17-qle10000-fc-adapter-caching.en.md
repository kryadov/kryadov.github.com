---
summary: QLogic's QLE10000 is an FC adapter with its own flash and a cache shared across the SAN, speeding up Oracle RAC and IBM pureScale with no hardware or software changes.
---

# QLE10000: caching in a Fibre Channel adapter

![QLogic QLE10000](/assets/blog/qle10000-fc-adapter-caching/01.png)

QLogic has released an interesting 8Gb FC adapter, the [QLE10000](http://www.qlogic.com/Resources/Documents/ApplicationSheets/Adapters/AppSheet_QLE10000_AccelerationForOracleRAC.pdf), which uses a shared cache (models with 200 and 400 GB of flash). The nodes of the "shared cache" talk to each other over the SAN.

The SAN speed-up is most noticeable for clustered and virtualised applications such as Oracle RAC and IBM pureScale (from 7× with one server to 22× with four) and is not noticeable at all for bulk data transfers.

Since no hardware or software changes are needed, for a certain class of software you can raise performance substantially just by swapping the FC cards in your servers.

---

*Originally published in Russian on [LiveJournal](https://ryadov.livejournal.com/554.html).*
