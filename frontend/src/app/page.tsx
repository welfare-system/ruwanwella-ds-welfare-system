"use client";

import { useEffect, useState } from "react";
import { Language } from "../lib/i18n";
import { API_BASE } from "../lib/api";

// ── Types ───────────────────────────────────────────────────────────────────
interface MemberFormData {
  name: string;
  email: string;
  phone: string;
  department: string;
  role: string;
  monthlyContribution: number;
  notes: string;
}

interface RegisteredMemberInfo {
  id: string;
  memberId: string;
  name: string;
  email: string | null;
  phone: string;
  department: string;
  role: string;
  monthlyContribution: number;
  joinDate: string;
}

const DEPARTMENTS = [
  { value: "Logistics & Transport", labelSi: "ප්‍රවාහන සහ සැපයුම් අංශය", labelEn: "Logistics & Transport" },
  { value: "Medical Operations", labelSi: "වෛද්‍ය මෙහෙයුම් අංශය", labelEn: "Medical Operations" },
  { value: "Information Technology", labelSi: "තොරතුරු තාක්ෂණ (IT) අංශය", labelEn: "Information Technology" },
  { value: "Human Resources", labelSi: "මානව සම්පත් අංශය", labelEn: "Human Resources" },
  { value: "Field Research", labelSi: "ක්ෂේත්‍ර පර්යේෂණ අංශය", labelEn: "Field Research" },
  { value: "Administration", labelSi: "පරිපාලන අංශය", labelEn: "Administration" },
  { value: "Operations", labelSi: "මෙහෙයුම් අංශය", labelEn: "Operations" },
  { value: "Finance & Accounts", labelSi: "මුදල් සහ ගිණුම් අංශය", labelEn: "Finance & Accounts" },
];

const ROLES = [
  { value: "Member", labelSi: "සාමාන්‍ය සාමාජික (General Member)", labelEn: "General Member" },
  { value: "Executive", labelSi: "විධායක කමිටු සාමාජික (Executive Committee)", labelEn: "Executive Committee" },
  { value: "Treasurer", labelSi: "භාණ්ඩාගාරික / විගණක (Treasurer / Auditor)", labelEn: "Treasurer / Auditor" },
  { value: "Secretary", labelSi: "ලේකම් (Secretary)", labelEn: "Secretary" },
  { value: "Chairperson", labelSi: "සභාපති (Chairperson)", labelEn: "Chairperson" },
];

