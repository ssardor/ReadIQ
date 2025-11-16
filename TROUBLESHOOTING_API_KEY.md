# 🔧 Исправление Ошибки "Invalid API Key"

## Проблема
```
Error creating profile: {
  message: 'Invalid API key',
  hint: 'Double check your Supabase `anon` or `service_role` API key.'
}
```

## ✅ Решение

### Шаг 1: Остановите сервер разработки
В терминале нажмите `Ctrl + C` чтобы остановить `npm run dev`

### Шаг 2: Проверьте Service Role Key

1. **Откройте Supabase Dashboard**:
   https://supabase.com/dashboard/project/islicuycdgkjqbixfuyx/settings/api

2. **Скопируйте `service_role` key** (не anon key!)
   - Это длинный JWT токен, который начинается с `eyJ...`
   - НЕ копируйте `anon` key!

3. **Обновите `.env.local`**:
   ```bash
   SUPABASE_SERVICE_ROLE_KEY=ваш_правильный_service_role_key
   ```

### Шаг 3: Запустите миграцию базы данных (если еще не сделали)

1. **Откройте SQL Editor** в Supabase:
   https://supabase.com/dashboard/project/islicuycdgkjqbixfuyx/sql/new

2. **Скопируйте и выполните** содержимое файла:
   `supabase/migrations/001_create_users_profiles.sql`

3. **Нажмите "Run"** (или Cmd/Ctrl + Enter)

4. **Проверьте результат**:
   ```sql
   -- Должна вернуть данные о таблице
   SELECT * FROM users_profiles LIMIT 1;
   ```

### Шаг 4: Перезапустите сервер

```bash
npm run dev
```

**⚠️ Важно**: Next.js читает `.env.local` только при запуске. После изменения переменных окружения всегда перезапускайте сервер!

## 🔍 Проверка

После перезапуска попробуйте:

1. Зайти на http://localhost:3000
2. Нажать "Get Started"
3. Заполнить форму регистрации
4. Нажать "Sign up"

**Ожидаемый результат**: 
- ✅ "Account created! Please check your email..."
- ✅ В терминале НЕТ ошибки "Invalid API key"
- ✅ В Supabase → Table Editor → users_profiles появилась новая запись

## 🐛 Если ошибка осталась

### Проверка 1: Убедитесь, что используете правильный ключ

```bash
# В терминале выполните:
echo $SUPABASE_SERVICE_ROLE_KEY
```

Или откройте `.env.local` и проверьте, что:
- Ключ не содержит пробелов в начале/конце
- Ключ начинается с `eyJ`
- Это именно `service_role` ключ, а не `anon`

### Проверка 2: Проверьте переменные окружения в коде

Создайте временный API endpoint для проверки:

```typescript
// pages/api/test-env.ts
export default function handler(req: any, res: any) {
  res.json({
    hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    keyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
    keyStart: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20) || 'not found'
  })
}
```

Откройте: http://localhost:3000/api/test-env

Должно показать:
```json
{
  "hasServiceKey": true,
  "keyLength": 240-300 (примерно),
  "keyStart": "eyJhbGciOiJIUzI1NiIsI..."
}
```

### Проверка 3: Убедитесь, что таблица создана

В Supabase SQL Editor:

```sql
-- Проверить существование таблицы
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'users_profiles'
);

-- Должно вернуть: true
```

## 📝 Правильная структура .env.local

```bash
# Environment variables for ReadIQ

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://islicuycdgkjqbixfuyx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzbGljdXljZGdranFiaXhmdXl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3MDg2NDEsImV4cCI6MjA3ODI4NDY0MX0.NW7CjoNzo2BM0Ijome4_axlOsj7PeI5KOGXpidJipWQ
SUPABASE_SERVICE_ROLE_KEY=YOUR_ACTUAL_SERVICE_ROLE_KEY_HERE_FROM_DASHBOARD

# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**Где взять правильный ключ**:
1. https://supabase.com/dashboard/project/islicuycdgkjqbixfuyx/settings/api
2. Найдите секцию "Project API keys"
3. Копируйте ключ с названием **"service_role"** (не "anon"!)
4. Это секретный ключ - никогда не публикуйте его!

## ✅ Быстрая проверка (после исправления)

1. Остановить сервер: `Ctrl + C`
2. Проверить `.env.local` - правильный service_role key
3. Запустить: `npm run dev`
4. Открыть: http://localhost:3000
5. Попробовать зарегистрироваться
6. Проверить терминал - ошибки "Invalid API key" больше нет!

## 🎯 Следующий шаг

После исправления ошибки:
- Пользователи смогут регистрироваться
- Профили будут создаваться в таблице `users_profiles`
- Email-верификация будет работать
- Можно будет войти в систему

Удачи! 🚀
