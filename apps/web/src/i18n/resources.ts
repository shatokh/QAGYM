export const resources = {
  en: {
    translation: {
      app: {
        brand: "QA Comics Gym",
        cleanCore: "Clean Core first",
        homeLabel: "QA Comics Gym catalog home",
        skipToContent: "Skip to main content",
      },
      locale: {
        navigationLabel: "Language",
      },
      catalog: {
        eyebrow: "Clean catalog",
        title: "Comics catalog",
        introduction:
          "The catalog data boundary is ready. Product cards arrive in the next approved task.",
        loading: "Loading catalog.",
        ready: "Catalog response received: {{count}} items.",
        errorTitle: "Catalog is unavailable",
        errorMessage: "The catalog could not be loaded. Try again.",
      },
      comic: {
        eyebrow: "Clean catalog",
        title: "Comic details",
        introduction:
          "The product data boundary is ready. The complete detail view arrives in the next approved task.",
        loading: "Loading comic details.",
        ready: "Comic response received for {{title}}.",
        errorTitle: "Comic details are unavailable",
        errorMessage: "The comic could not be loaded. Try again.",
        notFoundTitle: "Comic not found",
        notFoundMessage: "This comic is not available in the public catalog.",
      },
      actions: {
        retry: "Try again",
        backToCatalog: "Back to catalog",
      },
      notFound: {
        eyebrow: "Not found",
        title: "Page not found",
        message: "The requested page or language is not available.",
      },
      errors: {
        unexpectedTitle: "Something went wrong",
        unexpectedMessage:
          "The application could not display this page. Reload and try again.",
      },
    },
  },
  ru: {
    translation: {
      app: {
        brand: "QA Comics Gym",
        cleanCore: "Сначала чистое поведение",
        homeLabel: "Главная каталога QA Comics Gym",
        skipToContent: "Перейти к основному содержимому",
      },
      locale: {
        navigationLabel: "Язык",
      },
      catalog: {
        eyebrow: "Чистый каталог",
        title: "Каталог комиксов",
        introduction:
          "Контракт данных каталога готов. Карточки товаров появятся в следующей одобренной задаче.",
        loading: "Загрузка каталога.",
        ready: "Получен ответ каталога: {{count}} позиций.",
        errorTitle: "Каталог недоступен",
        errorMessage: "Не удалось загрузить каталог. Попробуйте ещё раз.",
      },
      comic: {
        eyebrow: "Чистый каталог",
        title: "Детали комикса",
        introduction:
          "Контракт данных товара готов. Полная страница появится в следующей одобренной задаче.",
        loading: "Загрузка информации о комиксе.",
        ready: "Получены данные комикса «{{title}}».",
        errorTitle: "Детали комикса недоступны",
        errorMessage: "Не удалось загрузить комикс. Попробуйте ещё раз.",
        notFoundTitle: "Комикс не найден",
        notFoundMessage: "Этот комикс недоступен в публичном каталоге.",
      },
      actions: {
        retry: "Попробовать снова",
        backToCatalog: "Вернуться в каталог",
      },
      notFound: {
        eyebrow: "Не найдено",
        title: "Страница не найдена",
        message: "Запрошенная страница или язык недоступны.",
      },
      errors: {
        unexpectedTitle: "Что-то пошло не так",
        unexpectedMessage:
          "Приложение не смогло показать страницу. Перезагрузите её и попробуйте снова.",
      },
    },
  },
} as const;
