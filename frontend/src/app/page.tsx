"use client";

import { useEffect, useState, useMemo } from "react";
import { Language, t } from "../lib/i18n";
import { API_BASE } from "../lib/api";

// ── Types & Interfaces ──────────────────────────────────────────────────────
interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: "admin" | "member";
  memberId?: string | null;
  department?: string;
  phone?: string;
  memberProfile?: Member | null;
}

interface Member {
  id: string;
  memberId: string;
  name: string;
  email: string;
  phone: string;
  department?: string;
  thanthura?: string;
  idNumber?: string;
  sewaAnkaya?: string;
  role: string;
  status: "Active" | "Inactive" | "Suspended" | "Pending";
  monthlyContribution: number;
  totalContributed: number;
  joinDate: string;
  notes?: string;
  loans?: Loan[];
  contributions?: Contribution[];
}

interface Loan {
  id: string;
  loanId: string;
  memberId: string;
  memberName: string;
  principalAmount: number;
  interestRate: number;
  termMonths: number;
  totalRepayable: number;
  monthlyPayment: number;
  amountRepaid: number;
  remainingBalance: number;
  purpose: string;
  status: "Pending" | "Approved" | "Active" | "Fully Repaid" | "Rejected";
  applicationDate: string;
  disbursedDate?: string | null;
  nextDueDate?: string | null;
}

interface Contribution {
  id: string;
  receiptNo: string;
  memberId: string;
  memberName: string;
  amount: number;
  monthCovered: string;
  paymentMethod: string;
  paymentDate: string;
  notes?: string;
}

interface FundSummary {
  currentCashPool: number;
  initialReserve: number;
  totalContributionsCollected: number;
  totalDisbursedLoans: number;
  totalRepaymentsReceived: number;
  totalOutstandingDebt: number;
  totalOtherIncome?: number;
  totalExpenses?: number;
  netCashFlow?: number;
  totalMembers: number;
  activeMembers: number;
  activeLoansCount: number;
  pendingLoansCount: number;
  recentContributionsCount: number;
  transactionsCount?: number;
}

interface Transaction {
  id: string;
  voucherNo: string;
  type: "income" | "expense";
  category: string;
  categoryName: string;
  amount: number;
  date: string;
  title: string;
  description: string;
  partyName: string;
  paymentMethod: string;
  receiptOrVoucherRef: string;
  recordedBy: string;
  recordedAt: string;
}

interface FinanceSummaryData {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  transactionsCount: number;
  incomeByCategory: { category: string; name: string; total: number; count: number }[];
  expenseByCategory: { category: string; name: string; total: number; count: number }[];
}

interface SystemSettings {
  organizationName: string;
  currency: string;
  currencySymbol: string;
  defaultContributionRate: number;
  maxLoanLimit: number;
  defaultInterestRate: number;
  autoPayrollDeduction: boolean;
  initialReserve?: number;
}

const CURRENCY_OPTIONS = [
  { code: "LKR", symbol: "Rs.", label: "LKR (Rs.) - Sri Lankan Rupee (ශ්‍රී ලංකා රුපියල්)" },
];

