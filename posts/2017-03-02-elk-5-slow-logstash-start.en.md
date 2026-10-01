---
summary: Logstash on a VM takes two minutes to start with zero CPU load — the cause is entropy starvation on /dev/random, and the haveged daemon fixes it.
---

# ELK 5.X: Logstash's slow start

If you take Logstash out of the box and install it on CentOS running as a VM, it can take one to two minutes to start.
Curiously, CPU and I/O load stay at zero the whole time.

It turned out that the [cause of the slowness](http://passbe.com/2016/12/21/logstash-slow-start-up-times-and-exhausting-entropy.html) is JRuby and /dev/random, and one way to cure it is to install the **haveged** package from [EPEL](https://www.8host.com/blog/ispolzovanie-prostogo-demona-entropii-haveged/) (you can enable the repository and install it with yum, or just download and install the [RPM](https://dl.fedoraproject.org/pub/epel/7/x86_64/Packages/h/)).

A little theory ([link](https://www.8host.com/blog/ispolzovanie-prostogo-demona-entropii-haveged/)):
Linux has two common devices, /dev/random and /dev/urandom. /dev/random produces randomness (it is designed to block) and waits for enough entropy before it outputs anything. When there is enough entropy, /dev/urandom produces the same quality of randomness; but /dev/urandom keeps generating random data (since it does not block) even when the entropy pool runs dry. That can lower the quality of the randomness and raises the chance of repeating earlier data. Low entropy is very dangerous on a production server, especially one that performs cryptographic functions.

There it is, the reason Logstash hangs on start-up: we are waiting for good-quality random data.

This is where **haveged** comes in. Based on the HAVEGE algorithm (and earlier on its library), haveged generates random data from variations in how long code takes to run on the processor. Since it is almost impossible to process the same block of code in exactly the same time (even in the same environment on the same hardware), the execution timings of one or more programs are a fine source of random data. haveged builds a source of random data from the differences in the processor's time stamp counter (TSC) after running a loop repeatedly.

Installing with yum once EPEL is enabled:

```
# yum install haveged
```

or from the [RPM](https://dl.fedoraproject.org/pub/epel/7/x86_64/Packages/h/):

```
# rpm -ivh haveged-*.el7.x86_64.rpm
```

Enabling it at boot and starting it:

CentOS 7:

```
# systemctl enable haveged
# systemctl start haveged
```

CentOS 5/6:

```
# chkconfig haveged on
# service haveged start
```

After this, Logstash starts instantly.

---

*Originally published in Russian on [LiveJournal](https://ryadov.livejournal.com/1357.html).*
