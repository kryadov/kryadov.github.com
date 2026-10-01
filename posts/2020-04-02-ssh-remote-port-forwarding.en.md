---
summary: Why SSH remote port forwarding binds only to 127.0.0.1 even when you ask for 0.0.0.0, and how GatewayPorts fixes it.
---

# SSH remote port forwarding

**The problem**: when you set up SSH remote port forwarding, for example

![SSH remote port forwarding diagram](/assets/blog/ssh-remote-port-forwarding/01.png)

or, put another way,

```sh
ssh user@front-server -R "0.0.0.0:12345:local-env-server:12345" -NCv
```

the listening port (12345 in our example) is bound to 127.0.0.1 (checked on Ubuntu 18.04 and CentOS 6/7), which in turn makes outside connections impossible:

```
~# netstat -tan|grep 12345
tcp        0      0 127.0.0.1:12345          0.0.0.0:*               LISTEN
```

**The fix**:

1. Set in /etc/ssh/sshd\_config:

   ```
   GatewayPorts clientspecified
   ```

2. Restart sshd:

   ```
   ~# systemctl restart sshd
   ```

After that all is well:

```
~# netstat -tan|grep 12345
tcp        0      0 0.0.0.0:12345          0.0.0.0:*               LISTEN
```

---

*Originally published in Russian on [LiveJournal](https://ryadov.livejournal.com/6430.html).*
