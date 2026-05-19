import React, { Component } from "react";
import { Page, Toast } from "react-onsenui";
import Button from "../components/Button";

import IBasePageStateModel from "../models/CDP/baseStates/IBasePageState.model";
import IBasePropsModel from "../models/CDP/baseProps/IBaseProps.model";

import { isNativeApp } from "../services/helper.svc";
import { getMemberProfile, getTransactions } from "../services/TransactionConnector.service";
import MemberProfile from "../components/MemberProfile";
import TransactionsFilter from "../components/TransactionsFilter";
import { ITransaction, ITransactionFilters, IPagination, ISorting } from "../models/Transaction.model";
import LoadingScreen from "../components/LoadingScreen";

export interface IHomeProps extends IBasePropsModel { }

export interface IHomeState extends IBasePageStateModel {
  profile: any | null;
  transactions: ITransaction[];
  filters: ITransactionFilters;
  pagination: IPagination;
  sorting: ISorting;
  totalRecords: number;
  openToast: boolean;
  toastMsg: string;
  toastColor: string;
  loading: boolean;
}

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  marginTop: "10px",
  backgroundColor: "#fff",
  borderRadius: "8px",
  overflow: "hidden",
  boxShadow: "0 4px 6px rgba(0,0,0,0.05)"
};

const thStyle: React.CSSProperties = {
  backgroundColor: "#16324f",
  color: "#fff",
  padding: "12px",
  textAlign: "left",
  fontSize: "14px"
};

const tdStyle: React.CSSProperties = {
  padding: "12px",
  borderBottom: "1px solid #e5e7eb",
  fontSize: "14px",
  color: "#374151"
};

class HomePage extends Component<IHomeProps, IHomeState> {
  pageContainer = React.createRef<HTMLDivElement>();
  pageClass = "desktop";

  state: IHomeState = {
    componentModel: undefined as any,
    profile: null,
    transactions: [],
    filters: {},
    pagination: { pageNumber: 1, pageSize: 10 },
    sorting: { sortBy: "date", sortDirection: "desc" },
    totalRecords: 0,
    openToast: false,
    toastMsg: "",
    toastColor: "danger",
    loading: true
  };

  componentDidMount() {
    if (isNativeApp()) {
      this.pageClass = "native";
    }
    this.loadData();
  }

  loadData = async () => {
    try {
      this.setState({ loading: true });

      const [profile, txData] = await Promise.all([
        getMemberProfile(),
        getTransactions(this.state.filters, this.state.pagination, this.state.sorting)
      ]);

      this.setState({
        profile,
        transactions: txData.transactions,
        totalRecords: txData.totalRecords,
        loading: false
      });
    } catch (err) {
      console.error("Error loading data", err);
      this.setState({ loading: false });
      this.showToast("Failed to load data", "danger");
    }
  };

  handleFilterChange = (filters: ITransactionFilters) => {
    this.setState({ filters });
  };

  handleApplyFilters = () => {
    this.setState({ pagination: { ...this.state.pagination, pageNumber: 1 } }, () => {
      this.loadData();
    });
  };

  handleClearFilters = () => {
    this.setState({ filters: {}, pagination: { ...this.state.pagination, pageNumber: 1 } }, () => {
      this.loadData();
    });
  };

handleNextPage = () => {
    const { pagination, totalRecords, transactions } = this.state;
    
    // Don't go to next page if current page is empty
    if (transactions.length === 0) return;
    
    // If totalRecords is unknown (-1), allow next if we got a full page
    if (totalRecords === -1) {
      if (transactions.length < pagination.pageSize) return; // Last page
      this.setState(
        { pagination: { ...pagination, pageNumber: pagination.pageNumber + 1 } },
        this.loadData
      );
    } else {
      // Known total - check if there's a next page
      if (pagination.pageNumber * pagination.pageSize < totalRecords) {
        this.setState(
          { pagination: { ...pagination, pageNumber: pagination.pageNumber + 1 } },
          this.loadData
        );
      }
    }
  };

  handlePrevPage = () => {
    const { pagination } = this.state;
    if (pagination.pageNumber > 1) {
      this.setState(
        { pagination: { ...pagination, pageNumber: pagination.pageNumber - 1 } },
        this.loadData
      );
    }
  };

