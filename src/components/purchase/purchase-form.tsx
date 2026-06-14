"use client";

import { useState, useCallback, useMemo } from "react";
import { ArrowLeft, ArrowRight, Check, Building2, User, MapPin, CreditCard, FileText } from "lucide-react";

interface PurchaseFormProps {
  plan: "premium" | "enterprise";
  onSubmit: (data: any) => Promise<void>;
  onBack: () => void;
}

export function PurchaseForm({ plan, onSubmit, onBack }: PurchaseFormProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    companyName: "", companySize: "", industry: "", website: "", taxId: "",
    fullName: "", email: "", phone: "", jobTitle: "",
    billingAddress: "", city: "", state: "", zipCode: "", country: "",
    paymentMethod: "credit_card", billingCycle: "monthly",
    expectedUsers: "", expectedChats: "", requiredFeatures: [] as string[], specialRequirements: "",
    agreedToTerms: false, agreedToPrivacy: false,
  });

  const totalSteps = useMemo(() => plan === "enterprise" ? 4 : 3, [plan]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  }, []);

  const handleNext = useCallback(() => {
    if (step < totalSteps) setStep(step + 1);
  }, [step, totalSteps]);

  const handleBack = useCallback(() => {
    if (step > 1) setStep(step - 1);
  }, [step]);

  const handleSubmit = useCallback(async () => {
    setLoading(true);
    try {
      await onSubmit({ plan, ...formData });
    } finally {
      setLoading(false);
    }
  }, [plan, formData, onSubmit]);

  const inputStyle = {
    width: "100%", padding: "0.75rem", border: "1px solid #d4f4ee",
    borderRadius: "6px", fontSize: "0.875rem",
  };

  const labelStyle = {
    display: "block", fontSize: "0.875rem", fontWeight: 500,
    color: "#0a1628", marginBottom: "0.5rem",
  };

  return (
    <div>
      {/* Progress Bar */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} style={{
              flex: 1, height: "4px", borderRadius: "2px",
              background: i < step ? "#0d8585" : "#d4f4ee",
            }} />
          ))}
        </div>
        <div style={{ fontSize: "0.875rem", color: "#5a7878" }}>
          Step {step} of {totalSteps}
        </div>
      </div>

      {/* Step 1: Company Information */}
      {step === 1 && (
        <div>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600, color: "#0a1628", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Building2 size={20} color="#0d8585" />
            Company Information
          </h2>
          <div style={{ display: "grid", gap: "1.25rem" }}>
            <div>
              <label style={labelStyle}>Company Name <span style={{ color: "#ef4444" }}>*</span></label>
              <input type="text" name="companyName" value={formData.companyName} onChange={handleInputChange} required style={inputStyle} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
              <div>
                <label style={labelStyle}>Company Size <span style={{ color: "#ef4444" }}>*</span></label>
                <select name="companySize" value={formData.companySize} onChange={handleInputChange} required style={inputStyle}>
                  <option value="">Select size</option>
                  <option value="1-10">1-10 employees</option>
                  <option value="11-50">11-50 employees</option>
                  <option value="51-200">51-200 employees</option>
                  <option value="201-500">201-500 employees</option>
                  <option value="501+">501+ employees</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Industry <span style={{ color: "#ef4444" }}>*</span></label>
                <select name="industry" value={formData.industry} onChange={handleInputChange} required style={inputStyle}>
                  <option value="">Select industry</option>
                  <option value="ecommerce">E-commerce</option>
                  <option value="saas">SaaS / Technology</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="finance">Finance</option>
                  <option value="education">Education</option>
                  <option value="real-estate">Real Estate</option>
                  <option value="marketing">Marketing / Agency</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
              <div>
                <label style={labelStyle}>Company Website</label>
                <input type="url" name="website" value={formData.website} onChange={handleInputChange} placeholder="https://yourcompany.com" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Tax ID / VAT Number</label>
                <input type="text" name="taxId" value={formData.taxId} onChange={handleInputChange} style={inputStyle} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Contact Information */}
      {step === 2 && (
        <div>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600, color: "#0a1628", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <User size={20} color="#0d8585" />
            Contact Information
          </h2>
          <div style={{ display: "grid", gap: "1.25rem" }}>
            <div>
              <label style={labelStyle}>Full Name <span style={{ color: "#ef4444" }}>*</span></label>
              <input type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} required style={inputStyle} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
              <div>
                <label style={labelStyle}>Email Address <span style={{ color: "#ef4444" }}>*</span></label>
                <input type="email" name="email" value={formData.email} onChange={handleInputChange} required style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Phone Number <span style={{ color: "#ef4444" }}>*</span></label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} required style={inputStyle} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Job Title <span style={{ color: "#ef4444" }}>*</span></label>
              <input type="text" name="jobTitle" value={formData.jobTitle} onChange={handleInputChange} required style={inputStyle} />
            </div>
            <div style={{ marginTop: "0.5rem" }}>
              <h3 style={{ fontSize: "0.95rem", fontWeight: 600, color: "#0a1628", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <MapPin size={18} color="#0d8585" />
                Billing Address
              </h3>
              <div style={{ display: "grid", gap: "1.25rem" }}>
                <div>
                  <label style={labelStyle}>Street Address <span style={{ color: "#ef4444" }}>*</span></label>
                  <input type="text" name="billingAddress" value={formData.billingAddress} onChange={handleInputChange} required style={inputStyle} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.25rem" }}>
                  <div>
                    <label style={labelStyle}>City <span style={{ color: "#ef4444" }}>*</span></label>
                    <input type="text" name="city" value={formData.city} onChange={handleInputChange} required style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>State / Province <span style={{ color: "#ef4444" }}>*</span></label>
                    <input type="text" name="state" value={formData.state} onChange={handleInputChange} required style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>ZIP / Postal Code <span style={{ color: "#ef4444" }}>*</span></label>
                    <input type="text" name="zipCode" value={formData.zipCode} onChange={handleInputChange} required style={inputStyle} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Country <span style={{ color: "#ef4444" }}>*</span></label>
                  <select name="country" value={formData.country} onChange={handleInputChange} required style={inputStyle}>
                    <option value="">Select country</option>
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                    <option value="GB">United Kingdom</option>
                    <option value="AU">Australia</option>
                    <option value="DE">Germany</option>
                    <option value="FR">France</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Payment & Requirements */}
      {step === 3 && (
        <div>
          {plan === "premium" ? (
            <>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 600, color: "#0a1628", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <CreditCard size={20} color="#0d8585" />
                Payment Information
              </h2>
              <div style={{ display: "grid", gap: "1.25rem" }}>
                <div>
                  <label style={labelStyle}>Payment Method <span style={{ color: "#ef4444" }}>*</span></label>
                  <select name="paymentMethod" value={formData.paymentMethod} onChange={handleInputChange} required style={inputStyle}>
                    <option value="credit_card">Credit Card</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="paypal">PayPal</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Billing Cycle <span style={{ color: "#ef4444" }}>*</span></label>
                  <select name="billingCycle" value={formData.billingCycle} onChange={handleInputChange} required style={inputStyle}>
                    <option value="monthly">Monthly - $29/month</option>
                    <option value="yearly">Yearly - $290/year (Save $58)</option>
                  </select>
                </div>
                <div style={{ background: "#edfaf7", padding: "1rem", borderRadius: "8px", border: "1px solid #d4f4ee" }}>
                  <div style={{ display: "flex", alignItems: "start", gap: "0.5rem" }}>
                    <input type="checkbox" name="agreedToTerms" checked={formData.agreedToTerms} onChange={handleInputChange} required />
                    <label style={{ fontSize: "0.875rem", color: "#0a1628" }}>
                      I agree to the <a href="/terms" style={{ color: "#0d8585" }}>Terms of Service</a> <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                  </div>
                  <div style={{ display: "flex", alignItems: "start", gap: "0.5rem", marginTop: "0.75rem" }}>
                    <input type="checkbox" name="agreedToPrivacy" checked={formData.agreedToPrivacy} onChange={handleInputChange} required />
                    <label style={{ fontSize: "0.875rem", color: "#0a1628" }}>
                      I agree to the <a href="/privacy" style={{ color: "#0d8585" }}>Privacy Policy</a> <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 600, color: "#0a1628", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <FileText size={20} color="#0d8585" />
                Additional Requirements
              </h2>
              <div style={{ display: "grid", gap: "1.25rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
                  <div>
                    <label style={labelStyle}>Expected Number of Users</label>
                    <input type="text" name="expectedUsers" value={formData.expectedUsers} onChange={handleInputChange} placeholder="e.g., 50 agents" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Expected Monthly Chats</label>
                    <input type="text" name="expectedChats" value={formData.expectedChats} onChange={handleInputChange} placeholder="e.g., 10,000 chats/month" style={inputStyle} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Special Requirements</label>
                  <textarea name="specialRequirements" value={formData.specialRequirements} onChange={handleInputChange} rows={4} placeholder="Describe any specific needs, integrations, or compliance requirements..." style={{ ...inputStyle, resize: "vertical" }} />
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Step 4: Review (Enterprise only) */}
      {step === 4 && plan === "enterprise" && (
        <div>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600, color: "#0a1628", marginBottom: "1.5rem" }}>
            Review Your Information
          </h2>
          <div style={{ background: "#f8fbfb", padding: "1.5rem", borderRadius: "8px", marginBottom: "1.5rem" }}>
            <h3 style={{ fontSize: "0.9rem", fontWeight: 600, color: "#0a1628", marginBottom: "0.75rem" }}>Company</h3>
            <p style={{ fontSize: "0.875rem", color: "#5a7878", marginBottom: "0.25rem" }}>{formData.companyName}</p>
            <p style={{ fontSize: "0.875rem", color: "#5a7878" }}>{formData.companySize} | {formData.industry}</p>
          </div>
          <div style={{ background: "#f8fbfb", padding: "1.5rem", borderRadius: "8px", marginBottom: "1.5rem" }}>
            <h3 style={{ fontSize: "0.9rem", fontWeight: 600, color: "#0a1628", marginBottom: "0.75rem" }}>Contact</h3>
            <p style={{ fontSize: "0.875rem", color: "#5a7878", marginBottom: "0.25rem" }}>{formData.fullName} - {formData.jobTitle}</p>
            <p style={{ fontSize: "0.875rem", color: "#5a7878", marginBottom: "0.25rem" }}>{formData.email}</p>
            <p style={{ fontSize: "0.875rem", color: "#5a7878" }}>{formData.phone}</p>
          </div>
          <div style={{ background: "#edfaf7", padding: "1rem", borderRadius: "8px", border: "1px solid #d4f4ee" }}>
            <div style={{ display: "flex", alignItems: "start", gap: "0.5rem" }}>
              <input type="checkbox" name="agreedToTerms" checked={formData.agreedToTerms} onChange={handleInputChange} required />
              <label style={{ fontSize: "0.875rem", color: "#0a1628" }}>
                I agree to the <a href="/terms" style={{ color: "#0d8585" }}>Terms of Service</a> <span style={{ color: "#ef4444" }}>*</span>
              </label>
            </div>
            <div style={{ display: "flex", alignItems: "start", gap: "0.5rem", marginTop: "0.75rem" }}>
              <input type="checkbox" name="agreedToPrivacy" checked={formData.agreedToPrivacy} onChange={handleInputChange} required />
              <label style={{ fontSize: "0.875rem", color: "#0a1628" }}>
                I agree to the <a href="/privacy" style={{ color: "#0d8585" }}>Privacy Policy</a> <span style={{ color: "#ef4444" }}>*</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: "flex", gap: "1rem", marginTop: "2rem", paddingTop: "2rem", borderTop: "1px solid #d4f4ee" }}>
        {step > 1 && (
          <button
            onClick={handleBack}
            style={{
              padding: "0.75rem 1.5rem", borderRadius: "8px",
              background: "transparent", border: "1px solid #d4f4ee",
              color: "#0a1628", fontSize: "0.875rem", fontWeight: 600,
              cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem",
            }}
          >
            <ArrowLeft size={18} />
            Previous
          </button>
        )}
        {step < totalSteps ? (
          <button
            onClick={handleNext}
            style={{
              marginLeft: "auto", padding: "0.75rem 1.5rem", borderRadius: "8px",
              background: "#0d8585", border: "none",
              color: "#fff", fontSize: "0.875rem", fontWeight: 600,
              cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem",
            }}
          >
            Continue
            <ArrowRight size={18} />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={loading || !formData.agreedToTerms || !formData.agreedToPrivacy}
            style={{
              marginLeft: "auto", padding: "0.75rem 2rem", borderRadius: "8px",
              background: loading ? "#8aa3a3" : "#0d8585", border: "none",
              color: "#fff", fontSize: "0.875rem", fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Processing..." : plan === "enterprise" ? "Submit Request" : "Complete Purchase"}
          </button>
        )}
      </div>
    </div>
  );
}
