"use client";

import { useState, useMemo, useCallback } from "react";
import { 
  Building2, Mail, Phone, MapPin, Calendar, CheckCircle, 
  Clock, XCircle, Ban, ChevronDown, ChevronUp, ExternalLink,
  Filter, Search, Download
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface PurchaseRequest {
  id: string;
  order_id: string;
  user_id: string | null;
  plan_type: "premium" | "enterprise";
  status: string;
  company_name: string;
  company_size: string | null;
  industry: string | null;
  website: string | null;
  tax_id: string | null;
  full_name: string;
  email: string;
  phone: string;
  job_title: string | null;
  billing_address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  country: string | null;
  payment_method: string | null;
  billing_cycle: string | null;
  expected_users: string | null;
  expected_chats: string | null;
  required_features: string[] | null;
  special_requirements: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

interface PurchaseRequestsListProps {
  initialRequests: PurchaseRequest[];
}

export function PurchaseRequestsList({ initialRequests }: PurchaseRequestsListProps) {
  const [requests, setRequests] = useState(initialRequests);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Memoize expensive functions
  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case "pending_review": return { bg: "#fef3c7", text: "#92400e", icon: Clock };
      case "pending_payment": return { bg: "#dbeafe", text: "#1e40af", icon: Clock };
      case "approved": return { bg: "#d1fae5", text: "#065f46", icon: CheckCircle };
      case "completed": return { bg: "#d1fae5", text: "#065f46", icon: CheckCircle };
      case "cancelled": return { bg: "#f3f4f6", text: "#374151", icon: Ban };
      case "rejected": return { bg: "#fee2e2", text: "#991b1b", icon: XCircle };
      default: return { bg: "#f3f4f6", text: "#374151", icon: Clock };
    }
  }, []);

  const getStatusLabel = useCallback((status: string) => {
    return status.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  }, []);

  // Memoize filtered requests
  const filteredRequests = useMemo(() => {
    return requests.filter(req => {
      const matchesStatus = statusFilter === "all" || req.status === statusFilter;
      const matchesPlan = planFilter === "all" || req.plan_type === planFilter;
      const matchesSearch = 
        req.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.order_id.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesStatus && matchesPlan && matchesSearch;
    });
  }, [requests, statusFilter, planFilter, searchQuery]);

  // Memoize stats
  const stats = useMemo(() => ({
    total: requests.length,
    pending: requests.filter(r => r.status === "pending_review").length,
    approved: requests.filter(r => r.status === "approved" || r.status === "completed").length,
    premium: requests.filter(r => r.plan_type === "premium").length,
    enterprise: requests.filter(r => r.plan_type === "enterprise").length,
  }), [requests]);

  // Optimistic status update with instant UI feedback
  const updateStatus = useCallback(async (requestId: string, newStatus: string) => {
    // Optimistic update - update UI immediately
    const previousRequests = [...requests];
    
    setRequests(prev => 
      prev.map(req => 
        req.id === requestId 
          ? { ...req, status: newStatus, updated_at: new Date().toISOString() } 
          : req
      )
    );

    try {
      const response = await fetch("/api/purchase/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, status: newStatus }),
      });

      if (!response.ok) {
        // Rollback on error
        setRequests(previousRequests);
        alert("Failed to update status. Please try again.");
      }
    } catch (error) {
      // Rollback on error
      setRequests(previousRequests);
      console.error("Failed to update status:", error);
      alert("Network error. Please check your connection.");
    }
  }, [requests]);

  // Toggle expand with useCallback
  const toggleExpand = useCallback((id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  }, []);

  return (
    <div>
      {/* Stats Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "1rem",
        marginBottom: "2rem",
      }}>
        <div style={{
          background: "#fff",
          padding: "1.5rem",
          borderRadius: "12px",
          border: "1px solid #d4f4ee",
        }}>
          <div style={{ fontSize: "0.75rem", color: "#5a7878", marginBottom: "0.5rem" }}>
            Total Requests
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 700, color: "#0a1628" }}>
            {stats.total}
          </div>
        </div>

        <div style={{
          background: "#fff",
          padding: "1.5rem",
          borderRadius: "12px",
          border: "1px solid #d4f4ee",
        }}>
          <div style={{ fontSize: "0.75rem", color: "#5a7878", marginBottom: "0.5rem" }}>
            Pending Review
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 700, color: "#f59e0b" }}>
            {stats.pending}
          </div>
        </div>

        <div style={{
          background: "#fff",
          padding: "1.5rem",
          borderRadius: "12px",
          border: "1px solid #d4f4ee",
        }}>
          <div style={{ fontSize: "0.75rem", color: "#5a7878", marginBottom: "0.5rem" }}>
            Premium Plans
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 700, color: "#0d8585" }}>
            {stats.premium}
          </div>
        </div>

        <div style={{
          background: "#fff",
          padding: "1.5rem",
          borderRadius: "12px",
          border: "1px solid #d4f4ee",
        }}>
          <div style={{ fontSize: "0.75rem", color: "#5a7878", marginBottom: "0.5rem" }}>
            Enterprise Plans
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 700, color: "#7c3aed" }}>
            {stats.enterprise}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{
        background: "#fff",
        padding: "1.5rem",
        borderRadius: "12px",
        border: "1px solid #d4f4ee",
        marginBottom: "1.5rem",
      }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr auto auto",
          gap: "1rem",
          alignItems: "center",
        }}>
          {/* Search */}
          <div style={{ position: "relative" }}>
            <Search size={18} style={{
              position: "absolute",
              left: "0.75rem",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#8aa3a3",
            }} />
            <input
              type="text"
              placeholder="Search by company, email, or order ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "0.75rem 0.75rem 0.75rem 2.5rem",
                border: "1px solid #d4f4ee",
                borderRadius: "8px",
                fontSize: "0.875rem",
              }}
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: "0.75rem",
              border: "1px solid #d4f4ee",
              borderRadius: "8px",
              fontSize: "0.875rem",
              minWidth: "150px",
            }}
          >
            <option value="all">All Status</option>
            <option value="pending_review">Pending Review</option>
            <option value="pending_payment">Pending Payment</option>
            <option value="approved">Approved</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="rejected">Rejected</option>
          </select>

          {/* Plan Filter */}
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            style={{
              padding: "0.75rem",
              border: "1px solid #d4f4ee",
              borderRadius: "8px",
              fontSize: "0.875rem",
              minWidth: "150px",
            }}
          >
            <option value="all">All Plans</option>
            <option value="premium">Premium</option>
            <option value="enterprise">Enterprise</option>
          </select>
        </div>
      </div>

      {/* Requests List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {filteredRequests.length === 0 ? (
          <div style={{
            background: "#fff",
            padding: "3rem",
            borderRadius: "12px",
            border: "1px solid #d4f4ee",
            textAlign: "center",
          }}>
            <p style={{ color: "#5a7878" }}>No purchase requests found</p>
          </div>
        ) : (
          filteredRequests.map((request) => {
            const statusInfo = getStatusColor(request.status);
            const StatusIcon = statusInfo.icon;
            const isExpanded = expandedId === request.id;

            return (
              <div
                key={request.id}
                style={{
                  background: "#fff",
                  borderRadius: "12px",
                  border: "1px solid #d4f4ee",
                  overflow: "hidden",
                }}
              >
                {/* Header */}
                <div
                  style={{
                    padding: "1.5rem",
                    display: "grid",
                    gridTemplateColumns: "auto 1fr auto auto auto",
                    gap: "1.5rem",
                    alignItems: "center",
                    cursor: "pointer",
                  }}
                  onClick={() => toggleExpand(request.id)}
                >
                  {/* Company Icon */}
                  <div style={{
                    width: "48px",
                    height: "48px",
                    background: "#edfaf7",
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                    <Building2 size={24} color="#0d8585" />
                  </div>

                  {/* Info */}
                  <div>
                    <div style={{
                      fontSize: "0.95rem",
                      fontWeight: 600,
                      color: "#0a1628",
                      marginBottom: "0.25rem",
                    }}>
                      {request.company_name}
                    </div>
                    <div style={{
                      fontSize: "0.8rem",
                      color: "#5a7878",
                      display: "flex",
                      gap: "1rem",
                      flexWrap: "wrap",
                    }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                        <Mail size={12} />
                        {request.email}
                      </span>
                      <span>Order: {request.order_id}</span>
                    </div>
                  </div>

                  {/* Plan Badge */}
                  <div style={{
                    padding: "0.4rem 0.75rem",
                    borderRadius: "6px",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    background: request.plan_type === "premium" ? "#e0f2fe" : "#ede9fe",
                    color: request.plan_type === "premium" ? "#0369a1" : "#6b21a8",
                  }}>
                    {request.plan_type.toUpperCase()}
                  </div>

                  {/* Status Badge */}
                  <div style={{
                    padding: "0.4rem 0.75rem",
                    borderRadius: "6px",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    background: statusInfo.bg,
                    color: statusInfo.text,
                    display: "flex",
                    alignItems: "center",
                    gap: "0.35rem",
                  }}>
                    <StatusIcon size={12} />
                    {getStatusLabel(request.status)}
                  </div>

                  {/* Expand Icon */}
                  <div>
                    {isExpanded ? <ChevronUp size={20} color="#5a7878" /> : <ChevronDown size={20} color="#5a7878" />}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div style={{
                    padding: "0 1.5rem 1.5rem",
                    borderTop: "1px solid #f0f0f0",
                  }}>
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                      gap: "1.5rem",
                      marginTop: "1.5rem",
                    }}>
                      {/* Company Details */}
                      <div>
                        <h3 style={{
                          fontSize: "0.875rem",
                          fontWeight: 600,
                          color: "#0a1628",
                          marginBottom: "0.75rem",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}>
                          <Building2 size={16} color="#0d8585" />
                          Company Details
                        </h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                          {request.company_size && (
                            <div style={{ fontSize: "0.8rem", color: "#5a7878" }}>
                              <strong>Size:</strong> {request.company_size}
                            </div>
                          )}
                          {request.industry && (
                            <div style={{ fontSize: "0.8rem", color: "#5a7878" }}>
                              <strong>Industry:</strong> {request.industry}
                            </div>
                          )}
                          {request.website && (
                            <div style={{ fontSize: "0.8rem", color: "#5a7878", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                              <strong>Website:</strong>
                              <a href={request.website} target="_blank" rel="noopener noreferrer" style={{ color: "#0d8585", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                                {request.website}
                                <ExternalLink size={12} />
                              </a>
                            </div>
                          )}
                          {request.tax_id && (
                            <div style={{ fontSize: "0.8rem", color: "#5a7878" }}>
                              <strong>Tax ID:</strong> {request.tax_id}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Contact Details */}
                      <div>
                        <h3 style={{
                          fontSize: "0.875rem",
                          fontWeight: 600,
                          color: "#0a1628",
                          marginBottom: "0.75rem",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}>
                          <Mail size={16} color="#0d8585" />
                          Contact Details
                        </h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                          <div style={{ fontSize: "0.8rem", color: "#5a7878" }}>
                            <strong>Name:</strong> {request.full_name}
                          </div>
                          {request.job_title && (
                            <div style={{ fontSize: "0.8rem", color: "#5a7878" }}>
                              <strong>Title:</strong> {request.job_title}
                            </div>
                          )}
                          <div style={{ fontSize: "0.8rem", color: "#5a7878" }}>
                            <strong>Email:</strong> {request.email}
                          </div>
                          <div style={{ fontSize: "0.8rem", color: "#5a7878" }}>
                            <strong>Phone:</strong> {request.phone}
                          </div>
                        </div>
                      </div>

                      {/* Billing Address */}
                      {request.billing_address && (
                        <div>
                          <h3 style={{
                            fontSize: "0.875rem",
                            fontWeight: 600,
                            color: "#0a1628",
                            marginBottom: "0.75rem",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                          }}>
                            <MapPin size={16} color="#0d8585" />
                            Billing Address
                          </h3>
                          <div style={{ fontSize: "0.8rem", color: "#5a7878", lineHeight: 1.6 }}>
                            {request.billing_address}<br />
                            {request.city}, {request.state} {request.zip_code}<br />
                            {request.country}
                          </div>
                        </div>
                      )}

                      {/* Payment Info (Premium) */}
                      {request.plan_type === "premium" && (
                        <div>
                          <h3 style={{
                            fontSize: "0.875rem",
                            fontWeight: 600,
                            color: "#0a1628",
                            marginBottom: "0.75rem",
                          }}>
                            Payment Information
                          </h3>
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                            {request.payment_method && (
                              <div style={{ fontSize: "0.8rem", color: "#5a7878" }}>
                                <strong>Method:</strong> {request.payment_method}
                              </div>
                            )}
                            {request.billing_cycle && (
                              <div style={{ fontSize: "0.8rem", color: "#5a7878" }}>
                                <strong>Cycle:</strong> {request.billing_cycle}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Enterprise Requirements */}
                      {request.plan_type === "enterprise" && (
                        <div>
                          <h3 style={{
                            fontSize: "0.875rem",
                            fontWeight: 600,
                            color: "#0a1628",
                            marginBottom: "0.75rem",
                          }}>
                            Requirements
                          </h3>
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                            {request.expected_users && (
                              <div style={{ fontSize: "0.8rem", color: "#5a7878" }}>
                                <strong>Expected Users:</strong> {request.expected_users}
                              </div>
                            )}
                            {request.expected_chats && (
                              <div style={{ fontSize: "0.8rem", color: "#5a7878" }}>
                                <strong>Expected Chats:</strong> {request.expected_chats}
                              </div>
                            )}
                            {request.special_requirements && (
                              <div style={{ fontSize: "0.8rem", color: "#5a7878", marginTop: "0.5rem" }}>
                                <strong>Special Requirements:</strong>
                                <div style={{
                                  marginTop: "0.25rem",
                                  padding: "0.75rem",
                                  background: "#f8fbfb",
                                  borderRadius: "6px",
                                  whiteSpace: "pre-wrap",
                                }}>
                                  {request.special_requirements}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Timeline */}
                      <div>
                        <h3 style={{
                          fontSize: "0.875rem",
                          fontWeight: 600,
                          color: "#0a1628",
                          marginBottom: "0.75rem",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}>
                          <Calendar size={16} color="#0d8585" />
                          Timeline
                        </h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                          <div style={{ fontSize: "0.8rem", color: "#5a7878" }}>
                            <strong>Created:</strong> {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                          </div>
                          <div style={{ fontSize: "0.8rem", color: "#5a7878" }}>
                            <strong>Updated:</strong> {formatDistanceToNow(new Date(request.updated_at), { addSuffix: true })}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{
                      marginTop: "1.5rem",
                      padding: "1rem",
                      background: "#f8fbfb",
                      borderRadius: "8px",
                      display: "flex",
                      gap: "0.75rem",
                      flexWrap: "wrap",
                    }}>
                      <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#0a1628", marginRight: "auto" }}>
                        Update Status:
                      </div>
                      {["pending_review", "pending_payment", "approved", "completed", "cancelled", "rejected"].map((status) => (
                        <button
                          key={status}
                          onClick={(e) => {
                            e.stopPropagation();
                            updateStatus(request.id, status);
                          }}
                          disabled={request.status === status}
                          style={{
                            padding: "0.5rem 0.75rem",
                            borderRadius: "6px",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            border: "none",
                            cursor: request.status === status ? "not-allowed" : "pointer",
                            opacity: request.status === status ? 0.5 : 1,
                            background: request.status === status ? "#d4f4ee" : "#fff",
                            color: "#0d8585",
                            transition: "background 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            if (request.status !== status) {
                              e.currentTarget.style.background = "#edfaf7";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (request.status !== status) {
                              e.currentTarget.style.background = "#fff";
                            }
                          }}
                        >
                          {getStatusLabel(status)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
