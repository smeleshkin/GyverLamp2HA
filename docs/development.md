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

Порядок сборки, публикации на GitHub и обновления через HACS: [Выпуск новой версии](releasing.md).
