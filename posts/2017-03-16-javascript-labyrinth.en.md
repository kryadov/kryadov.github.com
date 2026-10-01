---
summary: A maze out of random ╱ and ╲ characters in a few lines of JavaScript.
---

# Labyrinth generated with JavaScript

The code:

```html
<script>
for (var line=1; line<30; line++) {
  for(var i=1;i<0;i++) {
    var s = (Math.floor((Math.random()*2)%2)) ? "╱" : "╲";
    document.write(s);
  }
  document.writeln("<br>");
}
</script>
```

The result:

![A maze of ╱ and ╲ characters](/assets/blog/javascript-labyrinth/01.png)

Found on [http://js.do](http://js.do)

---

*Originally published in Russian on [LiveJournal](https://ryadov.livejournal.com/3285.html).*
