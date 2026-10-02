---
summary: How to build a two-node Tomcat 7/8 cluster with session replication, and why it stays silent until the firewall lets multicast through.
---

# Tomcat Clustering + Multicast + Firewall

How do you build a Tomcat 7 or 8 cluster, with an example, and make it work with the firewall that is on by default?

It's simple:

1) Install, configure and start [Tomcat](https://tomcat.apache.org/download-80.cgi#8.5.31) (say, two instances)

1.1) Add a [Cluster](https://tomcat.apache.org/tomcat-8.5-doc/cluster-howto.html#For_the_impatient) element [under Host](https://tomcat.apache.org/tomcat-8.5-doc/cluster-howto.html) in server.xml.

2) Create two pages in the Context you need:

2.1) index.jsp

```jsp
<%= session.getAttribute("cluster_attr") %>
```

2.2) set.jsp

```jsp
<% session.setAttribute("cluster_attr", "blablabla"); %>
```

3) Set up a shared Context (if you didn't put the pages into the ROOT context)

4) Start Tomcat:

```
tomcat/bin/startup.bat
```

5) Open "/" on both in a browser: you get null

6) Open /set.jsp on one of them

7) Repeat step 5: you get "blablabla" on both

...

9) Not working? Check the **firewall +** [multicast](https://blogs.agilefaqs.com/2009/11/08/enabling-multicast-on-your-macos-unix/) settings

10) Add a firewall rule and reload:

10.1) RHEL / CentOS 6

10.1.1) Add to /etc/sysconfig/iptables:

```
-A INPUT -m pkttype -j ACCEPT --pkt-type multicast
```

10.1.2) Run

```
# service iptables restart
```

10.2) RHEL / CentOS 7: run

```
# firewall-cmd --permanent --direct --add-rule ipv4 filter INPUT 0 -m pkttype --pkt-type multicast -j ACCEPT
success

# firewall-cmd --reload
success
```

11) Check (step 5) that everything works without restarting Tomcat.

---

*Originally published in Russian on [LiveJournal](https://ryadov.livejournal.com/4933.html).*
