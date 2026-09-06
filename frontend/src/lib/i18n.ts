export type Language = "en" | "si";

export interface TranslationDictionary {
  // Common & Shell
  appName: string;
  tagline: string;
  navOverview: string;
  navMembers: string;
  navLoans: string;
  navContributions: string;
  navSettings: string;
  signOut: string;
  apiOnline: string;
  apiOffline: string;
  adminBadge: string;
  memberBadge: string;
  welcomeBack: string;
  connectedAs: string;
  mySummary: string;
  myLoans: string;
  myReceipts: string;

  // Language Card in Settings
  langSectionTitle: string;
  langSectionSubtitle: string;
  englishOptionTitle: string;
  englishOptionDesc: string;
  sinhalaOptionTitle: string;
  sinhalaOptionDesc: string;
  activeLanguageBadge: string;

  // Profile Settings
  profileSectionTitle: string;
  profileSectionSubtitle: string;
  fullNameLabel: string;
  emailLabel: string;
  phoneLabel: string;
  departmentLabel: string;
  saveProfileBtn: string;
  profileSavedSuccess: string;

  // Password Settings
  passwordSectionTitle: string;
  passwordSectionSubtitle: string;
  currentPasswordLabel: string;
  newPasswordLabel: string;
  confirmPasswordLabel: string;
  updatePasswordBtn: string;
  passwordMatchError: string;
  passwordUpdatedSuccess: string;

  // Admin System Preferences
  systemPrefsTitle: string;
  systemPrefsSubtitle: string;
  orgTitleLabel: string;
  activeCurrencyLabel: string;
  customSymbolLabel: string;
  defaultContributionLabel: string;
  maxLoanLimitLabel: string;
  defaultInterestRateLabel: string;
  autoPayrollLabel: string;
  autoPayrollSubtitle: string;
  savePreferencesBtn: string;
  preferencesSavedSuccess: string;

  // Overview Tab
  cashPool: string;
  cashPoolSubtitle: string;
  totalMembers: string;
  totalMembersSubtitle: string;
  disbursedLoans: string;
  disbursedLoansSubtitle: string;
  outstandingDebt: string;
  outstandingDebtSubtitle: string;
  financialBreakdown: string;
  initialReserve: string;
  contributionsCollected: string;
  repaymentsReceived: string;
  activeLoansCount: string;
  recentActivityTitle: string;

  // Members Tab
  membersTitle: string;
  membersSubtitle: string;
  searchMembersPlaceholder: string;
  filterDepartment: string;
  filterStatus: string;
  registerMemberBtn: string;
  colMemberId: string;
  colMemberName: string;
  colDepartment: string;
  colRole: string;
  colMonthlyPledge: string;
  colTotalContributed: string;
  colStatus: string;
  colActions: string;
  viewProfile: string;
  editMember: string;
  deleteMember: string;

  // Loans Tab
  loansTitle: string;
  loansSubtitle: string;
  searchLoansPlaceholder: string;
  filterLoanStatus: string;
  applyLoanBtn: string;
  colLoanId: string;
  colBorrower: string;
  colPrincipal: string;
  colInterestRate: string;
  colMonthlyEMI: string;
  colRepaid: string;
  colRemainingBalance: string;
  actionApprove: string;
  actionReject: string;
  actionRecordPayment: string;

  // Contributions Tab
  contributionsTitle: string;
  contributionsSubtitle: string;
  searchContributionsPlaceholder: string;
  recordContributionBtn: string;
  colReceiptNo: string;
  colContributor: string;
  colAmount: string;
  colMonthCovered: string;
  colPaymentMethod: string;
  colPaymentDate: string;

  // Modals & Common Actions
  modalCancel: string;
  modalSave: string;
  modalSubmit: string;
  modalConfirm: string;
  modalClose: string;
  statusActive: string;
  statusInactive: string;
  statusSuspended: string;
  statusPending: string;
  statusApproved: string;
  statusFullyRepaid: string;
  statusRejected: string;

