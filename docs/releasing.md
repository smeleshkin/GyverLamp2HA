# Выпуск новой версии

Сборка и публикация пока выполняются вручную. Ниже пример выпуска `0.5.2`.
Команды запускаются из корня репозитория. Нужны Python 3.14, Node.js 22.12+ и доступ к GitHub.

## 1. Подготовить изменения

Убедитесь, что рабочая ветка содержит актуальный `origin/main`.
Внесите изменения и задайте новую версию в `custom_components/gyverlamp2/manifest.json`:

```json
"version": "0.5.2"
```

Если менялся интерфейс, обновите также `UI_VERSION` в `frontend/src/constants.ts`.
Это отдельная версия интерфейса; совпадение с версией интеграции не требуется.

## 2. Проверить и собрать

Подготовьте Python-окружение по [инструкции разработки](development.md#python), затем выполните:

```sh
.venv/bin/pytest -q
.venv/bin/ruff check .
.venv/bin/ruff format --check .

(cd frontend && npm ci && npm run check && npm test && npm run build)

python3 tools/build_release.py
```

Перед публикацией все проверки должны пройти.
Сборка фронта обновит `custom_components/gyverlamp2/frontend/gyverlamp2.js`.
Этот файл нужно включить в коммит: HACS скачивает готовый компонент и не запускает npm.

Архив для ручной установки появится в `dist/gyverlamp2-0.5.2.zip`.
Каталог `dist/` исключён из Git; архив прикрепляется к выпуску отдельно.

## 3. Отправить код и тег

Проверьте состав коммита, включая собранный JS. Не добавляйте локальные настройки и секреты.

```sh
git status --short
git diff --check
git diff

git add README.md custom_components docs examples frontend hacs.json pyproject.toml requirements-test.txt tests tools .gitignore
git diff --cached --check
git diff --cached --stat
git commit -m "Release 0.5.2"
git push origin HEAD:main

git tag v0.5.2
git push origin v0.5.2
```

`HEAD:main` отправляет текущий коммит в `main`, даже если локальная ветка называется иначе.
Если push отклонён из-за новых коммитов на сервере, сначала объедините изменения и повторите проверки.
Не перезаписывайте существующие теги: для исправления опубликованного выпуска используйте новый номер.

## 4. Опубликовать GitHub Release

1. Откройте [создание выпуска](https://github.com/smeleshkin/GyverLamp2HA/releases/new).
2. Выберите уже отправленный тег `v0.5.2`.
3. Задайте название и кратко опишите изменения.
4. Прикрепите `dist/gyverlamp2-0.5.2.zip` для ручной установки.
5. Опубликуйте обычный выпуск кнопкой **Publish release**, без **Pre-release**.

В текущей конфигурации HACS устанавливает каталог `custom_components/gyverlamp2` из исходников выбранного тега.
Приложенный ZIP нужен для ручной установки: его распаковывают в каталог конфигурации HA.

## 5. Обновить Home Assistant

HACS периодически проверяет репозиторий и покажет доступное обновление.
Чтобы проверить сразу, откройте **HACS → GyverLamp2 → ⋮ → Update information**.
Затем установите новую версию, перезапустите HA и обновите страницу или приложение.

Обычный push в `main` не выпускает новую стабильную версию: для этого нужен опубликованный GitHub Release.
Автоматическая установка обновлений в проекте не настроена.

Настройки подключения, сущности и сохранённые параметры эффектов при обычном обновлении сохраняются.
Удалять интеграцию и добавлять лампу заново не нужно.
Карточка обновляется вместе с компонентом; адрес JS содержит хеш сборки для обновления кэша.

Справка HACS: [выпуски интеграций](https://www.hacs.xyz/docs/publish/integration/#github-releases-optional),
[проверка обновлений](https://www.hacs.xyz/docs/use/repositories/dashboard/#updating-repository-metadata).
