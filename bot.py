import logging
from telegram import ForceReply, KeyboardButton, ReplyKeyboardMarkup, Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, ContextTypes, MessageHandler, filters, CallbackQueryHandler

# Enable logging
logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s", level=logging.INFO
)
logging.getLogger("httpx").setLevel(logging.WARNING)

logger = logging.getLogger(__name__)

TEXTS = {
    'ru': {
        'chosen_language': "Выберите язык:",
        'enter_full_name': "Введите ваше имя и фамилию:",
        'enter_phone': "Введите ваш номер телефона:",
        'main_menu': "Главное меню:",
        'main_buttons': [["🛍 Заказать", "🔥 Акция"], ["📦 Мои заказы", "⚙️ Настройки"], [ "📍 Ближайший филиал"]],
        'back': "⬅️ Назад",
        'order_menu': ['Доставка', 'Самовывоз'],
        'share_contact': "📞 Отправить номер телефона",
        'help': "Телефона",
    },
    'uz': {
        'chosen_language': "Tanlangan til:",
        'enter_full_name': "Ismingiz va familiyangizni kiriting:",
        'enter_phone': "Telefon raqamingizni kiriting:",
        'main_menu': "Asosiy menyu:",
        'main_buttons': [["🛍 Buyurtma berish", "🔥 Aksiya"], [ "📦 Buyurtmalarim", "⚙️ Sozlamalar"], [ "📍 Eng yaqin filial"]],
        'back': "⬅️ Orqaga",
        'order_menu': ['Yetkazib berish', 'Olib ketish'],
        'share_contact': "📞 Telefon raqamni yuborish",
        'help': "Yordam",
    }
}

user = {}  # Default language

# Define a few command handlers
async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Send a message when the command /help is issued."""
    user_id = update.effective_user.id
    lang = user.get(user_id, {}).get('language', 'ru')  # Default to 'ru' if no language selected
    await update.message.reply_text(TEXTS[lang]['help'])


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Send a message when the command /start is issued."""
    
    user_id = update.effective_user.id
    user[user_id] = {'language': None, 'full_name': None, 'phone': None}
    
    keyboard = [
        [
            InlineKeyboardButton("🇷🇺 Русский", callback_data='ru'),
            InlineKeyboardButton("🇺🇿 O'zbek", callback_data='uz'),
        ]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)

    await update.message.reply_text(
        TEXTS['ru']['chosen_language'] + "\n" + TEXTS['uz']['chosen_language'],
        reply_markup=reply_markup,
    )


# Handle language selection callback query
async def button(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle the button press for language selection."""
    query = update.callback_query
    user_id = query.from_user.id
    selected_language = query.data
    
    # Save the selected language in the user dictionary
    user[user_id]['language'] = selected_language
    
    # Send a confirmation message based on the selected language
    lang_texts = TEXTS[selected_language]
    await query.answer()  # Acknowledge the callback
    # Update the keyboard to show a checkmark next to the selected language
    keyboard = [
        [
            InlineKeyboardButton(
                "🇷🇺 Русский ✅" if selected_language == 'ru' else "🇷🇺 Русский", 
                callback_data='ru'
            ),
            InlineKeyboardButton(
                "🇺🇿 O'zbek ✅" if selected_language == 'uz' else "🇺🇿 O'zbek", 
                callback_data='uz'
            ),
        ]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    # Edit the message to update the keyboard
    await query.edit_message_text(
        lang_texts['chosen_language'], reply_markup=reply_markup
    )

    # You can then continue with additional steps, like asking for name or phone number
    user[user_id]['awaiting'] = 'full_name'  # Set state to await full name
    await query.message.reply_text(lang_texts['enter_full_name'])

# New handler to capture full name and phone number messages
async def handle_text(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle messages for full name and phone input."""
    user_id = update.effective_user.id
    if user_id not in user:
        await update.message.reply_text("Please send /start to begin the registration process.")
        return

    user_state = user[user_id].get('awaiting')
    lang = user[user_id].get('language', 'ru')
    
    if user_state == 'full_name':
        # Save the full name and update state to wait for phone number
        user[user_id]['full_name'] = update.message.text
        user[user_id]['awaiting'] = 'phone'
        await update.message.reply_text(
            TEXTS[lang]['enter_phone'],
            reply_markup=ReplyKeyboardMarkup(
            [[KeyboardButton(TEXTS[lang]['share_contact'], request_contact=True)]],
            resize_keyboard=True,
            one_time_keyboard=True
            )
        )
    elif user_state == 'phone':
        if update.message.contact:
            # Save the phone number from the shared contact
            user[user_id]['phone'] = update.message.contact.phone_number
        else:
            # Save the phone number from the text input
            user[user_id]['phone'] = update.message.text
        user[user_id].pop('awaiting', None)
        # Registration complete, show the main menu
        main_menu_buttons = TEXTS[lang]['main_buttons']
        await update.message.reply_text(
            TEXTS[lang]['main_menu'],
            reply_markup=ReplyKeyboardMarkup(
            main_menu_buttons,
            resize_keyboard=True
            )
        )

    else:
        await update.message.reply_text("I'm not expecting any input right now.")
    
# Handle button presses for "🛍 Buyurtma berish" or "🛍 Заказать"
async def handle_order_button(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user_id = update.effective_user.id
    lang = user[user_id].get('language', 'ru')
    order_buttons = [[TEXTS[lang]['back']]] + [[order_type] for order_type in TEXTS[lang]['order_types']]
    await update.message.reply_text(
        TEXTS[lang]['main_menu'],
        reply_markup=ReplyKeyboardMarkup(
            order_buttons,
            resize_keyboard=True
        )
    )

# Handle button presses for "🛍 Buyurtma berish" or "🛍 Заказать"
async def handle_order_button(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user_id = update.effective_user.id
    lang = user[user_id].get('language', 'ru')
    order_buttons = [[TEXTS[lang]['back']]] + [[order_type] for order_type in TEXTS[lang]['order_types']]
    await update.message.reply_text(
    TEXTS[lang]['main_menu'],
    reply_markup=ReplyKeyboardMarkup(
        order_buttons,
        resize_keyboard=True
    )
    )

    
def main() -> None:
    """Start the bot."""
    # Create the Application and pass it your bot's token.
    application = Application.builder().token("7820685548:AAFllspW0dGp6xDljt3NpoC_iI7mdSgHGA8").build()

    # on different commands - answer in Telegram
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("help", help_command))

    # Handle callback queries (button presses)
    application.add_handler(CallbackQueryHandler(button))

    # Handle text messages for full name and phone number
    application.add_handler(MessageHandler(filters.CONTACT, handle_text))
    # Handle reply keyboard button presses
    application.add_handler(MessageHandler(filters.Regex("⬅️ Назад|⬅️ Orqaga"), handle_text))
    
    # Add a handler for the order button
    application.add_handler(MessageHandler(filters.Regex("🛍 Buyurtma berish|🛍 Заказать"), handle_order_button))

    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_text))

    # Run the bot until the user presses Ctrl-C
    application.run_polling(allowed_updates=Update.ALL_TYPES)

if __name__ == "__main__":
    main()