export default function WelfareApp() {
  // ── Authentication States ─────────────────────────────────────────────────
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Login form states
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginSubmitting, setLoginSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [serverWakingUp, setServerWakingUp] = useState(false);

  // Navigation (Tabs)
  const [activeTab, setActiveTab] = useState<"overview" | "members" | "loans" | "contributions" | "finance" | "settings">("overview");

  // Language state
  const [language, setLanguage] = useState<Language>("si");

  // Core Data States
  const [fund, setFund] = useState<FundSummary | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [financeSummary, setFinanceSummary] = useState<FinanceSummaryData | null>(null);

  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    organizationName: "Staff Welfare Association",
    currency: "LKR",
    currencySymbol: "Rs.",
    defaultContributionRate: 2500,
    maxLoanLimit: 500000,
    defaultInterestRate: 4.5,
    autoPayrollDeduction: true,
    initialReserve: 45000,
  });
  const [loading, setLoading] = useState(true);
  const [serverOnline, setServerOnline] = useState<boolean | null>(null);

  // Notification Alert Banner
  const [alertMessage, setAlertMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  // Filter & Search states
  const [memberSearch, setMemberSearch] = useState("");
  const [memberDeptFilter, setMemberDeptFilter] = useState("All");
  const [memberStatusFilter, setMemberStatusFilter] = useState("All");

  const [loanSearch, setLoanSearch] = useState("");
  const [loanStatusFilter, setLoanStatusFilter] = useState("All");

  const [contributionSearch, setContributionSearch] = useState("");

  const [financeSearch, setFinanceSearch] = useState("");
  const [financeTypeFilter, setFinanceTypeFilter] = useState<"all" | "income" | "expense">("all");
  const [financeCategoryFilter, setFinanceCategoryFilter] = useState("all");

  // Finance Modals & Form states
  const [showRecordIncomeModal, setShowRecordIncomeModal] = useState(false);
  const [showRecordExpenseModal, setShowRecordExpenseModal] = useState(false);
  const [financeSubmitting, setFinanceSubmitting] = useState(false);

  // Income form states
  const [incomeCategory, setIncomeCategory] = useState("hall_rent");
  const [incomeAmount, setIncomeAmount] = useState("");
  const [incomeTitle, setIncomeTitle] = useState("");
  const [incomeDescription, setIncomeDescription] = useState("");
  const [incomeParty, setIncomeParty] = useState("");
  const [incomeMethod, setIncomeMethod] = useState("Cash");
  const [incomeRef, setIncomeRef] = useState("");
  const [incomeDate, setIncomeDate] = useState(new Date().toISOString().split("T")[0]);

  // Expense form states
  const [expenseCategory, setExpenseCategory] = useState("funeral_aid");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseTitle, setExpenseTitle] = useState("");
  const [expenseDescription, setExpenseDescription] = useState("");
  const [expenseParty, setExpenseParty] = useState("");
  const [expenseMethod, setExpenseMethod] = useState("Cash");
  const [expenseRef, setExpenseRef] = useState("");
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split("T")[0]);

  // Modals state
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showEditMemberModal, setShowEditMemberModal] = useState(false);
  const [showMemberDetailsModal, setShowMemberDetailsModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const [showApplyLoanModal, setShowApplyLoanModal] = useState(false);
  const [showPayLoanModal, setShowPayLoanModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);

  const [showRecordContributionModal, setShowRecordContributionModal] = useState(false);

  // Balance Management State
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [balanceForm, setBalanceForm] = useState<{
    mode: 'current' | 'reserve';
    amount: number | string;
    notes: string;
    recordTransaction: boolean;
  }>({
    mode: 'current',
    amount: 0,
    notes: '',
    recordTransaction: false
  });
  const [balanceSubmitting, setBalanceSubmitting] = useState(false);

  // Form states
  const [memberForm, setMemberForm] = useState({
    name: "",
    email: "",
    phone: "",
    thanthura: "",
    idNumber: "",
    sewaAnkaya: "",
    department: "",
    role: "Member",
    monthlyContribution: 100,
    notes: "",
  });
  const [newlyRegisteredMember, setNewlyRegisteredMember] = useState<Member | null>(null);
  const [memberSubmitting, setMemberSubmitting] = useState(false);
  const [memberFormError, setMemberFormError] = useState<string | null>(null);

  // Real-time duplicate validation against loaded members
  const duplicateValidation = useMemo(() => {
    const cleanId = memberForm.idNumber?.trim().toUpperCase() || "";
    const cleanSewa = memberForm.sewaAnkaya?.trim().toUpperCase() || "";
    const cleanEmail = memberForm.email?.trim().toLowerCase() || "";

    // When editing a member, exclude the member being edited
    const candidateMembers =
      showEditMemberModal && selectedMember
        ? members.filter(
            (m) => m.id !== selectedMember.id && m.memberId !== selectedMember.memberId
          )
        : members;

    const matchedId = cleanId
      ? candidateMembers.find((m) => m.idNumber && m.idNumber.trim().toUpperCase() === cleanId)
      : null;
    const matchedSewa = cleanSewa
      ? candidateMembers.find((m) => m.sewaAnkaya && m.sewaAnkaya.trim().toUpperCase() === cleanSewa)
      : null;
    const matchedEmail = cleanEmail
      ? candidateMembers.find((m) => m.email && m.email.trim().toLowerCase() === cleanEmail)
      : null;

    const idError = matchedId
      ? language === "si"
        ? `මෙම හැඳුනුම්පත් අංකය (${memberForm.idNumber.trim()}) දැනටමත් "${matchedId.name}" (${matchedId.memberId}) සාමාජිකයා යටතේ ලියාපදිංචි කර ඇත.`
        : `ID Number (NIC) "${memberForm.idNumber.trim()}" is already registered to "${matchedId.name}" (${matchedId.memberId}).`
      : null;

    const sewaError = matchedSewa
      ? language === "si"
        ? `මෙම සේවා අංකය (${memberForm.sewaAnkaya.trim()}) දැනටමත් "${matchedSewa.name}" (${matchedSewa.memberId}) සාමාජිකයා යටතේ ලියාපදිංචි කර ඇත.`
        : `Sewa Ankaya "${memberForm.sewaAnkaya.trim()}" is already registered to "${matchedSewa.name}" (${matchedSewa.memberId}).`
      : null;

    const emailError = matchedEmail
      ? language === "si"
        ? `මෙම විද්‍යුත් තැපැල් ලිපිනය (${memberForm.email.trim()}) දැනටමත් "${matchedEmail.name}" (${matchedEmail.memberId}) සාමාජිකයා යටතේ ලියාපදිංචි කර ඇත.`
        : `Email address "${memberForm.email.trim()}" is already registered to "${matchedEmail.name}" (${matchedEmail.memberId}).`
      : null;

    return {
      hasDuplicate: Boolean(matchedId || matchedSewa || matchedEmail),
      idError,
      sewaError,
      emailError,
      matchedId,
      matchedSewa,
      matchedEmail,
    };
  }, [memberForm.idNumber, memberForm.sewaAnkaya, memberForm.email, members, language, showEditMemberModal, selectedMember]);

  const [loanForm, setLoanForm] = useState({
    memberId: "",
    principalAmount: 2000,
    interestRate: 4.5,
    termMonths: 12,
    purpose: "",
  });

  const [repaymentForm, setRepaymentForm] = useState({
    amount: 0,
    paymentMethod: "Bank Transfer",
    notes: "",
  });

  const [contributionForm, setContributionForm] = useState({
    memberId: "",
    amount: 100,
    monthCovered: "September 2026",
    paymentMethod: "Payroll Deduction",
    notes: "Regular monthly welfare contribution",
  });

  // Settings form states
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    phone: "",
    department: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [settingsForm, setSettingsForm] = useState<SystemSettings>({
    organizationName: "Staff Welfare Association",
    currency: "LKR",
    currencySymbol: "Rs.",
    defaultContributionRate: 2500,
    maxLoanLimit: 500000,
    defaultInterestRate: 4.5,
    autoPayrollDeduction: true,
  });

  // ── Restore Token & Language on Mount ────────────────────────────────────
  useEffect(() => {
    const savedLang = localStorage.getItem("welfare_language") as Language | null;
    if (savedLang === "en" || savedLang === "si") {
      setLanguage(savedLang);
    } else {
      setLanguage("si");
    }

    const savedToken = localStorage.getItem("welfare_auth_token");
    if (savedToken) {
      setAuthToken(savedToken);
      fetch(`${API_BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${savedToken}` },
      })
        .then((res) => {
          if (!res.ok) throw new Error("Invalid session");
          return res.json();
        })
        .then((data) => {
          setCurrentUser(data.user);
          setProfileForm({
            name: data.user.name || "",
            email: data.user.email || "",
            phone: data.user.phone || "",
            department: data.user.department || "",
          });
        })
        .catch(() => {
          localStorage.removeItem("welfare_auth_token");
          setAuthToken(null);
          setCurrentUser(null);
        })
        .finally(() => {
          setAuthLoading(false);
        });
    } else {
      setAuthLoading(false);
    }
  }, []);

  // ── Fetch System Settings ─────────────────────────────────────────────────
  const fetchSystemSettings = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/settings/system`);
      if (res.ok) {
        const json = await res.json();
        setSystemSettings(json.data);
        setSettingsForm(json.data);
      }
    } catch (err) {
      console.warn("Could not fetch system settings:", err);
    }
  };

  useEffect(() => {
    fetchSystemSettings();
  }, []);

  // ── Fetch Core Data ───────────────────────────────────────────────────────
  const refreshAllData = async () => {
    try {
      const headers: Record<string, string> = {};
      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }

      const [fundRes, membersRes, loansRes, contributionsRes, transRes, finSumRes] = await Promise.all([
        fetch(`${API_BASE}/api/fund/summary`),
        fetch(`${API_BASE}/api/members`, { headers }),
        fetch(`${API_BASE}/api/loans`, { headers }),
        fetch(`${API_BASE}/api/contributions`, { headers }),
        fetch(`${API_BASE}/api/finance/transactions`, { headers }),
        fetch(`${API_BASE}/api/finance/summary`, { headers }),
      ]);

      if (fundRes.ok) {
        const json = await fundRes.json();
        setFund(json.data);
        setServerOnline(true);
      }

      if (membersRes.ok) {
        const json = await membersRes.json();
        setMembers(json.data || []);
      }

      if (loansRes.ok) {
        const json = await loansRes.json();
        setLoans(json.data || []);
      }

      if (contributionsRes.ok) {
        const json = await contributionsRes.json();
        setContributions(json.data || []);
      }

      if (transRes && transRes.ok) {
        const json = await transRes.json();
        setTransactions(json.data || []);
      }

      if (finSumRes && finSumRes.ok) {
        const json = await finSumRes.json();
        setFinanceSummary(json.summary || null);
      }
    } catch (err) {
      console.warn("API offline or error:", err);
      setServerOnline(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      refreshAllData();
      const interval = setInterval(refreshAllData, 12000);
      return () => clearInterval(interval);
    }
  }, [currentUser, authToken]);

  const notify = (type: "success" | "error" | "info", text: string) => {
    setAlertMessage({ type, text });
    setTimeout(() => setAlertMessage(null), 5000);
  };

  const changeLanguage = (newLang: Language) => {
    setLanguage(newLang);
    localStorage.setItem("welfare_language", newLang);
    notify("info", newLang === "si" ? "භාෂාව සිංහල ලෙස සාර්ථකව වෙනස් කරන ලදී" : "Display language set to English");
  };

  // ── Authentication Actions ────────────────────────────────────────────────
  const handleLogin = async (e?: React.FormEvent, customEmail?: string, customPassword?: string) => {
    if (e) e.preventDefault();
    const emailToUse = customEmail || loginEmail;
    const passwordToUse = customPassword || loginPassword;

    setLoginSubmitting(true);
    setLoginError(null);
    setServerWakingUp(false);

    const wakeTimer = setTimeout(() => {
      setServerWakingUp(true);
    }, 2500);

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailToUse, password: passwordToUse }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Authentication failed");

      localStorage.setItem("welfare_auth_token", data.token);
      setAuthToken(data.token);
      setCurrentUser(data.user);
      setServerOnline(true);
      setProfileForm({
        name: data.user.name || "",
        email: data.user.email || "",
        phone: data.user.phone || "",
        department: data.user.department || "",
      });
      notify("success", `Welcome, ${data.user.name} (${data.user.role.toUpperCase()})!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setLoginError(msg);
    } finally {
      clearTimeout(wakeTimer);
      setServerWakingUp(false);
      setLoginSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("welfare_auth_token");
    setAuthToken(null);
    setCurrentUser(null);
    setLoginEmail("");
    setLoginPassword("");
    notify("info", "You have signed out successfully.");
  };

  // ── Member Actions ────────────────────────────────────────────────────────
  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setMemberFormError(null);

    if (!memberForm.name.trim() || !memberForm.phone.trim()) {
      const errMsg = language === "si"
        ? "නම සහ දුරකථන අංකය ඇතුළත් කිරීම අනිවාර්ය වේ."
        : "Name and phone number are required.";
      setMemberFormError(errMsg);
      notify("error", errMsg);
      return;
    }

    if (!memberForm.idNumber?.trim()) {
      const errMsg = language === "si"
        ? "හැඳුනුම්පත් අංකය (ID Number / NIC) ඇතුළත් කිරීම අනිවාර්ය වේ."
        : "ID Number (NIC) is mandatory and required.";
      setMemberFormError(errMsg);
      notify("error", errMsg);
      return;
    }

    // Client-side duplicate check: block submission if already registered
    if (duplicateValidation.hasDuplicate) {
      const errorMsg =
        duplicateValidation.idError ||
        duplicateValidation.sewaError ||
        duplicateValidation.emailError ||
        (language === "si"
          ? "ද්විත්ව තොරතුරු හමුවී ඇත. කරුණාකර වෙනස් තොරතුරු භාවිතා කරන්න."
          : "Duplicate entries detected. Please resolve duplicates before submitting.");
      setMemberFormError(errorMsg);
      notify("error", errorMsg);
      return;
    }

    setMemberSubmitting(true);
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }

      // Active database duplicate pre-validation check
      try {
        const valRes = await fetch(`${API_BASE}/api/members/validate-duplicates`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            idNumber: memberForm.idNumber,
            sewaAnkaya: memberForm.sewaAnkaya,
            email: memberForm.email,
          }),
        });
        if (valRes.ok) {
          const valData = await valRes.json();
          if (valData.hasDuplicate) {
            const dupMsg = valData.error || (language === "si"
              ? "මෙම තොරතුරු සහිත සාමාජිකයෙකු දැනටමත් ලියාපදිංචි කර ඇත."
              : "Duplicate member information exists in system records. Registration blocked.");
            setMemberFormError(dupMsg);
            notify("error", dupMsg);
            setMemberSubmitting(false);
            return;
          }
        }
      } catch (checkErr) {
        console.warn("Pre-check duplicate validation network check failed, continuing to authoritative save:", checkErr);
      }

      const payload = {
        ...memberForm,
        department: memberForm.thanthura || memberForm.department || "General Staff",
      };
      const res = await fetch(`${API_BASE}/api/members`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        const errorMsg = data.error || (language === "si" ? "සාමාජිකයා ලියාපදිංචි කිරීම අසාර්ථක විය." : "Failed to add member");
        setMemberFormError(errorMsg);
        throw new Error(errorMsg);
      }

      setNewlyRegisteredMember(data.data);
      notify("success", language === "si" ? `${data.data.name} (${data.data.memberId}) සාමාජිකයා සාර්ථකව ලියාපදිංචි කරන ලදී!` : `Member ${data.data.name} (${data.data.memberId}) registered successfully!`);
      setShowAddMemberModal(false);
      setMemberFormError(null);
      setMemberForm({
        name: "",
        email: "",
        phone: "",
        thanthura: "",
        idNumber: "",
        sewaAnkaya: "",
        department: "",
        role: "Member",
        monthlyContribution: systemSettings.defaultContributionRate || 100,
        notes: "",
      });
      refreshAllData();
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setMemberFormError(msg);
      notify("error", msg);
    } finally {
      setMemberSubmitting(false);
    }
  };

  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;

    if (!memberForm.name.trim() || !memberForm.phone.trim()) {
      const errMsg = language === "si"
        ? "නම සහ දුරකථන අංකය ඇතුළත් කිරීම අනිවාර්ය වේ."
        : "Name and phone number are required.";
      notify("error", errMsg);
      return;
    }

    if (!memberForm.idNumber?.trim()) {
      const errMsg = language === "si"
        ? "හැඳුනුම්පත් අංකය (ID Number / NIC) ඇතුළත් කිරීම අනිවාර්ය වේ."
        : "ID Number (NIC) is mandatory and required.";
      notify("error", errMsg);
      return;
    }

    // Client-side duplicate check against other members
    const cleanId = memberForm.idNumber?.trim().toUpperCase() || "";
    const cleanSewa = memberForm.sewaAnkaya?.trim().toUpperCase() || "";
    const cleanEmail = memberForm.email?.trim().toLowerCase() || "";
    const otherMembers = members.filter(
      (m) => m.id !== selectedMember.id && m.memberId !== selectedMember.memberId
    );

    if (cleanId) {
      const dup = otherMembers.find(
        (m) => m.idNumber && m.idNumber.trim().toUpperCase() === cleanId
      );
      if (dup) {
        const msg = language === "si"
          ? `මෙම හැඳුනුම්පත් අංකය (${memberForm.idNumber.trim()}) දැනටමත් "${dup.name}" (${dup.memberId}) සාමාජිකයා යටතේ ලියාපදිංචි කර ඇත.`
          : `ID Number (NIC) "${memberForm.idNumber.trim()}" is already registered to "${dup.name}" (${dup.memberId}).`;
        notify("error", msg);
        return;
      }
    }

    if (cleanSewa) {
      const dup = otherMembers.find(
        (m) => m.sewaAnkaya && m.sewaAnkaya.trim().toUpperCase() === cleanSewa
      );
      if (dup) {
        const msg = language === "si"
          ? `මෙම සේවා අංකය (${memberForm.sewaAnkaya.trim()}) දැනටමත් "${dup.name}" (${dup.memberId}) සාමාජිකයා යටතේ ලියාපදිංචි කර ඇත.`
          : `Sewa Ankaya "${memberForm.sewaAnkaya.trim()}" is already registered to "${dup.name}" (${dup.memberId}).`;
        notify("error", msg);
        return;
      }
    }

    if (cleanEmail) {
      const dup = otherMembers.find(
        (m) => m.email && m.email.trim().toLowerCase() === cleanEmail
      );
      if (dup) {
        const msg = language === "si"
          ? `මෙම විද්‍යුත් තැපැල් ලිපිනය (${memberForm.email.trim()}) දැනටමත් "${dup.name}" (${dup.memberId}) සාමාජිකයා යටතේ ලියාපදිංචි කර ඇත.`
          : `Email address "${memberForm.email.trim()}" is already registered to "${dup.name}" (${dup.memberId}).`;
        notify("error", msg);
        return;
      }
    }

    try {
      // Server duplicate check
      const valRes = await fetch(`${API_BASE}/api/members/validate-duplicates`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          idNumber: memberForm.idNumber,
          sewaAnkaya: memberForm.sewaAnkaya,
          email: memberForm.email,
          excludeId: selectedMember.id,
        }),
      });
      if (valRes.ok) {
        const valData = await valRes.json();
        if (valData.hasDuplicate) {
          const dupMsg = valData.error || (language === "si"
            ? "ද්විත්ව සාමාජික තොරතුරු පද්ධතිය තුළ පවතී."
            : "Duplicate member information exists in system records.");
          notify("error", dupMsg);
          return;
        }
      }

      const payload = {
        ...memberForm,
        department: memberForm.thanthura || memberForm.department || "General Staff",
      };
      const res = await fetch(`${API_BASE}/api/members/${selectedMember.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || (language === "si" ? "සාමාජික තොරතුරු යාවත්කාලීන කිරීම අසාර්ථක විය." : "Failed to update member"));

      notify("success", language === "si" ? `${data.data.name} සාමාජික තොරතුරු යාවත්කාලීන කරන ලදී.` : `Member ${data.data.name} updated.`);
      setShowEditMemberModal(false);
      refreshAllData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      notify("error", msg);
    }
  };

  const handleDeleteMember = async (id: string, name: string) => {
    if (!confirm(language === "si" ? `ඔබට ${name} සාමාජිකයා ඉවත් කිරීමට අවශ්‍ය බව තහවුරු කරන්නද?` : `Are you sure you want to remove member ${name}?`)) return;
    try {
      const res = await fetch(`${API_BASE}/api/members/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete member");

      notify("info", language === "si" ? `${name} සාමාජිකයා සාර්ථකව ඉවත් කරන ලදී.` : `Member ${name} removed.`);
      refreshAllData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      notify("error", msg);
    }
  };

  const openMemberProfile = async (member: Member) => {
    try {
      const res = await fetch(`${API_BASE}/api/members/${member.id}`);
      if (res.ok) {
        const json = await res.json();
        setSelectedMember(json.data);
      } else {
        setSelectedMember(member);
      }
      setShowMemberDetailsModal(true);
    } catch {
      setSelectedMember(member);
      setShowMemberDetailsModal(true);
    }
  };

  const openEditMemberModal = (m: Member) => {
    setSelectedMember(m);
    setMemberForm({
      name: m.name,
      email: m.email,
      phone: m.phone,
      thanthura: m.thanthura || m.department || "",
      idNumber: m.idNumber || "",
      sewaAnkaya: m.sewaAnkaya || "",
      department: m.department || "",
      role: m.role,
      monthlyContribution: m.monthlyContribution,
      notes: m.notes || "",
    });
    setShowEditMemberModal(true);
  };

  // ── Loan Actions ──────────────────────────────────────────────────────────
  const handleApplyLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/loans`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(loanForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Loan application failed");

      notify("success", language === "si" ? `${data.data.loanId} ණය අයදුම්පත අනුමැතිය සඳහා ඉදිරිපත් කරන ලදී!` : `Loan ${data.data.loanId} submitted for review!`);
      setShowApplyLoanModal(false);
      setLoanForm({
        memberId: currentUser?.memberId || members[0]?.memberId || "",
        principalAmount: 2000,
        interestRate: systemSettings.defaultInterestRate || 4.5,
        termMonths: 12,
        purpose: "",
      });
      refreshAllData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      notify("error", msg);
    }
  };

  const handleUpdateLoanStatus = async (loanId: string, newStatus: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/loans/${loanId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Status update failed");

      notify("success", language === "si" ? `ණය තත්ත්වය යාවත්කාලීන කරන ලදී (${newStatus}).` : `Loan status updated to ${newStatus}.`);
      refreshAllData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      notify("error", msg);
    }
  };

  const handleRecordRepayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoan) return;
    try {
      const res = await fetch(`${API_BASE}/api/loans/${selectedLoan.id}/pay`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(repaymentForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Repayment failed");

      notify("success", language === "si" ? "ණය වාරික ගෙවීම සාර්ථකව සටහන් කරන ලදී!" : (data.message || "Repayment recorded!"));
      setShowPayLoanModal(false);
      refreshAllData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      notify("error", msg);
    }
  };

  // ── Contribution Actions ──────────────────────────────────────────────────
  const handleRecordContribution = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/contributions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(contributionForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Contribution recording failed");

      notify("success", language === "si" ? "දායකත්ව තැන්පතුව සාර්ථකව සටහන් කර රිසිට්පත නිකුත් කරන ලදී!" : (data.message || "Contribution recorded!"));
      setShowRecordContributionModal(false);
      refreshAllData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      notify("error", msg);
    }
  };

  // ── Finance Actions (Income & Expense) ────────────────────────────────────
  const handleRecordIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    setFinanceSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/finance/transactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({
          type: "income",
          category: incomeCategory,
          amount: parseFloat(incomeAmount),
          title: incomeTitle,
          description: incomeDescription,
          partyName: incomeParty,
          paymentMethod: incomeMethod,
          receiptOrVoucherRef: incomeRef,
          date: incomeDate,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to record income");

      notify("success", language === "si" ? "නව ආදායම් වාර්තාව සාර්ථකව සටහන් කරන ලදී!" : (data.message || "Income recorded successfully!"));
      setShowRecordIncomeModal(false);
      setIncomeAmount("");
      setIncomeTitle("");
      setIncomeDescription("");
      setIncomeParty("");
      setIncomeRef("");
      refreshAllData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      notify("error", msg);
    } finally {
      setFinanceSubmitting(false);
    }
  };

  const handleRecordExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setFinanceSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/finance/transactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({
          type: "expense",
          category: expenseCategory,
          amount: parseFloat(expenseAmount),
          title: expenseTitle,
          description: expenseDescription,
          partyName: expenseParty,
          paymentMethod: expenseMethod,
          receiptOrVoucherRef: expenseRef,
          date: expenseDate,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to record expense");

      notify("success", language === "si" ? "නව වියදම් වාර්තාව සාර්ථකව සටහන් කරන ලදී!" : (data.message || "Expense recorded successfully!"));
      setShowRecordExpenseModal(false);
      setExpenseAmount("");
      setExpenseTitle("");
      setExpenseDescription("");
      setExpenseParty("");
      setExpenseRef("");
      refreshAllData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      notify("error", msg);
    } finally {
      setFinanceSubmitting(false);
    }
  };

  const handleDeleteTransaction = async (id: string, voucherNo: string) => {
    const confirmPrompt = language === "si"
      ? `මෙම ගනුදෙනු වාර්තාව (${voucherNo}) සදහටම ඉවත් කිරීමට ඔබට සහතිකද?`
      : `Are you sure you want to delete transaction ${voucherNo}?`;
    if (!window.confirm(confirmPrompt)) return;

    try {
      const res = await fetch(`${API_BASE}/api/finance/transactions/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete transaction");

      notify("success", language === "si" ? "ගනුදෙනුව සාර්ථකව ඉවත් කරන ලදී." : "Transaction deleted successfully.");
      refreshAllData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      notify("error", msg);
    }
  };

  // ── Settings Actions ──────────────────────────────────────────────────────
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/settings/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(profileForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile");

      setCurrentUser((prev) => (prev ? { ...prev, ...data.data } : null));
      notify("success", t(language, "profileSavedSuccess"));
      refreshAllData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      notify("error", msg);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      notify("error", t(language, "passwordMatchError"));
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/settings/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to change password");

      notify("success", t(language, "passwordUpdatedSuccess"));
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      notify("error", msg);
    }
  };

  const handleUpdateSystemSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/settings/system`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(settingsForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update system settings");

      setSystemSettings(data.data);
      notify("success", language === "si" ? `පද්ධති මනාපයන් යාවත්කාලීන කරන ලදී. සක්‍රීය මුදල් ඒකකය: ශ්‍රී ලංකා රුපියල් (${data.data.currencySymbol})` : `System preferences updated. Active currency: ${data.data.currency} (${data.data.currencySymbol})`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      notify("error", msg);
    }
  };

  // ── Balance Management Actions ─────────────────────────────────────────────
  const openBalanceModal = (preferredMode: 'current' | 'reserve' = 'current') => {
    setBalanceForm({
      mode: preferredMode,
      amount: preferredMode === 'current'
        ? (fund ? fund.currentCashPool : 0)
        : (fund ? fund.initialReserve : 45000),
      notes: '',
      recordTransaction: false,
    });
    setShowBalanceModal(true);
  };

  const handleUpdateBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    setBalanceSubmitting(true);
    try {
      const numAmount = Number(balanceForm.amount);
      if (isNaN(numAmount) || numAmount < 0) {
        throw new Error(
          language === "si"
            ? "කරුණාකර වලංගු ශේෂ මුදලක් ඇතුළත් කරන්න (0 හෝ ඊට වැඩි)."
            : "Please enter a valid numeric amount (0 or greater)."
        );
      }

      const payload: Record<string, unknown> = {
        notes: balanceForm.notes,
        recordTransaction: balanceForm.recordTransaction,
      };
      if (balanceForm.mode === "current") {
        payload.currentBalance = numAmount;
      } else {
        payload.initialReserve = numAmount;
      }

      const res = await fetch(`${API_BASE}/api/fund/balance`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update account balance");

      notify(
        "success",
        language === "si"
          ? "සුබසාධක ගිණුම් ශේෂය සාර්ථකව යාවත්කාලීන කරන ලදී!"
          : "Welfare account balance successfully updated!"
      );
      setShowBalanceModal(false);
      refreshAllData();
      fetchSystemSettings();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      notify("error", msg);
    } finally {
      setBalanceSubmitting(false);
    }
  };

  // ── Loan Calculator Preview ───────────────────────────────────────────────
  const loanCalcPreview = useMemo(() => {
    const p = parseFloat(String(loanForm.principalAmount)) || 0;
    const r = parseFloat(String(loanForm.interestRate)) || 0;
    const m = parseInt(String(loanForm.termMonths), 10) || 1;
    const totalInterest = Math.round((p * (r / 100) * (m / 12)) * 100) / 100;
    const totalRepayable = Math.round((p + totalInterest) * 100) / 100;
    const monthlyEMI = Math.round((totalRepayable / m) * 100) / 100;
    return { totalInterest, totalRepayable, monthlyEMI };
  }, [loanForm]);

  // Role-based filtered views
  const visibleLoans = useMemo(() => {
    if (currentUser?.role === "member" && currentUser.memberId) {
      return loans.filter((l) => l.memberId === currentUser.memberId);
    }
    return loans;
  }, [loans, currentUser]);

  const visibleContributions = useMemo(() => {
    if (currentUser?.role === "member" && currentUser.memberId) {
      return contributions.filter((c) => c.memberId === currentUser.memberId);
    }
    return contributions;
  }, [contributions, currentUser]);

  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const matchesSearch =
        m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
        m.memberId.toLowerCase().includes(memberSearch.toLowerCase()) ||
        (m.thanthura && m.thanthura.toLowerCase().includes(memberSearch.toLowerCase())) ||
        (m.idNumber && m.idNumber.toLowerCase().includes(memberSearch.toLowerCase())) ||
        (m.sewaAnkaya && m.sewaAnkaya.toLowerCase().includes(memberSearch.toLowerCase())) ||
        (m.department && m.department.toLowerCase().includes(memberSearch.toLowerCase()));
      const matchesDept = memberDeptFilter === "All" || m.department === memberDeptFilter || m.thanthura === memberDeptFilter;
      const matchesStatus = memberStatusFilter === "All" || m.status === memberStatusFilter;
      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [members, memberSearch, memberDeptFilter, memberStatusFilter]);

  const filteredLoans = useMemo(() => {
    return visibleLoans.filter((l) => {
      const matchesSearch =
        l.loanId.toLowerCase().includes(loanSearch.toLowerCase()) ||
        l.memberName.toLowerCase().includes(loanSearch.toLowerCase()) ||
        l.purpose.toLowerCase().includes(loanSearch.toLowerCase());
      const matchesStatus = loanStatusFilter === "All" || l.status === loanStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [visibleLoans, loanSearch, loanStatusFilter]);

  const filteredContributions = useMemo(() => {
    return visibleContributions.filter((c) => {
      return (
        c.receiptNo.toLowerCase().includes(contributionSearch.toLowerCase()) ||
        c.memberName.toLowerCase().includes(contributionSearch.toLowerCase()) ||
        c.memberId.toLowerCase().includes(contributionSearch.toLowerCase()) ||
        c.paymentMethod.toLowerCase().includes(contributionSearch.toLowerCase())
      );
    });
  }, [visibleContributions, contributionSearch]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchesType = financeTypeFilter === "all" || t.type === financeTypeFilter;
      const matchesCategory = financeCategoryFilter === "all" || t.category === financeCategoryFilter;
      const q = financeSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        t.voucherNo.toLowerCase().includes(q) ||
        t.title.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        (t.partyName && t.partyName.toLowerCase().includes(q)) ||
        (t.categoryName && t.categoryName.toLowerCase().includes(q)) ||
        (t.receiptOrVoucherRef && t.receiptOrVoucherRef.toLowerCase().includes(q));
      return matchesType && matchesCategory && matchesSearch;
    });
  }, [transactions, financeTypeFilter, financeCategoryFilter, financeSearch]);

  const departments = useMemo(() => {
    return ["All", ...Array.from(new Set(members.map((m) => m.department)))];
  }, [members]);

  const activeMemberProfile = useMemo(() => {
    if (!currentUser?.memberId) return null;
    return members.find((m) => m.memberId === currentUser.memberId) || null;
  }, [currentUser, members]);

  const curr = systemSettings.currencySymbol;

  // ── Loading Screen ────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="auth-page">
        <div style={{ textAlign: "center", color: "var(--text-muted)" }}>
          <div className="status-dot" style={{ margin: "0 auto 12px auto", width: "16px", height: "16px" }} />
          <p>{language === "si" ? "ආරක්ෂිත සැසිය සත්‍යාපනය වෙමින් පවතී..." : "Verifying secure session..."}</p>
        </div>
      </div>
    );
  }

  // ── Unauthenticated State: Show Login Screen ──────────────────────────────
  if (!currentUser) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          {/* Quick Language Toggle on Login */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "8px" }}>
            <button
              type="button"
              className="header-lang-btn"
              onClick={() => changeLanguage(language === "en" ? "si" : "en")}
              title={language === "en" ? "සිංහල භාෂාවට මාරු වන්න" : "Switch to English"}
            >
              <span>🌐</span>
              <span>{language === "en" ? "EN" : "සිං"}</span>
              <span className="active-chip">{language === "en" ? "English" : "සිංහල"}</span>
            </button>
          </div>

          <div className="auth-brand">
            <div className="auth-logo">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="auth-title">{systemSettings.organizationName}</h2>
            <p className="auth-subtitle">
              {language === "si"
                ? "ඔබගේ ගිණුමට ඇතුල් වන්න හෝ පහත නිරූපණ ගිණුමක් තෝරාගන්න"
                : "Sign in with your credentials or pick a demo role to explore"}
            </p>
          </div>

          {serverWakingUp && (
            <div className="alert-banner alert-info" style={{ marginBottom: "16px" }}>
              <span>⏳</span>
              <span>
                {language === "si"
                  ? "නොමිලේ වලාකුළු සේවාදායකය (Render Free Tier) සක්‍රිය වෙමින් පවතී... කරුණාකර තත්පර කිහිපයක් රැඳී සිටින්න."
                  : "Cloud server is waking up (Render free tier cold start)... Please allow up to 30 seconds."}
              </span>
            </div>
          )}

          {loginError && (
            <div className="alert-banner alert-error" style={{ marginBottom: "16px" }}>
              <span>⚠</span>
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={(e) => handleLogin(e)}>
            <div className="form-group" style={{ marginBottom: "14px" }}>
              <label className="form-label">{t(language, "emailLabel")}</label>
              <input
                type="email"
                className="form-input"
                placeholder="name@org.internal"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: "20px" }}>
              <label className="form-label">{language === "si" ? "මුරපදය" : "Password"}</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••••••"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: "100%", padding: "12px", fontSize: "0.95rem" }}
              disabled={loginSubmitting}
            >
              {loginSubmitting
                ? (language === "si" ? "සත්‍යාපනය වෙමින් පවතී..." : "Authenticating...")
                : (language === "si" ? "ඇතුල් වන්න (JWT)" : "Sign In with JWT")}
            </button>
          </form>

          {/* Quick Demo Switcher */}
          <div className="demo-box">
            <div className="demo-title">
              <span>⚡</span> {language === "si" ? "ක්ෂණික පිවිසුම (1-Click Login)" : "Quick Demo Access (1-Click Login)"}
            </div>
            <div className="demo-btn-grid">
              <button
                type="button"
                className="demo-account-btn"
                onClick={() => handleLogin(undefined, "marcus.thorne@org.internal", "MemberPassword123!")}
              >
                <strong>📝 {language === "si" ? "සාමාජික ලියාපදිංචි පෝරමය" : "New Member Registration Form"}</strong>
                <span>{language === "si" ? "ලියාපදිංචි පෝරමයට ක්ෂණික පිවිසුම" : "Instant Access to Registration View"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );

  }

  // ── Authenticated State: Main Dashboard ───────────────────────────────────
  const isAdmin = Boolean(currentUser && currentUser.role && currentUser.role.trim().toLowerCase() === "admin");

  return (
    <div className="app-container w-full px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="header">
        <div className="brand-group">
          <div className="brand-logo">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="brand-info">
            <h1>{systemSettings.organizationName.toUpperCase()}</h1>
            <p>
              {isAdmin
                ? (language === "si" ? "පරිපාලක පාලක පුවරුව" : "Administrator Control Console")
                : (language === "si" ? "නව සාමාජික ලියාපදිංචි කිරීමේ පෝරමය" : "New Member Registration Portal")}
            </p>
          </div>
        </div>

        <div className="header-right">
          {/* Cloud Health Indicator */}
          <div 
            className="server-status-pill"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 10px",
              borderRadius: "9999px",
              fontSize: "0.75rem",
              fontWeight: 500,
              background: serverOnline ? "rgba(16, 185, 129, 0.1)" : "rgba(245, 158, 11, 0.1)",
              border: serverOnline ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(245, 158, 11, 0.3)",
              color: serverOnline ? "#10b981" : "#f59e0b"
            }}
            title={serverOnline ? "Cloud backend connected" : "Connecting to backend..."}
          >
            <span style={{ 
              width: "7px", 
              height: "7px", 
              borderRadius: "50%", 
              background: serverOnline ? "#10b981" : "#f59e0b",
              boxShadow: serverOnline ? "0 0 6px #10b981" : "none"
            }} />
            <span>{serverOnline ? (language === "si" ? "වලාකුළු සක්‍රියයි" : "Cloud Online") : (language === "si" ? "සම්බන්ධ වෙමින්..." : "Connecting...")}</span>
          </div>

          {/* Quick Language Toggle */}
          <button
            type="button"
            className="header-lang-btn"
            onClick={() => changeLanguage(language === "en" ? "si" : "en")}
            title={language === "en" ? "සිංහල භාෂාවට මාරු වන්න" : "Switch to English"}
          >
            <span>🌐</span>
            <span>{language === "en" ? "EN" : "සිං"}</span>
            <span className="active-chip">{language === "en" ? "English" : "සිංහල"}</span>
          </button>

          {/* User Profile Pill */}
          <div className="user-profile-badge">
            <div className="user-avatar-sm">{currentUser.name.charAt(0)}</div>
            <div className="user-info-text">
              <div className="user-name-line">{currentUser.name}</div>
              <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                <span className={isAdmin ? "badge-role-admin" : "badge-role-member"}>
                  {isAdmin ? t(language, "adminBadge") : t(language, "memberBadge")}
                </span>
                {currentUser.memberId && (
                  <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                    {currentUser.memberId}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button className="btn btn-secondary btn-sm" onClick={handleLogout} title={t(language, "signOut")}>
            {t(language, "signOut")} ⎋
          </button>
        </div>
      </header>

      {/* Global Notification Banner */}
      {alertMessage && (
        <div className={`alert-banner alert-${alertMessage.type}`}>
          <span>{alertMessage.type === "success" ? "✓" : alertMessage.type === "error" ? "⚠" : "ℹ"}</span>
          <span>{alertMessage.text}</span>
        </div>
      )}

      {/* Navigation Tabs (Admin Only) */}
      {isAdmin && (
        <div className="nav-tabs-container">
          <nav className="nav-tabs">
            <button
              className={`nav-tab ${activeTab === "overview" ? "active" : ""}`}
              onClick={() => setActiveTab("overview")}
            >
              📊 {t(language, "navOverview")}
            </button>

            <button
              className={`nav-tab ${activeTab === "members" ? "active" : ""}`}
              onClick={() => setActiveTab("members")}
            >
              👥 {t(language, "navMembers")}
              <span className="nav-tab-badge">{members.length}</span>
            </button>

            <button
              className={`nav-tab ${activeTab === "loans" ? "active" : ""}`}
              onClick={() => setActiveTab("loans")}
            >
              💳 {t(language, "navLoans")}
              <span className="nav-tab-badge">{visibleLoans.length}</span>
            </button>

            <button
              className={`nav-tab ${activeTab === "contributions" ? "active" : ""}`}
              onClick={() => setActiveTab("contributions")}
            >
              📑 {t(language, "navContributions")}
              <span className="nav-tab-badge">{visibleContributions.length}</span>
            </button>

            <button
              className={`nav-tab ${activeTab === "finance" ? "active" : ""}`}
              onClick={() => setActiveTab("finance")}
            >
              💰 {t(language, "navFinance")}
              <span className="nav-tab-badge">{transactions.length}</span>
            </button>

            <button
              className={`nav-tab ${activeTab === "settings" ? "active" : ""}`}
              onClick={() => setActiveTab("settings")}
            >
              ⚙️ {t(language, "navSettings")}
            </button>
          </nav>

          <div className="toolbar-actions">
            {activeTab === "members" && (
              <button className="btn btn-primary" onClick={() => setShowAddMemberModal(true)}>
                {t(language, "registerMemberBtn")}
              </button>
            )}
            {activeTab === "loans" && (
              <button
                className="btn btn-primary"
                onClick={() => {
                  const defaultMemId = currentUser?.memberId || members[0]?.memberId || "";
                  setLoanForm((prev) => ({ ...prev, memberId: defaultMemId }));
                  setShowApplyLoanModal(true);
                }}
              >
                {t(language, "applyLoanBtn")}
              </button>
            )}
            {activeTab === "contributions" && (
              <button
                className="btn btn-primary"
                onClick={() => {
                  if (members.length > 0 && !contributionForm.memberId) {
                    setContributionForm((prev) => ({ ...prev, memberId: members[0].memberId }));
                  }
                  setShowRecordContributionModal(true);
                }}
              >
                {t(language, "recordContributionBtn")}
              </button>
            )}
            {activeTab === "finance" && (
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  className="btn"
                  style={{ background: "rgba(16, 185, 129, 0.18)", border: "1px solid rgba(16, 185, 129, 0.4)", color: "#34d399", fontWeight: 700 }}
                  onClick={() => setShowRecordIncomeModal(true)}
                >
                  {t(language, "recordIncomeBtn")}
                </button>
                <button
                  className="btn"
                  style={{ background: "rgba(239, 68, 68, 0.18)", border: "1px solid rgba(239, 68, 68, 0.4)", color: "#f87171", fontWeight: 700 }}
                  onClick={() => setShowRecordExpenseModal(true)}
                >
                  {t(language, "recordExpenseBtn")}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {!isAdmin ? (
        /* Standalone New Member Registration Form (Exclusively displayed for regular users) */
        <div style={{ width: "100%", maxWidth: "100%", marginTop: "1rem" }}>
          {newlyRegisteredMember && (
            <div
              style={{
                background: "linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.25))",
                border: "1px solid rgba(16, 185, 129, 0.4)",
                borderRadius: "16px",
                padding: "24px 28px",
                marginBottom: "24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "16px",
                boxShadow: "0 10px 30px rgba(16, 185, 129, 0.15)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div
                  style={{
                    width: "52px",
                    height: "52px",
                    borderRadius: "50%",
                    background: "#10b981",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.6rem",
                    color: "#fff",
                    fontWeight: "bold",
                    flexShrink: 0,
                  }}
                >
                  ✓
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700, color: "#ecfdf5" }}>
                    {language === "si" ? "සාමාජික ලියාපදිංචිය සාර්ථකයි!" : "Registration Successful!"}
                  </h3>
                  <p style={{ margin: "4px 0 0 0", color: "#a7f3d0", fontSize: "0.92rem" }}>
                    {language === "si"
                      ? `${newlyRegisteredMember.name} සාර්ථකව පද්ධතියට එක් කරන ලදී. නව සාමාජික හැඳුනුම් අංකය:`
                      : `${newlyRegisteredMember.name} has been enrolled into the welfare fund. New Member ID:`}
                    <strong style={{ marginLeft: "8px", fontFamily: "var(--font-mono)", fontSize: "1.05rem", color: "#fff", background: "rgba(0,0,0,0.25)", padding: "2px 8px", borderRadius: "6px" }}>
                      {newlyRegisteredMember.memberId}
                    </strong>
                  </p>
                </div>
              </div>
              <button
                className="btn btn-secondary"
                style={{ background: "rgba(255,255,255,0.1)", borderColor: "rgba(255,255,255,0.2)", color: "#fff" }}
                onClick={() => setNewlyRegisteredMember(null)}
              >
                ✕ {language === "si" ? "වසන්න" : "Dismiss"}
              </button>
            </div>
          )}

          <div className="glass-panel" style={{ width: "100%", margin: "0 auto", padding: "28px" }}>
            <div className="panel-header" style={{ borderBottom: "1px solid var(--border-subtle)", paddingBottom: "18px", marginBottom: "24px" }}>
              <div className="panel-title-group">
                <h2 style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "1.4rem" }}>
                  <span>👤</span>
                  {language === "si" ? "නව සුබසාධක සාමාජිකයෙකු ලියාපදිංචි කිරීමේ පෝරමය" : "New Member Registration Form"}
                </h2>
                <p style={{ marginTop: "6px", fontSize: "0.95rem" }}>
                  {language === "si"
                    ? "නව සාමාජික තොරතුරු සහ මාසික දායකත්ව විස්තර ඇතුළත් කර සුබසාධක පද්ධතියට ලියාපදිංචි වන්න."
                    : "Enter new member details and monthly contribution pledge to enroll in the staff welfare fund."}
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateMember}>
              {duplicateValidation.hasDuplicate && (
                <div
                  style={{
                    background: "rgba(239, 68, 68, 0.12)",
                    border: "1px solid rgba(239, 68, 68, 0.4)",
                    borderRadius: "12px",
                    padding: "14px 18px",
                    marginBottom: "20px",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "12px",
                    color: "#fca5a5",
                  }}
                >
                  <span style={{ fontSize: "1.3rem", lineHeight: 1 }}>⛔</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#f87171" }}>
                      {language === "si" ? "ලියාපදිංචිය අවහිර කර ඇත (ද්විත්ව තොරතුරු හමුවිය):" : "Registration Blocked (Duplicate Entry Detected):"}
                    </div>
                    <div style={{ fontSize: "0.88rem", marginTop: "4px", color: "#fecaca" }}>
                      {duplicateValidation.idError || duplicateValidation.sewaError || duplicateValidation.emailError}
                    </div>
                  </div>
                </div>
              )}
              {!duplicateValidation.hasDuplicate && memberFormError && (
                <div
                  style={{
                    background: "rgba(239, 68, 68, 0.12)",
                    border: "1px solid rgba(239, 68, 68, 0.4)",
                    borderRadius: "12px",
                    padding: "14px 18px",
                    marginBottom: "20px",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    color: "#fca5a5",
                  }}
                >
                  <span style={{ fontSize: "1.3rem", lineHeight: 1 }}>⚠️</span>
                  <div style={{ fontSize: "0.9rem", color: "#fecaca" }}>{memberFormError}</div>
                </div>
              )}

              <div className="form-grid">
                <div className="form-group full">
                  <label className="form-label">{language === "si" ? "සම්පූර්ණ නම *" : "Full Name *"}</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder={language === "si" ? "උදා: කේ. ඒ. නිමල් පෙරේරා" : "e.g. K. A. Nimal Perera"}
                    required
                    value={memberForm.name}
                    onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={duplicateValidation.idError ? { color: "#f87171" } : undefined}>
                    {language === "si" ? "හැඳුනුම්පත් අංකය (ID Number) *" : "ID Number (NIC) *"}
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder={language === "si" ? "උදා: 199012345678 / 901234567V" : "e.g. 199012345678 / 901234567V"}
                    required
                    value={memberForm.idNumber}
                    style={duplicateValidation.idError ? { borderColor: "#ef4444", boxShadow: "0 0 0 3px rgba(239, 68, 68, 0.25)", background: "rgba(239, 68, 68, 0.05)" } : undefined}
                    onChange={(e) => {
                      setMemberForm({ ...memberForm, idNumber: e.target.value });
                      if (memberFormError) setMemberFormError(null);
                    }}
                  />
                  {duplicateValidation.idError && (
                    <div style={{ color: "#ef4444", fontSize: "0.82rem", marginTop: "6px", display: "flex", alignItems: "center", gap: "6px", fontWeight: 500 }}>
                      <span>⚠️</span> {duplicateValidation.idError}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label" style={duplicateValidation.sewaError ? { color: "#f87171" } : undefined}>
                    {language === "si" ? "සේවා අංකය (Sewa Ankaya) *" : "Sewa Ankaya (Service ID) *"}
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder={language === "si" ? "උදා: SO-4089 / 12345" : "e.g. SO-4089 / 12345"}
                    required
                    value={memberForm.sewaAnkaya}
                    style={duplicateValidation.sewaError ? { borderColor: "#ef4444", boxShadow: "0 0 0 3px rgba(239, 68, 68, 0.25)", background: "rgba(239, 68, 68, 0.05)" } : undefined}
                    onChange={(e) => {
                      setMemberForm({ ...memberForm, sewaAnkaya: e.target.value });
                      if (memberFormError) setMemberFormError(null);
                    }}
                  />
                  {duplicateValidation.sewaError && (
                    <div style={{ color: "#ef4444", fontSize: "0.82rem", marginTop: "6px", display: "flex", alignItems: "center", gap: "6px", fontWeight: 500 }}>
                      <span>⚠️</span> {duplicateValidation.sewaError}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    {language === "si" ? "තනතුර - Thanthura (Designation/Post) *" : "Thanthura (Designation/Post) *"}
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder={language === "si" ? "උදා: සංවර්ධන නිලධාරී / පරිපාලන නිලධාරී" : "e.g. Development Officer / Administrative Officer"}
                    required
                    value={memberForm.thanthura}
                    onChange={(e) => setMemberForm({ ...memberForm, thanthura: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{language === "si" ? "දුරකථන අංකය *" : "Phone Number *"}</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="077 123 4567"
                    required
                    value={memberForm.phone}
                    onChange={(e) => setMemberForm({ ...memberForm, phone: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={duplicateValidation.emailError ? { color: "#f87171" } : undefined}>
                    {language === "si" ? "විද්‍යුත් තැපැල් ලිපිනය (විකල්පයි)" : "Email Address (Optional)"}
                  </label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="nimal.perera@org.internal"
                    value={memberForm.email}
                    style={duplicateValidation.emailError ? { borderColor: "#ef4444", boxShadow: "0 0 0 3px rgba(239, 68, 68, 0.25)", background: "rgba(239, 68, 68, 0.05)" } : undefined}
                    onChange={(e) => {
                      setMemberForm({ ...memberForm, email: e.target.value });
                      if (memberFormError) setMemberFormError(null);
                    }}
                  />
                  {duplicateValidation.emailError && (
                    <div style={{ color: "#ef4444", fontSize: "0.82rem", marginTop: "6px", display: "flex", alignItems: "center", gap: "6px", fontWeight: 500 }}>
                      <span>⚠️</span> {duplicateValidation.emailError}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">{language === "si" ? "සුබසාධක සංගමයේ තනතුර" : "Role in Welfare"}</label>
                  <select
                    className="form-select"
                    value={memberForm.role}
                    onChange={(e) => setMemberForm({ ...memberForm, role: e.target.value })}
                  >
                    <option value="Member">{language === "si" ? "සාමාන්‍ය සාමාජික" : "General Member"}</option>
                    <option value="Executive">{language === "si" ? "විධායක කමිටු සාමාජික" : "Executive Committee"}</option>
                    <option value="Treasurer">{language === "si" ? "භාණ්ඩාගාරික / විගණක" : "Treasurer / Auditor"}</option>
                    <option value="Chairperson">{language === "si" ? "සභාපති" : "Chairperson"}</option>
                  </select>
                </div>

                <div className="form-group full">
                  <label className="form-label">{language === "si" ? `මාසික දායකත්ව පොරොන්දුව (${curr}) *` : `Monthly Pledge (${curr}) *`}</label>
                  <input
                    type="number"
                    min="10"
                    step="10"
                    className="form-input"
                    required
                    value={memberForm.monthlyContribution}
                    onChange={(e) => setMemberForm({ ...memberForm, monthlyContribution: Number(e.target.value) })}
                  />
                </div>

                <div className="form-group full">
                  <label className="form-label">{language === "si" ? "සටහන් / අනුබද්ධතාවය" : "Notes / Affiliation"}</label>
                  <textarea
                    className="form-textarea"
                    placeholder={language === "si" ? "විශේෂ සටහන්, බඳවා ගැනීමේ තොරතුරු..." : "Special notes, enrollment context..."}
                    rows={3}
                    value={memberForm.notes}
                    onChange={(e) => setMemberForm({ ...memberForm, notes: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px", paddingTop: "16px", borderTop: "1px solid var(--border-subtle)" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={memberSubmitting}
                  onClick={() => {
                    setMemberFormError(null);
                    setMemberForm({
                      name: "",
                      email: "",
                      phone: "",
                      thanthura: "",
                      idNumber: "",
                      sewaAnkaya: "",
                      department: "",
                      role: "Member",
                      monthlyContribution: systemSettings.defaultContributionRate || 100,
                      notes: "",
                    });
                  }}
                >
                  {language === "si" ? "පිරිසිදු කරන්න" : "Clear Form"}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    minWidth: "200px",
                    ...(duplicateValidation.hasDuplicate ? { opacity: 0.65, cursor: "not-allowed", background: "var(--bg-card, #334155)" } : {})
                  }}
                  disabled={memberSubmitting || duplicateValidation.hasDuplicate}
                  title={duplicateValidation.hasDuplicate ? (language === "si" ? "ද්විත්ව තොරතුරු පවතින බැවින් ලියාපදිංචි කළ නොහැක" : "Resolve duplicate entries to enable registration") : undefined}
                >
                  {memberSubmitting ? (
                    <span>⏳ {language === "si" ? "ලියාපදිංචි වෙමින් පවතී..." : "Registering..."}</span>
                  ) : duplicateValidation.hasDuplicate ? (
                    <>
                      <span>⛔</span> {language === "si" ? "ද්විත්ව තොරතුරු (අවහිරයි)" : "Duplicates Detected"}
                    </>
                  ) : (
                    <>
                      <span>✓</span> {language === "si" ? "ලියාපදිංචි කරන්න" : "Submit Registration"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        /* Administrator Dashboard Tabs Console */
        <>
          {/* Top Metrics Grid */}
          {activeTab !== "settings" && (
            <div className="metrics-grid">
              {/* Metric Card 1: Total Fund Balance (Cash Pool) */}
              <div
                className="metric-card cursor-pointer"
                style={{ position: "relative", display: "flex", flexDirection: "column" }}
                onClick={() => setActiveTab(activeTab === "finance" ? "overview" : "finance")}
                title={language === "si" ? "මූල්‍ය විස්තර පටිත්ත වෙත යන්න (Click to switch)" : "View Financial Overview / Finance (Click to switch)"}
              >
                <div className="metric-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span className="metric-label">{t(language, "cashPool")}</span>
                  <div className="metric-icon icon-emerald">{curr}</div>
                </div>
                <div className="metric-value">
                  {curr}
                  {fund ? fund.currentCashPool.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "..."}
                </div>
                <div className="metric-subtext">{t(language, "cashPoolSubtitle")}</div>

                {/* Explicitly visible, enabled Admin Manage Button - Left Aligned */}
                {isAdmin && (
                  <div
                    className="flex flex-row items-center justify-start gap-3"
                    style={{
                      marginTop: "auto",
                      paddingTop: "14px",
                      borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                      width: "100%"
                    }}
                  >
                    <button
                      type="button"
                      id="btn-manage-cash-pool"
                      style={{
                        width: "auto",
                        padding: "8px 14px",
                        fontSize: "0.82rem",
                        fontWeight: 700,
                        borderRadius: "8px",
                        background: "linear-gradient(135deg, rgba(16, 185, 129, 0.22) 0%, rgba(5, 150, 105, 0.32) 100%)",
                        border: "1px solid rgba(16, 185, 129, 0.5)",
                        color: "#34d399",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "flex-start",
                        gap: "8px",
                        transition: "all 0.2s ease",
                        boxShadow: "0 2px 8px rgba(16, 185, 129, 0.15)",
                        position: "relative",
                        zIndex: 2
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "linear-gradient(135deg, rgba(16, 185, 129, 0.35) 0%, rgba(5, 150, 105, 0.45) 100%)";
                        e.currentTarget.style.borderColor = "#10b981";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "linear-gradient(135deg, rgba(16, 185, 129, 0.22) 0%, rgba(5, 150, 105, 0.32) 100%)";
                        e.currentTarget.style.borderColor = "rgba(16, 185, 129, 0.5)";
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        openBalanceModal("current");
                      }}
                      title={language === "si" ? "ගිණුම් ශේෂය කළමනාකරණය / යාවත්කාලීන කරන්න" : "Manage / update association account balance"}
                    >
                      <span style={{ fontSize: "1rem" }}>⚙️</span>
                      <span>{language === "si" ? "ගිණුම් ශේෂය කළමනාකරණය" : "Manage"}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Metric Card 2: Outstanding Loans */}
              <div
                className="metric-card cursor-pointer"
                style={{ position: "relative", display: "flex", flexDirection: "column" }}
                onClick={() => setActiveTab("loans")}
                title={language === "si" ? "ණය පටිත්ත වෙත යන්න (Click to view loans)" : "View Loans Tab (Click to switch)"}
              >
                <div className="metric-header">
                  <span className="metric-label">{t(language, "outstandingDebt")}</span>
                  <div className="metric-icon icon-amber">💳</div>
                </div>
                <div className="metric-value">
                  {curr}
                  {fund ? fund.totalOutstandingDebt.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "..."}
                </div>
                <div className="metric-subtext">{fund ? `${fund.activeLoansCount} ${language === "si" ? "සක්‍රීය ණය ශේෂයන්" : "active loans outstanding"}` : "..."}</div>

                {isAdmin && (
                  <div
                    className="flex flex-row items-center justify-start gap-3"
                    style={{
                      marginTop: "auto",
                      paddingTop: "14px",
                      borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                      width: "100%"
                    }}
                  >
                    <button
                      type="button"
                      style={{
                        width: "auto",
                        padding: "8px 14px",
                        fontSize: "0.82rem",
                        fontWeight: 700,
                        borderRadius: "8px",
                        background: "rgba(245, 158, 11, 0.18)",
                        border: "1px solid rgba(245, 158, 11, 0.45)",
                        color: "#fbbf24",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "flex-start",
                        gap: "8px",
                        transition: "all 0.2s ease",
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveTab("loans");
                      }}
                    >
                      <span>💳</span>
                      <span>{language === "si" ? "ණය කළමනාකරණය" : "Manage Loans"}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Metric Card 3: Contributions Collected */}
              <div
                className="metric-card cursor-pointer"
                style={{ position: "relative", display: "flex", flexDirection: "column" }}
                onClick={() => setActiveTab("contributions")}
                title={language === "si" ? "දායකත්ව පටිත්ත වෙත යන්න (Click to view contributions)" : "View Contributions Tab (Click to switch)"}
              >
                <div className="metric-header">
                  <span className="metric-label">{t(language, "contributionsCollected")}</span>
                  <div className="metric-icon icon-blue">📈</div>
                </div>
                <div className="metric-value">
                  {curr}
                  {fund ? fund.totalContributionsCollected.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "..."}
                </div>
                <div className="metric-subtext">{language === "si" ? "එකතු වූ මුළු තැන්පතු" : "Cumulative Member Deposits"}</div>

                {isAdmin && (
                  <div
                    className="flex flex-row items-center justify-start gap-3"
                    style={{
                      marginTop: "auto",
                      paddingTop: "14px",
                      borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                      width: "100%"
                    }}
                  >
                    <button
                      type="button"
                      style={{
                        width: "auto",
                        padding: "8px 14px",
                        fontSize: "0.82rem",
                        fontWeight: 700,
                        borderRadius: "8px",
                        background: "rgba(59, 130, 246, 0.18)",
                        border: "1px solid rgba(59, 130, 246, 0.45)",
                        color: "#60a5fa",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "flex-start",
                        gap: "8px",
                        transition: "all 0.2s ease",
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveTab("contributions");
                      }}
                    >
                      <span>📑</span>
                      <span>{language === "si" ? "දායකත්ව කළමනාකරණය" : "Manage Deposits"}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Metric Card 4: Registered Members */}
              <div
                className="metric-card cursor-pointer"
                style={{ position: "relative", display: "flex", flexDirection: "column" }}
                onClick={() => setActiveTab("members")}
                title={language === "si" ? "සාමාජිකයන් පටිත්ත වෙත යන්න (Click to view members)" : "View Members Tab (Click to switch)"}
              >
                <div className="metric-header">
                  <span className="metric-label">{t(language, "totalMembers")}</span>
                  <div className="metric-icon icon-purple">👥</div>
                </div>
                <div className="metric-value">{fund ? fund.totalMembers : "..."}</div>
                <div className="metric-subtext">
                  {fund ? `${fund.activeMembers} ${language === "si" ? "සක්‍රීය" : "active"} • ${fund.pendingLoansCount} ${language === "si" ? "පොරොත්තුවේ ඇති ණය" : "pending loans"}` : "..."}
                </div>

                {isAdmin && (
                  <div
                    className="flex flex-row items-center justify-start gap-3"
                    style={{
                      marginTop: "auto",
                      paddingTop: "14px",
                      borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                      width: "100%"
                    }}
                  >
                    <button
                      type="button"
                      style={{
                        width: "auto",
                        padding: "8px 14px",
                        fontSize: "0.82rem",
                        fontWeight: 700,
                        borderRadius: "8px",
                        background: "rgba(168, 85, 247, 0.18)",
                        border: "1px solid rgba(168, 85, 247, 0.45)",
                        color: "#c084fc",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "flex-start",
                        gap: "8px",
                        transition: "all 0.2s ease",
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveTab("members");
                      }}
                    >
                      <span>👥</span>
                      <span>{language === "si" ? "සාමාජිකයන් කළමනාකරණය" : "Manage Members"}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

      {/* ── TAB 1: OVERVIEW ───────────────────────────────────────────────── */}
      {activeTab === "overview" && (
        <div className="overview-grid">
              {/* Fund Accounting Breakdown - Interactive Dashboard Health Panel */}
              <div
                className="glass-panel cursor-pointer"
                onClick={() => setActiveTab("finance")}
                title={language === "si" ? "සම්පූර්ණ මූල්‍ය විගණන විස්තර බැලීමට ක්ලික් කරන්න" : "Click anywhere to view full Finance records"}
              >
                <div className="panel-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                  <div className="panel-title-group">
                    <h2>{language === "si" ? "මූල්‍ය සෞඛ්‍යය සහ මුදල් ප්‍රවාහ ගිණුම්කරණය" : "Fund Health & Cash Flow Accounting"}</h2>
                    <p>{language === "si" ? "තැන්පතු, ණය නිකුත් කිරීම් සහ ආපසු අයවීම් විගණනය" : "Audit of deposits, disbursements, and repayments"}</p>
                  </div>
                  {isAdmin && (
                    <div className="flex flex-row items-center justify-start gap-3">
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        style={{
                          background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
                          boxShadow: "0 4px 14px rgba(16, 185, 129, 0.25)",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px"
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          openBalanceModal("current");
                        }}
                        title={language === "si" ? "ගිණුම් ශේෂය කළමනාකරණය / යාවත්කාලීන කරන්න" : "Manage / update association account balance"}
                      >
                        <span>⚙️</span>
                        <span>{language === "si" ? "ගිණුම් ශේෂය කළමනාකරණය" : "Manage"}</span>
                      </button>
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div className="endpoint-row" style={{ padding: "16px" }}>
                    <div>
                      <strong style={{ color: "var(--text-primary)", display: "block" }}>
                        {language === "si" ? "ආරම්භක අරමුදල් සංචිතය" : "Initial Capital Reserve"}
                      </strong>
                      <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                        {language === "si" ? "සංවිධානයේ මූලික පදනම" : "Organizational baseline"}
                      </span>
                    </div>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "1.1rem", fontWeight: 700 }}>
                      {curr}{fund ? fund.initialReserve.toLocaleString() : "0"}
                    </span>
                  </div>

                  <div
                    className="endpoint-row cursor-pointer"
                    style={{ padding: "16px" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveTab("contributions");
                    }}
                    title={language === "si" ? "දායකත්ව පටිත්ත වෙත යන්න" : "Click to view Contributions"}
                  >
                    <div>
                      <strong style={{ color: "#34d399", display: "block" }}>
                        {language === "si" ? "+ එකතු වූ සාමාජික දායකත්ව" : "+ Member Contributions Collected"}
                      </strong>
                      <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                        {language === "si" ? "මාසික වැටුප් සහ සෘජු තැන්පතු" : "Monthly payroll & direct deposits"}
                      </span>
                    </div>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "1.1rem", fontWeight: 700, color: "#34d399" }}>
                      +{curr}{fund ? fund.totalContributionsCollected.toLocaleString() : "0"}
                    </span>
                  </div>

                  <div
                    className="endpoint-row cursor-pointer"
                    style={{ padding: "16px" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveTab("loans");
                    }}
                    title={language === "si" ? "ණය පටිත්ත වෙත යන්න" : "Click to view Loans"}
                  >
                    <div>
                      <strong style={{ color: "#60a5fa", display: "block" }}>
                        {language === "si" ? "+ ලැබුණු ණය ආපසු ගෙවීම්" : "+ Loan Repayments Received"}
                      </strong>
                      <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                        {language === "si" ? "මූලික මුදල සහ උපචිත පොලිය" : "Principal plus accrued interest"}
                      </span>
                    </div>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "1.1rem", fontWeight: 700, color: "#60a5fa" }}>
                      +{curr}{fund ? fund.totalRepaymentsReceived.toLocaleString() : "0"}
                    </span>
                  </div>

                  <div
                    className="endpoint-row cursor-pointer"
                    style={{ padding: "16px" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveTab("loans");
                    }}
                    title={language === "si" ? "ණය පටිත්ත වෙත යන්න" : "Click to view Loans"}
                  >
                    <div>
                      <strong style={{ color: "#fb7185", display: "block" }}>
                        {language === "si" ? "- සාමාජිකයන් වෙත නිකුත් කළ ණය" : "- Loans Disbursed to Members"}
                      </strong>
                      <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                        {language === "si" ? "නිකුත් කරන ලද සුබසාධක ණය ප්‍රාග්ධනය" : "Issued welfare loan capital"}
                      </span>
                    </div>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "1.1rem", fontWeight: 700, color: "#fb7185" }}>
                      -{curr}{fund ? fund.totalDisbursedLoans.toLocaleString() : "0"}
                    </span>
                  </div>

                  <div
                    className="endpoint-row cursor-pointer"
                    style={{ padding: "16px" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveTab("finance");
                    }}
                    title={language === "si" ? "මූල්‍ය පටිත්ත වෙත යන්න" : "Click to view Finance"}
                  >
                    <div>
                      <strong style={{ color: "#34d399", display: "block" }}>
                        {language === "si" ? `+ ${t(language, "totalOtherIncomeLine")}` : `+ ${t(language, "totalOtherIncomeLine")}`}
                      </strong>
                      <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                        {language === "si" ? "ශාලා කුලී, වෙළඳසැල් කුලී සහ පරිත්‍යාග" : "Hall & shop leases, bank interest, donations"}
                      </span>
                    </div>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "1.1rem", fontWeight: 700, color: "#34d399" }}>
                      +{curr}{fund && fund.totalOtherIncome !== undefined ? fund.totalOtherIncome.toLocaleString() : "0"}
                    </span>
                  </div>

                  <div
                    className="endpoint-row cursor-pointer"
                    style={{ padding: "16px" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveTab("finance");
                    }}
                    title={language === "si" ? "මූල්‍ය පටිත්ත වෙත යන්න" : "Click to view Finance"}
                  >
                    <div>
                      <strong style={{ color: "#f87171", display: "block" }}>
                        {language === "si" ? `- ${t(language, "totalExpenseLine")}` : `- ${t(language, "totalExpenseLine")}`}
                      </strong>
                      <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                        {language === "si" ? "මරණාධාර, ක්‍රීඩා, ආගමික උත්සව සහ නඩත්තු" : "Funeral grants, sports, festivals & repairs"}
                      </span>
                    </div>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "1.1rem", fontWeight: 700, color: "#f87171" }}>
                      -{curr}{fund && fund.totalExpenses !== undefined ? fund.totalExpenses.toLocaleString() : "0"}
                    </span>
                  </div>

                  {/* Summary Card: Net Cash Balance */}
                  <div
                    className="cursor-pointer"
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "18px",
                      background: "rgba(99, 102, 241, 0.12)",
                      border: "1px solid rgba(99, 102, 241, 0.3)",
                      borderRadius: "var(--radius-md)",
                      marginTop: "8px",
                      flexWrap: "wrap",
                      gap: "12px"
                    }}
                    onClick={() => setActiveTab("finance")}
                    title={language === "si" ? "සම්පූර්ණ මූල්‍ය විගණන ලේඛන බැලීමට ක්ලික් කරන්න" : "Click to view full Finance ledger"}
                  >
                    <div>
                      <strong style={{ fontSize: "1.05rem", color: "#a5b4fc" }}>
                        {language === "si" ? "වත්මන් ශුද්ධ මුදල් ශේෂය" : "Current Net Cash Balance"}
                      </strong>
                      <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: "4px 0 0 0" }}>
                        {language === "si" ? "ණය නිකුත් කිරීම සඳහා පවතින ද්‍රවශීල ප්‍රාග්ධනය" : "Liquid capital available for loan disbursement"}
                      </p>
                      {isAdmin && (
                        <div className="flex flex-row items-center justify-start gap-3" style={{ marginTop: "10px" }}>
                          <button
                            type="button"
                            style={{
                              padding: "6px 14px",
                              fontSize: "0.8rem",
                              borderRadius: "7px",
                              background: "rgba(16, 185, 129, 0.18)",
                              border: "1px solid rgba(16, 185, 129, 0.45)",
                              color: "#34d399",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "flex-start",
                              gap: "6px",
                              fontWeight: 700,
                              transition: "all 0.2s ease"
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              openBalanceModal("current");
                            }}
                            title={language === "si" ? "ගිණුම් ශේෂය කළමනාකරණය / යාවත්කාලීන කරන්න" : "Manage / update association account balance"}
                          >
                            <span>⚙️</span>
                            <span>{language === "si" ? "ගිණුම් ශේෂය කළමනාකරණය" : "Manage"}</span>
                          </button>
                        </div>
                      )}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "1.5rem", fontWeight: 800, color: "#ffffff" }}>
                        {curr}{fund ? fund.currentCashPool.toLocaleString("en-US", { minimumFractionDigits: 2 }) : "0.00"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pending Loan Approvals - Interactive Dashboard Health Panel */}
              <div
                className="glass-panel cursor-pointer"
                onClick={() => setActiveTab("loans")}
                title={language === "si" ? "ණය කළමනාකරණය පටිත්ත වෙත යන්න" : "Click to navigate to Loans tab"}
              >
                <div className="panel-header">
                  <div className="panel-title-group">
                    <h2>{language === "si" ? "පොරොත්තුවේ ඇති ණය සමාලෝචන" : "Pending Loan Reviews"}</h2>
                    <p>{language === "si" ? "පරිපාලක අනුමැතිය අපේක්ෂාවෙන් පවතින අයදුම්පත්" : "Applications awaiting administrator approval"}</p>
                  </div>
                </div>

                {loans.filter((l) => l.status === "Pending").length === 0 ? (
                  <div className="empty-state">
                    <p>{language === "si" ? "✓ සියලුම ණය අයදුම්පත් සමාලෝචනය කර අවසන්!" : "✓ All loan applications have been processed!"}</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {loans
                      .filter((l) => l.status === "Pending")
                      .map((loan) => (
                        <div key={loan.id} className="item-card" style={{ flexDirection: "column", gap: "10px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                            <div>
                              <strong style={{ color: "var(--text-primary)" }}>{loan.memberName}</strong>
                              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                                {loan.loanId} • {language === "si" ? "අයදුම් කළ දිනය:" : "Applied"} {loan.applicationDate}
                              </div>
                            </div>
                            <span className="badge badge-pending">{t(language, "statusPending")}</span>
                          </div>

                          <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                            {language === "si" ? "අරමුණ:" : "Purpose:"} <em>{loan.purpose}</em>
                          </div>

                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              width: "100%",
                              marginTop: "6px",
                              flexWrap: "wrap",
                              gap: "10px"
                            }}
                          >
                            <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--text-primary)" }}>
                              {curr}{loan.principalAmount.toLocaleString()} ({loan.termMonths} {language === "si" ? "මාස" : "mo"} @ {loan.interestRate}%)
                            </span>

                            <div className="flex flex-row items-center justify-start gap-3">
                              <button
                                className="btn btn-success btn-sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUpdateLoanStatus(loan.id, "Active");
                                }}
                              >
                                {language === "si" ? "අනුමත කර නිකුත් කරන්න" : "Approve & Disburse"}
                              </button>
                              <button
                                className="btn btn-danger-ghost btn-sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUpdateLoanStatus(loan.id, "Rejected");
                                }}
                              >
                                {language === "si" ? "ප්‍රතික්ෂේප කරන්න" : "Reject"}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
            </div>
          </div>
      )}

      {/* ── TAB 2: MEMBERS DIRECTORY ────────────────────────────────────────── */}
      {activeTab === "members" && (
        <div className="glass-panel">
            <div className="panel-header">
              <div className="panel-title-group">
                <h2>{t(language, "membersTitle")}</h2>
                <p>{t(language, "membersSubtitle")}</p>
              </div>
              <button className="btn btn-primary" onClick={() => setShowAddMemberModal(true)}>
                {t(language, "registerMemberBtn")}
              </button>
            </div>

            {/* Search & Filter Bar */}
            <div className="filter-bar">
              <div className="search-box">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  className="search-input"
                  placeholder={t(language, "searchMembersPlaceholder")}
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                />
              </div>

              <select
                className="filter-select"
                value={memberDeptFilter}
                onChange={(e) => setMemberDeptFilter(e.target.value)}
              >
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d === "All"
                      ? (language === "si" ? "දෙපාර්තමේන්තුව: සියල්ල" : "Department: All")
                      : (language === "si" ? `දෙපාර්තමේන්තුව: ${d}` : `Department: ${d}`)}
                  </option>
                ))}
              </select>

              <select
                className="filter-select"
                value={memberStatusFilter}
                onChange={(e) => setMemberStatusFilter(e.target.value)}
              >
                <option value="All">{language === "si" ? "තත්ත්වය: සියල්ල" : "Status: All"}</option>
                <option value="Active">{language === "si" ? "තත්ත්වය: සක්‍රීය" : "Status: Active"}</option>
                <option value="Inactive">{language === "si" ? "තත්ත්වය: අක්‍රීය" : "Status: Inactive"}</option>
                <option value="Suspended">{language === "si" ? "තත්ත්වය: අත්හිටුවූ" : "Status: Suspended"}</option>
              </select>
            </div>

            {/* Members Table */}
            <div className="table-swipe-hint">
              <span>👉</span> {language === "si" ? "වගුව සම්පූර්ණයෙන් බැලීමට තිරස් අතට අනුචලනය කරන්න (Swipe)" : "Swipe horizontally to view full table details"}
            </div>
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t(language, "colMemberId")}</th>
                    <th>{language === "si" ? "නම සහ තොරතුරු" : "Name & Contact"}</th>
                    <th>{language === "si" ? "තනතුර සහ වගකීම" : "Designation & Role"}</th>
                    <th>{t(language, "colMonthlyPledge")}</th>
                    <th>{t(language, "colTotalContributed")}</th>
                    <th>{t(language, "colStatus")}</th>
                    <th style={{ textAlign: "right" }}>{t(language, "colActions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="empty-state">
                        {language === "si" ? "ගැළපෙන සාමාජික වාර්තා හමු නොවීය." : "No members match your current filters."}
                      </td>
                    </tr>
                  ) : (
                    filteredMembers.map((m) => (
                      <tr key={m.id}>
                        <td style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "#a5b4fc" }}>
                          {m.memberId}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{m.name}</div>
                          <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                            {[m.email, m.phone].filter(Boolean).join(" • ")}
                          </div>
                          {(m.idNumber || m.sewaAnkaya) && (
                            <div style={{ fontSize: "0.74rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                              {[m.idNumber && `NIC: ${m.idNumber}`, m.sewaAnkaya && `Sewa: ${m.sewaAnkaya}`].filter(Boolean).join(" • ")}
                            </div>
                          )}
                        </td>
                        <td>
                          <div style={{ color: "var(--text-secondary)", fontWeight: 500 }}>{m.thanthura || m.department}</div>
                          <div style={{ fontSize: "0.78rem", color: "var(--accent-cyan)" }}>{m.role}</div>
                        </td>
                        <td style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                          {curr}{m.monthlyContribution}{language === "si" ? "/මසකට" : "/mo"}
                        </td>
                        <td style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "#34d399" }}>
                          {curr}{m.totalContributed.toLocaleString()}
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              m.status === "Active"
                                ? "badge-active"
                                : m.status === "Pending"
                                ? "badge-pending"
                                : m.status === "Suspended"
                                ? "badge-rejected"
                                : "badge-neutral"
                            }`}
                          >
                            {m.status === "Active"
                              ? t(language, "statusActive")
                              : m.status === "Pending"
                              ? t(language, "statusPending")
                              : m.status === "Suspended"
                              ? t(language, "statusSuspended")
                              : t(language, "statusInactive")}
                          </span>
                        </td>
                        <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                          <button
                            className="btn btn-action-ghost"
                            onClick={() => openMemberProfile(m)}
                            title="View Profile & Financials"
                          >
                            {language === "si" ? "තොරතුරු" : "Profile"}
                          </button>
                          <button
                            className="btn btn-action-ghost"
                            onClick={() => openEditMemberModal(m)}
                            title="Edit Details"
                          >
                            {language === "si" ? "සංස්කරණය" : "Edit"}
                          </button>
                          <button
                            className="btn btn-danger-ghost"
                            onClick={() => handleDeleteMember(m.id, m.name)}
                            title="Remove Member"
                          >
                            {language === "si" ? "ඉවත් කරන්න" : "Delete"}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
      )}

      {/* ── TAB 3: LOANS TRACKER ───────────────────────────────────────────── */}
      {activeTab === "loans" && (
        <div className="glass-panel">
          <div className="panel-header">
            <div className="panel-title-group">
              <h2>{isAdmin ? (language === "si" ? "සියලුම සුබසාධක ණය සහ නිකුත් කිරීම්" : "All Welfare Loans & Disbursements") : (language === "si" ? "මගේ සුබසාධක ණය කළඹ" : "My Welfare Loan Portfolio")}</h2>
              <p>{isAdmin ? (language === "si" ? "සියලුම කාර්ය මණ්ඩල ණය අනුමත කිරීම, අධීක්ෂණය සහ ආපසු ගෙවීම් සටහන් කිරීම" : "Approve, track, and record repayments for all staff loans") : (language === "si" ? "ඔබගේ සක්‍රීය සහ ඓතිහාසික සුබසාධක ණය" : "Your active and historical welfare loans")}</p>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => {
                const defaultMemId = currentUser?.memberId || members[0]?.memberId || "";
                setLoanForm((prev) => ({ ...prev, memberId: defaultMemId }));
                setShowApplyLoanModal(true);
              }}
            >
              {t(language, "applyLoanBtn")}
            </button>
          </div>

          <div className="filter-bar">
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                className="search-input"
                placeholder={t(language, "searchLoansPlaceholder")}
                value={loanSearch}
                onChange={(e) => setLoanSearch(e.target.value)}
              />
            </div>

            <select
              className="filter-select"
              value={loanStatusFilter}
              onChange={(e) => setLoanStatusFilter(e.target.value)}
            >
              <option value="All">{language === "si" ? "සියලුම තත්ත්වයන්" : "All Statuses"}</option>
              <option value="Pending">{language === "si" ? "පොරොත්තුවේ පවතින" : "Pending Review"}</option>
              <option value="Active">{language === "si" ? "සක්‍රීය සහ නිකුත් කළ" : "Active & Disbursed"}</option>
              <option value="Fully Repaid">{language === "si" ? "සම්පූර්ණයෙන් ගෙවා නිම කළ" : "Fully Repaid"}</option>
              <option value="Rejected">{language === "si" ? "ප්‍රතික්ෂේපිත" : "Rejected"}</option>
            </select>
          </div>

          <div className="table-swipe-hint">
            <span>👉</span> {language === "si" ? "වගුව සම්පූර්ණයෙන් බැලීමට තිරස් අතට අනුචලනය කරන්න (Swipe)" : "Swipe horizontally to view full table details"}
          </div>
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t(language, "colLoanId")}</th>
                  <th>{t(language, "colBorrower")}</th>
                  <th>{language === "si" ? "මූලික මුදල සහ කොන්දේසි" : "Principal & Terms"}</th>
                  <th>{language === "si" ? "ආපසු ගෙවීමේ ප්‍රගතිය" : "Repayment Progress"}</th>
                  <th>{t(language, "colRemainingBalance")}</th>
                  <th>{t(language, "colStatus")}</th>
                  <th style={{ textAlign: "right" }}>{t(language, "colActions")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredLoans.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="empty-state">
                      {language === "si" ? "ගැළපෙන ණය වාර්තා හමු නොවීය." : "No loans match your search or filter."}
                    </td>
                  </tr>
                ) : (
                  filteredLoans.map((l) => {
                    const percentRepaid = l.totalRepayable > 0 ? Math.min(100, Math.round((l.amountRepaid / l.totalRepayable) * 100)) : 0;
                    return (
                      <tr key={l.id}>
                        <td>
                          <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "#a5b4fc" }}>
                            {l.loanId}
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                            {language === "si" ? "අයදුම් කළ දිනය:" : "App:"} {l.applicationDate}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{l.memberName}</div>
                          <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                            {language === "si" ? "අංකය:" : "ID:"} {l.memberId}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                            {curr}{l.principalAmount.toLocaleString()}
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                            {l.termMonths} {language === "si" ? "මාස @ " : "mo @ "}{l.interestRate}% {language === "si" ? "සරල පොලිය" : "simple int."}
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "var(--accent-cyan)", fontFamily: "var(--font-mono)" }}>
                            {curr}{l.monthlyPayment}{language === "si" ? "/මසකට EMI" : "/mo EMI"}
                          </div>
                        </td>
                        <td>
                          <div className="progress-container">
                            <div className="progress-track">
                              <div
                                className={`progress-fill ${percentRepaid === 100 ? "complete" : ""}`}
                                style={{ width: `${percentRepaid}%` }}
                              />
                            </div>
                            <div className="progress-labels">
                              <span>{curr}{l.amountRepaid.toFixed(2)}</span>
                              <span>{percentRepaid}%</span>
                            </div>
                          </div>
                        </td>
                        <td style={{ fontFamily: "var(--font-mono)", fontWeight: 800, color: l.remainingBalance === 0 ? "#34d399" : "#fbbf24" }}>
                          {curr}{l.remainingBalance.toFixed(2)}
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              l.status === "Active"
                                ? "badge-active"
                                : l.status === "Pending"
                                ? "badge-pending"
                                : l.status === "Fully Repaid"
                                ? "badge-repaid"
                                : "badge-rejected"
                            }`}
                          >
                            {l.status === "Active"
                              ? t(language, "statusActive")
                              : l.status === "Pending"
                              ? t(language, "statusPending")
                              : l.status === "Fully Repaid"
                              ? t(language, "statusFullyRepaid")
                              : t(language, "statusRejected")}
                          </span>
                        </td>
                        <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                          {isAdmin && l.status === "Pending" && (
                            <>
                              <button
                                className="btn btn-success btn-sm"
                                onClick={() => handleUpdateLoanStatus(l.id, "Active")}
                                title="Approve & Disburse"
                              >
                                {language === "si" ? "අනුමත කරන්න" : "Approve"}
                              </button>
                              <button
                                className="btn btn-danger-ghost btn-sm"
                                onClick={() => handleUpdateLoanStatus(l.id, "Rejected")}
                                title="Reject Application"
                              >
                                {language === "si" ? "ප්‍රතික්ෂේප කරන්න" : "Reject"}
                              </button>
                            </>
                          )}

                          {l.status === "Active" && (
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => {
                                setSelectedLoan(l);
                                setRepaymentForm({
                                  amount: l.monthlyPayment,
                                  paymentMethod: "Bank Transfer",
                                  notes: `EMI installment for ${l.loanId}`,
                                });
                                setShowPayLoanModal(true);
                              }}
                              title="Record Payment"
                            >
                              {language === "si" ? "+ වාරිකය ගෙවන්න" : "+ Payment"}
                            </button>
                          )}

                          {l.status === "Fully Repaid" && (
                            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                              {language === "si" ? "ගෙවා නිමයි" : "Cleared"}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 4: CONTRIBUTIONS LEDGER ────────────────────────────────────── */}
      {activeTab === "contributions" && (
        <div className="glass-panel">
          <div className="panel-header">
            <div className="panel-title-group">
              <h2>{isAdmin ? (language === "si" ? "මාසික දායකත්ව ලෙජරය" : "Monthly Contributions Ledger") : (language === "si" ? "මගේ දායකත්ව රිසිට්පත්" : "My Contribution Receipts")}</h2>
              <p>{isAdmin ? (language === "si" ? "සියලුම කාර්ය මණ්ඩල සාමාජික තැන්පතු වාර්තා" : "Historical audit trail of all staff welfare member deposits") : (language === "si" ? "ඔබගේ සුබසාධක අරමුදල් තැන්පතු පිළිබඳ නිල රිසිට්පත්" : "Official receipts of your welfare fund deposits")}</p>
            </div>
            {isAdmin && (
              <button
                className="btn btn-primary"
                onClick={() => {
                  if (members.length > 0 && !contributionForm.memberId) {
                    setContributionForm((prev) => ({ ...prev, memberId: members[0].memberId }));
                  }
                  setShowRecordContributionModal(true);
                }}
              >
                {t(language, "recordContributionBtn")}
              </button>
            )}
          </div>

          <div className="filter-bar">
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                className="search-input"
                placeholder={t(language, "searchContributionsPlaceholder")}
                value={contributionSearch}
                onChange={(e) => setContributionSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="table-swipe-hint">
            <span>👉</span> {language === "si" ? "වගුව සම්පූර්ණයෙන් බැලීමට තිරස් අතට අනුචලනය කරන්න (Swipe)" : "Swipe horizontally to view full table details"}
          </div>
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t(language, "colReceiptNo")}</th>
                  <th>{t(language, "colContributor")}</th>
                  <th>{t(language, "colAmount")}</th>
                  <th>{t(language, "colMonthCovered")}</th>
                  <th>{t(language, "colPaymentMethod")}</th>
                  <th>{t(language, "colPaymentDate")}</th>
                  <th>{language === "si" ? "සටහන්" : "Notes"}</th>
                </tr>
              </thead>
              <tbody>
                {filteredContributions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="empty-state">
                      {language === "si" ? "දායකත්ව වාර්තා කිසිවක් හමු නොවීය." : "No contribution records found."}
                    </td>
                  </tr>
                ) : (
                  filteredContributions.map((c) => (
                    <tr key={c.id}>
                      <td style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "#a5b4fc" }}>
                        {c.receiptNo}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{c.memberName}</div>
                        <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{c.memberId}</div>
                      </td>
                      <td style={{ fontFamily: "var(--font-mono)", fontWeight: 800, color: "#34d399", fontSize: "0.95rem" }}>
                        +{curr}{c.amount.toFixed(2)}
                      </td>
                      <td>
                        <span className="badge badge-neutral">{c.monthCovered}</span>
                      </td>
                      <td style={{ color: "var(--text-secondary)" }}>{c.paymentMethod}</td>
                      <td style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>{c.paymentDate}</td>
                      <td style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>{c.notes || "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 5: FINANCE (INCOME & EXPENSES) ──────────────────────────────── */}
      {activeTab === "finance" && (
        <div>
          {/* Top Finance Metric Highlights */}
          <div className="metrics-grid" style={{ marginBottom: "24px" }}>
            <div className="metric-card">
              <div className="metric-header">
                <span className="metric-label">{t(language, "totalIncomeCard")}</span>
                <div className="metric-icon icon-emerald">📈</div>
              </div>
              <div className="metric-value" style={{ color: "#34d399" }}>
                +{curr}{financeSummary ? financeSummary.totalIncome.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
              </div>
              <div className="metric-subtext">
                {transactions.filter((t) => t.type === "income").length} {language === "si" ? "ආදායම් ලේඛන සටහන්" : "recorded income entries"}
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-header">
                <span className="metric-label">{t(language, "totalExpenseCard")}</span>
                <div className="metric-icon icon-amber">📉</div>
              </div>
              <div className="metric-value" style={{ color: "#f87171" }}>
                -{curr}{financeSummary ? financeSummary.totalExpenses.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
              </div>
              <div className="metric-subtext">
                {transactions.filter((t) => t.type === "expense").length} {language === "si" ? "සුබසාධක වියදම් වවුචර්" : "expense disbursement vouchers"}
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-header">
                <span className="metric-label">{t(language, "netCashFlowCard")}</span>
                <div className="metric-icon icon-blue">⚖️</div>
              </div>
              <div
                className="metric-value"
                style={{
                  color: financeSummary && financeSummary.netBalance >= 0 ? "#34d399" : "#f87171",
                }}
              >
                {financeSummary && financeSummary.netBalance >= 0 ? "+" : ""}
                {curr}{financeSummary ? financeSummary.netBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
              </div>
              <div className="metric-subtext">{t(language, "netCashFlowSubtitle")}</div>
            </div>

            <div className="metric-card">
              <div className="metric-header">
                <span className="metric-label">{language === "si" ? "මුළු ගනුදෙනු ලේඛන" : "Audit Records"}</span>
                <div className="metric-icon icon-purple">📑</div>
              </div>
              <div className="metric-value">{transactions.length}</div>
              <div className="metric-subtext">
                {language === "si" ? "විගණනය කළ සියලුම වවුචර්" : "All verified financial entries"}
              </div>
            </div>
          </div>

          {/* Category Distribution Breakdown */}
          <div className="finance-breakdown-grid">
            {/* Income Streams */}
            <div className="finance-category-card">
              <div className="finance-category-header">
                <h3>
                  <span>💰</span> {t(language, "incomeCategoriesTitle")}
                </h3>
                <span className="badge-income">
                  +{curr}{financeSummary ? financeSummary.totalIncome.toLocaleString() : "0"}
                </span>
              </div>
              <div className="finance-category-list">
                {[
                  { key: "hall_rent", label: t(language, "catHallRent") },
                  { key: "shop_rent", label: t(language, "catShopRent") },
                  { key: "donations", label: t(language, "catDonations") },
                  { key: "fund_interest", label: t(language, "catFundInterest") },
                  { key: "other_income", label: t(language, "catOtherIncome") },
                ].map((cat) => {
                  const item = financeSummary?.incomeByCategory?.find((c) => c.category === cat.key);
                  const total = item ? item.total : 0;
                  const count = item ? item.count : 0;
                  return (
                    <div key={cat.key} className="finance-category-item">
                      <div className="finance-category-name">
                        <span>•</span>
                        <div>
                          <strong>{cat.label}</strong>
                          <span className="finance-category-count">{count} {language === "si" ? "සටහන්" : "records"}</span>
                        </div>
                      </div>
                      <div className="finance-category-val finance-amount-income">
                        +{curr}{total.toLocaleString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Expense Streams */}
            <div className="finance-category-card">
              <div className="finance-category-header">
                <h3>
                  <span>📤</span> {t(language, "expenseCategoriesTitle")}
                </h3>
                <span className="badge-expense">
                  -{curr}{financeSummary ? financeSummary.totalExpenses.toLocaleString() : "0"}
                </span>
              </div>
              <div className="finance-category-list">
                {[
                  { key: "funeral_aid", label: t(language, "catFuneralAid") },
                  { key: "sports", label: t(language, "catSports") },
                  { key: "religious_festivals", label: t(language, "catReligiousFestivals") },
                  { key: "welfare_events", label: t(language, "catWelfareEvents") },
                  { key: "medical_aid", label: t(language, "catMedicalAid") },
                  { key: "maintenance", label: t(language, "catMaintenance") },
                  { key: "admin_expenses", label: t(language, "catAdminExpenses") },
                  { key: "other_expense", label: t(language, "catOtherExpense") },
                ].map((cat) => {
                  const item = financeSummary?.expenseByCategory?.find((c) => c.category === cat.key);
                  const total = item ? item.total : 0;
                  const count = item ? item.count : 0;
                  return (
                    <div key={cat.key} className="finance-category-item">
                      <div className="finance-category-name">
                        <span>•</span>
                        <div>
                          <strong>{cat.label}</strong>
                          <span className="finance-category-count">{count} {language === "si" ? "සටහන්" : "records"}</span>
                        </div>
                      </div>
                      <div className="finance-category-val finance-amount-expense">
                        -{curr}{total.toLocaleString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Transactions Ledger Panel */}
          <div className="glass-panel">
            <div className="panel-header">
              <div className="panel-title-group">
                <h2>{t(language, "financeTitle")}</h2>
                <p>{t(language, "financeSubtitle")}</p>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  className="btn"
                  style={{ background: "rgba(16, 185, 129, 0.2)", border: "1px solid rgba(16, 185, 129, 0.4)", color: "#34d399", fontWeight: 700 }}
                  onClick={() => setShowRecordIncomeModal(true)}
                >
                  {t(language, "recordIncomeBtn")}
                </button>
                <button
                  className="btn"
                  style={{ background: "rgba(239, 68, 68, 0.2)", border: "1px solid rgba(239, 68, 68, 0.4)", color: "#f87171", fontWeight: 700 }}
                  onClick={() => setShowRecordExpenseModal(true)}
                >
                  {t(language, "recordExpenseBtn")}
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="filter-bar">
              <div className="search-box">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  className="search-input"
                  placeholder={t(language, "searchFinancePlaceholder")}
                  value={financeSearch}
                  onChange={(e) => setFinanceSearch(e.target.value)}
                />
              </div>

              {/* Type Filter */}
              <select
                className="filter-select"
                value={financeTypeFilter}
                onChange={(e) => setFinanceTypeFilter(e.target.value as "all" | "income" | "expense")}
              >
                <option value="all">{t(language, "filterAllTransactions")}</option>
                <option value="income">{t(language, "filterOnlyIncomes")}</option>
                <option value="expense">{t(language, "filterOnlyExpenses")}</option>
              </select>

              {/* Category Filter */}
              <select
                className="filter-select"
                value={financeCategoryFilter}
                onChange={(e) => setFinanceCategoryFilter(e.target.value)}
              >
                <option value="all">{t(language, "filterAllCategories")}</option>
                <optgroup label={t(language, "incomeCategoriesTitle")}>
                  <option value="hall_rent">{t(language, "catHallRent")}</option>
                  <option value="shop_rent">{t(language, "catShopRent")}</option>
                  <option value="donations">{t(language, "catDonations")}</option>
                  <option value="fund_interest">{t(language, "catFundInterest")}</option>
                  <option value="other_income">{t(language, "catOtherIncome")}</option>
                </optgroup>
                <optgroup label={t(language, "expenseCategoriesTitle")}>
                  <option value="funeral_aid">{t(language, "catFuneralAid")}</option>
                  <option value="sports">{t(language, "catSports")}</option>
                  <option value="religious_festivals">{t(language, "catReligiousFestivals")}</option>
                  <option value="welfare_events">{t(language, "catWelfareEvents")}</option>
                  <option value="medical_aid">{t(language, "catMedicalAid")}</option>
                  <option value="maintenance">{t(language, "catMaintenance")}</option>
                  <option value="admin_expenses">{t(language, "catAdminExpenses")}</option>
                  <option value="other_expense">{t(language, "catOtherExpense")}</option>
                </optgroup>
              </select>
            </div>

            {/* Transactions Table */}
            <div className="table-swipe-hint">
              <span>👉</span> {language === "si" ? "වගුව සම්පූර්ණයෙන් බැලීමට තිරස් අතට අනුචලනය කරන්න (Swipe)" : "Swipe horizontally to view full table details"}
            </div>
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t(language, "colVoucherNo")}</th>
                    <th>{t(language, "colType")}</th>
                    <th>{t(language, "colCategory")}</th>
                    <th>{t(language, "colDescription")}</th>
                    <th>{t(language, "colParty")}</th>
                    <th>{t(language, "colMethod")} & {t(language, "colDate")}</th>
                    <th style={{ textAlign: "right" }}>{t(language, "colAmount")}</th>
                    {isAdmin && <th style={{ textAlign: "right" }}>{t(language, "colActions")}</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={isAdmin ? 8 : 7} className="empty-state">
                        {language === "si"
                          ? "ගැළපෙන ආදායම් හෝ වියදම් වාර්තා කිසිවක් හමු නොවීය."
                          : "No financial transactions found matching criteria."}
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((tx) => {
                      const isInc = tx.type === "income";
                      return (
                        <tr key={tx.id}>
                          <td>
                            <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "#a5b4fc" }}>
                              {tx.voucherNo}
                            </div>
                            {tx.receiptOrVoucherRef && tx.receiptOrVoucherRef !== tx.voucherNo && (
                              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                                Ref: {tx.receiptOrVoucherRef}
                              </div>
                            )}
                          </td>
                          <td>
                            <span className={isInc ? "badge-income" : "badge-expense"}>
                              {isInc ? `▲ ${t(language, "typeIncome")}` : `▼ ${t(language, "typeExpense")}`}
                            </span>
                          </td>
                          <td>
                            <span className="cat-pill">
                              {tx.categoryName || tx.category}
                            </span>
                          </td>
                          <td>
                            <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                              {tx.title}
                            </div>
                            {tx.description && (
                              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "2px" }}>
                                {tx.description}
                              </div>
                            )}
                          </td>
                          <td>
                            <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                              {tx.partyName || "—"}
                            </div>
                          </td>
                          <td>
                            <div style={{ fontSize: "0.82rem", color: "var(--text-primary)" }}>
                              {tx.paymentMethod}
                            </div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                              {tx.date}
                            </div>
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <div
                              style={{
                                fontFamily: "var(--font-mono)",
                                fontWeight: 800,
                                fontSize: "1rem",
                                color: isInc ? "#34d399" : "#f87171",
                              }}
                            >
                              {isInc ? "+" : "-"}
                              {curr}{Number(tx.amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                          </td>
                          {isAdmin && (
                            <td style={{ textAlign: "right" }}>
                              <button
                                className="btn btn-secondary btn-sm"
                                style={{ color: "#f87171", borderColor: "rgba(239, 68, 68, 0.3)" }}
                                onClick={() => handleDeleteTransaction(tx.id, tx.voucherNo)}
                                title={t(language, "deleteMember")}
                              >
                                ✕
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 6: SETTINGS ────────────────────────────────────────────────── */}
      {activeTab === "settings" && (
        <div className="settings-grid">
          {/* Card 0: Language & Regional Settings */}
          <div className="settings-card full-width">
            <div className="settings-card-header">
              <div className="settings-icon">🌐</div>
              <div>
                <h3>{t(language, "langSectionTitle")}</h3>
                <p>{t(language, "langSectionSubtitle")}</p>
              </div>
            </div>

            <div className="lang-selection-grid">
              <div
                className={`lang-option-card ${language === "en" ? "active" : ""}`}
                onClick={() => changeLanguage("en")}
              >
                <div className="lang-flag-badge">🇬🇧</div>
                <div className="lang-option-content">
                  <div className="lang-option-title">
                    <span>{t(language, "englishOptionTitle")}</span>
                    {language === "en" && (
                      <span className="lang-check-pill">✓ {t(language, "activeLanguageBadge")}</span>
                    )}
                  </div>
                  <p className="lang-option-desc">{t(language, "englishOptionDesc")}</p>
                </div>
              </div>

              <div
                className={`lang-option-card ${language === "si" ? "active" : ""}`}
                onClick={() => changeLanguage("si")}
              >
                <div className="lang-flag-badge">🇱🇰</div>
                <div className="lang-option-content">
                  <div className="lang-option-title">
                    <span>{t(language, "sinhalaOptionTitle")}</span>
                    {language === "si" && (
                      <span className="lang-check-pill">✓ {t(language, "activeLanguageBadge")}</span>
                    )}
                  </div>
                  <p className="lang-option-desc">{t(language, "sinhalaOptionDesc")}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Card 1: My Personal Profile Details */}
          <div className="settings-card">
            <div className="settings-card-header">
              <div className="settings-icon">👤</div>
              <div>
                <h3>{t(language, "profileSectionTitle")}</h3>
                <p>{t(language, "profileSectionSubtitle")}</p>
              </div>
            </div>

            <form onSubmit={handleUpdateProfile}>
              <div className="form-group" style={{ marginBottom: "14px" }}>
                <label className="form-label">{t(language, "fullNameLabel")}</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: "14px" }}>
                <label className="form-label">{t(language, "emailLabel")}</label>
                <input
                  type="email"
                  className="form-input"
                  required
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: "14px" }}>
                <label className="form-label">{t(language, "phoneLabel")}</label>
                <input
                  type="text"
                  className="form-input"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: "20px" }}>
                <label className="form-label">{t(language, "departmentLabel")}</label>
                <input
                  type="text"
                  className="form-input"
                  value={profileForm.department}
                  onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: "auto" }}>
                {t(language, "saveProfileBtn")}
              </button>
            </form>
          </div>

          {/* Card 2: Security & Password */}
          <div className="settings-card">
            <div className="settings-card-header">
              <div className="settings-icon">🔐</div>
              <div>
                <h3>{t(language, "passwordSectionTitle")}</h3>
                <p>{t(language, "passwordSectionSubtitle")}</p>
              </div>
            </div>

            <form onSubmit={handleChangePassword}>
              <div className="form-group" style={{ marginBottom: "14px" }}>
                <label className="form-label">{t(language, "currentPasswordLabel")}</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Enter current password"
                  required
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: "14px" }}>
                <label className="form-label">{t(language, "newPasswordLabel")}</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Enter new password"
                  required
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: "20px" }}>
                <label className="form-label">{t(language, "confirmPasswordLabel")}</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Confirm new password"
                  required
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                />
              </div>

              <button type="submit" className="btn btn-secondary" style={{ marginTop: "auto" }}>
                {t(language, "updatePasswordBtn")}
              </button>
            </form>
          </div>

          {/* Card 3: System Preferences (Admin Only) */}
          {isAdmin && (
            <div className="settings-card full-width">
              <div className="settings-card-header">
                <div className="settings-icon">⚙️</div>
                <div>
                  <h3>{t(language, "systemPrefsTitle")}</h3>
                  <p>{t(language, "systemPrefsSubtitle")}</p>
                </div>
              </div>

              <form onSubmit={handleUpdateSystemSettings}>
                <div className="form-grid">
                  <div className="form-group full">
                    <label className="form-label">{t(language, "orgTitleLabel")}</label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      value={settingsForm.organizationName}
                      onChange={(e) => setSettingsForm({ ...settingsForm, organizationName: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">{t(language, "activeCurrencyLabel")}</label>
                    <select
                      className="form-select"
                      value="LKR"
                      disabled
                      style={{ cursor: "not-allowed", opacity: 0.9 }}
                    >
                      <option value="LKR">LKR (Rs.) - Sri Lankan Rupee (ශ්‍රී ලංකා රුපියල්)</option>
                    </select>
                    <span style={{ fontSize: "0.74rem", color: "var(--accent-cyan)", marginTop: "3px" }}>
                      🇱🇰 {language === "si" ? "පද්ධතිය ශ්‍රී ලංකා රුපියල් (Rs.) සඳහා පමණක් සකසා ඇත" : "System locked exclusively to Sri Lankan Rupees (Rs.)"}
                    </span>
                  </div>

                  <div className="form-group">
                    <label className="form-label">{t(language, "customSymbolLabel")}</label>
                    <input
                      type="text"
                      className="form-input"
                      value="Rs."
                      readOnly
                      disabled
                      style={{ cursor: "not-allowed", opacity: 0.9 }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">{t(language, "defaultContributionLabel")}</label>
                    <input
                      type="number"
                      className="form-input"
                      min="10"
                      step="10"
                      value={settingsForm.defaultContributionRate}
                      onChange={(e) => setSettingsForm({ ...settingsForm, defaultContributionRate: Number(e.target.value) })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">{t(language, "maxLoanLimitLabel")}</label>
                    <input
                      type="number"
                      className="form-input"
                      min="1000"
                      step="500"
                      value={settingsForm.maxLoanLimit}
                      onChange={(e) => setSettingsForm({ ...settingsForm, maxLoanLimit: Number(e.target.value) })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">{t(language, "defaultInterestRateLabel")}</label>
                    <input
                      type="number"
                      className="form-input"
                      step="0.1"
                      min="0"
                      max="30"
                      value={settingsForm.defaultInterestRate}
                      onChange={(e) => setSettingsForm({ ...settingsForm, defaultInterestRate: Number(e.target.value) })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      {language === "si" ? `ආරම්භක අරමුදල් සංචිතය (${curr})` : `Initial Capital Reserve (${curr})`}
                    </label>
                    <input
                      type="number"
                      className="form-input"
                      min="0"
                      step="100"
                      value={settingsForm.initialReserve ?? 45000}
                      onChange={(e) => setSettingsForm({ ...settingsForm, initialReserve: Number(e.target.value) })}
                    />
                    <span style={{ fontSize: "0.74rem", color: "var(--text-muted)", marginTop: "3px" }}>
                      {language === "si" ? "සුබසාධක අරමුදලේ ආරම්භක මූලික ශේෂය" : "Baseline organizational capital reserve"}
                    </span>
                  </div>

                  <div className="form-group">
                    <div className="toggle-group">
                      <div className="toggle-label">
                        <strong>{t(language, "autoPayrollLabel")}</strong>
                        <span>{t(language, "autoPayrollSubtitle")}</span>
                      </div>
                      <input
                        type="checkbox"
                        style={{ width: "20px", height: "20px", cursor: "pointer" }}
                        checked={settingsForm.autoPayrollDeduction}
                        onChange={(e) => setSettingsForm({ ...settingsForm, autoPayrollDeduction: e.target.checked })}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end" }}>
                  <button type="submit" className="btn btn-primary">
                    {t(language, "savePreferencesBtn")}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
        </>
      )}

      {/* ── MODALS ─────────────────────────────────────────────────────────── */}

      {/* 1. Register Member Modal (Admin Only) */}
      {isAdmin && showAddMemberModal && (
        <div className="modal-backdrop" onClick={() => setShowAddMemberModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{language === "si" ? "නව සුබසාධක සාමාජිකයෙකු ලියාපදිංචි කිරීම" : "Register New Welfare Member"}</h3>
              <button className="modal-close-btn" onClick={() => setShowAddMemberModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateMember}>
              <div className="modal-body">
                {duplicateValidation.hasDuplicate && (
                  <div
                    style={{
                      background: "rgba(239, 68, 68, 0.12)",
                      border: "1px solid rgba(239, 68, 68, 0.4)",
                      borderRadius: "12px",
                      padding: "12px 16px",
                      marginBottom: "18px",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "10px",
                      color: "#fca5a5",
                    }}
                  >
                    <span style={{ fontSize: "1.2rem", lineHeight: 1 }}>⛔</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "0.92rem", color: "#f87171" }}>
                        {language === "si" ? "ලියාපදිංචිය අවහිර කර ඇත (ද්විත්ව තොරතුරු හමුවිය):" : "Registration Blocked (Duplicate Entry Detected):"}
                      </div>
                      <div style={{ fontSize: "0.85rem", marginTop: "4px", color: "#fecaca" }}>
                        {duplicateValidation.idError || duplicateValidation.sewaError || duplicateValidation.emailError}
                      </div>
                    </div>
                  </div>
                )}
                {!duplicateValidation.hasDuplicate && memberFormError && (
                  <div
                    style={{
                      background: "rgba(239, 68, 68, 0.12)",
                      border: "1px solid rgba(239, 68, 68, 0.4)",
                      borderRadius: "12px",
                      padding: "12px 16px",
                      marginBottom: "18px",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      color: "#fca5a5",
                    }}
                  >
                    <span style={{ fontSize: "1.2rem", lineHeight: 1 }}>⚠️</span>
                    <div style={{ fontSize: "0.88rem", color: "#fecaca" }}>{memberFormError}</div>
                  </div>
                )}

                <div className="form-grid">
                  <div className="form-group full">
                    <label className="form-label">{language === "si" ? "සම්පූර්ණ නම *" : "Full Name *"}</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder={language === "si" ? "උදා: කේ. ඒ. නිමල් පෙරේරා" : "e.g. K. A. Nimal Perera"}
                      required
                      value={memberForm.name}
                      onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={duplicateValidation.idError ? { color: "#f87171" } : undefined}>
                      {language === "si" ? "හැඳුනුම්පත් අංකය (ID Number) *" : "ID Number (NIC) *"}
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder={language === "si" ? "උදා: 199012345678 / 901234567V" : "e.g. 199012345678 / 901234567V"}
                      required
                      value={memberForm.idNumber}
                      style={duplicateValidation.idError ? { borderColor: "#ef4444", boxShadow: "0 0 0 3px rgba(239, 68, 68, 0.25)", background: "rgba(239, 68, 68, 0.05)" } : undefined}
                      onChange={(e) => {
                        setMemberForm({ ...memberForm, idNumber: e.target.value });
                        if (memberFormError) setMemberFormError(null);
                      }}
                    />
                    {duplicateValidation.idError && (
                      <div style={{ color: "#ef4444", fontSize: "0.82rem", marginTop: "6px", display: "flex", alignItems: "center", gap: "6px", fontWeight: 500 }}>
                        <span>⚠️</span> {duplicateValidation.idError}
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={duplicateValidation.sewaError ? { color: "#f87171" } : undefined}>
                      {language === "si" ? "සේවා අංකය (Sewa Ankaya) *" : "Sewa Ankaya (Service ID) *"}
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder={language === "si" ? "උදා: SO-4089 / 12345" : "e.g. SO-4089 / 12345"}
                      required
                      value={memberForm.sewaAnkaya}
                      style={duplicateValidation.sewaError ? { borderColor: "#ef4444", boxShadow: "0 0 0 3px rgba(239, 68, 68, 0.25)", background: "rgba(239, 68, 68, 0.05)" } : undefined}
                      onChange={(e) => {
                        setMemberForm({ ...memberForm, sewaAnkaya: e.target.value });
                        if (memberFormError) setMemberFormError(null);
                      }}
                    />
                    {duplicateValidation.sewaError && (
                      <div style={{ color: "#ef4444", fontSize: "0.82rem", marginTop: "6px", display: "flex", alignItems: "center", gap: "6px", fontWeight: 500 }}>
                        <span>⚠️</span> {duplicateValidation.sewaError}
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      {language === "si" ? "තනතුර - Thanthura (Designation/Post) *" : "Thanthura (Designation/Post) *"}
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder={language === "si" ? "උදා: සංවර්ධන නිලධාරී / කළමනාකරණ සේවා නිලධාරී" : "e.g. Development Officer / Administrative Officer"}
                      required
                      value={memberForm.thanthura}
                      onChange={(e) => setMemberForm({ ...memberForm, thanthura: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">{language === "si" ? "දුරකථන අංකය *" : "Phone Number *"}</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="077 123 4567"
                      required
                      value={memberForm.phone}
                      onChange={(e) => setMemberForm({ ...memberForm, phone: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={duplicateValidation.emailError ? { color: "#f87171" } : undefined}>
                      {language === "si" ? "විද්‍යුත් තැපැල් ලිපිනය (විකල්පයි)" : "Email Address (Optional)"}
                    </label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="nimal.perera@org.internal"
                      value={memberForm.email}
                      style={duplicateValidation.emailError ? { borderColor: "#ef4444", boxShadow: "0 0 0 3px rgba(239, 68, 68, 0.25)", background: "rgba(239, 68, 68, 0.05)" } : undefined}
                      onChange={(e) => {
                        setMemberForm({ ...memberForm, email: e.target.value });
                        if (memberFormError) setMemberFormError(null);
                      }}
                    />
                    {duplicateValidation.emailError && (
                      <div style={{ color: "#ef4444", fontSize: "0.82rem", marginTop: "6px", display: "flex", alignItems: "center", gap: "6px", fontWeight: 500 }}>
                        <span>⚠️</span> {duplicateValidation.emailError}
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">{language === "si" ? "සුබසාධක සංගමයේ තනතුර" : "Role in Welfare"}</label>
                    <select
                      className="form-select"
                      value={memberForm.role}
                      onChange={(e) => setMemberForm({ ...memberForm, role: e.target.value })}
                    >
                      <option value="Member">{language === "si" ? "සාමාන්‍ය සාමාජික" : "General Member"}</option>
                      <option value="Executive">{language === "si" ? "විධායක කමිටු සාමාජික" : "Executive Committee"}</option>
                      <option value="Treasurer">{language === "si" ? "භාණ්ඩාගාරික / විගණක" : "Treasurer / Auditor"}</option>
                      <option value="Chairperson">{language === "si" ? "සභාපති" : "Chairperson"}</option>
                    </select>
                  </div>

                  <div className="form-group full">
                    <label className="form-label">{language === "si" ? `මාසික දායකත්ව පොරොන්දුව (${curr}) *` : `Monthly Pledge (${curr}) *`}</label>
                    <input
                      type="number"
                      min="10"
                      step="10"
                      className="form-input"
                      required
                      value={memberForm.monthlyContribution}
                      onChange={(e) => setMemberForm({ ...memberForm, monthlyContribution: Number(e.target.value) })}
                    />
                  </div>

                  <div className="form-group full">
                    <label className="form-label">{language === "si" ? "සටහන් / අනුබද්ධතාවය" : "Notes / Affiliation"}</label>
                    <textarea
                      className="form-textarea"
                      placeholder={language === "si" ? "විශේෂ සටහන්, බඳවා ගැනීමේ තොරතුරු..." : "Special notes, enrollment context..."}
                      value={memberForm.notes}
                      onChange={(e) => setMemberForm({ ...memberForm, notes: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setMemberFormError(null);
                    setShowAddMemberModal(false);
                  }}
                >
                  {t(language, "modalCancel")}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={duplicateValidation.hasDuplicate ? { opacity: 0.65, cursor: "not-allowed", background: "var(--bg-card, #334155)" } : {}}
                  disabled={memberSubmitting || duplicateValidation.hasDuplicate}
                  title={duplicateValidation.hasDuplicate ? (language === "si" ? "ද්විත්ව තොරතුරු පවතින බැවින් ලියාපදිංචි කළ නොහැක" : "Resolve duplicate entries to enable registration") : undefined}
                >
                  {memberSubmitting ? (
                    <span>⏳ {language === "si" ? "ලියාපදිංචි වෙමින් පවතී..." : "Registering..."}</span>
                  ) : duplicateValidation.hasDuplicate ? (
                    <>
                      <span>⛔</span> {language === "si" ? "ද්විත්ව තොරතුරු (අවහිරයි)" : "Duplicates Detected"}
                    </>
                  ) : (
                    language === "si" ? "සුරකින්න සහ ලියාපදිංචි කරන්න" : "Save & Register"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Edit Member Modal (Admin Only) */}
      {isAdmin && showEditMemberModal && selectedMember && (
        <div className="modal-backdrop" onClick={() => setShowEditMemberModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{language === "si" ? `සාමාජික සංස්කරණය: ${selectedMember.name}` : `Edit Member: ${selectedMember.name}`}</h3>
              <button className="modal-close-btn" onClick={() => setShowEditMemberModal(false)}>✕</button>
            </div>
            <form onSubmit={handleUpdateMember}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group full">
                    <label className="form-label">{language === "si" ? "සම්පූර්ණ නම" : "Full Name"}</label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      value={memberForm.name}
                      onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={duplicateValidation.idError ? { color: "#f87171" } : undefined}>
                      {language === "si" ? "හැඳුනුම්පත් අංකය (ID Number) *" : "ID Number (NIC) *"}
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. 199012345678 / 901234567V"
                      required
                      value={memberForm.idNumber}
                      style={duplicateValidation.idError ? { borderColor: "#ef4444", boxShadow: "0 0 0 3px rgba(239, 68, 68, 0.25)", background: "rgba(239, 68, 68, 0.05)" } : undefined}
                      onChange={(e) => setMemberForm({ ...memberForm, idNumber: e.target.value })}
                    />
                    {duplicateValidation.idError && (
                      <div style={{ color: "#ef4444", fontSize: "0.82rem", marginTop: "6px", display: "flex", alignItems: "center", gap: "6px", fontWeight: 500 }}>
                        <span>⚠️</span> {duplicateValidation.idError}
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={duplicateValidation.sewaError ? { color: "#f87171" } : undefined}>
                      {language === "si" ? "සේවා අංකය (Sewa Ankaya)" : "Sewa Ankaya (Service ID)"}
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. SO-4089 / 12345"
                      value={memberForm.sewaAnkaya}
                      style={duplicateValidation.sewaError ? { borderColor: "#ef4444", boxShadow: "0 0 0 3px rgba(239, 68, 68, 0.25)", background: "rgba(239, 68, 68, 0.05)" } : undefined}
                      onChange={(e) => setMemberForm({ ...memberForm, sewaAnkaya: e.target.value })}
                    />
                    {duplicateValidation.sewaError && (
                      <div style={{ color: "#ef4444", fontSize: "0.82rem", marginTop: "6px", display: "flex", alignItems: "center", gap: "6px", fontWeight: 500 }}>
                        <span>⚠️</span> {duplicateValidation.sewaError}
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">{language === "si" ? "තනතුර (Thanthura / Designation)" : "Thanthura (Designation/Post)"}</label>
                    <input
                      type="text"
                      className="form-input"
                      value={memberForm.thanthura}
                      onChange={(e) => setMemberForm({ ...memberForm, thanthura: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">{language === "si" ? "දුරකථන අංකය" : "Phone"}</label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      value={memberForm.phone}
                      onChange={(e) => setMemberForm({ ...memberForm, phone: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={duplicateValidation.emailError ? { color: "#f87171" } : undefined}>
                      {language === "si" ? "විද්‍යුත් තැපැල් ලිපිනය (විකල්පයි)" : "Email (Optional)"}
                    </label>
                    <input
                      type="email"
                      className="form-input"
                      value={memberForm.email}
                      style={duplicateValidation.emailError ? { borderColor: "#ef4444", boxShadow: "0 0 0 3px rgba(239, 68, 68, 0.25)", background: "rgba(239, 68, 68, 0.05)" } : undefined}
                      onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
                    />
                    {duplicateValidation.emailError && (
                      <div style={{ color: "#ef4444", fontSize: "0.82rem", marginTop: "6px", display: "flex", alignItems: "center", gap: "6px", fontWeight: 500 }}>
                        <span>⚠️</span> {duplicateValidation.emailError}
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">{language === "si" ? "සුබසාධක සංගමයේ තනතුර" : "Role in Welfare"}</label>
                    <input
                      type="text"
                      className="form-input"
                      value={memberForm.role}
                      onChange={(e) => setMemberForm({ ...memberForm, role: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">{language === "si" ? `මාසික දායකත්වය (${curr})` : `Monthly Pledge (${curr})`}</label>
                    <input
                      type="number"
                      className="form-input"
                      value={memberForm.monthlyContribution}
                      onChange={(e) => setMemberForm({ ...memberForm, monthlyContribution: Number(e.target.value) })}
                    />
                  </div>

                  <div className="form-group full">
                    <label className="form-label">{language === "si" ? "සටහන්" : "Notes"}</label>
                    <textarea
                      className="form-textarea"
                      value={memberForm.notes}
                      onChange={(e) => setMemberForm({ ...memberForm, notes: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditMemberModal(false)}>
                  {t(language, "modalCancel")}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={duplicateValidation.hasDuplicate ? { opacity: 0.65, cursor: "not-allowed", background: "var(--bg-card, #334155)" } : {}}
                  disabled={duplicateValidation.hasDuplicate}
                  title={duplicateValidation.hasDuplicate ? (language === "si" ? "ද්විත්ව තොරතුරු පවතින බැවින් සුරැකිය නොහැක" : "Resolve duplicate entries to save") : undefined}
                >
                  {duplicateValidation.hasDuplicate ? (
                    <>
                      <span>⛔</span> {language === "si" ? "ද්විත්ව තොරතුරු (අවහිරයි)" : "Duplicates Detected"}
                    </>
                  ) : (
                    t(language, "modalSave")
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Member Profile Drawer */}
      {showMemberDetailsModal && selectedMember && (
        <div className="modal-backdrop" onClick={() => setShowMemberDetailsModal(false)}>
          <div className="modal-dialog lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{language === "si" ? "සාමාජික මූල්‍ය පැතිකඩ" : "Member Financial Profile"}</h3>
              <button className="modal-close-btn" onClick={() => setShowMemberDetailsModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="profile-hero">
                <div className="profile-avatar">{selectedMember.name.charAt(0)}</div>
                <div className="profile-meta">
                  <h3>{selectedMember.name}</h3>
                  <p>
                    {selectedMember.memberId} • {selectedMember.role} • {selectedMember.thanthura || selectedMember.department}
                  </p>
                  {(selectedMember.idNumber || selectedMember.sewaAnkaya) && (
                    <p style={{ marginTop: "2px", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                      {[selectedMember.idNumber && `NIC/ID: ${selectedMember.idNumber}`, selectedMember.sewaAnkaya && `Sewa No: ${selectedMember.sewaAnkaya}`].filter(Boolean).join(" • ")}
                    </p>
                  )}
                  <p style={{ marginTop: "4px" }}>
                    {language === "si" ? "බැඳුණු දිනය:" : "Joined:"} {selectedMember.joinDate} • {language === "si" ? "මාසික දායකත්වය:" : "Monthly Pledge:"} <strong>{curr}{selectedMember.monthlyContribution}</strong>
                  </p>
                </div>
              </div>

              {/* Stats Row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                <div className="metric-card" style={{ padding: "16px" }}>
                  <div className="metric-label">{language === "si" ? "ජීවිත කාලීන දායකත්වය" : "Lifetime Contributions"}</div>
                  <div className="metric-value" style={{ fontSize: "1.6rem", color: "#34d399" }}>
                    {curr}{selectedMember.totalContributed.toLocaleString()}
                  </div>
                </div>
                <div className="metric-card" style={{ padding: "16px" }}>
                  <div className="metric-label">{language === "si" ? "සම්බන්ධිත ණය ප්‍රමාණය" : "Associated Loans"}</div>
                  <div className="metric-value" style={{ fontSize: "1.6rem", color: "#60a5fa" }}>
                    {selectedMember.loans ? selectedMember.loans.length : 0}
                  </div>
                </div>
              </div>

              {/* Associated Loans */}
              <h4 style={{ fontSize: "1rem", color: "var(--text-primary)", marginBottom: "10px" }}>
                {language === "si" ? "ණය ඉතිහාසය" : "Loan History"}
              </h4>
              {!selectedMember.loans || selectedMember.loans.length === 0 ? (
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "20px" }}>
                  {language === "si" ? "මෙම සාමාජිකයා සඳහා ණය ඉතිහාසයක් නොමැත." : "No loan history for this member."}
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px" }}>
                  {selectedMember.loans.map((l) => (
                    <div key={l.id} className="endpoint-row">
                      <div>
                        <strong>{l.loanId}</strong> ({l.status === "Active" ? t(language, "statusActive") : l.status === "Pending" ? t(language, "statusPending") : l.status === "Fully Repaid" ? t(language, "statusFullyRepaid") : t(language, "statusRejected")}) — {curr}{l.principalAmount.toLocaleString()} ({l.purpose})
                      </div>
                      <span style={{ fontFamily: "var(--font-mono)" }}>
                        {language === "si" ? "ශේෂය:" : "Bal:"} {curr}{l.remainingBalance.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Recent Contributions */}
              <h4 style={{ fontSize: "1rem", color: "var(--text-primary)", marginBottom: "10px" }}>
                {language === "si" ? "මෑත කාලීන දායකත්වයන්" : "Recent Contributions"}
              </h4>
              {!selectedMember.contributions || selectedMember.contributions.length === 0 ? (
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                  {language === "si" ? "දායකත්ව වාර්තා මෙතෙක් නොමැත." : "No contribution records yet."}
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {selectedMember.contributions.slice(0, 5).map((c) => (
                    <div key={c.id} className="endpoint-row">
                      <div>
                        <strong>{c.receiptNo}</strong> — {c.monthCovered} ({c.paymentMethod})
                      </div>
                      <span style={{ fontFamily: "var(--font-mono)", color: "#34d399", fontWeight: 700 }}>
                        +{curr}{c.amount.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowMemberDetailsModal(false)}>
                {t(language, "modalClose")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Apply Loan Modal */}
      {showApplyLoanModal && (
        <div className="modal-backdrop" onClick={() => setShowApplyLoanModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{language === "si" ? "නව සුබසාධක ණය අයදුම්පත" : "New Welfare Loan Application"}</h3>
              <button className="modal-close-btn" onClick={() => setShowApplyLoanModal(false)}>✕</button>
            </div>
            <form onSubmit={handleApplyLoan}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group full">
                    <label className="form-label">{language === "si" ? "ණය ලබාගන්නා සාමාජිකයා *" : "Borrower Member *"}</label>
                    {isAdmin ? (
                      <select
                        className="form-select"
                        required
                        value={loanForm.memberId}
                        onChange={(e) => setLoanForm({ ...loanForm, memberId: e.target.value })}
                      >
                        {members.map((m) => (
                          <option key={m.id} value={m.memberId}>
                            {m.name} ({m.memberId}) — {language === "si" ? "දායකත්වය:" : "Contributed:"} {curr}{m.totalContributed}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        className="form-input"
                        disabled
                        value={`${currentUser.name} (${currentUser.memberId})`}
                      />
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">{language === "si" ? `ණය මූලික මුදල (${curr}) *` : `Principal Amount (${curr}) *`}</label>
                    <input
                      type="number"
                      step="100"
                      min="100"
                      max={systemSettings.maxLoanLimit}
                      className="form-input"
                      required
                      value={loanForm.principalAmount}
                      onChange={(e) => setLoanForm({ ...loanForm, principalAmount: Number(e.target.value) })}
                    />
                    <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px" }}>
                      {language === "si" ? `යෝජනාක්‍රම උපරිම සීමාව: ${curr}${systemSettings.maxLoanLimit.toLocaleString()}` : `Scheme ceiling: ${curr}${systemSettings.maxLoanLimit.toLocaleString()}`}
                    </span>
                  </div>

                  <div className="form-group">
                    <label className="form-label">{language === "si" ? "ණය කාල සීමාව (මාස) *" : "Loan Term (Months) *"}</label>
                    <select
                      className="form-select"
                      value={loanForm.termMonths}
                      onChange={(e) => setLoanForm({ ...loanForm, termMonths: Number(e.target.value) })}
                    >
                      <option value="6">{language === "si" ? "මාස 6" : "6 Months"}</option>
                      <option value="12">{language === "si" ? "මාස 12 (වසර 1)" : "12 Months (1 Year)"}</option>
                      <option value="18">{language === "si" ? "මාස 18" : "18 Months"}</option>
                      <option value="24">{language === "si" ? "මාස 24 (වසර 2)" : "24 Months (2 Years)"}</option>
                      <option value="36">{language === "si" ? "මාස 36 (වසර 3)" : "36 Months (3 Years)"}</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">{language === "si" ? "වාර්ෂික පොලී අනුපාතිකය (%)" : "Annual Interest Rate (%)"}</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="20"
                      className="form-input"
                      value={loanForm.interestRate}
                      onChange={(e) => setLoanForm({ ...loanForm, interestRate: Number(e.target.value) })}
                    />
                  </div>

                  <div className="form-group full">
                    <label className="form-label">{language === "si" ? "ණය ලබාගැනීමේ අරමුණ *" : "Loan Purpose *"}</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder={language === "si" ? "උදා: හදිසි වෛද්‍ය වියදම්, නිවාස අලුත්වැඩියාව, අධ්‍යාපන ගාස්තු" : "e.g. Emergency medical expenses, home repair, tuition"}
                      required
                      value={loanForm.purpose}
                      onChange={(e) => setLoanForm({ ...loanForm, purpose: e.target.value })}
                    />
                  </div>
                </div>

                {/* Calculation Preview */}
                <div className="calc-preview-card">
                  <div>
                    <div className="calc-label">{language === "si" ? "මුළු පොලිය" : "Total Interest"}</div>
                    <div className="calc-val">{curr}{loanCalcPreview.totalInterest.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="calc-label">{language === "si" ? "මුළු ආපසු ගෙවිය යුතු මුදල" : "Total Repayable"}</div>
                    <div className="calc-val">{curr}{loanCalcPreview.totalRepayable.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="calc-label">{language === "si" ? "මාසික වාරිකය (EMI)" : "Monthly EMI"}</div>
                    <div className="calc-val" style={{ color: "#34d399" }}>
                      {curr}{loanCalcPreview.monthlyEMI.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowApplyLoanModal(false)}>
                  {t(language, "modalCancel")}
                </button>
                <button type="submit" className="btn btn-primary">
                  {language === "si" ? "අයදුම්පත ඉදිරිපත් කරන්න" : "Submit Application"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Record Repayment Modal */}
      {showPayLoanModal && selectedLoan && (
        <div className="modal-backdrop" onClick={() => setShowPayLoanModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{language === "si" ? `ණය වාරික ගෙවීම සටහන් කිරීම: ${selectedLoan.loanId}` : `Record Loan Payment: ${selectedLoan.loanId}`}</h3>
              <button className="modal-close-btn" onClick={() => setShowPayLoanModal(false)}>✕</button>
            </div>
            <form onSubmit={handleRecordRepayment}>
              <div className="modal-body">
                <div style={{ marginBottom: "16px", padding: "12px", background: "rgba(13, 19, 33, 0.7)", borderRadius: "var(--radius-sm)" }}>
                  <div>{language === "si" ? "ණයකරු:" : "Borrower:"} <strong>{selectedLoan.memberName}</strong></div>
                  <div>{language === "si" ? "මුළු ආපසු ගෙවිය යුතු මුදල:" : "Total Repayable:"} <strong>{curr}{selectedLoan.totalRepayable.toFixed(2)}</strong></div>
                  <div>{language === "si" ? "ඉතිරි ශේෂය:" : "Remaining Balance:"} <strong style={{ color: "#fbbf24" }}>{curr}{selectedLoan.remainingBalance.toFixed(2)}</strong></div>
                  <div>{language === "si" ? "මාසික වාරිකය:" : "Monthly EMI:"} <strong>{curr}{selectedLoan.monthlyPayment.toFixed(2)}</strong></div>
                </div>

                <div className="form-grid">
                  <div className="form-group full">
                    <label className="form-label">{language === "si" ? `ගෙවීම් මුදල (${curr}) *` : `Payment Amount (${curr}) *`}</label>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      max={selectedLoan.remainingBalance}
                      className="form-input"
                      required
                      value={repaymentForm.amount}
                      onChange={(e) => setRepaymentForm({ ...repaymentForm, amount: Number(e.target.value) })}
                    />
                  </div>

                  <div className="form-group full">
                    <label className="form-label">{language === "si" ? "ගෙවීම් ක්‍රමය" : "Payment Method"}</label>
                    <select
                      className="form-select"
                      value={repaymentForm.paymentMethod}
                      onChange={(e) => setRepaymentForm({ ...repaymentForm, paymentMethod: e.target.value })}
                    >
                      <option value="Bank Transfer">{language === "si" ? "බැංකු හුවමාරුව (EFT)" : "Bank Transfer (EFT)"}</option>
                      <option value="Payroll Deduction">{language === "si" ? "වැටුපෙන් අඩුකිරීම" : "Payroll Deduction"}</option>
                      <option value="Cash / Cheque">{language === "si" ? "මුදල් / චෙක්පත්" : "Cash / Cheque"}</option>
                    </select>
                  </div>

                  <div className="form-group full">
                    <label className="form-label">{language === "si" ? "ගෙවීම් සටහන / යොමුව" : "Payment Memo / Reference"}</label>
                    <input
                      type="text"
                      className="form-input"
                      value={repaymentForm.notes}
                      onChange={(e) => setRepaymentForm({ ...repaymentForm, notes: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowPayLoanModal(false)}>
                  {t(language, "modalCancel")}
                </button>
                <button type="submit" className="btn btn-primary">
                  {language === "si" ? "වාරික ගෙවීම තහවුරු කරන්න" : "Confirm Repayment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Record Contribution Modal (Admin Only) */}
      {isAdmin && showRecordContributionModal && (
        <div className="modal-backdrop" onClick={() => setShowRecordContributionModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{language === "si" ? "මාසික දායකත්වය සටහන් කිරීම" : "Record Monthly Contribution"}</h3>
              <button className="modal-close-btn" onClick={() => setShowRecordContributionModal(false)}>✕</button>
            </div>
            <form onSubmit={handleRecordContribution}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group full">
                    <label className="form-label">{language === "si" ? "දායක වන සාමාජිකයා *" : "Contributing Member *"}</label>
                    <select
                      className="form-select"
                      required
                      value={contributionForm.memberId}
                      onChange={(e) => {
                        const m = members.find((mem) => mem.memberId === e.target.value);
                        setContributionForm({
                          ...contributionForm,
                          memberId: e.target.value,
                          amount: m ? m.monthlyContribution : contributionForm.amount,
                        });
                      }}
                    >
                      {members.map((m) => (
                        <option key={m.id} value={m.memberId}>
                          {m.name} ({m.memberId}) — {language === "si" ? "සම්මත:" : "Standard:"} {curr}{m.monthlyContribution}{language === "si" ? "/මසකට" : "/mo"}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">{language === "si" ? `දායකත්ව මුදල (${curr}) *` : `Amount (${curr}) *`}</label>
                    <input
                      type="number"
                      step="5"
                      min="5"
                      className="form-input"
                      required
                      value={contributionForm.amount}
                      onChange={(e) => setContributionForm({ ...contributionForm, amount: Number(e.target.value) })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">{language === "si" ? "අදාළ මාසය" : "Month Covered"}</label>
                    <select
                      className="form-select"
                      value={contributionForm.monthCovered}
                      onChange={(e) => setContributionForm({ ...contributionForm, monthCovered: e.target.value })}
                    >
                      <option value="September 2026">{language === "si" ? "2026 සැප්තැම්බර්" : "September 2026"}</option>
                      <option value="October 2026">{language === "si" ? "2026 ඔක්තෝබර්" : "October 2026"}</option>
                      <option value="November 2026">{language === "si" ? "2026 නොවැම්බර්" : "November 2026"}</option>
                      <option value="December 2026">{language === "si" ? "2026 දෙසැම්බර්" : "December 2026"}</option>
                    </select>
                  </div>

                  <div className="form-group full">
                    <label className="form-label">{language === "si" ? "ගෙවීම් ක්‍රමය" : "Payment Method"}</label>
                    <select
                      className="form-select"
                      value={contributionForm.paymentMethod}
                      onChange={(e) => setContributionForm({ ...contributionForm, paymentMethod: e.target.value })}
                    >
                      <option value="Payroll Deduction">{language === "si" ? "වැටුපෙන් අඩුකිරීම" : "Payroll Deduction"}</option>
                      <option value="Bank Transfer">{language === "si" ? "සෘජු බැංකු තැන්පතුව" : "Direct Bank Transfer"}</option>
                      <option value="Cash / Direct Deposit">{language === "si" ? "මුදල් / සෘජු භාරදීම" : "Cash / Direct Deposit"}</option>
                    </select>
                  </div>

                  <div className="form-group full">
                    <label className="form-label">{language === "si" ? "රිසිට්පත් සටහන" : "Receipt Memo"}</label>
                    <input
                      type="text"
                      className="form-input"
                      value={contributionForm.notes}
                      onChange={(e) => setContributionForm({ ...contributionForm, notes: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowRecordContributionModal(false)}>
                  {t(language, "modalCancel")}
                </button>
                <button type="submit" className="btn btn-primary">
                  {language === "si" ? "රිසිට්පත නිකුත් කර සටහන් කරන්න" : "Generate Receipt & Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Record Income Modal */}
      {showRecordIncomeModal && (
        <div className="modal-backdrop" onClick={() => setShowRecordIncomeModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span>💰</span> {t(language, "modalRecordIncomeTitle")}
                </h3>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "2px" }}>
                  {t(language, "modalRecordIncomeSubtitle")}
                </p>
              </div>
              <button className="modal-close-btn" onClick={() => setShowRecordIncomeModal(false)}>✕</button>
            </div>
            <form onSubmit={handleRecordIncome}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group full">
                    <label className="form-label">{t(language, "modalFieldCategory")} *</label>
                    <select
                      className="form-select"
                      required
                      value={incomeCategory}
                      onChange={(e) => setIncomeCategory(e.target.value)}
                    >
                      <option value="hall_rent">{t(language, "catHallRent")}</option>
                      <option value="shop_rent">{t(language, "catShopRent")}</option>
                      <option value="donations">{t(language, "catDonations")}</option>
                      <option value="fund_interest">{t(language, "catFundInterest")}</option>
                      <option value="other_income">{t(language, "catOtherIncome")}</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">{t(language, "modalFieldAmount")} *</label>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      className="form-input"
                      required
                      placeholder="e.g. 45000"
                      value={incomeAmount}
                      onChange={(e) => setIncomeAmount(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">{t(language, "modalFieldDate")} *</label>
                    <input
                      type="date"
                      className="form-input"
                      required
                      value={incomeDate}
                      onChange={(e) => setIncomeDate(e.target.value)}
                    />
                  </div>

                  <div className="form-group full">
                    <label className="form-label">{t(language, "modalFieldTitle")} *</label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      placeholder={language === "si" ? "උදා: ප්‍රජා ශාලා කුලිය - සැප්තැම්බර් උත්සවය" : "e.g. Community Hall Rent - Sept Wedding"}
                      value={incomeTitle}
                      onChange={(e) => setIncomeTitle(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">{t(language, "modalFieldPartyIncome")}</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder={language === "si" ? "ගෙවූ පුද්ගලයා හෝ ආයතනය" : "Payer Name / Company"}
                      value={incomeParty}
                      onChange={(e) => setIncomeParty(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">{t(language, "modalFieldPaymentMethod")}</label>
                    <select
                      className="form-select"
                      value={incomeMethod}
                      onChange={(e) => setIncomeMethod(e.target.value)}
                    >
                      <option value="Cash">{t(language, "paymentMethodCash")}</option>
                      <option value="Bank Transfer">{t(language, "paymentMethodBankTransfer")}</option>
                      <option value="Cheque">{t(language, "paymentMethodCheque")}</option>
                      <option value="Online">{t(language, "paymentMethodOnline")}</option>
                    </select>
                  </div>

                  <div className="form-group full">
                    <label className="form-label">{t(language, "modalFieldRef")}</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder={language === "si" ? "චෙක්පත් / රිසිට්පත් / බැංකු යොමු අංකය" : "Bank Slip / Cheque # / Ref"}
                      value={incomeRef}
                      onChange={(e) => setIncomeRef(e.target.value)}
                    />
                  </div>

                  <div className="form-group full">
                    <label className="form-label">{t(language, "modalFieldNotes")}</label>
                    <textarea
                      className="form-input"
                      rows={2}
                      placeholder={language === "si" ? "අමතර විස්තර සහ විගණන සටහන්..." : "Additional details or audit memos..."}
                      value={incomeDescription}
                      onChange={(e) => setIncomeDescription(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowRecordIncomeModal(false)}>
                  {t(language, "modalCancel")}
                </button>
                <button
                  type="submit"
                  className="btn"
                  style={{ background: "#10b981", color: "#ffffff", fontWeight: 700 }}
                  disabled={financeSubmitting}
                >
                  {financeSubmitting ? "..." : (language === "si" ? "ආදායම සටහන් කරන්න" : "Save Income Record")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. Record Expense Modal */}
      {showRecordExpenseModal && (
        <div className="modal-backdrop" onClick={() => setShowRecordExpenseModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span>📤</span> {t(language, "modalRecordExpenseTitle")}
                </h3>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "2px" }}>
                  {t(language, "modalRecordExpenseSubtitle")}
                </p>
              </div>
              <button className="modal-close-btn" onClick={() => setShowRecordExpenseModal(false)}>✕</button>
            </div>
            <form onSubmit={handleRecordExpense}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group full">
                    <label className="form-label">{t(language, "modalFieldCategory")} *</label>
                    <select
                      className="form-select"
                      required
                      value={expenseCategory}
                      onChange={(e) => setExpenseCategory(e.target.value)}
                    >
                      <option value="funeral_aid">{t(language, "catFuneralAid")}</option>
                      <option value="sports">{t(language, "catSports")}</option>
                      <option value="religious_festivals">{t(language, "catReligiousFestivals")}</option>
                      <option value="welfare_events">{t(language, "catWelfareEvents")}</option>
                      <option value="medical_aid">{t(language, "catMedicalAid")}</option>
                      <option value="maintenance">{t(language, "catMaintenance")}</option>
                      <option value="admin_expenses">{t(language, "catAdminExpenses")}</option>
                      <option value="other_expense">{t(language, "catOtherExpense")}</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">{t(language, "modalFieldAmount")} *</label>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      className="form-input"
                      required
                      placeholder="e.g. 25000"
                      value={expenseAmount}
                      onChange={(e) => setExpenseAmount(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">{t(language, "modalFieldDate")} *</label>
                    <input
                      type="date"
                      className="form-input"
                      required
                      value={expenseDate}
                      onChange={(e) => setExpenseDate(e.target.value)}
                    />
                  </div>

                  <div className="form-group full">
                    <label className="form-label">{t(language, "modalFieldTitle")} *</label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      placeholder={language === "si" ? "උදා: මරණාධාර ආධාර මුදල - නිමල් ජයසේකර මහතා" : "e.g. Funeral grant for late member"}
                      value={expenseTitle}
                      onChange={(e) => setExpenseTitle(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">{t(language, "modalFieldPartyExpense")}</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder={language === "si" ? "මුදල් ලබන්නා හෝ ප්‍රතිලාභියා" : "Recipient / Beneficiary Name"}
                      value={expenseParty}
                      onChange={(e) => setExpenseParty(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">{t(language, "modalFieldPaymentMethod")}</label>
                    <select
                      className="form-select"
                      value={expenseMethod}
                      onChange={(e) => setExpenseMethod(e.target.value)}
                    >
                      <option value="Cash">{t(language, "paymentMethodCash")}</option>
                      <option value="Bank Transfer">{t(language, "paymentMethodBankTransfer")}</option>
                      <option value="Cheque">{t(language, "paymentMethodCheque")}</option>
                      <option value="Online">{t(language, "paymentMethodOnline")}</option>
                    </select>
                  </div>

                  <div className="form-group full">
                    <label className="form-label">{t(language, "modalFieldRef")}</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder={language === "si" ? "වවුචර් / චෙක්පත් / ගෙවීම් යොමු අංකය" : "Voucher # / Cheque # / Receipt"}
                      value={expenseRef}
                      onChange={(e) => setExpenseRef(e.target.value)}
                    />
                  </div>

                  <div className="form-group full">
                    <label className="form-label">{t(language, "modalFieldNotes")}</label>
                    <textarea
                      className="form-input"
                      rows={2}
                      placeholder={language === "si" ? "අමතර විස්තර සහ විගණන සටහන්..." : "Additional details or audit memos..."}
                      value={expenseDescription}
                      onChange={(e) => setExpenseDescription(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowRecordExpenseModal(false)}>
                  {t(language, "modalCancel")}
                </button>
                <button
                  type="submit"
                  className="btn"
                  style={{ background: "#ef4444", color: "#ffffff", fontWeight: 700 }}
                  disabled={financeSubmitting}
                >
                  {financeSubmitting ? "..." : (language === "si" ? "වියදම සටහන් කරන්න" : "Disburse & Save Expense")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. Balance Management Modal */}
      {showBalanceModal && (
        <div className="modal-backdrop" id="modal-balance-management" onClick={() => setShowBalanceModal(false)}>
          <div className="modal-dialog" style={{ maxWidth: "620px" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span>⚖️</span> {language === "si" ? "ගිණුම් ශේෂය කළමනාකරණය" : "Manage Account Balance"}
                </h3>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "2px" }}>
                  {language === "si"
                    ? "සුබසාධක අරමුදලේ වත්මන් මුදල් ශේෂය හෝ ආරම්භක සංචිතය යාවත්කාලීන කරන්න"
                    : "Audit and update the welfare fund's current balance or initial capital reserve"}
                </p>
              </div>
              <button className="modal-close-btn" onClick={() => setShowBalanceModal(false)}>✕</button>
            </div>

            {/* Current Metrics Overview Strip */}
            <div style={{
              background: "rgba(15, 23, 42, 0.45)",
              borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
              padding: "14px 20px",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px"
            }}>
              <div style={{
                background: "rgba(16, 185, 129, 0.08)",
                border: "1px solid rgba(16, 185, 129, 0.2)",
                borderRadius: "10px",
                padding: "10px 14px"
              }}>
                <div style={{ fontSize: "0.74rem", color: "#6ee7b7", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
                  {language === "si" ? "වත්මන් මුදල් සංචිතය (Cash Pool)" : "Current Cash Pool"}
                </div>
                <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#ecfdf5", fontFamily: "var(--font-mono)", marginTop: "2px" }}>
                  {curr}{fund ? fund.currentCashPool.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "..."}
                </div>
              </div>

              <div style={{
                background: "rgba(59, 130, 246, 0.08)",
                border: "1px solid rgba(59, 130, 246, 0.2)",
                borderRadius: "10px",
                padding: "10px 14px"
              }}>
                <div style={{ fontSize: "0.74rem", color: "#93c5fd", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
                  {language === "si" ? "මූලික ආරම්භක සංචිතය (Base Reserve)" : "Base Opening Reserve"}
                </div>
                <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#eff6ff", fontFamily: "var(--font-mono)", marginTop: "2px" }}>
                  {curr}{fund ? fund.initialReserve.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "..."}
                </div>
              </div>
            </div>

            <form onSubmit={handleUpdateBalance}>
              <div className="modal-body" style={{ padding: "20px" }}>
                {/* Mode Selector Tabs */}
                <div style={{ marginBottom: "18px" }}>
                  <label className="form-label" style={{ marginBottom: "8px" }}>
                    {language === "si" ? "ශේෂ යාවත්කාලීන කිරීමේ ක්‍රමය තෝරන්න" : "Balance Adjustment Method"}
                  </label>
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "8px",
                    background: "rgba(0, 0, 0, 0.25)",
                    padding: "4px",
                    borderRadius: "10px",
                    border: "1px solid rgba(255, 255, 255, 0.06)"
                  }}>
                    <button
                      type="button"
                      style={{
                        padding: "10px 12px",
                        borderRadius: "8px",
                        border: "none",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        background: balanceForm.mode === "current" ? "var(--primary, #059669)" : "transparent",
                        color: balanceForm.mode === "current" ? "#ffffff" : "var(--text-muted)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "2px"
                      }}
                      onClick={() => setBalanceForm({
                        ...balanceForm,
                        mode: "current",
                        amount: fund ? fund.currentCashPool : 0
                      })}
                    >
                      <span>🎯 {language === "si" ? "වත්මන් මුදල් ශේෂය" : "Target Current Balance"}</span>
                      <span style={{ fontSize: "0.7rem", opacity: 0.85, fontWeight: 400 }}>
                        {language === "si" ? "සෘජුවම ශේෂය සැකසීම" : "Direct Cash Pool Value"}
                      </span>
                    </button>

                    <button
                      type="button"
                      style={{
                        padding: "10px 12px",
                        borderRadius: "8px",
                        border: "none",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        background: balanceForm.mode === "reserve" ? "var(--primary, #059669)" : "transparent",
                        color: balanceForm.mode === "reserve" ? "#ffffff" : "var(--text-muted)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "2px"
                      }}
                      onClick={() => setBalanceForm({
                        ...balanceForm,
                        mode: "reserve",
                        amount: fund ? fund.initialReserve : 45000,
                        recordTransaction: false
                      })}
                    >
                      <span>🏛️ {language === "si" ? "ආරම්භක මූලික සංචිතය" : "Base Opening Reserve"}</span>
                      <span style={{ fontSize: "0.7rem", opacity: 0.85, fontWeight: 400 }}>
                        {language === "si" ? "පදනම් ප්‍රාග්ධනය" : "Baseline Reserve Capital"}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="form-grid">
                  {/* Amount Input */}
                  <div className="form-group full">
                    <label className="form-label">
                      {balanceForm.mode === "current"
                        ? (language === "si" ? `නව වත්මන් මුදල් ශේෂය (${curr}) *` : `Target Current Cash Pool Balance (${curr}) *`)
                        : (language === "si" ? `නව ආරම්භක සංචිත මුදල (${curr}) *` : `New Base Capital Reserve (${curr}) *`)}
                    </label>
                    <div style={{ position: "relative" }}>
                      <span style={{
                        position: "absolute",
                        left: "14px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "var(--text-muted)",
                        fontWeight: 600,
                        fontFamily: "var(--font-mono)"
                      }}>
                        {curr}
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="form-input"
                        required
                        style={{ paddingLeft: "42px", fontSize: "1.1rem", fontFamily: "var(--font-mono)", fontWeight: 700 }}
                        placeholder="0.00"
                        value={balanceForm.amount}
                        onChange={(e) => setBalanceForm({ ...balanceForm, amount: e.target.value })}
                      />
                    </div>
                    <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "4px" }}>
                      {balanceForm.mode === "current"
                        ? (language === "si"
                            ? "සංගමයේ බැංකු ගිණුමේ හෝ සේප්පුවේ ඇති සැබෑ වත්මන් මුදල් ශේෂය මෙහි ඇතුළත් කරන්න."
                            : "Specify the exact balance presently available in the bank account or association safe.")
                        : (language === "si"
                            ? "සුබසාධක අරමුදල ආරම්භ කළ අවස්ථාවේ පැවති ආරම්භක සංචිතය මෙයින් සකස් වේ."
                            : "Adjusts the baseline opening capital from which all cumulative income and expenses are computed.")}
                    </span>
                  </div>

                  {/* Mode A Only: Transaction Log Checkbox & Diff Preview */}
                  {balanceForm.mode === "current" && (
                    <div className="form-group full">
                      {fund && !isNaN(Number(balanceForm.amount)) && (
                        <div style={{
                          padding: "10px 14px",
                          borderRadius: "8px",
                          marginBottom: "12px",
                          fontSize: "0.83rem",
                          background: (Number(balanceForm.amount) - fund.currentCashPool) >= 0 ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                          border: `1px solid ${(Number(balanceForm.amount) - fund.currentCashPool) >= 0 ? "rgba(16, 185, 129, 0.25)" : "rgba(239, 68, 68, 0.25)"}`,
                          color: (Number(balanceForm.amount) - fund.currentCashPool) >= 0 ? "#6ee7b7" : "#fca5a5",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center"
                        }}>
                          <span>{language === "si" ? "ශේෂ වෙනස (Difference):" : "Calculated Adjustment Difference:"}</span>
                          <strong style={{ fontFamily: "var(--font-mono)", fontSize: "0.95rem" }}>
                            {(Number(balanceForm.amount) - fund.currentCashPool) >= 0 ? "+" : ""}{curr}{(Number(balanceForm.amount) - fund.currentCashPool).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </strong>
                        </div>
                      )}

                      <div className="toggle-group" style={{ padding: "12px 14px", background: "rgba(0,0,0,0.2)", borderRadius: "8px" }}>
                        <div className="toggle-label">
                          <strong style={{ fontSize: "0.88rem" }}>
                            {language === "si" ? "මූල්‍ය ලෙජරයේ ගැලපුම් වාර්තාවක් සටහන් කරන්න" : "Log audit transaction in ledger"}
                          </strong>
                          <span style={{ fontSize: "0.76rem" }}>
                            {language === "si"
                              ? "වෙනස මුදල් ආදායමක් හෝ වියදමක් ලෙස මූල්‍ය ලෙජරයට (Finance Transactions) ස්වයංක්‍රීයව එක් වේ."
                              : "Automatically logs the variance as an audit income or expense voucher in the finance ledger."}
                          </span>
                        </div>
                        <input
                          type="checkbox"
                          style={{ width: "20px", height: "20px", cursor: "pointer" }}
                          checked={balanceForm.recordTransaction}
                          onChange={(e) => setBalanceForm({ ...balanceForm, recordTransaction: e.target.checked })}
                        />
                      </div>
                    </div>
                  )}

                  {/* Notes / Reason */}
                  <div className="form-group full">
                    <label className="form-label">
                      {language === "si" ? "විගණන සටහන් සහ හේතුව (විකල්පයි)" : "Audit Memo & Reference (Optional)"}
                    </label>
                    <textarea
                      className="form-textarea"
                      rows={2}
                      placeholder={language === "si" ? "උදා: 2026 සැප්තැම්බර් බැංකු ප්‍රකාශන ගැලපීම, විධායක කමිටු තීරණ අංක 12..." : "e.g. Bank statement reconciliation as of Sept 2026, committee resolution #12..."}
                      value={balanceForm.notes}
                      onChange={(e) => setBalanceForm({ ...balanceForm, notes: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowBalanceModal(false)}>
                  {t(language, "modalCancel")}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ minWidth: "160px", background: "linear-gradient(135deg, #059669 0%, #10b981 100%)" }}
                  disabled={balanceSubmitting}
                >
                  {balanceSubmitting ? (
                    <span>⏳ {language === "si" ? "යාවත්කාලීන වෙමින්..." : "Updating..."}</span>
                  ) : (
                    <span>✓ {language === "si" ? "ශේෂය තහවුරු කරන්න" : "Save Balance Update"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="footer">
        <p>
          {systemSettings.organizationName} • {language === "si" ? "සම්බන්ධිත ගිණුම:" : "Connected as"}{" "}
          <span>{currentUser.role === "admin" ? (language === "si" ? "පරිපාලක" : "ADMIN") : (language === "si" ? "සාමාජික" : "MEMBER")}</span>{" "}
          ({currentUser.name})
        </p>
      </footer>
    </div>
  );
}
