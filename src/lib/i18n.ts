import { useAuth } from '../context/AuthContext';

export type Language = 'English' | 'Hindi' | 'Hinglish';

const dictionary: Record<string, Record<Language, string>> = {
  // Tabs & Global
  dashboard: { English: 'Dashboard', Hindi: 'डैशबोर्ड', Hinglish: 'Dashboard' },
  transactions: { English: 'Transactions', Hindi: 'लेन-देन', Hinglish: 'Transactions' },
  history: { English: 'History', Hindi: 'इतिहास', Hinglish: 'History' },
  add: { English: 'Add', Hindi: 'जोड़ें', Hinglish: 'Add' },
  insights: { English: 'Insights', Hindi: 'अंतर्दृष्टि', Hinglish: 'Insights' },
  profile: { English: 'Profile', Hindi: 'प्रोफ़ाइल', Hinglish: 'Profile' },
  ai_insights: { English: 'Insights', Hindi: 'इनसाइट्स', Hinglish: 'Insights' },
  settings: { English: 'Settings', Hindi: 'सेटिंग्स', Hinglish: 'Settings' },

  // Time Periods
  weekly: { English: 'Weekly', Hindi: 'साप्ताहिक', Hinglish: 'Weekly' },
  month: { English: 'Monthly', Hindi: 'मासिक', Hinglish: 'Monthly' },
  year: { English: 'Yearly', Hindi: 'वार्षिक', Hinglish: 'Yearly' },
  all: { English: 'All', Hindi: 'सभी', Hinglish: 'Sab' },
  
  // Dashboard
  welcome_back: { English: 'Welcome back', Hindi: 'वापसी पर स्वागत है', Hinglish: 'Welcome back' },
  your_balance: { English: 'Your balance', Hindi: 'आपका बैलेंस', Hinglish: 'Aapka balance' },
  total_balance: { English: 'Total Balance', Hindi: 'कुल बैलेंस', Hinglish: 'Total Balance' },
  income: { English: 'Income', Hindi: 'आय', Hinglish: 'Income' },
  expenses: { English: 'Expenses', Hindi: 'खर्च', Hinglish: 'Kharche' },
  recent_transaction: { English: 'Recent Transactions', Hindi: 'हाल के लेन-देन', Hinglish: 'Recent Transactions' },
  see_all: { English: 'View All', Hindi: 'सभी देखें', Hinglish: 'View All' },
  from_last_month: { English: 'from last month', Hindi: 'पिछले महीने से', Hinglish: 'pichle mahine se' },

  // Add & Edit Transaction
  add_transaction: { English: 'Add Transaction', Hindi: 'लेन-देन जोड़ें', Hinglish: 'Transaction Add Karein' },
  edit_transaction: { English: 'Edit Transaction', Hindi: 'लेन-देन संपादित करें', Hinglish: 'Transaction Edit Karein' },
  transaction_details: { English: 'Transaction Details', Hindi: 'लेन-देन विवरण', Hinglish: 'Transaction Details' },
  amount: { English: 'Amount', Hindi: 'रकम', Hinglish: 'Amount' },
  category: { English: 'Category', Hindi: 'श्रेणी', Hinglish: 'Category' },
  merchant_name: { English: 'Merchant / Source', Hindi: 'व्यापारी / स्रोत', Hinglish: 'Merchant / Source' },
  date: { English: 'Date', Hindi: 'दिनांक', Hinglish: 'Date' },
  note: { English: 'Note / Description', Hindi: 'नोट / विवरण', Hinglish: 'Note / Details' },
  payment_mode: { English: 'Payment Mode', Hindi: 'भुगतान का तरीका', Hinglish: 'Payment Mode' },
  cash: { English: 'Cash', Hindi: 'नकद', Hinglish: 'Cash' },
  bank: { English: 'Bank Transfer', Hindi: 'बैंक ट्रांसफर', Hinglish: 'Bank' },
  upi: { English: 'UPI', Hindi: 'यूपीआई', Hinglish: 'UPI' },
  card: { English: 'Card', Hindi: 'कार्ड', Hinglish: 'Card' },
  save_transaction: { English: 'Save Transaction', Hindi: 'लेन-देन सहेजें', Hinglish: 'Save Karein' },
  save_changes: { English: 'Save Changes', Hindi: 'बदलाव सहेजें', Hinglish: 'Save Changes' },
  delete_transaction: { English: 'Delete Transaction', Hindi: 'लेन-देन हटाएं', Hinglish: 'Delete Transaction' },
  delete_confirm_title: { English: 'Delete Transaction?', Hindi: 'लेन-देन हटाएं?', Hinglish: 'Transaction delete karein?' },
  delete_confirm_desc: { English: 'Are you sure you want to permanently delete this transaction?', Hindi: 'क्या आप वाकई इस लेन-देन को स्थायी रूप से हटाना चाहते हैं?', Hinglish: 'Kya aap sach mein ye transaction delete karna chahte hain?' },
  saving: { English: 'Saving...', Hindi: 'सहेज रहा है...', Hinglish: 'Save ho raha hai...' },
  select_category: { English: 'Select Category', Hindi: 'श्रेणी चुनें', Hinglish: 'Category chunein' },
  success_updated: { English: 'Transaction updated successfully!', Hindi: 'लेन-देन सफलतापूर्वक अपडेट किया गया!', Hinglish: 'Transaction successfully update ho gaya!' },

  // Transactions Tab / History / Search & Filter
  spending_top: { English: 'Spending Top', Hindi: 'शीर्ष खर्च', Hinglish: 'Top Spending' },
  total_expenses: { English: 'Total Expenses', Hindi: 'कुल खर्च', Hinglish: 'Total Kharcha' },
  top_list: { English: 'Top List', Hindi: 'शीर्ष सूची', Hinglish: 'Top List' },
  no_transactions_found: { English: 'No transactions found.', Hindi: 'कोई लेन-देन नहीं मिला।', Hinglish: 'Koi transaction nahi mila.' },
  search_placeholder: { English: 'Search merchant or note...', Hindi: 'व्यापारी या नोट खोजें...', Hinglish: 'Search merchant ya note...' },
  filter_title: { English: 'Filters', Hindi: 'फ़िल्टर', Hinglish: 'Filters' },
  filter_type: { English: 'Type', Hindi: 'प्रकार', Hinglish: 'Type' },
  filter_all: { English: 'All', Hindi: 'सभी', Hinglish: 'Sab' },
  filter_expense: { English: 'Expense', Hindi: 'खर्च', Hinglish: 'Expense' },
  filter_income: { English: 'Income', Hindi: 'आय', Hinglish: 'Income' },
  filter_reset: { English: 'Reset Filters', Hindi: 'फ़िल्टर हटाएं', Hinglish: 'Reset Filters' },
  filter_apply: { English: 'Apply', Hindi: 'लागू करें', Hinglish: 'Apply' },
  min_amount: { English: 'Min Amount', Hindi: 'न्यूनतम राशि', Hinglish: 'Min Amount' },
  max_amount: { English: 'Max Amount', Hindi: 'अधिकतम राशि', Hinglish: 'Max Amount' },

  // Budget & Goals Screen
  budget_goals: { English: 'Budget & Goals', Hindi: 'बजट और लक्ष्य', Hinglish: 'Budget & Goals' },
  budget_goals_desc: { English: 'Manage monthly and category limits', Hindi: 'मासिक और श्रेणी बजट सीमाएं सेट करें', Hinglish: 'Monthly aur category limits manage karein' },
  overall_monthly_budget: { English: 'Overall Monthly Budget', Hindi: 'कुल मासिक बजट', Hinglish: 'Total Monthly Budget' },
  set_budget: { English: 'Set Budget', Hindi: 'बजट तय करें', Hinglish: 'Budget Set Karein' },
  category_budgets: { English: 'Category Budgets', Hindi: 'श्रेणीवार बजट', Hinglish: 'Category Budgets' },
  budget_used: { English: 'Budget Used', Hindi: 'बजट खर्च हुआ', Hinglish: 'Budget Used' },
  spent: { English: 'Spent', Hindi: 'खर्च हुआ', Hinglish: 'Spent' },
  remaining: { English: 'Remaining', Hindi: 'शेष', Hinglish: 'Remaining' },
  over_budget: { English: 'Over Budget!', Hindi: 'बजट पार हो गया!', Hinglish: 'Budget over ho gaya!' },
  under_budget: { English: 'Within Budget', Hindi: 'बजट के अंदर', Hinglish: 'Budget ke andar' },
  add_category_budget: { English: 'Set Category Budget', Hindi: 'श्रेणी का बजट तय करें', Hinglish: 'Category Budget Set Karein' },

  // Categories Management Screen
  manage_categories: { English: 'Manage Categories', Hindi: 'श्रेणियां प्रबंधित करें', Hinglish: 'Manage Categories' },
  manage_categories_desc: { English: 'Add custom categories, icons and colors', Hindi: 'कस्टम श्रेणियां, आइकन और रंग जोड़ें', Hinglish: 'Custom categories aur icons manage karein' },
  add_new_category: { English: 'Add New Category', Hindi: 'नई श्रेणी जोड़ें', Hinglish: 'Nayi Category Add Karein' },
  edit_category: { English: 'Edit Category', Hindi: 'श्रेणी बदलें', Hinglish: 'Category Edit Karein' },
  category_name: { English: 'Category Name', Hindi: 'श्रेणी का नाम', Hinglish: 'Category Name' },
  category_icon: { English: 'Select Icon', Hindi: 'आइकन चुनें', Hinglish: 'Icon Select Karein' },
  category_color: { English: 'Select Color', Hindi: 'रंग चुनें', Hinglish: 'Color Select Karein' },
  default_badge: { English: 'Default', Hindi: 'डिफ़ॉल्ट', Hinglish: 'Default' },
  custom_badge: { English: 'Custom', Hindi: 'कस्टम', Hinglish: 'Custom' },
  delete_category_confirm: { English: 'Delete Category?', Hindi: 'श्रेणी हटाएं?', Hinglish: 'Category delete karein?' },

  // Notifications Screen
  notifications: { English: 'Notifications', Hindi: 'सूचनाएं', Hinglish: 'Notifications' },
  mark_all_read: { English: 'Mark all as read', Hindi: 'सभी को पढ़ा हुआ चिह्नित करें', Hinglish: 'Mark all as read' },
  no_notifications: { English: 'No notifications right now.', Hindi: 'अभी कोई सूचना नहीं है।', Hinglish: 'Abhi koi notifications nahi hain.' },
  all_caught_up: { English: 'You are all caught up! ✨', Hindi: 'आप सब कुछ देख चुके हैं! ✨', Hinglish: 'Sab kuch up to date hai! ✨' },

  // Edit Profile Screen
  edit_profile: { English: 'Edit Profile', Hindi: 'प्रोफ़ाइल संपादित करें', Hinglish: 'Edit Profile' },
  full_name: { English: 'Full Name', Hindi: 'पूरा नाम', Hinglish: 'Full Name' },
  change_photo: { English: 'Change Photo', Hindi: 'फ़ोटो बदलें', Hinglish: 'Photo Change Karein' },
  profile_updated: { English: 'Profile updated successfully!', Hindi: 'प्रोफ़ाइल सफलतापूर्वक अपडेट हो गई!', Hinglish: 'Profile update ho gayi!' },

  // Forgot Password Screen
  forgot_password: { English: 'Forgot Password?', Hindi: 'पासवर्ड भूल गए?', Hinglish: 'Forgot Password?' },
  reset_password: { English: 'Reset Password', Hindi: 'पासवर्ड रीसेट करें', Hinglish: 'Reset Password' },
  reset_instructions: { English: 'Enter your registered email address to receive password reset instructions.', Hindi: 'पासवर्ड रीसेट लिंक प्राप्त करने के लिए अपना पंजीकृत ईमेल दर्ज करें।', Hinglish: 'Password reset link ke liye registered email dalein.' },
  send_reset_link: { English: 'Send Reset Link', Hindi: 'रीसेट लिंक भेजें', Hinglish: 'Send Reset Link' },
  back_to_login: { English: 'Back to Sign In', Hindi: 'साइन इन पर वापस जाएं', Hinglish: 'Back to Sign In' },
  reset_email_sent: { English: 'Password reset link sent to your email!', Hindi: 'पासवर्ड रीसेट लिंक आपके ईमेल पर भेज दिया गया है!', Hinglish: 'Password reset link aapke email par bhej diya gaya hai!' },

  // Insights & Reports
  reports: { English: 'Reports', Hindi: 'रिपोर्ट्स', Hinglish: 'Reports' },
  overview_finances: { English: 'Overview of your finances', Hindi: 'अपने वित्त का अवलोकन', Hinglish: 'Apne finances ka overview' },
  expenses_breakdown: { English: 'Expenses Breakdown', Hindi: 'खर्चों का विवरण', Hinglish: 'Kharche ka Breakdown' },
  detailed_view: { English: 'Detailed view of your recent spending', Hindi: 'आपके हालिया खर्च का विस्तृत विवरण', Hinglish: 'Aapke spending ka detailed view' },
  spending_trend: { English: 'Spending Trend', Hindi: 'खर्च का रुझान', Hinglish: 'Spending Trend' },
  monthly_statistics: { English: 'Monthly statistics', Hindi: 'मासिक आंकड़े', Hinglish: 'Monthly stats' },
  monthly_budget: { English: 'Monthly budget', Hindi: 'मासिक बजट', Hinglish: 'Monthly budget' },
  expense: { English: 'Expense', Hindi: 'खर्च', Hinglish: 'Kharcha' },
  balance: { English: 'Balance', Hindi: 'बैलेंस', Hinglish: 'Balance' },
  budget_income: { English: 'Budget (Income)', Hindi: 'बजट (आय)', Hinglish: 'Budget (Income)' },
  edit: { English: 'Edit', Hindi: 'बदलें', Hinglish: 'Edit' },
  no_transactions_report: { English: 'No transactions to report.', Hindi: 'रिपोर्ट करने के लिए कोई लेन-देन नहीं है।', Hinglish: 'Report karne ke liye koi transactions nahi hai.' },
  transaction: { English: 'Transaction', Hindi: 'लेन-देन', Hinglish: 'Transaction' },

  // Settings
  total_spend: { English: 'Total Spend', Hindi: 'कुल खर्च', Hinglish: 'Total spend' },
  status: { English: 'Status', Hindi: 'स्थिति', Hinglish: 'Status' },
  active: { English: 'Active', Hindi: 'सक्रिय', Hinglish: 'Active' },
  preferences: { English: 'Preferences', Hindi: 'प्राथमिकताएं', Hinglish: 'Preferences' },
  data_management: { English: 'Data Management', Hindi: 'डेटा प्रबंधन', Hinglish: 'Data Management' },
  language: { English: 'Language', Hindi: 'भाषा', Hinglish: 'Bhasha' },
  currency: { English: 'Currency', Hindi: 'मुद्रा', Hinglish: 'Currency' },
  delete_all_data: { English: 'Delete All Data', Hindi: 'सभी डेटा मिटाएं', Hinglish: 'Saara data delete karein' },
  delete_all_desc: { English: 'Delete all your transactions', Hindi: 'अपने सभी लेन-देन मिटाएं', Hinglish: 'Apne saare transactions delete karein' },
  export_data: { English: 'Export Backup', Hindi: 'डेटा निर्यात करें (बैकअप)', Hinglish: 'Data Export Karein' },
  export_desc: { English: 'Download all transactions (JSON/CSV)', Hindi: 'सभी लेन-देन डाउनलोड करें', Hinglish: 'Saare transactions download karein' },
  import_data: { English: 'Import Backup', Hindi: 'डेटा आयात करें (रिस्टोर)', Hinglish: 'Data Import Karein' },
  import_desc: { English: 'Restore transactions from JSON/CSV', Hindi: 'फ़ाइल से लेन-देन रिस्टोर करें', Hinglish: 'Backup file se restore karein' },
  account_info: { English: 'Account Information', Hindi: 'खाता जानकारी', Hinglish: 'Account ki jaankari' },
  email_address: { English: 'Email Address', Hindi: 'ईमेल पता', Hinglish: 'Email address' },
  phone_number: { English: 'Phone Number', Hindi: 'फ़ोन नंबर', Hinglish: 'Phone number' },
  member_since: { English: 'Member Since', Hindi: 'सदस्यता तिथि', Hinglish: 'Member since' },
  user_id: { English: 'User ID', Hindi: 'उपयोगकर्ता आईडी', Hinglish: 'User ID' },
  log_out: { English: 'Log Out', Hindi: 'लॉग आउट', Hinglish: 'Log out' },
  not_linked: { English: 'Not Linked', Hindi: 'लिंक नहीं है', Hinglish: 'Linked nahi hai' },
  cancel: { English: 'Cancel', Hindi: 'रद्द करें', Hinglish: 'Cancel' },
  save: { English: 'Save', Hindi: 'सहेजें', Hinglish: 'Save' },
  delete: { English: 'Delete', Hindi: 'हटाएं', Hinglish: 'Delete' },

  // Network Errors & Common
  err_network: { English: 'Network Error', Hindi: 'नेटवर्क त्रुटि', Hinglish: 'Network Error' },
  err_network_msg: { English: 'Please check your internet connection.', Hindi: 'कृपया अपना इंटरनेट कनेक्शन जांचें।', Hinglish: 'Internet connection check karo.' },
  other: { English: 'Other', Hindi: 'अन्य', Hinglish: 'Baaki' },

  // Added missing settings & common strings
  delete_my_account: { English: 'Delete My Account', Hindi: 'मेरा खाता हटाएं', Hinglish: 'Mera Account Delete Karein' },
  delete_account_desc: { English: 'Permanently erase all data', Hindi: 'स्थायी रूप से सभी डेटा मिटाएं', Hinglish: 'Hamesha ke liye saara data mitayein' },
  delete_all_transactions: { English: 'Delete All Transactions', Hindi: 'सभी लेन-देन मिटाएं', Hinglish: 'Saare transactions delete karein' },
  delete_all_transactions_msg: { English: 'Are you sure you want to erase all your transaction records? This action cannot be reversed.', Hindi: 'क्या आप वाकई अपने सभी लेन-देन रिकॉर्ड मिटाना चाहते हैं? इस क्रिया को पलटा नहीं जा सकता।', Hinglish: 'Kya aap sach mein saare transactions delete karna chahte hain? Ise wapas nahi laya ja sakta.' },
  delete_all: { English: 'Delete All', Hindi: 'सभी हटाएं', Hinglish: 'Delete All' },
  delete_account_msg: { English: 'Are you sure you want to permanently delete your Rupeo account and all data? This action is irreversible.', Hindi: 'क्या आप वाकई अपने रुपियो खाते और सभी डेटा को स्थायी रूप से हटाना चाहते हैं? इस क्रिया को पलटा नहीं जा सकता।', Hinglish: 'Kya aap sach mein apna Rupeo account aur saara data delete karna chahte hain? Ise wapas nahi laya ja sakta.' },
  terms_conditions: { English: 'Terms & Conditions', Hindi: 'नियम और शर्तें', Hinglish: 'Terms & Conditions' },
  privacy_policy: { English: 'Privacy Policy', Hindi: 'गोपनीयता नीति', Hinglish: 'Privacy Policy' },
  legal: { English: 'Legal', Hindi: 'कानूनी', Hinglish: 'Legal' },
  danger_zone: { English: 'Danger Zone', Hindi: 'खतरनाक क्षेत्र', Hinglish: 'Danger Zone' },
  version: { English: 'Version', Hindi: 'संस्करण', Hinglish: 'Version' },
  logout_msg: { English: 'Are you sure you want to log out of your Rupeo account?', Hindi: 'क्या आप वाकई अपने रुपियो खाते से लॉग आउट करना चाहते हैं?', Hinglish: 'Kya aap sach mein Rupeo se log out karna chahte hain?' },
  update_starting_balance: { English: 'Update Starting Balance', Hindi: 'शुरुआती बैलेंस अपडेट करें', Hinglish: 'Starting Balance Update Karein' },
  starting_balance_desc: { English: 'Set the balance you had before recording transactions in Rupeo.', Hindi: 'रुपियो में लेन-देन दर्ज करने से पहले आपका जो बैलेंस था, उसे सेट करें।', Hinglish: 'Rupeo me transactions record karne se pehle ka balance set karein.' },
  download_backup: { English: 'Download Backup', Hindi: 'बैकअप डाउनलोड करें', Hinglish: 'Backup Download Karein' },
  choose_backup_file: { English: 'Choose Backup File', Hindi: 'बैकअप फ़ाइल चुनें', Hinglish: 'Backup File Chunein' },
  or_paste_text: { English: 'OR PASTE TEXT', Hindi: 'या टेक्स्ट पेस्ट करें', Hinglish: 'YA TEXT PASTE KAREIN' },
  import_pasted_text: { English: 'Import Pasted Text', Hindi: 'पेस्ट किया गया टेक्स्ट आयात करें', Hinglish: 'Pasted Text Import Karein' },
  recommended: { English: 'Recommended', Hindi: 'सुझाया गया', Hinglish: 'Recommended' },
  json_backup: { English: 'JSON Backup', Hindi: 'JSON बैकअप', Hinglish: 'JSON Backup' },
  json_desc: { English: 'Full structured backup. Ideal for restoring transactions.', Hindi: 'पूर्ण संरचित बैकअप। लेन-देन को पुनर्स्थापित करने के लिए आदर्श।', Hinglish: 'Full backup. Transactions wapas laane ke liye best.' },
  csv_backup: { English: 'Excel / Spreadsheet (.csv)', Hindi: 'एक्सेल / स्प्रेडशीट (.csv)', Hinglish: 'Excel / Spreadsheet (.csv)' },
  csv_desc: { English: 'Spreadsheet compatible file. Open with Excel or Google Sheets.', Hindi: 'स्प्रेडशीट संगत फ़ाइल। एक्सेल या गूगल शीट्स के साथ खोलें।', Hinglish: 'Excel ya Google Sheets me open karne ke liye.' },

  // Reminders Screen
  bill_reminders: { English: 'Bill Reminders', Hindi: 'बिल अनुस्मारक', Hinglish: 'Bill Reminders' },
  active_reminders: { English: 'active reminder(s)', Hindi: 'सक्रिय अनुस्मारक', Hinglish: 'active reminders' },
  no_reminders: { English: 'No Reminders Yet', Hindi: 'अभी कोई अनुस्मारक नहीं है', Hinglish: 'Koi reminders nahi hain' },
  no_reminders_sub: { English: 'Tap + below to add your first bill or recharge reminder.', Hindi: 'अपना पहला बिल या रिचार्ज रिमाइंडर जोड़ने के लिए नीचे + पर टैप करें।', Hinglish: 'Pehla bill ya recharge reminder add karne ke liye + dabayein.' },
  upcoming: { English: 'Upcoming', Hindi: 'आगामी', Hinglish: 'Aane wala' },
  overdue: { English: 'Overdue', Hindi: 'बकाया', Hinglish: 'Overdue' },
  due_soon: { English: 'Due Soon', Hindi: 'जल्द देय', Hinglish: 'Due Soon' },
  paid: { English: 'Paid', Hindi: 'भुगतान किया', Hinglish: 'Paid' },
  update_reminder: { English: 'Update Reminder', Hindi: 'अनुस्मारक अपडेट करें', Hinglish: 'Reminder Update Karein' },
  new_reminder: { English: 'NEW REMINDER', Hindi: 'नया अनुस्मारक', Hinglish: 'NEW REMINDER' },
  edit_bill: { English: 'Edit Bill / Recharge', Hindi: 'बिल / रिचार्ज संपादित करें', Hinglish: 'Bill / Recharge Edit Karein' },
  add_bill: { English: 'Add Bill / Recharge', Hindi: 'बिल / रिचार्ज जोड़ें', Hinglish: 'Bill / Recharge Add Karein' },
  never_miss: { English: 'Never miss your next payment or recharge.', Hindi: 'कभी भी अपना अगला भुगतान या रिचार्ज न चूकें।', Hinglish: 'Apna agla payment ya recharge kabhi miss na karein.' },
  choose_provider: { English: 'Choose a provider', Hindi: 'एक प्रदाता चुनें', Hinglish: 'Provider chunein' },
  bill_details: { English: 'Bill details', Hindi: 'बिल विवरण', Hinglish: 'Bill details' },
  name: { English: 'Name', Hindi: 'नाम', Hinglish: 'Naam' },
  renewal_type: { English: 'Renewal Type', Hindi: 'नवीनीकरण प्रकार', Hinglish: 'Renewal Type' },
  by_days: { English: 'By Days', Hindi: 'दिनों के अनुसार', Hinglish: 'By Days' },
  monthly_date: { English: 'Monthly Date', Hindi: 'मासिक तिथि', Hinglish: 'Monthly Date' },
  recharge_cycle: { English: 'Recharge Cycle', Hindi: 'रिचार्ज चक्र', Hinglish: 'Recharge Cycle' },
  due_on_day: { English: 'Due on Day', Hindi: 'देय दिन', Hinglish: 'Due on Day' },
  remind_before: { English: 'Remind Before', Hindi: 'से पहले याद दिलाएं', Hinglish: 'Remind Before' },
  notifications_enabled: { English: 'Notifications enabled', Hindi: 'सूचनाएं सक्षम', Hinglish: 'Notifications on hain' },
  notifications_off: { English: 'Notifications off', Hindi: 'सूचनाएं बंद', Hinglish: 'Notifications off hain' },
  save_reminder: { English: 'Save Reminder', Hindi: 'अनुस्मारक सहेजें', Hinglish: 'Reminder Save Karein' },
  record_payment: { English: 'Record Payment & Proof', Hindi: 'भुगतान और प्रमाण दर्ज करें', Hinglish: 'Payment & Proof Record Karein' },
  record_payment_sub: { English: 'Record this payment securely', Hindi: 'इस भुगतान को सुरक्षित रूप से दर्ज करें', Hinglish: 'Is payment ko securely record karein' },
  payment_proof: { English: 'Payment Proof', Hindi: 'भुगतान प्रमाण', Hinglish: 'Payment Proof' },
  screenshot_attached: { English: 'Screenshot attached', Hindi: 'स्क्रीनशॉट संलग्न', Hinglish: 'Screenshot attached' },
  proof_saved: { English: 'Proof will be saved with this payment', Hindi: 'प्रमाण इस भुगतान के साथ सहेजा जाएगा', Hinglish: 'Proof is payment ke saath save hoga' },
  add_screenshot: { English: 'Add payment screenshot', Hindi: 'भुगतान स्क्रीनशॉट जोड़ें', Hinglish: 'Payment screenshot add karein' },
  confirm_paid: { English: 'Confirm Paid', Hindi: 'भुगतान की पुष्टि करें', Hinglish: 'Confirm Paid' },
  remove_reminder: { English: 'Remove Reminder', Hindi: 'अनुस्मारक हटाएं', Hinglish: 'Reminder Remove Karein' },
  remove: { English: 'Remove', Hindi: 'हटाएं', Hinglish: 'Remove' },
  keep: { English: 'Keep', Hindi: 'रखें', Hinglish: 'Keep' },
  days: { English: 'Days', Hindi: 'दिन', Hinglish: 'Din' },
  day: { English: 'Day', Hindi: 'दिन', Hinglish: 'Din' },

  // Currency Selector
  search_currency: { English: 'Search Currency', Hindi: 'मुद्रा खोजें', Hinglish: 'Currency Search Karein' },
  popular_currencies: { English: 'Popular Currencies', Hindi: 'लोकप्रिय मुद्राएं', Hinglish: 'Popular Currencies' },
  all_currencies: { English: 'All Currencies', Hindi: 'सभी मुद्राएं', Hinglish: 'All Currencies' },

  // AI Insights / Reports Screen
  financial_reports: { English: 'Financial Reports', Hindi: 'वित्तीय रिपोर्ट', Hinglish: 'Financial Reports' },
  income_expense_analytics: { English: 'Income, expense & spending analytics', Hindi: 'आय, खर्च और स्पेंडिंग एनालिटिक्स', Hinglish: 'Income, expense aur spending analytics' },
  loading_analytics: { English: 'Loading Analytics...', Hindi: 'एनालिटिक्स लोड हो रहा है...', Hinglish: 'Analytics load ho rahi hai...' },
  no_data_period: { English: 'No transactions this period', Hindi: 'इस अवधि में कोई लेन-देन नहीं', Hinglish: 'Is period mein koi transaction nahi' },
  add_first_tx: { English: 'Add your first transaction to see insights', Hindi: 'इनसाइट देखने के लिए पहला लेन-देन जोड़ें', Hinglish: 'Insights ke liye pehla transaction add karein' },

  // Period Labels
  period_month: { English: 'Month', Hindi: 'महीना', Hinglish: 'Month' },
  period_last_mo: { English: 'Last Mo', Hindi: 'पिछला', Hinglish: 'Last Mo' },
  period_3mo: { English: '3 Mo', Hindi: '3 महीने', Hinglish: '3 Mo' },
  period_year: { English: 'Year', Hindi: 'साल', Hinglish: 'Year' },
  period_all: { English: 'All', Hindi: 'सभी', Hinglish: 'Sab' },

  // Metrics Labels
  net_savings: { English: 'NET SAVINGS', Hindi: 'शुद्ध बचत', Hinglish: 'NET SAVINGS' },
  saved_pct: { English: 'Saved', Hindi: 'बचाया', Hinglish: 'Bachaya' },
  daily_avg: { English: 'Daily Avg', Hindi: 'दैनिक औसत', Hinglish: 'Daily Avg' },
  total_income: { English: 'Total Income', Hindi: 'कुल आय', Hinglish: 'Total Income' },
  total_expense: { English: 'Total Expense', Hindi: 'कुल खर्च', Hinglish: 'Total Kharcha' },
  net_balance: { English: 'Net Balance', Hindi: 'शुद्ध बैलेंस', Hinglish: 'Net Balance' },
  transactions_count: { English: 'Transactions', Hindi: 'लेन-देन', Hinglish: 'Transactions' },

  // Chart Titles
  spending_wave: { English: 'Spending Wave', Hindi: 'खर्च तरंग', Hinglish: 'Spending Wave' },
  daily_trend: { English: 'Daily trend & peak spending days', Hindi: 'दैनिक रुझान और अधिकतम खर्च के दिन', Hinglish: 'Daily trend aur peak spending days' },
  cash_flow_trends: { English: 'Cash Flow Trends', Hindi: 'नकदी प्रवाह रुझान', Hinglish: 'Cash Flow Trends' },
  income_vs_expense: { English: 'Income vs Expense comparison', Hindi: 'आय बनाम खर्च तुलना', Hinglish: 'Income vs Expense comparison' },
  total_spent: { English: 'Total Spent', Hindi: 'कुल खर्च', Hinglish: 'Total Spent' },
  total_income_label: { English: 'Total Income', Hindi: 'कुल आय', Hinglish: 'Total Income' },
  tap_slice: { English: 'Tap slice to inspect', Hindi: 'विवरण के लिए टैप करें', Hinglish: 'Details ke liye tap karein' },

  // Spending Velocity Card
  spending_velocity: { English: 'Spending Velocity & Pace', Hindi: 'खर्च की गति और रफ्तार', Hinglish: 'Spending Velocity & Pace' },
  current_vs_last: { English: 'Current Month vs Last Month', Hindi: 'इस महीने बनाम पिछले महीने', Hinglish: 'Current Month vs Last Month' },
  comparative_trend: { English: 'Comparative Spending Trend', Hindi: 'तुलनात्मक खर्च रुझान', Hinglish: 'Comparative Spending Trend' },
  projected_month: { English: 'Projected Month Total', Hindi: 'अनुमानित मासिक कुल', Hinglish: 'Projected Month Total' },
  previous_period: { English: 'Previous Period', Hindi: 'पिछली अवधि', Hinglish: 'Previous Period' },
  first_period: { English: 'First Period', Hindi: 'पहली अवधि', Hinglish: 'First Period' },
  no_prior_data: { English: 'No prior data', Hindi: 'कोई पुराना डेटा नहीं', Hinglish: 'Koi purana data nahi' },
  more_spending: { English: 'more', Hindi: 'ज़्यादा', Hinglish: 'zyada' },
  less_spending: { English: 'less', Hindi: 'कम', Hinglish: 'kam' },

  // 50/30/20 Rule
  budget_rule: { English: '50 / 30 / 20 Budget Rule', Hindi: '50 / 30 / 20 बजट नियम', Hinglish: '50 / 30 / 20 Budget Rule' },
  budget_rule_sub: { English: 'Needs (50%) • Wants (30%) • Savings (20%)', Hindi: 'ज़रूरतें (50%) • इच्छाएं (30%) • बचत (20%)', Hinglish: 'Needs (50%) • Wants (30%) • Savings (20%)' },
  budget_balanced: { English: 'Balanced 🎯', Hindi: 'संतुलित 🎯', Hinglish: 'Balanced 🎯' },
  budget_needs_review: { English: 'Needs Review ⚠️', Hindi: 'समीक्षा ज़रूरी ⚠️', Hinglish: 'Review Chahiye ⚠️' },
  needs_label: { English: 'Needs (50%)', Hindi: 'ज़रूरतें (50%)', Hinglish: 'Needs (50%)' },
  wants_label: { English: 'Wants (30%)', Hindi: 'इच्छाएं (30%)', Hinglish: 'Wants (30%)' },
  savings_label: { English: 'Savings (20%)', Hindi: 'बचत (20%)', Hinglish: 'Savings (20%)' },
  of_budget: { English: '% of budget', Hindi: '% बजट का', Hinglish: '% budget ka' },
  saved_label: { English: '% saved', Hindi: '% बचाया', Hinglish: '% bachaya' },

  // Financial Health Card
  financial_vitality: { English: 'Financial Vitality', Hindi: 'वित्तीय स्वास्थ्य', Hinglish: 'Financial Vitality' },
  ai_analysis: { English: 'AI Budget & Habits Analysis', Hindi: 'AI बजट और आदतें विश्लेषण', Hinglish: 'AI Budget & Habits Analysis' },

  // Category & Chart Section
  expense_breakdown: { English: 'Expense Breakdown', Hindi: 'खर्च विवरण', Hinglish: 'Expense Breakdown' },
  income_breakdown: { English: 'Income Breakdown', Hindi: 'आय विवरण', Hinglish: 'Income Breakdown' },
  top_categories: { English: 'Top Categories', Hindi: 'शीर्ष श्रेणियां', Hinglish: 'Top Categories' },
  by_category: { English: 'Ranked by amount', Hindi: 'राशि के अनुसार', Hinglish: 'Amount ke hisaab se' },

  // Day of Week & Weekend
  day_pattern: { English: 'Day Spending Pattern', Hindi: 'दिनवार खर्च पैटर्न', Hinglish: 'Day Spending Pattern' },
  peak_day: { English: 'Peak spending day', Hindi: 'सबसे ज़्यादा खर्च का दिन', Hinglish: 'Sabse zyada spending ka din' },
  weekday_vs_weekend: { English: 'Weekday vs Weekend', Hindi: 'सप्ताहदिन बनाम सप्ताहांत', Hinglish: 'Weekday vs Weekend' },
  weekdays_label: { English: 'Weekdays', Hindi: 'सप्ताहदिन', Hinglish: 'Weekdays' },
  weekends_label: { English: 'Weekends', Hindi: 'वीकेंड', Hinglish: 'Weekends' },

  // Payment Mode Split
  payment_split: { English: 'Payment Mode Split', Hindi: 'भुगतान माध्यम विभाजन', Hinglish: 'Payment Mode Split' },
  how_you_pay: { English: 'How you are spending', Hindi: 'आप कैसे खर्च कर रहे हैं', Hinglish: 'Aap kaise spend kar rahe hain' },

  // Top Expenses
  top_expenses_title: { English: 'Top 5 Largest Expenses', Hindi: 'शीर्ष 5 सबसे बड़े खर्च', Hinglish: 'Top 5 Largest Expenses' },
  biggest_hits: { English: 'Your biggest spending transactions', Hindi: 'आपके सबसे बड़े खर्च', Hinglish: 'Aapke sabse bade kharche' },
  no_expenses: { English: 'No expenses recorded', Hindi: 'कोई खर्च दर्ज नहीं', Hinglish: 'Koi kharcha record nahi' },

  // Transaction Receipt
  credit: { English: 'Credit', Hindi: 'क्रेडिट', Hinglish: 'Credit' },
  debit: { English: 'Debit', Hindi: 'डेबिट', Hinglish: 'Debit' },
  verified: { English: 'Verified', Hindi: 'सत्यापित', Hinglish: 'Verified' },
  payment_mode_label: { English: 'Payment Mode', Hindi: 'भुगतान माध्यम', Hinglish: 'Payment Mode' },
  reference_id: { English: 'Reference', Hindi: 'संदर्भ', Hinglish: 'Reference' },
  timestamp: { English: 'Date & Time', Hindi: 'दिनांक और समय', Hinglish: 'Date & Time' },

  // Add Transaction
  type_expense: { English: 'Expense', Hindi: 'खर्च', Hinglish: 'Kharcha' },
  type_income: { English: 'Income', Hindi: 'आय', Hinglish: 'Income' },
  enter_amount: { English: 'Enter amount', Hindi: 'राशि दर्ज करें', Hinglish: 'Amount dalein' },
  merchant_placeholder: { English: 'e.g. Zomato, Amazon, Salary...', Hindi: 'जैसे Zomato, Amazon, वेतन...', Hinglish: 'jaise Zomato, Amazon, Salary...' },
  note_placeholder: { English: 'Optional note or description', Hindi: 'वैकल्पिक नोट या विवरण', Hinglish: 'Optional note ya description' },
  today: { English: 'Today', Hindi: 'आज', Hinglish: 'Aaj' },
  yesterday: { English: 'Yesterday', Hindi: 'कल', Hinglish: 'Kal' },

  // Dashboard
  good_morning: { English: 'Good morning', Hindi: 'सुप्रभात', Hinglish: 'Good morning' },
  good_afternoon: { English: 'Good afternoon', Hindi: 'नमस्कार', Hinglish: 'Good afternoon' },
  good_evening: { English: 'Good evening', Hindi: 'शुभ संध्या', Hinglish: 'Good evening' },
  this_month_spend: { English: "This Month's Spend", Hindi: 'इस महीने का खर्च', Hinglish: 'Is Month ka Spend' },
  quick_add: { English: 'Quick Add', Hindi: 'जल्दी जोड़ें', Hinglish: 'Quick Add' },
  no_transactions_yet: { English: 'No transactions yet', Hindi: 'अभी कोई लेन-देन नहीं', Hinglish: 'Abhi koi transaction nahi' },
  tap_to_add: { English: 'Tap + to add your first transaction', Hindi: 'पहला लेन-देन जोड़ने के लिए + दबाएं', Hinglish: '+ dabao apna pehla transaction add karne ke liye' },
};

export function useTranslation() {
  const { settings } = useAuth();
  const lang: Language = (settings?.language as Language) || 'English';

  const t = (key: keyof typeof dictionary | string): string => {
    if (!dictionary[key]) {
      return key;
    }
    return dictionary[key][lang] || dictionary[key]['English'];
  };

  return { t, lang };
}