  showToast = (msg: string, color: string) => {
    this.setState({ openToast: true, toastMsg: msg, toastColor: color });
  };

  dismissToast = () => {
    this.setState({ openToast: false });
  };

  render() {
    const { profile, transactions, filters, loading, pagination, totalRecords } = this.state;

    return (
      <Page key="home" id="home" className={this.pageClass}>
        <Toast isOpen={this.state.openToast} className={this.state.toastColor}>
          <div>{this.state.toastMsg}</div>
          <Button variant="toast" onClick={this.dismissToast} style={{ marginLeft: "15px" }}>OK</Button>
        </Toast>

        <div
          className="cdp_page_container"
          ref={this.pageContainer}
          style={{ padding: "20px", paddingBottom: "80px", maxWidth: "900px", margin: "0 auto", overflowY: "auto", height: "100%", boxSizing: "border-box" }}
        >
          {loading && transactions.length === 0 ? (
            <LoadingScreen className="cdp-page-loader" />
          ) : (
            <>
          {profile && (
            <MemberProfile
              firstName={profile.firstName}
              lastName={profile.lastName}
              email={profile.email}
              phone={profile.phone}
            />
          )}

          <TransactionsFilter
            filters={filters}
            onFilterChange={this.handleFilterChange}
            onApply={this.handleApplyFilters}
            onClear={this.handleClearFilters}
          />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <h2 style={{ margin: 0 }}>Transactions</h2>
            <div>
              <Button
                variant="quiet"
                onClick={this.loadData}
                disabled={loading}
              >
                Refresh Data
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="cdp-inline-loading">Please wait while we retrieve your information.</div>
          ) : transactions.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", background: "#f9fafb", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
              <h3 style={{ margin: 0, color: "#6b7280" }}>No transactions found</h3>
              <p style={{ margin: "8px 0 0", fontSize: "14px", color: "#9ca3af" }}>Try adjusting your filters or go back to the previous page</p>
            </div>
          ) : (
            <div>
              <table style={tableStyle}>
                <thead>
                  <tr>
                   <th style={thStyle}>Date</th>
                    <th style={thStyle}>Description</th>
                    <th style={thStyle}>Amount</th>
                    <th style={thStyle}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(t => (
                    <tr key={t.id}>
                      <td style={tdStyle}>{new Date(t.date).toLocaleDateString()}</td>
                      <td style={tdStyle}>{t.description}</td>
                      <td style={tdStyle}>
                        <span style={{ color: t.type === "Credit" ? "#10b981" : "#ef4444", fontWeight: 500 }}>
                          {t.type === "Credit" ? "+" : "-"}${t.amount.toFixed(2)}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{
                          padding: "4px 8px",
                          borderRadius: "12px",
                          fontSize: "12px",
                          fontWeight: 600,
                          backgroundColor: (t.status === "Completed" || t.status === "Posted") ? "#d1fae5" : t.status === "Pending" ? "#fef3c7" : "#fee2e2",
                          color: (t.status === "Completed" || t.status === "Posted") ? "#065f46" : t.status === "Pending" ? "#92400e" : "#991b1b"
                        }}>
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls - Always visible */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", fontSize: "14px", color: "#6b7280" }}>
            <div>
              {transactions.length > 0 ? (
                <span>
                  Showing :{(pagination.pageNumber - 1) * pagination.pageSize + 1} - {(pagination.pageNumber - 1) * pagination.pageSize + transactions.length}
                </span>
              ) : (
                <span>Page {pagination.pageNumber}</span>
              )}
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <Button
                variant="secondary"
                onClick={this.handlePrevPage}
                disabled={pagination.pageNumber === 1}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                onClick={this.handleNextPage}
                disabled={transactions.length === 0 || (totalRecords > 0 && pagination.pageNumber * pagination.pageSize > totalRecords) || (totalRecords === -1 && transactions.length < pagination.pageSize)}
              >
                Next
              </Button>
            </div>
          </div>

            </>
          )}
        </div>
      </Page>
    );
  }
}

export default HomePage;