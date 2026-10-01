---
summary: Лабиринт из случайных «╱» и «╲» в несколько строк JavaScript.
---

# Labyrinth generated with JavaScript

Код:

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

Результат:

![Лабиринт из символов ╱ и ╲](/assets/blog/javascript-labyrinth/01.png)

Найдено на [http://js.do](http://js.do)

---

*Впервые опубликовано в [ЖЖ](https://ryadov.livejournal.com/3285.html).*
