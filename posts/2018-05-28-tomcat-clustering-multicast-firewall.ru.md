---
summary: Как собрать кластер из двух Tomcat 7/8 с репликацией сессий и почему он молчит, пока firewall не пропускает multicast.
---

# Tomcat Clustering + Multicast + Firewall

Как собрать кластер из Tomcat 7 или 8 с примером и заставить его работать с включенным по умолчанию firewall?

Все просто:

1) Устанавливаем, конфигурируем и запускаем [Tomcat](https://tomcat.apache.org/download-80.cgi#8.5.31) (например, в 2-х экземплярах)

1.1) Добавляем в server.xml [под Host](https://tomcat.apache.org/tomcat-8.5-doc/cluster-howto.html) [Cluster](https://tomcat.apache.org/tomcat-8.5-doc/cluster-howto.html#For_the_impatient).

2) Создаем 2 странички в нужном Context:

2.1) index.jsp

```jsp
<%= session.getAttribute("cluster_attr") %>
```

2.2) set.jsp

```jsp
<% session.setAttribute("cluster_attr", "blablabla"); %>
```

3) Устанавливаем общий Context (если странички положили не в ROOT-context)

4) Запускаем Tomcat:

```
tomcat/bin/startup.bat
```

5) Заходим в браузере на "/" на обоих, получаем null

6) Заходим в браузере на /set.jsp на "одном из"

7) Повторяем п.5 - получаем "blablabla" на обоих

...

9) Не работает? Проверяем настройки **firewall +** [multicast](https://blogs.agilefaqs.com/2009/11/08/enabling-multicast-on-your-macos-unix/)

10) Добавляем firewall-правило, рефрешим:

10.1) RHEL / CentOS 6

10.1.1) Добавляем в /etc/sysconfig/iptables:

```
-A INPUT -m pkttype -j ACCEPT --pkt-type multicast
```

10.1.2) Запускаем

```
# service iptables restart
```

10.2) RHEL / CentOS 7 - запускаем

```
# firewall-cmd --permanent --direct --add-rule ipv4 filter INPUT 0 -m pkttype --pkt-type multicast -j ACCEPT
success

# firewall-cmd --reload
success
```

11) Проверяем (п.5), что всё заработало без перезапуска Tomcat.

---

*Впервые опубликовано в [ЖЖ](https://ryadov.livejournal.com/4933.html).*
