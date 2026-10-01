---
summary: Почему при SSH remote port forwarding порт слушает только 127.0.0.1, даже если указан 0.0.0.0, и как это исправить через GatewayPorts.
---

# SSH remote port forwarding

**Проблема**: при настройке SSH remote port forwarding, например,

![Схема SSH remote port forwarding](/assets/blog/ssh-remote-port-forwarding/01.png)

или, по-другому,

```sh
ssh user@front-server -R "0.0.0.0:12345:local-env-server:12345" -NCv
```

Bind слушающего порта (12345, в нашем примере) происходит на 127.0.0.1 (проверено на Ubuntu 18.04 / CentOS 6/7), что в свою очередь приводит к невозможности внешних подключений:

```
~# netstat -tan|grep 12345
tcp        0      0 127.0.0.1:12345          0.0.0.0:*               LISTEN
```

**Решение**:

1. Установить в /etc/ssh/sshd\_config:

   ```
   GatewayPorts clientspecified
   ```

2. Перезапустить sshd:

   ```
   ~# systemctl restart sshd
   ```

После этого все становится хорошо:

```
~# netstat -tan|grep 12345
tcp        0      0 0.0.0.0:12345          0.0.0.0:*               LISTEN
```

---

*Впервые опубликовано в [ЖЖ](https://ryadov.livejournal.com/6430.html).*