  // Finance Tab
  navFinance: string;
  financeTitle: string;
  financeSubtitle: string;
  totalIncomeCard: string;
  totalIncomeSubtitle: string;
  totalExpenseCard: string;
  totalExpenseSubtitle: string;
  netCashFlowCard: string;
  netCashFlowSubtitle: string;
  recordIncomeBtn: string;
  recordExpenseBtn: string;
  searchFinancePlaceholder: string;
  filterAllTransactions: string;
  filterOnlyIncomes: string;
  filterOnlyExpenses: string;
  filterAllCategories: string;
  categoryBreakdownTitle: string;
  incomeCategoriesTitle: string;
  expenseCategoriesTitle: string;
  colVoucherNo: string;
  colType: string;
  colCategory: string;
  colDescription: string;
  colParty: string;
  colMethod: string;
  colDate: string;
  typeIncome: string;
  typeExpense: string;

  // Categories
  catHallRent: string;
  catShopRent: string;
  catDonations: string;
  catFundInterest: string;
  catOtherIncome: string;
  catFuneralAid: string;
  catSports: string;
  catReligiousFestivals: string;
  catWelfareEvents: string;
  catMedicalAid: string;
  catMaintenance: string;
  catAdminExpenses: string;
  catOtherExpense: string;

  // Finance Modals & Overview Lines
  modalRecordIncomeTitle: string;
  modalRecordIncomeSubtitle: string;
  modalRecordExpenseTitle: string;
  modalRecordExpenseSubtitle: string;
  modalFieldCategory: string;
  modalFieldAmount: string;
  modalFieldTitle: string;
  modalFieldPartyIncome: string;
  modalFieldPartyExpense: string;
  modalFieldPaymentMethod: string;
  modalFieldDate: string;
  modalFieldRef: string;
  modalFieldNotes: string;
  paymentMethodCash: string;
  paymentMethodBankTransfer: string;
  paymentMethodCheque: string;
  paymentMethodOnline: string;
  totalOtherIncomeLine: string;
  totalExpenseLine: string;
}

