# Разработка

## Python

Python 3.14:

```sh
python3 -m venv .venv
.venv/bin/pip install -r requirements-test.txt
.venv/bin/pytest -q
.venv/bin/ruff check .
.venv/bin/ruff format --check .
```

`protocol.py` кодирует пакеты, `lamp.py` управляет командами и связью,
`transport.py` разделяет UDP-сокеты между лампами. `modes.py` хранит модель эффектов,
`mode_manager.py` сохраняет и отправляет настройки. `runtime.py` и `migrations.py`
отвечают за подключение и совместимость конфигураций. Платформенные файлы создают сущности HA.

## Фронт

Исходники и команды сборки: [frontend/README.md](../frontend/README.md).
Тесты не управляют реальной лампой.

## Выпуск

Соберите фронт, выполните проверки и создайте архив:

```sh
python3 tools/build_release.py
```

Архив появится в `dist/`. Он содержит только `custom_components/gyverlamp2`, включая
готовый JavaScript. Для установки из HACS собранный JS также должен быть в репозитории.
Зависимости, временные файлы и архивы `dist/` исключены через `.gitignore`.
