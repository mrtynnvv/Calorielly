 <p align="center">

  <img height="300"  src="./mockups/iphone.png"/>

  <img height="300"  src="./mockups/mac.png"/>

</p>

<p align="center">
  <i>Веб-приложение <a href="https://calorielly.ru">calorielly.ru</a> </i>
</p>
<h1 align="center">Calorielly</h1>
<!-- <p align="center">Счетчик калорий, дневник питания.</p> -->

<p align="center">
  <a href="https://github.com/Dexone/Calorielly/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/Dexone/Calorielly?style=flat" />
  </a>
</p>

<!-- ## ✨ Ключевые возможности

- Calorielly — классный, удобный, отзывчивый и легко настраиваемый счетчик калорий
- Поддерживает авторизацию и создание аккаунта для новых пользователей
- Имеет гибкие настройки, планирование целей, калькулятор граммов
- Встроен график изменения веса и таймлайн дневника питания
- Многоуровневая регистрация в 5 шагов
- Вход по телефону и паролю; сохранение сессии (ID в localStorage через Pinia), авто‑редиректы
- Учёт калорий за день: добавление приёма пищи (название + ккал), автоматическое создание дня, суммирование калорий за сегодня
- Таймлайн приёмов пищи с навигацией по дням и удалением записей
- Учёт веса: обновление текущего веса и график динамики (Chart.js)
- Настройки профиля: изменение желаемого веса и дневного лимита калорий
- Калькулятор граммов: расчёт массы продукта по его ккал/100 г и целевым ккал
- Профиль: просмотр данных аккаунта, выход и удаление аккаунта -->

## 💡 Архитектура и стек

- В процессе разработки принципиально не применялись AI-инструменты
- Строгая типизация: TypeScript строгий режим в `tsconfig.*` (noUnused, noFallthrough и др.)
- Единый стиль кода: ESLint flat config (с `@typescript-eslint` и `import`), Prettier, Stylelint для SCSS
- Архитектура фронтенда: Vue 3 Composition API + Pinia (персист через `pinia-plugin-persistedstate`), типизированные сторы
- Конфигурация Vite: `@vitejs/plugin-vue`, алиас `@` в `/src`, глобальные SCSS-переменные и переходы, Vite 6
- Интеграция с Chart.js через `vue-chart-3`: типизированные `ChartOptions`/`ChartData`, реактивные источники
- HTTP-клиент: Axios; прямые REST‑вызовы к API
- Роутинг: четкое разделение layout’ов через `meta.blank`, навигационные гарды на уровне маршрутов
- Деплой: автоматизированная доставка на GitHub Pages, SPA fallback, кеширование зависимостей
<!-- - Backend (репозиторий: https://github.com/mrtynnvv/api-nestjs ): NestJS 11 (модульная архитектура: `AuthModule`, `UsersModule`, `PrismaModule`), глобальная конфигурация через `@nestjs/config`
- ORM и данные: Prisma 6 + SQLite; файл БД вынесен в `external-db/app.sqlite` (удобно для бэкапов/разделения окружений), миграции в `prisma/migrations`, включены `PRAGMA journal_mode=WAL` и `foreign_keys`
- Аутентификация и безопасность: JWT (`@nestjs/jwt` + `passport-jwt`), хеширование паролей через Argon2id (`argon2`), нормализация телефона, обработка ошибок через стандартные `HttpException`
- Валидация ввода: DTO на `class-validator`/`class-transformer` + глобальный `ValidationPipe` (`whitelist`, `transform`)
- API эндпоинты: `POST /auth/register`, `POST /auth/login`; защищённые `GET|PATCH /users/me/calorie-limit` (JWT Guard)
- Конфигурация и окружения: переменные `.env` (`DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_ACCESS_EXPIRES`), генерация `.env` из `.env.example` (`npm run genEnv`)
- Процессы и деплой: PM2 (`ecosystem.config.js`), разделение env для dev/prod, zero‑downtime рестарты; `start:prod` на `dist/main.js` -->

## 📝 Licence

Copyright © 2025 [Dima Martynov](https://github.com/mrtynnvv).<br />
Этот проект находится под лицензией [MIT](https://github.com/mrtynnvv/Calorielly/blob/main/LICENSE).<br />
_Использованные изображения принадлежат [Flowbite Icons](https://flowbite.com/icons/)._
