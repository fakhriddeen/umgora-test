import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

const translations = {
  en: {
    // Top Navigation Categories
    allCampaigns: "ALL CAMPAIGNS",
    ladies: "LADIES",
    gentlemen: "GENTLEMEN",
    children: "CHILDREN",

    
    // Legacy nav
    men: "Men",
    women: "Women",
    kids: "Kids",
    sale: "Sale",
    new: "New",
    search: "Search",
    searchPlaceholder: "Search products...",
    cart: "Bag",
    wishlist: "Wishlist",
    account: "Account",
    admin: "Admin",
    logout: "Logout",
    login: "Login",
    register: "Register",
    
    // Clothing subcategories
    clothing: "CLOTHING",
    pants: "Pants",
    shirtsPolos: "Shirts & Polos",
    jacketsCoats: "Jackets & Coats",
    sweatersCardigans: "Sweaters & Cardigans",
    sector: "Sector",
    jeans: "Jeans",
    pantsJeans: "Pants & Jeans",
    shirtsTops: "Shirts & Tops",
    sweaterKnitwear: "Sweater & Knitwear",
    beachwear: "Beachwear",
    laundry: "Laundry",
    
    // Shoes subcategories
    shoes: "SHOES",
    sneakers: "Sneakers",
    sportShoes: "Sport Shoes",
    loafers: "Loafers",
    laceUpShoes: "Lace-Up Shoes",
    bootsBoots: "Boots & Boots",
    openShoes: "Open Shoes",
    boots: "Boots",
    crawlingWalkingShoes: "Crawling & Walking Shoes",
    
    // Accessories subcategories
    accessories: "ACCESSORIES",
    bagsSuitcases: "Bags & Suitcases",
    jewelry: "Jewelry",
    watches: "Watches",
    hatsHatsCaps: "Hats, Hats & Caps",
    sunglasses: "Sunglasses",
    walletsCases: "Wallets & Cases",
    babyAccessories: "Baby Accessories",
    bagsBackpacks: "Bags & Backpacks",
    scarfsShawls: "Scarfs & Shawls",
    
    // Equipment subcategories
    equipment: "Equipment",
    sportsWatchesElectronics: "Sports Watches & Electronics",
    other: "OTHER",
    helmetsProtectors: "Helmets, Protectors & Protectors",
    bottlesBoxes: "Bottles & Boxes",
    ballsRackets: "Balls & Rackets",
    sportsSunglasses: "Sports & Sunglasses",
    toysCuddlyToys: "Toys & Cuddly Toys",
    
    // Care subcategories
    care: "Care",
    hair: "Hair",
    shavingBeardCare: "Shaving & Beard Care",
    accessoriesAccessories: "Accessories & Accessories",
    
    // Living subcategories
    household: "Household",
    crocketryCutlery: "Crockery & Cutlery",
    lamps: "Lamps",
    kitchenAccessories: "Kitchen Accessories",
    bathingAccessories: "Bathing Accessories",
    officeAccessories: "Office Accessories",
    
    textiles: "Textiles",
    bedLinenSheets: "Bed Linen & Sheets",
    bathroomTextiles: "Bathroom Textiles",
    tableLinen: "Table Linen",
    pillowsPillowcases: "Pillows & Pillowcases",
    kitchenTextiles: "Kitchen Textiles",
    blanketsPlaids: "Blankets & Plaids",
    
    homeAccessories: "Home Accessories",
    accessoriesDecoration: "Accessories & Decoration",
    storage: "Storage",
    candlesRoomFragrances: "Candles & Room Fragrances",
    vases: "Vases",
    flowersAccessories: "Flowers & Accessories",
    wallDesign: "Wall Design",
    
    furniture: "Furniture",
    balconyGarden: "Balcony & Garden",
    seatingFurniture: "Seating Furniture",
    wardrobes: "Wardrobes",
    bookshelves: "Bookshelves",
    tables: "Tables",
    bedsMattresses: "Beds & Mattresses",
    
    // Home page
    shopNow: "Shop Now",
    newArrivals: "New Arrivals",
    featuredCollections: "Featured Collections",
    discoverMore: "Discover More",
    
    // Looks Section
    shopTheLook: "Shop The Look",
    looksDescription: "Get inspired by our curated outfits and shop the complete look",
    noLooksAvailable: "No looks available yet",
    items: "items",
    backToLooks: "Back to Looks",
    clickToSeeProducts: "Click to see all products in this look",
    youMayAlsoLike: "You May Also Like",
    lookNotFound: "Look not found",
    viewProduct: "View",
    
    // Product
    addToBag: "Add to Bag",
    buyNow: "Buy Now",
    selectSize: "Select Size",
    selectColor: "Select Color",
    sizeGuide: "Size Guide",
    description: "Description",
    material: "Material",
    details: "Details",
    delivery: "Delivery",
    inStock: "In Stock",
    outOfStock: "Out of Stock",
    sku: "SKU",
    price: "Price",
    quantity: "Quantity",
    
    // Cart
    shoppingBag: "Shopping Bag",
    subtotal: "Subtotal",
    shipping: "Shipping",
    total: "Total",
    checkout: "Checkout",
    continueShopping: "Continue Shopping",
    emptyBag: "Your bag is empty",
    remove: "Remove",
    freeShipping: "Free Shipping",
    applyPromoCode: "Apply Promo Code",
    promoCodePlaceholder: "Enter promo code",
    promoApplied: "Promo code applied!",
    invalidPromo: "Invalid promo code",
    discount: "Discount",
    
    // Filters
    filterBy: "Filter by",
    sortBy: "Sort by",
    priceRange: "Price Range",
    size: "Size",
    color: "Color",
    category: "Category",
    clearAll: "Clear All",
    apply: "Apply",
    newestFirst: "Newest First",
    oldestFirst: "Oldest First",
    priceLowHigh: "Price: Low to High",
    priceHighLow: "Price: High to Low",
    mostPopular: "Most Popular",
    
    // Admin
    dashboard: "Dashboard",
    products: "Products",
    orders: "Orders",
    campaigns: "Campaigns",
    categories: "Categories",
    looks: "LOOKS",
    addProduct: "Add Product",
    editProduct: "Edit Product",
    addCampaign: "Create Campaign",
    addLook: "Add Look",
    editLook: "Edit Look",
    deleteLook: "Delete Look",
    
    // Orders
    orderHistory: "Order History",
    orderNumber: "Order",
    orderDate: "Date",
    orderStatus: "Status",
    orderTotal: "Total",
    pending: "Pending",
    confirmed: "Confirmed",
    processing: "Processing",
    shipped: "Shipped",
    delivered: "Delivered",
    cancelled: "Cancelled",
    
    // Checkout
    shippingAddress: "Shipping Address",
    fullName: "Full Name",
    addressLine1: "Address Line 1",
    addressLine2: "Address Line 2",
    city: "City",
    postalCode: "Postal Code",
    country: "Country",
    phone: "Phone",
    paymentMethod: "Payment Method",
    placeOrder: "Place Order",
    orderPlaced: "Order placed successfully!",
    orderConfirmation: "Order Confirmation",
    
    // Campaign
    campaignDiscount: "Campaign Discount",
    validUntil: "Valid Until",
    
    // Wishlist
    yourWishlist: "Your Wishlist",
    emptyWishlist: "Your wishlist is empty",
    addToWishlist: "Add to Wishlist",
    removeFromWishlist: "Remove from Wishlist",
    
    // Profile
    myProfile: "My Profile",
    editProfile: "Edit Profile",
    saveChanges: "Save Changes",
    
    // Common
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    loading: "Loading...",
    view: "View",
    home: "Home",
    specialOffers: "Special Offers",
    noProductsFound: "No products found",
    clearFilters: "Clear Filters",
    
    // Footer
    shop: "Shop",
    help: "Help",
    contact: "Contact",
    returns: "Returns",
    newsletter: "Newsletter",
    subscribeExclusive: "Subscribe for exclusive offers",
    allRightsReserved: "All rights reserved",
    
    // Errors/Messages
    pleaseLogin: "Please log in to continue",
    loginToContinue: "Login to Continue",
    errorOccurred: "An error occurred",
    tryAgain: "Try Again",
    success: "Success",
    
    // Sizes
    sizeXS: "XS",
    sizeS: "S",
    sizeM: "M",
    sizeL: "L",
    sizeXL: "XL",
    sizeXXL: "XXL",
  },
  
  de: {
    // Top Navigation Categories
    allCampaigns: "ALLE KAMPAGNEN",
    ladies: "DAMEN",
    gentlemen: "HERREN",
    children: "KINDER",

    
    // Legacy nav
    men: "Herren",
    women: "Damen",
    kids: "Kinder",
    sale: "Sale",
    new: "Neu",
    search: "Suchen",
    searchPlaceholder: "Produkte suchen...",
    cart: "Tasche",
    wishlist: "Wunschliste",
    account: "Konto",
    admin: "Admin",
    logout: "Abmelden",
    login: "Anmelden",
    register: "Registrieren",
    
    // Clothing subcategories
    clothing: "BEKLEIDUNG",
    pants: "Hosen",
    shirtsPolos: "Hemden & Polos",
    jacketsCoats: "Jacken & Mäntel",
    sweatersCardigans: "Pullover & Strickjacken",
    sector: "Sektor",
    jeans: "Jeans",
    pantsJeans: "Hosen & Jeans",
    shirtsTops: "Hemden & Tops",
    sweaterKnitwear: "Pullover & Strickwaren",
    beachwear: "Badebekleidung",
    laundry: "Wäsche",
    
    // Shoes subcategories
    shoes: "SCHUHE",
    sneakers: "Sneakers",
    sportShoes: "Sportschuhe",
    loafers: "Loafers",
    laceUpShoes: "Schnürschuhe",
    bootsBoots: "Stiefel & Boots",
    openShoes: "Offene Schuhe",
    boots: "Stiefel",
    crawlingWalkingShoes: "Krabbel- & Laufschuhe",
    
    // Accessories subcategories
    accessories: "ACCESSOIRES",
    bagsSuitcases: "Taschen & Koffer",
    jewelry: "Schmuck",
    watches: "Uhren",
    hatsHatsCaps: "Hüte, Mützen & Caps",
    sunglasses: "Sonnenbrillen",
    walletsCases: "Geldbörsen & Etuis",
    babyAccessories: "Baby-Accessoires",
    bagsBackpacks: "Taschen & Rucksäcke",
    scarfsShawls: "Schals & Tücher",
    
    // Equipment subcategories
    equipment: "Ausrüstung",
    sportsWatchesElectronics: "Sportuhren & Elektronik",
    other: "SONSTIGES",
    helmetsProtectors: "Helme, Protektoren & Schützer",
    bottlesBoxes: "Flaschen & Boxen",
    ballsRackets: "Bälle & Schläger",
    sportsSunglasses: "Sport- & Sonnenbrillen",
    toysCuddlyToys: "Spielzeug & Kuscheltiere",
    
    // Care subcategories
    care: "Pflege",
    hair: "Haare",
    shavingBeardCare: "Rasur & Bartpflege",
    accessoriesAccessories: "Zubehör & Accessoires",
    
    // Living subcategories
    household: "Haushalt",
    crocketryCutlery: "Geschirr & Besteck",
    lamps: "Lampen",
    kitchenAccessories: "Küchenzubehör",
    bathingAccessories: "Badezubehör",
    officeAccessories: "Bürozubehör",
    
    textiles: "Textilien",
    bedLinenSheets: "Bettwäsche & Laken",
    bathroomTextiles: "Badtextilien",
    tableLinen: "Tischwäsche",
    pillowsPillowcases: "Kissen & Kissenbezüge",
    kitchenTextiles: "Küchentextilien",
    blanketsPlaids: "Decken & Plaids",
    
    homeAccessories: "Wohnaccessoires",
    accessoriesDecoration: "Accessoires & Dekoration",
    storage: "Aufbewahrung",
    candlesRoomFragrances: "Kerzen & Raumdüfte",
    vases: "Vasen",
    flowersAccessories: "Blumen & Zubehör",
    wallDesign: "Wandgestaltung",
    
    furniture: "Möbel",
    balconyGarden: "Balkon & Garten",
    seatingFurniture: "Sitzmöbel",
    wardrobes: "Schränke",
    bookshelves: "Bücherregale",
    tables: "Tische",
    bedsMattresses: "Betten & Matratzen",
    
    // Home page
    shopNow: "Jetzt Einkaufen",
    newArrivals: "Neuankömmlinge",
    featuredCollections: "Ausgewählte Kollektionen",
    discoverMore: "Mehr Entdecken",
    
    // Looks Section
    shopTheLook: "Shop The Look",
    looksDescription: "Lassen Sie sich von unseren kuratierten Outfits inspirieren und kaufen Sie den kompletten Look",
    noLooksAvailable: "Noch keine Looks verfügbar",
    items: "Artikel",
    backToLooks: "Zurück zu Looks",
    clickToSeeProducts: "Klicken Sie, um alle Produkte in diesem Look zu sehen",
    youMayAlsoLike: "Das könnte Ihnen auch gefallen",
    lookNotFound: "Look nicht gefunden",
    viewProduct: "Ansehen",
    
    // Product
    addToBag: "In Die Tasche",
    buyNow: "Jetzt Kaufen",
    selectSize: "Größe Wählen",
    selectColor: "Farbe Wählen",
    sizeGuide: "Größentabelle",
    description: "Beschreibung",
    material: "Material",
    details: "Details",
    delivery: "Lieferung",
    inStock: "Auf Lager",
    outOfStock: "Ausverkauft",
    sku: "Artikelnummer",
    price: "Preis",
    quantity: "Menge",
    
    // Cart
    shoppingBag: "Einkaufstasche",
    subtotal: "Zwischensumme",
    shipping: "Versand",
    total: "Gesamt",
    checkout: "Zur Kasse",
    continueShopping: "Weiter Einkaufen",
    emptyBag: "Ihre Tasche ist leer",
    remove: "Entfernen",
    freeShipping: "Kostenloser Versand",
    applyPromoCode: "Aktionscode Anwenden",
    promoCodePlaceholder: "Aktionscode eingeben",
    promoApplied: "Aktionscode angewendet!",
    invalidPromo: "Ungültiger Aktionscode",
    discount: "Rabatt",
    
    // Filters
    filterBy: "Filtern Nach",
    sortBy: "Sortieren Nach",
    priceRange: "Preisspanne",
    size: "Größe",
    color: "Farbe",
    category: "Kategorie",
    clearAll: "Alle Löschen",
    apply: "Anwenden",
    newestFirst: "Neueste Zuerst",
    oldestFirst: "Älteste Zuerst",
    priceLowHigh: "Preis: Niedrig nach Hoch",
    priceHighLow: "Preis: Hoch nach Niedrig",
    mostPopular: "Beliebteste",
    
    // Admin
    dashboard: "Dashboard",
    products: "Produkte",
    orders: "Bestellungen",
    campaigns: "Kampagnen",
    categories: "Kategorien",
    looks: "LOOKS",
    addProduct: "Produkt Hinzufügen",
    editProduct: "Produkt Bearbeiten",
    addCampaign: "Kampagne Erstellen",
    addLook: "Look Hinzufügen",
    editLook: "Look Bearbeiten",
    deleteLook: "Look Löschen",
    
    // Orders
    orderHistory: "Bestellverlauf",
    orderNumber: "Bestellung",
    orderDate: "Datum",
    orderStatus: "Status",
    orderTotal: "Gesamt",
    pending: "Ausstehend",
    confirmed: "Bestätigt",
    processing: "In Bearbeitung",
    shipped: "Versendet",
    delivered: "Geliefert",
    cancelled: "Storniert",
    
    // Checkout
    shippingAddress: "Lieferadresse",
    fullName: "Vollständiger Name",
    addressLine1: "Adresszeile 1",
    addressLine2: "Adresszeile 2",
    city: "Stadt",
    postalCode: "Postleitzahl",
    country: "Land",
    phone: "Telefon",
    paymentMethod: "Zahlungsmethode",
    placeOrder: "Bestellung Aufgeben",
    orderPlaced: "Bestellung erfolgreich aufgegeben!",
    orderConfirmation: "Bestellbestätigung",
    
    // Campaign
    campaignDiscount: "Kampagnenrabatt",
    validUntil: "Gültig Bis",
    
    // Wishlist
    yourWishlist: "Ihre Wunschliste",
    emptyWishlist: "Ihre Wunschliste ist leer",
    addToWishlist: "Zur Wunschliste",
    removeFromWishlist: "Von Wunschliste entfernen",
    
    // Profile
    myProfile: "Mein Profil",
    editProfile: "Profil Bearbeiten",
    saveChanges: "Änderungen Speichern",
    
    // Common
    save: "Speichern",
    cancel: "Abbrechen",
    delete: "Löschen",
    edit: "Bearbeiten",
    loading: "Laden...",
    view: "Ansehen",
    home: "Startseite",
    specialOffers: "Sonderangebote",
    noProductsFound: "Keine Produkte gefunden",
    clearFilters: "Filter Löschen",
    
    // Footer
    shop: "Shop",
    help: "Hilfe",
    contact: "Kontakt",
    returns: "Rückgabe",
    newsletter: "Newsletter",
    subscribeExclusive: "Abonnieren Sie für exklusive Angebote",
    allRightsReserved: "Alle Rechte vorbehalten",
    
    // Errors/Messages
    pleaseLogin: "Bitte melden Sie sich an, um fortzufahren",
    loginToContinue: "Anmelden zum Fortfahren",
    errorOccurred: "Ein Fehler ist aufgetreten",
    tryAgain: "Erneut Versuchen",
    success: "Erfolg",
    
    // Sizes
    sizeXS: "XS",
    sizeS: "S",
    sizeM: "M",
    sizeL: "L",
    sizeXL: "XL",
    sizeXXL: "XXL",
  },
  
  ru: {
    // Top Navigation Categories
    allCampaigns: "ВСЕ АКЦИИ",
    ladies: "ЖЕНЩИНАМ",
    gentlemen: "МУЖЧИНАМ",
    children: "ДЕТЯМ",

    
    // Legacy nav
    men: "Мужчины",
    women: "Женщины",
    kids: "Дети",
    sale: "Распродажа",
    new: "Новинки",
    search: "Поиск",
    searchPlaceholder: "Искать товары...",
    cart: "Корзина",
    wishlist: "Избранное",
    account: "Аккаунт",
    admin: "Админ",
    logout: "Выйти",
    login: "Войти",
    register: "Регистрация",
    
    // Clothing subcategories
    clothing: "ОДЕЖДА",
    pants: "Брюки",
    shirtsPolos: "Рубашки и поло",
    jacketsCoats: "Куртки и пальто",
    sweatersCardigans: "Свитера и кардиганы",
    sector: "Сектор",
    jeans: "Джинсы",
    pantsJeans: "Брюки и джинсы",
    shirtsTops: "Рубашки и топы",
    sweaterKnitwear: "Свитера и трикотаж",
    beachwear: "Пляжная одежда",
    laundry: "Белье",
    
    // Shoes subcategories
    shoes: "ОБУВЬ",
    sneakers: "Кроссовки",
    sportShoes: "Спортивная обувь",
    loafers: "Лоферы",
    laceUpShoes: "Обувь на шнуровке",
    bootsBoots: "Ботинки и сапоги",
    openShoes: "Открытая обувь",
    boots: "Ботинки",
    crawlingWalkingShoes: "Обувь для малышей",
    
    // Accessories subcategories
    accessories: "АКСЕССУАРЫ",
    bagsSuitcases: "Сумки и чемоданы",
    jewelry: "Украшения",
    watches: "Часы",
    hatsHatsCaps: "Шляпы и кепки",
    sunglasses: "Солнцезащитные очки",
    walletsCases: "Кошельки и чехлы",
    babyAccessories: "Детские аксессуары",
    bagsBackpacks: "Сумки и рюкзаки",
    scarfsShawls: "Шарфы и платки",
    
    // Equipment subcategories
    equipment: "Снаряжение",
    sportsWatchesElectronics: "Спортивные часы и электроника",
    other: "ДРУГОЕ",
    helmetsProtectors: "Шлемы и защита",
    bottlesBoxes: "Бутылки и контейнеры",
    ballsRackets: "Мячи и ракетки",
    sportsSunglasses: "Спортивные очки",
    toysCuddlyToys: "Игрушки и мягкие игрушки",
    
    // Care subcategories
    care: "Уход",
    hair: "Волосы",
    shavingBeardCare: "Бритье и уход за бородой",
    accessoriesAccessories: "Аксессуары и принадлежности",
    
    // Living subcategories
    household: "Домашнее хозяйство",
    crocketryCutlery: "Посуда и столовые приборы",
    lamps: "Лампы",
    kitchenAccessories: "Кухонные аксессуары",
    bathingAccessories: "Аксессуары для ванной",
    officeAccessories: "Офисные аксессуары",
    
    textiles: "Текстиль",
    bedLinenSheets: "Постельное белье",
    bathroomTextiles: "Текстиль для ванной",
    tableLinen: "Столовый текстиль",
    pillowsPillowcases: "Подушки и наволочки",
    kitchenTextiles: "Кухонный текстиль",
    blanketsPlaids: "Одеяла и пледы",
    
    homeAccessories: "Домашние аксессуары",
    accessoriesDecoration: "Аксессуары и декор",
    storage: "Хранение",
    candlesRoomFragrances: "Свечи и ароматы",
    vases: "Вазы",
    flowersAccessories: "Цветы и аксессуары",
    wallDesign: "Оформление стен",
    
    furniture: "Мебель",
    balconyGarden: "Балкон и сад",
    seatingFurniture: "Мягкая мебель",
    wardrobes: "Шкафы",
    bookshelves: "Книжные полки",
    tables: "Столы",
    bedsMattresses: "Кровати и матрасы",
    
    // Home page
    shopNow: "Купить Сейчас",
    newArrivals: "Новые Поступления",
    featuredCollections: "Избранные Коллекции",
    discoverMore: "Узнать Больше",
    
    // Looks Section
    shopTheLook: "Shop The Look",
    looksDescription: "Вдохновляйтесь нашими подобранными образами и покупайте полный образ",
    noLooksAvailable: "Пока нет доступных образов",
    items: "товаров",
    backToLooks: "Назад к образам",
    clickToSeeProducts: "Нажмите, чтобы увидеть все товары в этом образе",
    youMayAlsoLike: "Вам также может понравиться",
    lookNotFound: "Образ не найден",
    viewProduct: "Смотреть",
    
    // Product
    addToBag: "В Корзину",
    buyNow: "Купить Сейчас",
    selectSize: "Выберите Размер",
    selectColor: "Выберите Цвет",
    sizeGuide: "Таблица Размеров",
    description: "Описание",
    material: "Материал",
    details: "Детали",
    delivery: "Доставка",
    inStock: "В Наличии",
    outOfStock: "Нет в Наличии",
    sku: "Артикул",
    price: "Цена",
    quantity: "Количество",
    
    // Cart
    shoppingBag: "Корзина",
    subtotal: "Промежуточный Итог",
    shipping: "Доставка",
    total: "Итого",
    checkout: "Оформить",
    continueShopping: "Продолжить Покупки",
    emptyBag: "Ваша корзина пуста",
    remove: "Удалить",
    freeShipping: "Бесплатная доставка",
    applyPromoCode: "Применить промокод",
    promoCodePlaceholder: "Введите промокод",
    promoApplied: "Промокод применен!",
    invalidPromo: "Неверный промокод",
    discount: "Скидка",
    
    // Filters
    filterBy: "Фильтровать По",
    sortBy: "Сортировать По",
    priceRange: "Диапазон Цен",
    size: "Размер",
    color: "Цвет",
    category: "Категория",
    clearAll: "Очистить Все",
    apply: "Применить",
    newestFirst: "Сначала новые",
    oldestFirst: "Сначала старые",
    priceLowHigh: "Цена: по возрастанию",
    priceHighLow: "Цена: по убыванию",
    mostPopular: "Популярные",
    
    // Admin
    dashboard: "Панель",
    products: "Товары",
    orders: "Заказы",
    campaigns: "Кампании",
    categories: "Категории",
    looks: "ОБРАЗЫ",
    addProduct: "Добавить Товар",
    editProduct: "Редактировать Товар",
    addCampaign: "Создать Кампанию",
    addLook: "Добавить образ",
    editLook: "Редактировать образ",
    deleteLook: "Удалить образ",
    
    // Orders
    orderHistory: "История Заказов",
    orderNumber: "Заказ",
    orderDate: "Дата",
    orderStatus: "Статус",
    orderTotal: "Итого",
    pending: "Ожидает",
    confirmed: "Подтвержден",
    processing: "Обрабатывается",
    shipped: "Отправлен",
    delivered: "Доставлен",
    cancelled: "Отменен",
    
    // Checkout
    shippingAddress: "Адрес доставки",
    fullName: "Полное имя",
    addressLine1: "Адрес (строка 1)",
    addressLine2: "Адрес (строка 2)",
    city: "Город",
    postalCode: "Почтовый индекс",
    country: "Страна",
    phone: "Телефон",
    paymentMethod: "Способ оплаты",
    placeOrder: "Оформить заказ",
    orderPlaced: "Заказ успешно оформлен!",
    orderConfirmation: "Подтверждение заказа",
    
    // Campaign
    campaignDiscount: "Скидка Кампании",
    validUntil: "Действует До",
    
    // Wishlist
    yourWishlist: "Ваше избранное",
    emptyWishlist: "Ваш список избранного пуст",
    addToWishlist: "В избранное",
    removeFromWishlist: "Удалить из избранного",
    
    // Profile
    myProfile: "Мой профиль",
    editProfile: "Редактировать профиль",
    saveChanges: "Сохранить изменения",
    
    // Common
    save: "Сохранить",
    cancel: "Отмена",
    delete: "Удалить",
    edit: "Редактировать",
    loading: "Загрузка...",
    view: "Просмотр",
    home: "Главная",
    specialOffers: "Специальные Предложения",
    noProductsFound: "Товары не найдены",
    clearFilters: "Очистить фильтры",
    
    // Footer
    shop: "Магазин",
    help: "Помощь",
    contact: "Контакты",
    returns: "Возврат",
    newsletter: "Рассылка",
    subscribeExclusive: "Подпишитесь на эксклюзивные предложения",
    allRightsReserved: "Все права защищены",
    
    // Errors/Messages
    pleaseLogin: "Пожалуйста, войдите для продолжения",
    loginToContinue: "Войти для продолжения",
    errorOccurred: "Произошла ошибка",
    tryAgain: "Попробовать снова",
    success: "Успешно",
    
    // Sizes
    sizeXS: "XS",
    sizeS: "S",
    sizeM: "M",
    sizeL: "L",
    sizeXL: "XL",
    sizeXXL: "XXL",
  }
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('en');
  const [isRTL, setIsRTL] = useState(false);
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const savedLang = localStorage.getItem('language') || 'en';
    setLanguage(savedLang);
  }, []);

  const changeLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
    setIsRTL(lang === 'ar' || lang === 'he');
    // Force re-render of all components using this context
    forceUpdate(n => n + 1);
  };

  const t = (key) => {
    return translations[language]?.[key] || translations.en[key] || key;
  };

  const getLocalizedField = (obj, field) => {
    if (!obj) return '';
    return obj[`${field}_${language}`] || obj[`${field}_en`] || obj[field] || '';
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t, getLocalizedField, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};