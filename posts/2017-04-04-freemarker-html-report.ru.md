---
summary: Как собрать HTML-отчёт из шаблона на Apache FreeMarker — конфигурация, модель данных, шаблон — и сконвертировать его в PDF через Flying Saucer.
---

# Как FreeMarker поможет быстро сделать HTML-отчет на базе шаблона (+ конвертация в PDF)

[Apache FreeMarker](http://freemarker.org/) это Java-библиотека (лицензия - Apache 2.0) для генерации различных текстовых форматов (HTML, e-mails, конфигурационные файлы, исходные коды, и т.д.) которая базируется на шаблонах и меняющихся входных данных.

Шаблоны пишутся на FreeMarker Template Language (FTL), который будет понятен не только программисту, но, например и верстальщику.

Моделью данных может выступать, к примеру HashMap с String, Number, POJO внутри или, например, при чуть больших усилиях JSON.

Фишка в том, что движок FreeMarker-a позволяет воспользоваться не только набором стандартных функций и конструкций (условия, циклы, работа с числами и строками), но и расширить шаблон вызовами своих функций (пример - конвертация числа в строку прописью, транслитерация строки и проч.).  
Кроме того, есть code-completion в IDEA/Eclipse, что при наличии оных позволяет "быстрее" разрабатывать.

![Схема работы FreeMarker: шаблон + данные = результат](/assets/blog/freemarker-html-report/01.png)

Итого, чтобы сгенерировать отчет, необходимо:  
1) Сконфигурировать движок:

```java
// Укажем версию конфигурации
Configuration cfg = new Configuration(Configuration.VERSION_2_3_25);

// Где будут располагаться файлы с шаблонами
cfg.setDirectoryForTemplateLoading(new File("/where/you/store/templates"));

// Кодировка шаблонов
cfg.setDefaultEncoding("UTF-8");

// Как будут обрабатываться ошибки
// Используем TemplateExceptionHandler.HTML_DEBUG_HANDLER.
cfg.setTemplateExceptionHandler(TemplateExceptionHandler.RETHROW_HANDLER);
```

2) Создать модель данных:

```
(root)
  |
  +- user = "Big Joe"
  |
  +- latestProduct
      |
      +- url = "products/greenmouse.html"
      |
      +- name = "green mouse"
```

Вот так:

```java
// Это root-объект - HashMap, но мог быть и JavaBean.
Map<String, Object> root = new HashMap<>();

// Добавим "user" в "root"
root.put("user", "Big Joe");

// Создадим "latestProduct"
Product latest = new Product();
latest.setUrl("products/greenmouse.html");
latest.setName("green mouse");
// и добавим "latestProduct" в "root"
root.put("latestProduct", latest);
```

Собственно Java Bean (класс должен быть public и иметь соотв. getter-ы):

```java
public class Product {
    private String url;
    private String name;

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}
```

3) Получить шаблон через экземпляр Configuration (файл test.ftlh должен быть создан и находиться в /where/you/store/templates, который мы указали на первом шаге):

```java
Template temp = cfg.getTemplate("test.ftlh");
```

Пример самого файла:

```html
<html>
<head>
  <title>Welcome!</title>
</head>
<body>
  <h1>Welcome ${user}!</h1>
  <p>Our latest product:
  <a href="${latestProduct.url}">${latestProduct.name}</a>!
</body>
</html>
```

4) Свести шаблон и данные, выведем в stdout:

```java
Writer out = new OutputStreamWriter(System.out);
temp.process(root, out);
```

5) В результате получаем:

```html
<html>
<head>
  <title>Welcome!</title>
</head>
<body>
  <h1>Welcome John Doe!</h1>
  <p>Our latest product:
  <a href="products/greenmouse.html">green mouse</a>!
</body>
</html>
```

Дополнительно:  
1) [Список встроенных функций](http://freemarker.org/docs/ref_builtins.html)  
2) [Как написать свою функцию](http://freemarker.org/docs/pgui_datamodel_method.html)  
3) Как сконвертировать полученный, например, HTML в PDF при помощи [flyingsaucer](https://github.com/flyingsaucerproject/flyingsaucer):

```java
import org.xhtmlrenderer.pdf.ITextFontResolver;
import org.xhtmlrenderer.pdf.ITextRenderer;

public static byte[] html2pdf(String html, String fontsPath) throws IOException,
                                                              DocumentException {
    ITextRenderer renderer = new ITextRenderer();
    loadFonts(renderer.getFontResolver(), fontsPath);
    renderer.setDocumentFromString(html);
    renderer.layout();

    ByteArrayOutputStream os = new ByteArrayOutputStream();
    renderer.createPDF(os);

    return os.toByteArray();
}
```

---

*Впервые опубликовано в [ЖЖ](https://ryadov.livejournal.com/3399.html).*
