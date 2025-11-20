import { useCallback } from 'react'
import type { Language } from '@/lib/settings'

const EN_TRANSLATIONS: Record<string, string> = {}
const RU_TRANSLATIONS: Record<string, string> = {
  '© {{year}} ReadIQ. All rights reserved.': '© {{year}} ReadIQ. Все права защищены.',
  'Adjust appearance and language preferences for ReadIQ.': 'Настройте внешний вид и язык интерфейса ReadIQ.',
  'Appearance': 'Оформление',
  'Bright interface ideal for daytime use.': 'Светлая тема, подходящая для дневного освещения.',
  'Created by educators for real learning outcomes.': 'Создано преподавателями для реальных учебных результатов.',
  'Empowering students with effective reading comprehension tools.': 'Помогаем студентам эффективными инструментами для развития чтения и понимания текста.',
  'Five-minute assessments that fit into any schedule.': 'Пятиминутные проверки знаний впишутся в любой график.',
  'Groups': 'Группы',
  'Quizzes': 'Квизы',
  'Analytics': 'Аналитика',
  'Choose the language used across the entire interface.': 'Выберите язык, который будет использоваться во всём интерфейсе.',
  'Control theme, language, and accessibility preferences for your account.': 'Управляйте темой, языком и параметрами доступности своего аккаунта.',
  'Dark mode': 'Тёмная тема',
  'Dimmed interface to reduce eye strain in low light.': 'Приглушённая палитра, чтобы снизить нагрузку на глаза при слабом освещении.',
  'English': 'Английский',
  'Get started': 'Начать работу',
  'Go to home': 'На главную',
  'Log in': 'Войти',
  'Login - ReadIQ': 'ReadIQ — вход в систему',
  'Login failed': 'Не удалось выполнить вход',
  'Login to your ReadIQ account': 'Войдите в свой аккаунт ReadIQ',
  'Signed in successfully! Redirecting to your dashboard...': 'Вход выполнен! Переходим в аккаунт…',
  'Sign in': 'Войти',
  'Sign in to your account': 'Войдите в аккаунт',
  'Signing in...': 'Выполняем вход…',
  'Sign up': 'Зарегистрироваться',
  "Don't have an account?": 'Нет аккаунта?',
  'Master reading comprehension in minutes.': 'Освойте понимание прочитанного за считанные минуты.',
  'ReadIQ - Master reading comprehension in minutes': 'ReadIQ — улучшайте понимание прочитанного за минуты',
  'Email address': 'Адрес электронной почты',
  'Email is required': 'Необходимо указать email',
  'Please enter a valid email address': 'Введите корректный email',
  'Password': 'Пароль',
  'Password is required': 'Необходимо указать пароль',
  'Password must be at least 8 characters long': 'Пароль должен быть не короче 8 символов',
  'Password must contain at least one number': 'Пароль должен содержать хотя бы одну цифру',
  'Forgot your password?': 'Забыли пароль?',
  'Please verify your email before logging in. Check your inbox.': 'Пожалуйста, подтвердите email перед входом. Проверьте почту.',
  'Please verify your email before logging in.': 'Подтвердите email, прежде чем входить в систему.',
  'No session returned': 'Сессия не сформирована',
  'Failed to persist session': 'Не удалось сохранить сессию',
  'This email is already registered. Please log in instead.': 'Этот email уже зарегистрирован. Пожалуйста, войдите.',
  'Invalid email or password. Please try again.': 'Неверный email или пароль. Попробуйте ещё раз.',
  'Too many attempts. Please try again later.': 'Слишком много попыток. Попробуйте позже.',
  'An unexpected error occurred. Please try again.': 'Произошла непредвиденная ошибка. Попробуйте ещё раз.',
  'Light mode': 'Светлая тема',
  'Language': 'Язык',
  'Legal': 'Правовая информация',
  'Privacy policy': 'Политика конфиденциальности',
  'Need more settings?': 'Нужны дополнительные настройки?',
  'Russian': 'Русский',
  'Select how ReadIQ looks on this device.': 'Выберите, как будет выглядеть ReadIQ на этом устройстве.',
  'Settings': 'Настройки',
  'Quick assessments that help students improve reading skills and stay motivated.': 'Быстрые проверки знаний помогают ученикам развивать чтение и сохранять мотивацию.',
  'Quick and efficient': 'Быстро и эффективно',
  'Quick 5-minute assessments designed by educators to help students improve reading skills and track progress effectively.': 'Короткие пятиминутные задания от преподавателей помогают ученикам развивать чтение и отслеживать прогресс.',
  'We are expanding customization options. Let us know what you need via support@readiq.app.': 'Мы расширяем список настроек. Напишите на support@readiq.app, какие параметры вам нужны.',
  'Quick links': 'Быстрые ссылки',
  'Terms of service': 'Условия использования',
  'Use English for all interface elements.': 'Использовать английский язык во всех элементах интерфейса.',
  'Use Russian for all interface elements.': 'Использовать русский язык во всех элементах интерфейса.',
  'Toggle color theme': 'Переключить тему оформления',
  '← Back': '← Назад',
  'Mentor': 'Наставник',
  'Student': 'Студент',
  'Profile': 'Профиль',
  'Logging out...': 'Выходим из аккаунта…',
  'Log out': 'Выйти',
  'Monitor improvement with detailed analytics.': 'Отслеживайте прогресс с помощью подробной аналитики.',
  'Teacher-designed': 'Разработано преподавателями',
  'Track progress': 'Отслеживайте прогресс',
  'Failed to refresh quiz data': 'Не удалось обновить данные квиза',
  'Quiz data refreshed': 'Данные квиза обновлены',
  'Error while refreshing quiz data': 'Ошибка при обновлении данных квиза',
  'Quiz title is required': 'Название квиза обязательно',
  'Failed to update quiz': 'Не удалось обновить квиз',
  'Quiz updated': 'Квиз обновлён',
  'Error while saving quiz': 'Ошибка при сохранении квиза',
  'Archive this quiz? This action cannot be undone.': 'Архивировать этот квиз? Действие нельзя отменить.',
  'Failed to archive quiz': 'Не удалось архивировать квиз',
  'Quiz archived': 'Квиз отправлен в архив',
  'Error while archiving quiz': 'Ошибка при архивировании квиза',
  'Back to quizzes': 'Назад к квизам',
  'Created {{date}}': 'Создан {{date}}',
  'Updated {{date}}': 'Обновлён {{date}}',
  'Refreshing...': 'Обновление...',
  'Refresh': 'Обновить',
  'Cancel': 'Отмена',
  'Edit': 'Редактировать',
  'Archiving...': 'Архивирование...',
  'Archive': 'Архивировать',
  'Quiz information': 'Информация о квизе',
  'No description provided': 'Описание не указано',
  'Template status': 'Статус шаблона',
  'Active': 'Активен',
  'Disabled': 'Отключён',
  'Title': 'Название',
  'Description': 'Описание',
  'Saving...': 'Сохранение...',
  'Save': 'Сохранить',
  'Linked groups': 'Привязанные группы',
  'This quiz is not linked to any group yet. Create an assignment when scheduling an instance.': 'Квиз пока не привязан ни к одной группе. Создайте назначение при создании инстанса.',
  'Unknown group': 'Неизвестная группа',
  'Status': 'Статус',
  'Slot': 'Слот',
  'Duration': 'Продолжительность',
  'Question preview': 'Предпросмотр вопросов',
  'items': 'шт.',
  'This quiz has no questions yet.': 'В этом квизе пока нет вопросов.',
  'Question': 'Вопрос',
  'Difficulty': 'Сложность',
  'Slide': 'Слайд',
  'Creation method': 'Способ создания',
  'Manual mode': 'Ручной режим',
  'Enter questions and answers yourself.': 'Самостоятельно заполните вопросы и ответы.',
  'AI from text': 'AI из текста',
  'Describe the material and AI will prepare a quiz.': 'Опишите материал — AI подготовит квиз.',
  'AI from PDF': 'AI из PDF',
  'Upload a document and AI will extract the text to build a quiz.': 'Загрузите документ — AI извлечёт текст и создаст квиз.',
  'Difficulty level': 'Уровень сложности',
  'Choose a difficulty level that AI should follow when creating questions.': 'Подберите сложность, на которую AI будет ориентироваться при составлении вопросов.',
  'Prompt for AI': 'Описание для AI',
  'For example: read the text about the water cycle and prepare comprehension questions.': 'Например: прочитай текст о круговороте воды и подготовь вопросы для проверки понимания',
  'Number of questions': 'Количество вопросов',
  'AI will prepare a draft quiz that you can edit on the next step.': 'AI сгенерирует тест и его можно будет отредактировать на следующем шаге.',
  'AI will use the selected level to balance the difficulty of generated questions.': 'AI будет придерживаться выбранного уровня, расставляя баланс сложности в создаваемом квизе.',
  'PDF document': 'PDF документ',
  'Remove': 'Удалить',
  'The document will be converted to text so AI can generate questions. You can edit them on the next step.': 'Документ будет преобразован в текст, после чего AI сгенерирует вопросы. При необходимости отредактируйте их на следующем шаге.',
  'Loading groups...': 'Загрузка групп...',
  'No groups available yet.': 'Пока нет доступных групп.',
  'Create a group': 'Создайте группу',
  'and come back to link this quiz.': 'затем вернитесь, чтобы привязать квиз.',
  'Select a group...': 'Выберите группу...',
  'Generating...': 'Генерация...',
  'Next': 'Далее',
  'Correct answer': 'Правильный ответ',
  'Add at least one question': 'Добавьте минимум один вопрос',
  'Review': 'Предпросмотр',
  'Group': 'Группа',
  'Questions': 'Вопросы'
}

const interpolate = (template: string, variables?: Record<string, string | number>) => {
  if (!variables) return template
  return Object.keys(variables).reduce((acc, key) => {
    const value = String(variables[key])
    return acc.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), value)
  }, template)
}

export const translateText = (
  language: Language,
  defaultText: string,
  variables?: Record<string, string | number>,
) => {
  if (language === 'en') {
    const translated = EN_TRANSLATIONS[defaultText] ?? defaultText
    return interpolate(translated, variables)
  }
  if (language === 'ru') {
    const translated = RU_TRANSLATIONS[defaultText] ?? defaultText
    return interpolate(translated, variables)
  }
  return interpolate(defaultText, variables)
}

export const useTranslate = (language: Language) => {
  return useCallback(
    (defaultText: string, variables?: Record<string, string | number>) =>
      translateText(language, defaultText, variables),
    [language],
  )
}

export const getRuTranslations = () => RU_TRANSLATIONS
export const getEnTranslations = () => EN_TRANSLATIONS