export default function NewMemberRegistrationPage() {
  // ── Language State ────────────────────────────────────────────────────────
  const [language, setLanguage] = useState<Language>("si");

  // ── Form State ────────────────────────────────────────────────────────────
  const [formData, setFormData] = useState<MemberFormData>({
    name: "",
    email: "",
    phone: "",
    department: "Logistics & Transport",
    role: "Member",
    monthlyContribution: 100,
    notes: "",
  });

  // ── Feedback & Async States ───────────────────────────────────────────────
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverOnline, setServerOnline] = useState<boolean | null>(null);
  const [alertMessage, setAlertMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [registeredMember, setRegisteredMember] = useState<RegisteredMemberInfo | null>(null);
  const [currencySymbol, setCurrencySymbol] = useState("Rs.");

  // ── Load Preferences & Check Backend ──────────────────────────────────────
  useEffect(() => {
    // Restore language preference
    const savedLang = localStorage.getItem("welfare_language") as Language | null;
    if (savedLang === "en" || savedLang === "si") {
      setLanguage(savedLang);
    }

    // Health check and settings fetch
    const checkBackend = async () => {
      try {
        const [healthRes, settingsRes] = await Promise.all([
          fetch(`${API_BASE}/api/health`),
          fetch(`${API_BASE}/api/settings/system`),
        ]);

        if (healthRes.ok) {
          setServerOnline(true);
        } else {
          setServerOnline(false);
        }

        if (settingsRes.ok) {
          const json = await settingsRes.json();
          if (json.data) {
            if (json.data.currencySymbol) {
              setCurrencySymbol(json.data.currencySymbol);
            }
            if (json.data.defaultContributionRate) {
              setFormData((prev) => ({
                ...prev,
                monthlyContribution: prev.monthlyContribution === 100 ? json.data.defaultContributionRate : prev.monthlyContribution,
              }));
            }
          }
        }
      } catch (err) {
        console.warn("Backend connection check failed:", err);
        setServerOnline(false);
      }
    };

    checkBackend();
  }, []);

  const changeLanguage = (newLang: Language) => {
    setLanguage(newLang);
    localStorage.setItem("welfare_language", newLang);
  };

  const handleClearForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      department: "Logistics & Transport",
      role: "Member",
      monthlyContribution: 100,
      notes: "",
    });
    setAlertMessage(null);
  };

  // ── Form Submission ───────────────────────────────────────────────────────
  const handleRegisterMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setAlertMessage(null);

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("welfare_auth_token") : null;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE}/api/members`, {
        method: "POST",
        headers,
        body: JSON.stringify(formData),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || (language === "si" ? "සාමාජිකයා ලියාපදිංචි කිරීම අසාර්ථක විය." : "Failed to register member."));
      }

      const created: RegisteredMemberInfo = json.data;
      setRegisteredMember(created);
      setAlertMessage({
        type: "success",
        text: language === "si"
          ? `${created.name} (${created.memberId}) සාමාජිකයා සාර්ථකව ලියාපදිංචි කරන ලදී!`
          : `Member ${created.name} (${created.memberId}) was registered successfully!`,
      });

      // Clear input fields for next entry
      setFormData({
        name: "",
        email: "",
        phone: "",
        department: "Logistics & Transport",
        role: "Member",
        monthlyContribution: 100,
        notes: "",
      });

      // Scroll to top of the form smoothly to see confirmation
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setAlertMessage({ type: "error", text: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="app-container w-full px-4 sm:px-6 lg:px-8">
      {/* ── Top Bar: Brand, Connectivity & Language Switcher ─────────────── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
          marginBottom: "28px",
          padding: "16px 24px",
          background: "var(--bg-card)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div
            style={{
              width: "46px",
              height: "46px",
              borderRadius: "var(--radius-md)",
              background: "var(--gradient-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 16px rgba(99, 102, 241, 0.4)",
              flexShrink: 0,
            }}
          >
            <svg
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              style={{ width: "26px", height: "26px", color: "#ffffff" }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
          </div>
          <div>
            <h1
              style={{
                fontSize: "1.2rem",
                fontWeight: 800,
                letterSpacing: "-0.02em",
                color: "var(--text-primary)",
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              {language === "si" ? "කාර්ය මණ්ඩල සුබසාධක සංගමය" : "Staff Welfare Association"}
            </h1>
            <p
              style={{
                fontSize: "0.82rem",
                color: "var(--text-muted)",
                margin: "4px 0 0 0",
              }}
            >
              {language === "si" ? "සාමාජික කළමනාකරණ සහ ලියාපදිංචි කිරීමේ පද්ධතිය" : "Official Member Enrollment & Fund Management System"}
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          {/* Cloud Health Indicator */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "5px 12px",
              borderRadius: "9999px",
              fontSize: "0.78rem",
              fontWeight: 600,
              background: serverOnline ? "rgba(16, 185, 129, 0.12)" : "rgba(245, 158, 11, 0.12)",
              border: serverOnline ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(245, 158, 11, 0.3)",
              color: serverOnline ? "#10b981" : "#f59e0b",
            }}
          >
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: serverOnline ? "#10b981" : "#f59e0b",
                boxShadow: serverOnline ? "0 0 8px #10b981" : "none",
              }}
            />
            <span>
              {serverOnline
                ? (language === "si" ? "පද්ධතිය සක්‍රියයි" : "Cloud Online")
                : (language === "si" ? "සම්බන්ධ වෙමින්..." : "Connecting...")}
            </span>
          </div>

          {/* Language Toggle */}
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
      </div>

      {/* ── Global Notification Banner ───────────────────────────────────── */}
      {alertMessage && (
        <div className={`alert-banner alert-${alertMessage.type}`} style={{ marginBottom: "24px" }}>
          <span style={{ fontSize: "1.1rem" }}>
            {alertMessage.type === "success" ? "✓" : alertMessage.type === "error" ? "⚠" : "ℹ"}
          </span>
          <span style={{ flex: 1, fontWeight: 500 }}>{alertMessage.text}</span>
          <button
            type="button"
            onClick={() => setAlertMessage(null)}
            style={{
              background: "transparent",
              border: "none",
              color: "inherit",
              cursor: "pointer",
              padding: "2px 8px",
              fontSize: "1rem",
              opacity: 0.8,
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Success Confirmation Card (When a Member is Registered) ─────── */}
      {registeredMember && (
        <div
          style={{
            background: "rgba(16, 185, 129, 0.08)",
            border: "1px solid rgba(16, 185, 129, 0.35)",
            borderRadius: "var(--radius-lg)",
            padding: "24px",
            marginBottom: "30px",
            boxShadow: "0 8px 32px rgba(16, 185, 129, 0.12)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              flexWrap: "wrap",
              gap: "16px",
              marginBottom: "18px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  background: "rgba(16, 185, 129, 0.2)",
                  color: "#34d399",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.4rem",
                  fontWeight: 800,
                  border: "1px solid rgba(16, 185, 129, 0.4)",
                }}
              >
                ✓
              </div>
              <div>
                <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#34d399", margin: 0 }}>
                  {language === "si" ? "සාමාජික ලියාපදිංචිය සාර්ථකයි!" : "Member Successfully Registered!"}
                </h2>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: "3px 0 0 0" }}>
                  {language === "si"
                    ? "සාමාජිකයාගේ තොරතුරු සුබසාධක දත්ත සමුදායට ඇතුළත් කර අංකයක් නිකුත් කරන ලදී."
                    : "Member details have been securely saved and enrolled into the welfare registry."}
                </p>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setRegisteredMember(null)}
            >
              {language === "si" ? "+ තවත් සාමාජිකයෙකු ලියාපදිංචි කරන්න" : "+ Register Another Member"}
            </button>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "14px",
              background: "rgba(10, 14, 25, 0.6)",
              padding: "16px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <div>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", display: "block" }}>
                {language === "si" ? "සාමාජික අංකය" : "Member ID"}
              </span>
              <strong style={{ fontFamily: "var(--font-mono)", fontSize: "1.2rem", color: "#a5b4fc" }}>
                {registeredMember.memberId}
              </strong>
            </div>

            <div>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", display: "block" }}>
                {language === "si" ? "සාමාජික නම" : "Full Name"}
              </span>
              <strong style={{ fontSize: "1rem", color: "var(--text-primary)" }}>
                {registeredMember.name}
              </strong>
            </div>

            <div>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", display: "block" }}>
                {language === "si" ? "දෙපාර්තමේන්තුව" : "Department"}
              </span>
              <span style={{ fontSize: "0.92rem", color: "var(--text-secondary)" }}>
                {registeredMember.department}
              </span>
            </div>

            <div>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", display: "block" }}>
                {language === "si" ? "දුරකථන අංකය" : "Phone"}
              </span>
              <span style={{ fontSize: "0.92rem", color: "var(--text-secondary)" }}>
                {registeredMember.phone}
              </span>
            </div>

            <div>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", display: "block" }}>
                {language === "si" ? "මාසික දායකත්ව පොරොන්දුව" : "Monthly Pledge"}
              </span>
              <strong style={{ fontFamily: "var(--font-mono)", fontSize: "1rem", color: "#34d399" }}>
                {currencySymbol}{registeredMember.monthlyContribution.toLocaleString()}{language === "si" ? "/මසකට" : "/mo"}
              </strong>
            </div>

            <div>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", display: "block" }}>
                {language === "si" ? "ලියාපදිංචි දිනය" : "Enrollment Date"}
              </span>
              <span style={{ fontSize: "0.92rem", color: "var(--text-secondary)" }}>
                {registeredMember.joinDate}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Standalone New Member Registration Form Card ─────────────────── */}
      <div
        className="glass-panel"
        style={{
          width: "100%",
          maxWidth: "100%",
          padding: "32px 36px",
          background: "var(--bg-card)",
          border: "1px solid var(--border-medium)",
          boxShadow: "var(--shadow-md), var(--shadow-glow)",
        }}
      >
        <div
          className="panel-header"
          style={{
            borderBottom: "1px solid var(--border-subtle)",
            paddingBottom: "22px",
            marginBottom: "30px",
          }}
        >
          <div className="panel-title-group">
            <h2
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                fontSize: "1.45rem",
                fontWeight: 800,
                color: "var(--text-primary)",
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "36px",
                  height: "36px",
                  borderRadius: "var(--radius-sm)",
                  background: "rgba(99, 102, 241, 0.18)",
                  color: "#a5b4fc",
                  fontSize: "1.2rem",
                }}
              >
                👤
              </span>
              {language === "si" ? "නව සුබසාධක සාමාජිකයෙකු ලියාපදිංචි කිරීමේ පෝරමය" : "New Member Registration Form"}
            </h2>
            <p style={{ marginTop: "6px", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
              {language === "si"
                ? "නව සාමාජික තොරතුරු සහ මාසික දායකත්ව පොරොන්දුව ඇතුළත් කර කාර්ය මණ්ඩල සුබසාධක අරමුදලට ලියාපදිංචි කරන්න."
                : "Enter the prospective member's details and contribution pledge to enroll them in the staff welfare fund."}
            </p>
          </div>
        </div>

        <form onSubmit={handleRegisterMember}>
          {/* Section 1: Personal & Contact Information */}
          <div style={{ marginBottom: "28px" }}>
            <h3
              style={{
                fontSize: "1rem",
                fontWeight: 700,
                color: "#818cf8",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: "16px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span>📋</span>
              {language === "si" ? "1. පුද්ගලික සහ සබඳතා තොරතුරු" : "1. Personal & Contact Information"}
            </h3>

            <div className="form-grid">
              {/* Full Name */}
              <div className="form-group full">
                <label className="form-label" htmlFor="member-name">
                  {language === "si" ? "සම්පූර්ණ නම *" : "Full Name *"}
                </label>
                <input
                  id="member-name"
                  type="text"
                  className="form-input"
                  placeholder={language === "si" ? "උදා: කේ. ඒ. නිමල් පෙරේරා මහතා" : "e.g. Dr. Jane Foster"}
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              {/* Email (Optional) */}
              <div className="form-group">
                <label className="form-label" htmlFor="member-email">
                  {language === "si" ? "විද්‍යුත් තැපැල් ලිපිනය (විකල්පයි)" : "Email Address (Optional)"}
                </label>
                <input
                  id="member-email"
                  type="email"
                  className="form-input"
                  placeholder="nimal.perera@org.internal"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                <span style={{ fontSize: "0.74rem", color: "var(--text-muted)", marginTop: "2px" }}>
                  {language === "si" ? "ලිපිනය නොමැති නම් හිස්ව තැබිය හැක." : "May be left blank if member has no official email."}
                </span>
              </div>

              {/* Phone Number */}
              <div className="form-group">
                <label className="form-label" htmlFor="member-phone">
                  {language === "si" ? "දුරකථන අංකය *" : "Phone Number *"}
                </label>
                <input
                  id="member-phone"
                  type="tel"
                  className="form-input"
                  placeholder="077 123 4567"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
                <span style={{ fontSize: "0.74rem", color: "var(--text-muted)", marginTop: "2px" }}>
                  {language === "si" ? "SMS සහ නිල දැනුම්දීම් සඳහා භාවිතා වේ." : "Used for official SMS and emergency notices."}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Department & Role */}
          <div style={{ marginBottom: "28px" }}>
            <h3
              style={{
                fontSize: "1rem",
                fontWeight: 700,
                color: "#818cf8",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: "16px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span>🏢</span>
              {language === "si" ? "2. දෙපාර්තමේන්තුව සහ සංගමයේ තනතුර" : "2. Department & Welfare Role"}
            </h3>

            <div className="form-grid">
              {/* Department */}
              <div className="form-group">
                <label className="form-label" htmlFor="member-dept">
                  {language === "si" ? "දෙපාර්තමේන්තුව / අංශය *" : "Department / Division *"}
                </label>
                <select
                  id="member-dept"
                  className="form-select"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept.value} value={dept.value}>
                      {language === "si" ? dept.labelSi : dept.labelEn}
                    </option>
                  ))}
                </select>
              </div>

              {/* Role */}
              <div className="form-group">
                <label className="form-label" htmlFor="member-role">
                  {language === "si" ? "සුබසාධක සංගමයේ තනතුර *" : "Role in Welfare Association *"}
                </label>
                <select
                  id="member-role"
                  className="form-select"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {language === "si" ? r.labelSi : r.labelEn}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Financial Pledge & Affiliation Notes */}
          <div style={{ marginBottom: "32px" }}>
            <h3
              style={{
                fontSize: "1rem",
                fontWeight: 700,
                color: "#818cf8",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: "16px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span>💰</span>
              {language === "si" ? "3. මාසික දායකත්ව පොරොන්දුව සහ සටහන්" : "3. Monthly Contribution Pledge & Notes"}
            </h3>

            <div className="form-grid">
              {/* Monthly Contribution */}
              <div className="form-group">
                <label className="form-label" htmlFor="member-contribution">
                  {language === "si"
                    ? `මාසික දායකත්ව මුදල (${currencySymbol}) *`
                    : `Monthly Contribution Pledge (${currencySymbol}) *`}
                </label>
                <input
                  id="member-contribution"
                  type="number"
                  min="10"
                  step="10"
                  className="form-input"
                  required
                  value={formData.monthlyContribution}
                  onChange={(e) => setFormData({ ...formData, monthlyContribution: Number(e.target.value) })}
                />
                <span style={{ fontSize: "0.74rem", color: "var(--text-muted)", marginTop: "2px" }}>
                  {language === "si"
                    ? `වැටුපෙන් හෝ සෘජුව අය කෙරෙන අවම මුදල ${currencySymbol}10 කි.`
                    : `Regular monthly contribution amount (minimum ${currencySymbol}10).`}
                </span>
              </div>

              {/* Notes */}
              <div className="form-group full">
                <label className="form-label" htmlFor="member-notes">
                  {language === "si" ? "අමතර සටහන් / විශේෂ තොරතුරු" : "Additional Notes / Remarks"}
                </label>
                <textarea
                  id="member-notes"
                  className="form-textarea"
                  placeholder={
                    language === "si"
                      ? "විශේෂ සටහන්, බඳවා ගැනීමේ පසුබිම හෝ අනුබද්ධතා විස්තර..."
                      : "Special notes, recruitment background, or membership remarks..."
                  }
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Form Action Controls */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              gap: "14px",
              paddingTop: "24px",
              borderTop: "1px solid var(--border-subtle)",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleClearForm}
              disabled={isSubmitting}
            >
              {language === "si" ? "පිරිසිදු කරන්න" : "Clear Form"}
            </button>

            <button
              type="submit"
              className="btn btn-primary"
              style={{
                minWidth: "220px",
                padding: "12px 24px",
                fontSize: "0.95rem",
                fontWeight: 700,
              }}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⏳</span>
                  <span>{language === "si" ? "ලියාපදිංචි වෙමින් පවතී..." : "Registering Member..."}</span>
                </>
              ) : (
                <>
                  <span>✓</span>
                  <span>{language === "si" ? "සුරකින්න සහ ලියාපදිංචි කරන්න" : "Save & Register Member"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="footer" style={{ marginTop: "40px" }}>
        <p>
          {language === "si" ? "කාර්ය මණ්ඩල සුබසාධක අරමුදල් කළමනාකරණ පද්ධතිය" : "Staff Welfare Fund Management System"} •{" "}
          <span>Ruwanwella DS Welfare System</span>
        </p>
      </footer>
    </div>
  );
}
