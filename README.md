# intraHouse.plugin-voiceterminal

Плагин для подключения к системе умного дома intraHouse голосового терминала на базе ПО mdmTerminal2 - https://github.com/Aculeasis/mdmTerminal2

По умолчанию плагин слушает get-запросы от mdmTerminal2 по порту 8999. Поэтому в settings.ini mdmTerminal2 в секции [majordomo] (надеюсь автор скоро уберет ото всюду это название) необходимо прописать IP-адрес сервера iH вместе с портом, который будет слушать плагин.
Запросы от mdmTerminal2 приходят на плагин в виде /command.php?terminal=VT1&username=admin&qry=someurlencodedtext. Плагин декодирует url и сравнивает его с "Расширениями", которые прописаны в нем. На текущий момент в настройках плагина в качестве "Расширения" достаточно прописать /command.php?terminal=VT1, где VT1 - имя голосового терминала, которое задается в секции [majordomo] mdmTerminal2. Всю остальную обработку get-запроса делаем в скрипте, имя которого необходимо указать в поле "Запустить сценарий".
При появлении на порте 8999 get-запроса вида /command.php?terminal=VT1&username=admin&qry=someurlencodedtext плагин отправляет в сценарий NameofScene (пользовательское название) аргументы в виде json - {"terminal":"VT1","username":"admin", "qry":"someurldecodetext"}.

Сценарий должен отправить в плагин команду разрешенного для mdmTerminal2 типа, например вот так:
this.pluginCommand({ unit:"voiceterminal1", command:"tts:Тестовое воспроизведение текста" }).
Плагин установит соединение с mdmTerminal2 по порту 7999 с помощью соккета, передаст ему команду и закроет соединение.

Для удобства конфигурирования mdmTerminal2, его автор сделал плагин для веб-конфигуратора - https://github.com/Aculeasis/mdmt2-web-config