export const translations: Record<Language, TranslationDictionary> = {
  en: {
    appName: "Welfare Fund Management",
    tagline: "Staff Welfare Association & Benevolent Cooperative",
    navOverview: "Overview",
    navMembers: "Members",
    navLoans: "Loans Tracker",
    navContributions: "Contributions",
    navSettings: "Settings",
    signOut: "Sign Out",
    apiOnline: "API ONLINE",
    apiOffline: "API OFFLINE",
    adminBadge: "ADMIN",
    memberBadge: "MEMBER",
    welcomeBack: "Welcome back",
    connectedAs: "Connected as",
    mySummary: "My Summary",
    myLoans: "My Loans",
    myReceipts: "My Receipts",

    // Language Card in Settings
    langSectionTitle: "Language & Regional Settings",
    langSectionSubtitle: "Choose your preferred display language across the portal and dashboard",
    englishOptionTitle: "English",
    englishOptionDesc: "Default international English interface",
    sinhalaOptionTitle: "සිංහල (Sinhala)",
    sinhalaOptionDesc: "සම්පූර්ණ අතුරුමුහුණත සිංහල භාෂාවෙන් පරිශීලනය කරන්න",
    activeLanguageBadge: "Active Language",

    // Profile Settings
    profileSectionTitle: "Personal Profile Details",
    profileSectionSubtitle: "Update your personal information and contact records",
    fullNameLabel: "Full Name",
    emailLabel: "Email Address",
    phoneLabel: "Phone Number",
    departmentLabel: "Department",
    saveProfileBtn: "Save Profile Changes",
    profileSavedSuccess: "Profile details saved successfully!",

    // Password Settings
    passwordSectionTitle: "Security & Password",
    passwordSectionSubtitle: "Change your account password securely",
    currentPasswordLabel: "Current Password",
    newPasswordLabel: "New Password (Min 6 chars)",
    confirmPasswordLabel: "Confirm New Password",
    updatePasswordBtn: "Update Password",
    passwordMatchError: "New password and confirmation do not match.",
    passwordUpdatedSuccess: "Password updated successfully!",

    // Admin System Preferences
    systemPrefsTitle: "Welfare Scheme & Currency Configuration",
    systemPrefsSubtitle: "Global financial baselines, borrowing ceilings, and currency formatting",
    orgTitleLabel: "Organization / Scheme Title",
    activeCurrencyLabel: "Active System Currency",
    customSymbolLabel: "Custom Symbol Display",
    defaultContributionLabel: "Default Monthly Contribution Pledge",
    maxLoanLimitLabel: "Maximum Loan Borrowing Ceiling",
    defaultInterestRateLabel: "Default Annual Interest Rate (%)",
    autoPayrollLabel: "Automatic Payroll Deductions",
    autoPayrollSubtitle: "Enable batch monthly contribution ledger generation",
    savePreferencesBtn: "Save System Preferences",
    preferencesSavedSuccess: "System preferences updated successfully!",

    // Overview Tab
    cashPool: "Total Fund Balance",
    cashPoolSubtitle: "Net liquid funds ready for allocation",
    totalMembers: "Registered Members",
    totalMembersSubtitle: "Active welfare contributors",
    disbursedLoans: "Total Disbursed Loans",
    disbursedLoansSubtitle: "Cumulatively granted member loans",
    outstandingDebt: "Outstanding Loans",
    outstandingDebtSubtitle: "Active loans pending repayment",
    financialBreakdown: "Financial Summary & Performance",
    initialReserve: "Initial Fund Reserve",
    contributionsCollected: "Contributions Collected",
    repaymentsReceived: "Loan Repayments Received",
    activeLoansCount: "Active Loan Schemes",
    recentActivityTitle: "Recent Activity Feed",

    // Members Tab
    membersTitle: "Member Directory",
    membersSubtitle: "View, search, and manage registered welfare association members",
    searchMembersPlaceholder: "Search by name, ID, or email...",
    filterDepartment: "All Departments",
    filterStatus: "All Statuses",
    registerMemberBtn: "+ Register Member",
    colMemberId: "Member ID",
    colMemberName: "Member Name",
    colDepartment: "Department",
    colRole: "Role",
    colMonthlyPledge: "Monthly Pledge",
    colTotalContributed: "Total Contributed",
    colStatus: "Status",
    colActions: "Actions",
    viewProfile: "View Profile",
    editMember: "Edit",
    deleteMember: "Delete",

    // Loans Tab
    loansTitle: "Loans & Credit Management",
    loansSubtitle: "Track member borrowing, manage approvals, and record monthly installments",
    searchLoansPlaceholder: "Search loans by borrower or ID...",
    filterLoanStatus: "All Loans",
    applyLoanBtn: "+ Apply for Loan",
    colLoanId: "Loan ID",
    colBorrower: "Borrower",
    colPrincipal: "Principal",
    colInterestRate: "Interest Rate",
    colMonthlyEMI: "Monthly EMI",
    colRepaid: "Repaid",
    colRemainingBalance: "Remaining Balance",
    actionApprove: "Approve",
    actionReject: "Reject",
    actionRecordPayment: "Pay EMI",

    // Contributions Tab
    contributionsTitle: "Welfare Contributions Ledger",
    contributionsSubtitle: "Real-time record of member deposits and monthly welfare pledges",
    searchContributionsPlaceholder: "Search receipts by member or receipt #...",
    recordContributionBtn: "+ Record Contribution",
    colReceiptNo: "Receipt #",
    colContributor: "Contributor",
    colAmount: "Amount",
    colMonthCovered: "Month Covered",
    colPaymentMethod: "Payment Method",
    colPaymentDate: "Date Recorded",

    // Modals & Common Actions
    modalCancel: "Cancel",
    modalSave: "Save Changes",
    modalSubmit: "Submit",
    modalConfirm: "Confirm",
    modalClose: "Close",
    statusActive: "Active",
    statusInactive: "Inactive",
    statusSuspended: "Suspended",
    statusPending: "Pending",
    statusApproved: "Approved",
    statusFullyRepaid: "Fully Repaid",
    statusRejected: "Rejected",

    // Finance Tab
    navFinance: "Income & Expenses",
    financeTitle: "Income & Expense Management",
    financeSubtitle: "Track community hall rents, shop leases, donations, funeral aid, sports, and religious festivals",
    totalIncomeCard: "Total External Income",
    totalIncomeSubtitle: "Rent, leases, donations & miscellaneous",
    totalExpenseCard: "Total Welfare Expenses",
    totalExpenseSubtitle: "Funeral grants, festivals, maintenance & aid",
    netCashFlowCard: "Net Operating Surplus",
    netCashFlowSubtitle: "Operational inflows minus outflows",
    recordIncomeBtn: "+ Record Income",
    recordExpenseBtn: "+ Record Expense",
    searchFinancePlaceholder: "Search vouchers, descriptions, parties...",
    filterAllTransactions: "All Transactions",
    filterOnlyIncomes: "Incomes Only",
    filterOnlyExpenses: "Expenses Only",
    filterAllCategories: "All Categories",
    categoryBreakdownTitle: "Category-wise Allocation & Sources",
    incomeCategoriesTitle: "Revenue Streams (Incomes)",
    expenseCategoriesTitle: "Welfare Disbursements (Expenses)",
    colVoucherNo: "Voucher / Ref #",
    colType: "Type",
    colCategory: "Category",
    colDescription: "Description / Purpose",
    colParty: "Payer / Recipient",
    colMethod: "Method",
    colDate: "Date",
    typeIncome: "Income",
    typeExpense: "Expense",

    catHallRent: "Hall Rent (අප්නාශාලා / ශාලා කුලිය)",
    catShopRent: "Shop Rent (වෙළඳසැල් කුලිය)",
    catDonations: "Special Donations & Aid (පරිත්‍යාග)",
    catFundInterest: "Fund Bank Interest (අරමුදල් පොලී)",
    catOtherIncome: "Other Miscellaneous Income (වෙනත් ආදායම්)",
    catFuneralAid: "Funeral Aid (මරණාධාර / මරණධාරා)",
    catSports: "Sports & Youth Activities (ක්‍රීඩා)",
    catReligiousFestivals: "Religious & Cultural Festivals (ආගමික උත්සව)",
    catWelfareEvents: "Welfare & Social Events (සුබසාධක උත්සව)",
    catMedicalAid: "Emergency Medical Aid (හදිසි වෛද්‍ය ආධාර)",
    catMaintenance: "Maintenance & Repairs (නඩත්තු)",
    catAdminExpenses: "Administrative & Stationery (පරිපාලන)",
    catOtherExpense: "Other Miscellaneous Expenses (වෙනත් වියදම්)",

    modalRecordIncomeTitle: "Record New Income Entry",
    modalRecordIncomeSubtitle: "Register hall rent, shop lease, donations or other welfare receipts",
    modalRecordExpenseTitle: "Record New Expense Disbursement",
    modalRecordExpenseSubtitle: "Disburse funeral aid, sponsor sports, religious festivals or maintenance",
    modalFieldCategory: "Transaction Category",
    modalFieldAmount: "Amount (Rs.)",
    modalFieldTitle: "Short Title / Purpose",
    modalFieldPartyIncome: "Received From (Payer / Organization)",
    modalFieldPartyExpense: "Disbursed To (Recipient / Beneficiary)",
    modalFieldPaymentMethod: "Payment Method",
    modalFieldDate: "Transaction Date",
    modalFieldRef: "Receipt / Voucher / Check Ref #",
    modalFieldNotes: "Additional Notes / Audit Details",
    paymentMethodCash: "Cash (මුදල්)",
    paymentMethodBankTransfer: "Bank Transfer (බැංකු තැන්පතු)",
    paymentMethodCheque: "Cheque (චෙක්පත්)",
    paymentMethodOnline: "Online / Digital (ඩිජිටල්)",
    totalOtherIncomeLine: "Other Welfare Incomes (Hall/Shop/Donations)",
    totalExpenseLine: "Welfare Expenses (Funeral/Sports/Festivals)",
  },
  si: {
    appName: "සුබසාධක අරමුදල් කළමනාකරණය",
    tagline: "කාර්ය මණ්ඩල සුබසාධක සංගමය සහ අන්‍යෝන්‍ය සමූපකාරය",
    navOverview: "දළ විශ්ලේෂණය",
    navMembers: "සාමාජිකයන්",
    navLoans: "ණය පහසුකම්",
    navContributions: "දායකත්ව",
    navSettings: "සැකසුම්",
    signOut: "ඉවත් වන්න",
    apiOnline: "සම්බන්ධතාව සක්‍රීයයි",
    apiOffline: "නොබැඳි",
    adminBadge: "පරිපාලක",
    memberBadge: "සාමාජික",
    welcomeBack: "නැවත සාදරයෙන් පිළිගනිමු",
    connectedAs: "සම්බන්ධිත ගිණුම",
    mySummary: "මගේ සාරාංශය",
    myLoans: "මගේ ණය පහසුකම්",
    myReceipts: "මගේ රිසිට්පත්",

    // Language Card in Settings
    langSectionTitle: "භාෂාව සහ කලාපීය සැකසුම්",
    langSectionSubtitle: "පද්ධතිය පරිශීලනය කිරීමට ඔබ කැමති භාෂාව තෝරාගන්න",
    englishOptionTitle: "English (ඉංග්‍රීසි)",
    englishOptionDesc: "Default international English interface",
    sinhalaOptionTitle: "සිංහල (Sinhala)",
    sinhalaOptionDesc: "සම්පූර්ණ පද්ධතිය සිංහල භාෂාවෙන් භාවිතා කරන්න",
    activeLanguageBadge: "ක්‍රියාකාරී භාෂාව",

    // Profile Settings
    profileSectionTitle: "පුද්ගලික තොරතුරු",
    profileSectionSubtitle: "ඔබගේ නම, දුරකථන අංකය සහ දෙපාර්තමේන්තු තොරතුරු යාවත්කාලීන කරන්න",
    fullNameLabel: "සම්පූර්ණ නම",
    emailLabel: "විද්‍යුත් තැපැල් ලිපිනය",
    phoneLabel: "දුරකථන අංකය",
    departmentLabel: "දෙපාර්තමේන්තුව",
    saveProfileBtn: "තොරතුරු සුරකින්න",
    profileSavedSuccess: "පුද්ගලික තොරතුරු සාර්ථකව සුරකින ලදී!",

    // Password Settings
    passwordSectionTitle: "ආරක්ෂාව සහ මුරපදය",
    passwordSectionSubtitle: "ඔබගේ ගිණුමේ මුරපදය ආරක්ෂිතව වෙනස් කරන්න",
    currentPasswordLabel: "වත්මන් මුරපදය",
    newPasswordLabel: "නව මුරපදය (අවම අක්ෂර 6ක්)",
    confirmPasswordLabel: "නව මුරපදය තහවුරු කරන්න",
    updatePasswordBtn: "මුරපදය යාවත්කාලීන කරන්න",
    passwordMatchError: "නව මුරපදය සහ තහවුරු කිරීමේ මුරපදය නොගැළපේ.",
    passwordUpdatedSuccess: "මුරපදය සාර්ථකව යාවත්කාලීන කරන ලදී!",

    // Admin System Preferences
    systemPrefsTitle: "සුබසාධක යෝජනාක්‍රමය සහ මුදල් ඒකක සැකසුම්",
    systemPrefsSubtitle: "මූල්‍ය ප්‍රතිපත්ති, උපරිම ණය සීමාවන් සහ මුදල් ඒකක සැකසුම්",
    orgTitleLabel: "සංවිධානයේ / අරමුදලේ නම",
    activeCurrencyLabel: "ක්‍රියාකාරී මුදල් ඒකකය",
    customSymbolLabel: "මුදල් සංකේතය",
    defaultContributionLabel: "පෙරනිමි මාසික දායකත්ව මුදල",
    maxLoanLimitLabel: "උපරිම ණය ලබාදීමේ සීමාව",
    defaultInterestRateLabel: "පෙරනිමි වාර්ෂික පොලී අනුපාතිකය (%)",
    autoPayrollLabel: "ස්වයංක්‍රීය වැටුප් අඩුකිරීම්",
    autoPayrollSubtitle: "මාසික දායකත්ව ලෙජරය ස්වයංක්‍රීයව සැකසීම සක්‍රීය කරන්න",
    savePreferencesBtn: "පද්ධති සැකසුම් සුරකින්න",
    preferencesSavedSuccess: "පද්ධති මනාපයන් සාර්ථකව යාවත්කාලීන කරන ලදී!",

    // Overview Tab
    cashPool: "මුළු අරමුදල් ශේෂය",
    cashPoolSubtitle: "නිකුත් කිරීමට ඇති ශුද්ධ ද්‍රවශීල මුදල් ප්‍රමාණය",
    totalMembers: "ලියාපදිංචි සාමාජිකයන්",
    totalMembersSubtitle: "සක්‍රීය සුබසාධක දායකයන්",
    disbursedLoans: "නිකුත් කළ මුළු ණය",
    disbursedLoansSubtitle: "සාමාජිකයන් වෙත නිකුත් කර ඇති ණය ප්‍රමාණය",
    outstandingDebt: "අයවිය යුතු මුළු මුදල",
    outstandingDebtSubtitle: "නැවත අයවීමට ඇති සක්‍රීය ණය ශේෂය",
    financialBreakdown: "මූල්‍ය සාරාංශය සහ කාර්යසාධනය",
    initialReserve: "ආරම්භක අරමුදල් සංචිතය",
    contributionsCollected: "එකතු කරන ලද දායකත්ව මුදල්",
    repaymentsReceived: "ලැබුණු ණය ආපසු ගෙවීම්",
    activeLoansCount: "ක්‍රියාකාරී ණය ප්‍රමාණය",
    recentActivityTitle: "මෑත කාලීන ක්‍රියාකාරකම්",

    // Members Tab
    membersTitle: "සාමාජික නාමාවලිය",
    membersSubtitle: "ලියාපදිංචි සාමාජික තොරතුරු පරිශීලනය සහ කළමනාකරණය",
    searchMembersPlaceholder: "නම, අංකය හෝ ඊමේල් මඟින් සොයන්න...",
    filterDepartment: "සියලුම දෙපාර්තමේන්තු",
    filterStatus: "සියලුම තත්ත්වයන්",
    registerMemberBtn: "+ නව සාමාජිකයෙකු ලියාපදිංචි කරන්න",
    colMemberId: "සාමාජික අංකය",
    colMemberName: "සාමාජිකයාගේ නම",
    colDepartment: "දෙපාර්තමේන්තුව",
    colRole: "තනතුර",
    colMonthlyPledge: "මාසික දායකත්වය",
    colTotalContributed: "මුළු දායකත්වය",
    colStatus: "තත්ත්වය",
    colActions: "ක්‍රියාමාර්ග",
    viewProfile: "තොරතුරු බලන්න",
    editMember: "සංස්කරණය",
    deleteMember: "ඉවත් කරන්න",

    // Loans Tab
    loansTitle: "ණය පහසුකම් කළමනාකරණය",
    loansSubtitle: "සාමාජික ණය අයදුම්පත්, අනුමැතීන් සහ මාසික වාරික සටහන් කිරීම",
    searchLoansPlaceholder: "ණයකරුගේ නම හෝ ණය අංකයෙන් සොයන්න...",
    filterLoanStatus: "සියලුම ණය",
    applyLoanBtn: "+ ණයක් අයදුම් කරන්න",
    colLoanId: "ණය අංකය",
    colBorrower: "ණයකරු",
    colPrincipal: "මූලික මුදල",
    colInterestRate: "පොලී අනුපාතිකය",
    colMonthlyEMI: "මාසික වාරිකය",
    colRepaid: "ගෙවූ මුදල",
    colRemainingBalance: "ඉතිරි ශේෂය",
    actionApprove: "අනුමත කරන්න",
    actionReject: "ප්‍රතික්ෂේප කරන්න",
    actionRecordPayment: "වාරිකය ගෙවන්න",

    // Contributions Tab
    contributionsTitle: "සුබසාධක දායකත්ව ලෙජරය",
    contributionsSubtitle: "සාමාජික මාසික දායකත්ව සහ තැන්පතු පිළිබඳ සජීවී වාර්තාව",
    searchContributionsPlaceholder: "සාමාජිකයා හෝ රිසිට්පත් අංකයෙන් සොයන්න...",
    recordContributionBtn: "+ දායකත්වයක් සටහන් කරන්න",
    colReceiptNo: "රිසිට්පත් අංකය",
    colContributor: "දායකයා",
    colAmount: "මුදල",
    colMonthCovered: "අදාළ මාසය",
    colPaymentMethod: "ගෙවීම් ක්‍රමය",
    colPaymentDate: "සටහන් කළ දිනය",

    // Modals & Common Actions
    modalCancel: "අවලංගු කරන්න",
    modalSave: "සුරකින්න",
    modalSubmit: "ඉදිරිපත් කරන්න",
    modalConfirm: "තහවුරු කරන්න",
    modalClose: "වසන්න",
    statusActive: "සක්‍රීය",
    statusInactive: "අක්‍රීය",
    statusSuspended: "අත්හිටුවූ",
    statusPending: "පොරොත්තුවේ",
    statusApproved: "අනුමත කළ",
    statusFullyRepaid: "සම්පූර්ණයෙන් ගෙවා නිම කළ",
    statusRejected: "ප්‍රතික්ෂේපිත",

    // Finance Tab
    navFinance: "ආදායම් සහ වියදම්",
    financeTitle: "ආදායම් සහ වියදම් කළමනාකරණය",
    financeSubtitle: "ශාලා කුලී, වෙළඳසැල් කුලී, පරිත්‍යාග, මරණාධාර, ක්‍රීඩා සහ ආගමික උත්සව වියදම් වාර්තා ලෙජරය",
    totalIncomeCard: "මුළු බාහිර ආදායම්",
    totalIncomeSubtitle: "කුලී, පරිත්‍යාග සහ වෙනත් අරමුදල් ලැබීම්",
    totalExpenseCard: "මුළු සුබසාධක වියදම්",
    totalExpenseSubtitle: "මරණාධාර, උත්සව, ක්‍රීඩා සහ නඩත්තු පිරිවැය",
    netCashFlowCard: "ශුද්ධ මූල්‍ය ශේෂය (ආදායම් - වියදම්)",
    netCashFlowSubtitle: "මෙහෙයුම් ආදායම් සහ වියදම් අතර ශුද්ධ වෙනස",
    recordIncomeBtn: "+ ආදායමක් සටහන් කරන්න",
    recordExpenseBtn: "+ වියදමක් සටහන් කරන්න",
    searchFinancePlaceholder: "වවුචර් අංකය, විස්තරය හෝ පුද්ගලයා සොයන්න...",
    filterAllTransactions: "සියලුම ගනුදෙනු",
    filterOnlyIncomes: "ආදායම් පමණි",
    filterOnlyExpenses: "වියදම් පමණි",
    filterAllCategories: "සියලුම කාණ්ඩ",
    categoryBreakdownTitle: "කාණ්ඩ අනුව මූල්‍ය බෙදීයාම සහ ප්‍රභව",
    incomeCategoriesTitle: "ආදායම් මාර්ග (Incomes)",
    expenseCategoriesTitle: "සුබසාධක වියදම් සහ ආධාර (Expenses)",
    colVoucherNo: "වවුචර් / රිසිට්පත් අංකය",
    colType: "වර්ගය",
    colCategory: "කාණ්ඩය",
    colDescription: "විස්තරය / අරමුණ",
    colParty: "ගෙවන්නා / ලබන්නා",
    colMethod: "ගෙවීම් ක්‍රමය",
    colDate: "දිනය",
    typeIncome: "ආදායම",
    typeExpense: "වියදම",

    catHallRent: "ශාලා කුලිය (Hall Rent)",
    catShopRent: "වෙළඳසැල් කුලිය (Shop Rent)",
    catDonations: "විශේෂ පරිත්‍යාග සහ ආධාර (Donations)",
    catFundInterest: "අරමුදල් පොලී ආදායම් (Fund Interest)",
    catOtherIncome: "වෙනත් ආදායම් (Other Income)",
    catFuneralAid: "මරණාධාර / මරණධාරා (Funeral Aid)",
    catSports: "ක්‍රීඩා සහ තරුණ කටයුතු (Sports)",
    catReligiousFestivals: "ආගමික උත්සව සහ සංස්කෘතික (Religious Festivals)",
    catWelfareEvents: "සුබසාධක උත්සව (Welfare Events)",
    catMedicalAid: "හදිසි වෛද්‍ය ආධාර (Medical Aid)",
    catMaintenance: "නඩත්තු සහ අලුත්වැඩියා (Maintenance)",
    catAdminExpenses: "පරිපාලන සහ ලිපිද්‍රව්‍ය වියදම් (Admin)",
    catOtherExpense: "වෙනත් වියදම් (Other Expense)",

    modalRecordIncomeTitle: "නව ආදායම් වාර්තාවක් සටහන් කිරීම",
    modalRecordIncomeSubtitle: "ශාලා කුලී, වෙළඳසැල් කුලී, පරිත්‍යාග හෝ වෙනත් ආදායම් අරමුදලට එකතු කරන්න",
    modalRecordExpenseTitle: "නව වියදම් වාර්තාවක් සටහන් කිරීම",
    modalRecordExpenseSubtitle: "මරණාධාර, ක්‍රීඩා ආධාර, ආගමික උත්සව හෝ නඩත්තු වියදම් අරමුදලින් මුදාහරින්න",
    modalFieldCategory: "ගනුදෙනු කාණ්ඩය",
    modalFieldAmount: "මුදල (රු.)",
    modalFieldTitle: "කෙටි මාතෘකාව / අරමුණ",
    modalFieldPartyIncome: "ලැබුණේ කාගෙන්ද (ගෙවූ පුද්ගලයා / ආයතනය)",
    modalFieldPartyExpense: "ගෙවීම් ලැබුවේ කවුරුන්ද (ප්‍රතිලාභියා / සැපයුම්කරු)",
    modalFieldPaymentMethod: "ගෙවීම් ක්‍රමය",
    modalFieldDate: "ගනුදෙනු දිනය",
    modalFieldRef: "රිසිට්පත් / චෙක්පත් / වවුචර් අංකය",
    modalFieldNotes: "අමතර සටහන් සහ විගණන විස්තර",
    paymentMethodCash: "මුදල් (Cash)",
    paymentMethodBankTransfer: "බැංකු තැන්පතු (Bank Transfer)",
    paymentMethodCheque: "චෙක්පත් (Cheque)",
    paymentMethodOnline: "ඩිජිටල් ගෙවීම් (Online)",
    totalOtherIncomeLine: "වෙනත් සුබසාධක ආදායම් (ශාලා/වෙළඳසැල්/පරිත්‍යාග)",
    totalExpenseLine: "සුබසාධක වියදම් (මරණාධාර/ක්‍රීඩා/උත්සව)",
  },
};

export function t(lang: Language, key: keyof TranslationDictionary): string {
  return translations[lang]?.[key] || translations.en[key] || String(key);
}
