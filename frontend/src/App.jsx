import { Fragment, useEffect, useState } from "react";
import {
  Users, UserPlus, Search, Pencil, Trash2, X, LayoutDashboard,
  ClipboardList, UserCheck, GraduationCap, CalendarDays, CheckCircle2, TrendingUp, Clock3, ArrowUpRight
} from "lucide-react";
import "./App.css";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from "recharts";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000";

const API_URL = `${API_BASE_URL}/api/employees`;
const LOGIN_URL = `${API_BASE_URL}/api/login`;

const emptyForm = {
  name: "", email: "", department: "", role: "", batch: "",
  joiningDate: "", status: "Pre-Onboarding", phone: "",
  offerStatus: "Pending", offerAcceptanceDate: "",
  documentCollectionStatus: "Pending", documentStatus: "Pending", backgroundCheckStatus: "Not Started",
  joiningConfirmation: "Pending", workLocation: "", reportingManager: "", onboardingStatus: "Pending",
  joiningCompleted: false, employeeIdCreated: false, documentVerified: false,
  equipmentStatus: "Pending", emailAccessStatus: "Pending", systemAccessStatus: "Pending",
  inductionStatus: "Pending", policyAcknowledgement: false,
  trainingStatus: "Not Started", mentor: "", probationStartDate: "", probationEndDate: "",
  probationStatus: "In Progress", feedback: "", performanceReviewStatus: "Pending", configurationStatus: "Pending"
};

const stages = [
  { key: "pre", label: "Pre-Onboarding", icon: ClipboardList },
  { key: "joining", label: "Joining Day", icon: UserCheck },
  { key: "post", label: "Post-Onboarding", icon: GraduationCap }
];

const statusOptions = ["Pending", "In Progress", "Completed"];
const selectOptions = {
  offerStatus: ["Pending", "Sent", "Accepted", "Declined"],
  documentCollectionStatus: ["Pending", "Requested", "Collected", "Completed"],
  onboardingStatus: ["Pending", "In Progress", "Completed", "On Hold"],
  emailAccessStatus: ["Pending", "Created", "Not Required"],
  configurationStatus: ["Pending", "In Progress", "Completed", "Not Required"],
  documentStatus: ["Pending", "Submitted", "Verified", "Rejected"],
  backgroundCheckStatus: ["Not Started", "In Progress", "Completed", "Issue Found"],
  joiningConfirmation: ["Pending", "Confirmed", "Rescheduled"],
  equipmentStatus: ["Pending", "Issued", "Not Required"],
  systemAccessStatus: ["Pending", "Created", "Not Required"],
  inductionStatus: ["Pending", "Scheduled", "Completed"],
  trainingStatus: ["Not Started", "In Progress", "Completed"],
  probationStatus: ["In Progress", "Completed", "Extended"],
  performanceReviewStatus: ["Pending", "Scheduled", "Completed"]
};

function App() {
  const [employees, setEmployees] = useState([]);
  const [token, setToken] = useState(
  sessionStorage.getItem("hr_token") || ""
);

const [loginEmail, setLoginEmail] = useState("");
const [loginPassword, setLoginPassword] = useState("");
const [loginError, setLoginError] = useState("");
const [isLoggingIn, setIsLoggingIn] = useState(false);
const [hrUser, setHrUser] = useState(
  JSON.parse(sessionStorage.getItem("hr_user") || "null")
);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [page, setPage] = useState("dashboard");
  const [stage, setStage] = useState("pre");
  const [viewingTasksEmployeeId, setViewingTasksEmployeeId] = useState(null);
  async function handleLogin(event) {
  event.preventDefault();

  if (isLoggingIn) return;

  setLoginError("");
  setIsLoggingIn(true);

  try {
    const response = await fetch(LOGIN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: loginEmail,
        password: loginPassword
      })
    });

    const data = await response.json();

    if (!response.ok) {
      setLoginError(data.message || "Login failed.");
      return;
    }

    sessionStorage.setItem("hr_token", data.access_token);
    sessionStorage.setItem("hr_user", JSON.stringify(data.user));

    setToken(data.access_token);
    setHrUser(data.user);
    setLoginPassword("");

  } catch {
    setLoginError("Could not connect to backend. Please try again.");
  } finally {
    setIsLoggingIn(false);
  }
}
function handleLogout() {
  sessionStorage.removeItem("hr_token");
  sessionStorage.removeItem("hr_user");

  setToken("");
  setHrUser(null);
  setEmployees([]);
  setShowModal(false);
  setEditingId(null);
}

async function fetchEmployees() {
  try {
    const response = await fetch(API_URL, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.msg || "Could not load employees.");
    }
    setEmployees(data);
    setError("");
  } catch (err) {
    setError(err.message || "Could not connect to backend.");
  }
}

  useEffect(() => { if (token) { fetchEmployees(); }}, [token]);

  function openAddModal() {
    setForm({ ...emptyForm });
    setEditingId(null);
    setError("");
    setShowModal(true);
  }

  function openEditModal(employee) {
    const normalized = { ...emptyForm, ...employee };
    setForm(normalized);
    setEditingId(employee.id);
    setError("");
    setShowModal(true);
  }

  function handleChange(event) {
    const { name, value, type, checked } = event.target;
    setForm(previous => ({ ...previous, [name]: type === "checkbox" ? checked : value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    const url = editingId ? `${API_URL}/${editingId}` : API_URL;
    try {
      const response = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: {"Content-Type": "application/json",Authorization: `Bearer ${token}`},
        body: JSON.stringify(form)
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }
      setShowModal(false);
      setEditingId(null);
      setForm({ ...emptyForm });
      await fetchEmployees();
    } catch {
      setError("Could not connect to backend.");
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this employee?")) return;
    try {
      const response = await fetch(`${API_URL}/${id}`, {method: "DELETE",headers: {Authorization: `Bearer ${token}`}
});
      if (response.ok) fetchEmployees();
      else setError("Could not delete employee.");
    } catch {
      setError("Could not connect to backend.");
    }
  }

  const filteredEmployees = employees.filter(employee =>
    Object.values(employee).join(" ").toLowerCase().includes(search.toLowerCase())
  );

  const preTasks = ["offerStatus", "offerAcceptanceDate", "documentCollectionStatus", "documentStatus", "backgroundCheckStatus", "joiningConfirmation", "workLocation", "reportingManager", "onboardingStatus"];
  const joiningTasks = ["joiningCompleted", "employeeIdCreated", "documentVerified", "equipmentStatus", "emailAccessStatus", "systemAccessStatus", "inductionStatus", "policyAcknowledgement"];
  const postTasks = ["trainingStatus", "mentor", "probationStartDate", "probationEndDate", "probationStatus", "feedback", "performanceReviewStatus", "configurationStatus"];
  const taskFields = stage === "pre" ? preTasks : stage === "joining" ? joiningTasks : postTasks;

  const taskLabels = {
    offerStatus: "Offer Letter Status",
    offerAcceptanceDate: "Offer Acceptance Date",
    documentCollectionStatus: "Document Collection",
    documentStatus: "Document Verification Status",
    backgroundCheckStatus: "Background Verification",
    joiningConfirmation: "Joining Confirmation",
    workLocation: "Work Location",
    reportingManager: "Reporting Manager",
    onboardingStatus: "Onboarding Status",
    joiningCompleted: "Joining Completed",
    documentVerified: "Documents Verified",
    employeeIdCreated: "Employee ID Created",
    equipmentStatus: "Equipment / Laptop",
    systemAccessStatus: "System Access",
    emailAccessStatus: "Email Access",
    inductionStatus: "Induction",
    policyAcknowledgement: "Policy Acknowledgement",
    trainingStatus: "Training Status",
    mentor: "Mentor / Buddy",
    probationStartDate: "Probation Start Date",
    probationEndDate: "Probation End Date",
    probationStatus: "Probation Status",
    feedback: "Feedback",
    performanceReviewStatus: "Performance Review",
    configurationStatus: "Configuration Status"
  };

  const isDone = (employee, field) => {
    const value = employee[field];
    return value === true || value === "Completed" || value === "Verified" ||
      value === "Accepted" || value === "Confirmed" || value === "Issued" ||
      value === "Created" || value === "Collected" || (typeof value === "string" && value.trim() !== "" && ["offerAcceptanceDate", "workLocation", "reportingManager", "mentor", "probationStartDate", "probationEndDate", "feedback"].includes(field));
  };
  // Collect actual pending HR actions

const allTaskFields = [
  ...preTasks,
  ...joiningTasks,
  ...postTasks
];

const pendingActionItems = employees.flatMap(employee =>
  allTaskFields
    .filter(field => !isDone(employee, field))
    .map(field => ({
      employeeId: employee.id,
      employeeName: employee.name,
      taskField: field,
      taskName: taskLabels[field],
      department: employee.department
    }))
);
const openPendingAction = (action) => {
  const actionStage = preTasks.includes(action.taskField)
    ? "pre"
    : joiningTasks.includes(action.taskField)
    ? "joining"
    : "post";

  setPage("onboarding");
  setStage(actionStage);
  setViewingTasksEmployeeId(action.employeeId);
};  


  const pendingTasks = employees.reduce((total, employee) => {
    return total + [...preTasks, ...joiningTasks, ...postTasks]
      .filter(field => !isDone(employee, field)).length;
  }, 0);

  const upcomingJoiners = employees.filter(employee =>
    employee.status === "Pre-Onboarding" || employee.status === "Joining"
  ).length;
  // Dashboard analytics

const activeEmployees = employees.filter(
  employee => String(employee.status || "").trim().toLowerCase() === "active"
).length;

const inactiveEmployees = employees.filter(
  employee => String(employee.status || "").trim().toLowerCase() === "inactive"
).length;

const totalTasks = employees.reduce((total, employee) => {
  return total + preTasks.length + joiningTasks.length + postTasks.length;
}, 0);

const completedTasks = employees.reduce((total, employee) => {
  return total + [...preTasks, ...joiningTasks, ...postTasks]
    .filter(field => isDone(employee, field)).length;
}, 0);

const onboardingCompletion = totalTasks
  ? Math.round((completedTasks / totalTasks) * 100)
  : 0;

const departmentStats = Object.entries(
  employees.reduce((departments, employee) => {
    const department = employee.department || "Unassigned";
    departments[department] = (departments[department] || 0) + 1;
    return departments;
  }, {})
).map(([name, count]) => ({ name, count }));

  async function updateTask(employee, field, value) {
    setError("");
    try {
      const response = await fetch(`${API_URL}/${employee.id}`, {
        method: "PUT",
        headers: {"Content-Type": "application/json",Authorization: `Bearer ${token}`},
        body: JSON.stringify({ ...employee, [field]: value })
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Could not update onboarding task.");
        return;
      }
      await fetchEmployees();
    } catch {
      setError("Could not connect to backend.");
    }
  }

  function getStageProgress(employee) {
  const fields =
    stage === "pre"
      ? preTasks
      : stage === "joining"
      ? joiningTasks
      : postTasks;

  const completed = fields.filter(field => isDone(employee, field)).length;
  const total = fields.length;

  const percent = total
    ? Math.round((completed / total) * 100)
    : 0;

  return {
    completed,
    total,
    percent
  };
}
if (!token) {
  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-icon">
          <Users size={30} />
        </div>

        <h1>HR Workspace</h1>
        <p>Sign in to manage your employee workspace.</p>

        <form onSubmit={handleLogin}>
          <label>
            Email Address
            <input
              type="email"
              placeholder="Enter your HR email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              placeholder="Enter your password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              required
            />
          </label>

          {loginError && (
            <p className="login-error">{loginError}</p>
          )}

          <button type="submit" className="login-button" disabled={isLoggingIn}> {isLoggingIn ? "Signing in..." : "Sign In"}</button>
        </form>

        <small>Authorized HR users only</small>
      </div>
    </div>
  );
}

  return (
    <div className="app">
      <aside className="sidebar">
        {/* Sidebar brand: intentionally only HR WORKSPACE */}
        <div className="sidebar-brand">
          <Users size={20} />
          <span>HR WORKSPACE</span>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${page === "dashboard" ? "active" : ""}`}
            onClick={() => setPage("dashboard")}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </button>

          <button
            className={`nav-item ${page === "employees" ? "active" : ""}`}
            onClick={() => setPage("employees")}
          >
            <Users size={18} />
            <span>Employees</span>
          </button>

          <button
            className={`nav-item ${page === "onboarding" ? "active" : ""}`}
            onClick={() => setPage("onboarding")}
          >
            <ClipboardList size={18} />
            <span>Onboarding Tasks</span>
          </button>
        </nav>

        <div className="sidebar-bottom"> <div className="profile-avatar"></div><button className="logout-btn" onClick={handleLogout}> Logout</button></div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <p className="eyebrow">HR WORKSPACE / PEOPLE</p>
            <h1>{page === "dashboard" ? "HR Dashboard" : page === "employees" ? "Employee Management" : "Onboarding Management"}</h1>
            <p className="subtitle">Manage employee lifecycle from pre-onboarding to post-onboarding.</p>
          </div>
          <button className="add-employee-btn" onClick={openAddModal}>
            <UserPlus size={16} />
            <span>Add Employee</span>
          </button>
        </header>

        {error && <p className="error-message">{error}</p>}

        {page === "dashboard" && (
          <section className="welcome-panel">
            <div>
              <span className="welcome-kicker">YOUR PEOPLE, YOUR WORKFLOW</span>
              <h2>Good evening, {hrUser?.name || "HR Admin"}<span>✦</span></h2>
              <p>Here’s the latest overview of your employee lifecycle.</p>
            </div>
            <div className="welcome-illustration"><Users size={34} /><span className="welcome-orbit orbit-one"></span><span className="welcome-orbit orbit-two"></span></div>
          </section>
        )}

        <section className="stats">

  <div className="stat-card stat-purple">
    <div className="stat-top">
      <span>Total Employees</span>
      <div className="stat-icon purple"><Users size={19} /></div>
    </div>
    <div className="stat-number">{employees.length}</div>
    <div className="stat-foot">All employee records</div>
  </div>

  <div className="stat-card stat-green">
    <div className="stat-top">
      <span>Active Employees</span>
      <div className="stat-icon green"><UserCheck size={19} /></div>
    </div>
    <div className="stat-number">{activeEmployees}</div>
    <div className="stat-foot">Currently active employees</div>
  </div>

  <div className="stat-card stat-orange">
    <div className="stat-top">
      <span>Inactive Employees</span>
      <div className="stat-icon orange"><Users size={19} /></div>
    </div>
    <div className="stat-number">{inactiveEmployees}</div>
    <div className="stat-foot">Inactive employee records</div>
  </div>

  <div className="stat-card stat-blue">
    <div className="stat-top">
      <span>Upcoming Joiners</span>
      <div className="stat-icon blue"><CalendarDays size={19} /></div>
    </div>
    <div className="stat-number">{upcomingJoiners}</div>
    <div className="stat-foot">Pre-onboarding or joining</div>
  </div>

  <div className="stat-card stat-orange">
    <div className="stat-top">
      <span>Pending Tasks</span>
      <div className="stat-icon orange"><ClipboardList size={19} /></div>
    </div>
    <div className="stat-number">{pendingTasks}</div>
    <div className="stat-foot">Tasks awaiting completion</div>
  </div>

  <div className="stat-card stat-green">
    <div className="stat-top">
      <span>Onboarding Completion</span>
      <div className="stat-icon green"><CheckCircle2 size={19} /></div>
    </div>
    <div className="stat-number">{onboardingCompletion}%</div>
    <div className="stat-foot">Overall checklist progress</div>
  </div>

</section>

        {page === "dashboard" && (
  <section className="analytics-grid">

    {/* Department Distribution */}
    <div className="employee-section analytics-section">
      <div className="section-heading">
        <div>
          <h2>Department Distribution</h2>
          <p>Employees across departments</p>
        </div>
      </div>

      <div className="chart-container">
        {departmentStats.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={departmentStats}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar
                dataKey="count"
                fill="#7563ee"
                radius={[6, 6, 0, 0]}
                barSize={35}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="empty-state">No department data available.</p>
        )}
      </div>
    </div>

    {/* Workforce Overview */}
    <div className="employee-section workforce-card">
      <div className="section-heading">
        <div>
          <h2>Workforce Overview</h2>
          <p>Current employee statistics</p>
        </div>
      </div>

      <div className="workforce-stat">
        <span>Total Employees</span>
        <strong>{employees.length}</strong>
      </div>

      <div className="workforce-stat">
        <span>Active Employees</span>
        <strong className="active-value">{activeEmployees}</strong>
      </div>

      <div className="workforce-stat">
        <span>Inactive Employees</span>
        <strong className="inactive-value">{inactiveEmployees}</strong>
      </div>

      <div className="workforce-divider"></div>

      <div className="workforce-progress-heading">
        <strong>Onboarding Completion</strong>
        <strong>{onboardingCompletion}%</strong>
      </div>

      <div className="progress-track workforce-progress">
        <div
          className="progress-fill"
          style={{ width: `${onboardingCompletion}%` }}
        />
      </div>

      <p className="workforce-note">
        {completedTasks} of {totalTasks} checklist tasks completed
      </p>
    </div>

  </section>
)}

        {page === "dashboard" && (
          <section className="dashboard-insights">
            <div className="insight-card">
              <div className="insight-heading"><div><span className="eyebrow">LIFECYCLE OVERVIEW</span><h2>Onboarding progress</h2></div><span className="insight-icon"><TrendingUp size={18}/></span></div>
              {stages.map((item, index) => {
                const fields = index === 0 ? preTasks : index === 1 ? joiningTasks : postTasks;
                const total = employees.length * fields.length;
                const completed = employees.reduce((sum, employee) => sum + fields.filter(field => isDone(employee, field)).length, 0);
                const percent = total ? Math.round(completed / total * 100) : 0;
                return <div className="progress-row" key={item.key}><div className="progress-label"><span>{item.label}</span><strong>{percent}%</strong></div><div className="progress-track"><div className={`progress-fill progress-${item.key}`} style={{width: `${percent}%`}} /></div></div>;
              })}
            </div>
            <div className="insight-card attention-card">
  <div className="insight-heading">
    <div>
      <span className="eyebrow">HR ACTION CENTER</span>
      <h2>Pending HR Actions</h2>
    </div>
    <span className="insight-icon attention-icon">
      <Clock3 size={18} />
    </span>
  </div>

  <div className="attention-number">
    {pendingActionItems.length}
    <small> pending actions</small>
  </div>

  <div className="action-list">
    {pendingActionItems.slice(0, 5).map((action, index) => (
      <div
  className="action-item"
  key={`${action.employeeId}-${action.taskField}`}
  role="button"
  tabIndex={0}
  onClick={() => openPendingAction(action)}
  onKeyDown={(event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openPendingAction(action);
    }
  }}
  title="Click to review this employee's task"
>
        <div className="action-item-info">
          <strong>{action.taskName}</strong>
          <small>
            {action.employeeName} · {action.department || "Unassigned"}
          </small>
        </div>

        <span className="action-pending">Pending</span>
      </div>
    ))}
  </div>

  {pendingActionItems.length > 5 && (
    <p className="action-more">
      + {pendingActionItems.length - 5} more pending actions
    </p>
  )}

  <button
    className="text-action"
    onClick={() => setPage("onboarding")}
  >
    Review all onboarding tasks
    <ArrowUpRight size={16} />
  </button>
</div>
          </section>
        )}

        {(page === "dashboard" || page === "onboarding") && (
          <section className="employee-section onboarding-section">
            <div className="section-heading">
              <div><h2>Employee Onboarding Workflow</h2><p>Select a stage to review and update HR tasks.</p></div>
            </div>
            <div className="stage-tabs">
              {stages.map(item => {
                const Icon = item.icon;
                return <button key={item.key} className={`stage-tab ${stage === item.key ? "active" : ""}`} onClick={() => setStage(item.key)}><Icon size={17} />{item.label}</button>;
              })}
            </div>
            <div className="table-wrapper">
              <table>
                <thead><tr><th>EMPLOYEE</th><th>OVERALL PROGRESS</th><th>STAGE</th><th>TASKS</th></tr></thead>
                <tbody>
                  {employees.map(employee => {const progress = getStageProgress(employee); const isViewing = String(viewingTasksEmployeeId) === String(employee.id);
                  return (
                      <Fragment key={employee.id}>
                        <tr>
                          <td><strong>{employee.name}</strong><small className="table-sub">{employee.email}</small></td>
                          <td>
                            <div className="employee-progress">
                              <div className="progress-track"><div className="progress-fill" style={{ width: `${progress.percent}%` }} /></div>
                              <small>{progress.completed} / {progress.total} completed · {progress.percent}%</small>
                            </div>
                          </td>
                          <td><span className={`status-badge ${employee.status?.toLowerCase().replaceAll(" ", "-")}`}>{employee.status || "Pre-Onboarding"}</span></td>
                          <td><button className="view-tasks-btn" onClick={() => setViewingTasksEmployeeId(isViewing ? null : employee.id)}>{isViewing ? "Hide Tasks" : "View Tasks"}</button></td>
                        </tr>
                        {isViewing && (
                          <tr className="task-details-row">
                            <td colSpan="4">
                              <div className="employee-task-details">
                                <div className="task-details-heading">
                                  <div><span className="eyebrow">{stages.find(item => item.key === stage)?.label}</span><h3>{employee.name} — Onboarding Checklist</h3><p>Update this employee’s tasks directly here.</p></div>
                                  <button className="close-task-details" onClick={() => setViewingTasksEmployeeId(null)} aria-label="Close tasks"><X size={18} /></button>
                                </div>
                                <div className="employee-task-list">
                                  {taskFields.map(field => (
                                    <div className="employee-task-item" key={`${employee.id}-${field}`}>
                                      <div className="task-item-title">
                                        {isDone(employee, field) ? <CheckCircle2 size={18} /> : <Clock3 size={18} />}
                                        <div><strong>{taskLabels[field]}</strong><small>{isDone(employee, field) ? "Completed" : "Pending"}</small></div>
                                      </div>
                                      {[
                                        "offerAcceptanceDate", "probationStartDate", "probationEndDate"
                                      ].includes(field) ? (
                                        <input className="task-select" type="date" value={employee[field] || ""}
                                          onChange={e => updateTask(employee, field, e.target.value)} />
                                      ) : ["workLocation", "reportingManager", "mentor", "feedback"].includes(field) ? (
                                        <input className="task-select" type="text" value={employee[field] || ""}
                                          placeholder="Enter details"
                                          onChange={e => updateTask(employee, field, e.target.value)} />
                                      ) : (
                                        <select className="task-select" value={String(employee[field] ?? (["joiningCompleted", "employeeIdCreated", "documentVerified", "policyAcknowledgement"].includes(field) ? false : "Pending"))}
                                          onChange={e => updateTask(employee, field, ["joiningCompleted", "employeeIdCreated", "documentVerified", "policyAcknowledgement"].includes(field) ? e.target.value === "true" : e.target.value)}>
                                          {["joiningCompleted", "employeeIdCreated", "documentVerified", "policyAcknowledgement"].includes(field)
                                            ? <><option value="false">Pending</option><option value="true">Completed</option></>
                                            : (selectOptions[field] || statusOptions).map(option => <option key={option} value={option}>{option}</option>)}
                                        </select>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                  {employees.length === 0 && <tr><td colSpan="4" className="empty-state">Add an employee to begin tracking onboarding tasks.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {(page === "dashboard" || page === "employees") && (
          <section className="employee-section">
            <div className="section-heading">
              <div><h2>Employee Records</h2><p>{filteredEmployees.length} employee records in your HR database.</p></div>
              <div className="search-box"><Search size={18} /><input placeholder="Search employees..." value={search} onChange={e => setSearch(e.target.value)} /></div>
            </div>
            <div className="table-wrapper">
              <table>
                <thead><tr><th>EMPLOYEE</th><th>DEPARTMENT</th><th>ROLE</th><th>JOINING DATE</th><th>STATUS</th><th>ACTIONS</th></tr></thead>
                <tbody>
                  {filteredEmployees.map(employee => (
                    <tr key={employee.id}>
                      <td><div className="employee-info"><div className="employee-avatar">{employee.name?.charAt(0).toUpperCase()}</div><div><strong>{employee.name}</strong><small>{employee.email}</small></div></div></td>
                      <td><span className="department-tag">{employee.department || "—"}</span></td>
                      <td>{employee.role || "—"}</td>
                      <td>{employee.joiningDate || "—"}</td>
                      <td><span className={`status-badge ${employee.status?.toLowerCase().replaceAll(" ", "-")}`}>{employee.status}</span></td>
                      <td><div className="actions"><button className="icon-btn edit" title="Edit employee" onClick={() => openEditModal(employee)}><Pencil size={17} /></button><button className="icon-btn delete" title="Delete employee" onClick={() => handleDelete(employee.id)}><Trash2 size={17} /></button></div></td>
                    </tr>
                  ))}
                  {filteredEmployees.length === 0 && <tr><td colSpan="6" className="empty-state">No employees found.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal hr-modal">
            <div className="modal-header">
              <div><h2>{editingId ? "Edit Employee / HR Record" : "Add Employee / HR Record"}</h2><p>Enter employee details and onboarding information.</p></div>
              <button type="button" className="icon-btn" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <h3 className="form-section-title">Employee Details</h3>
              <div className="form-grid">
                <label>Full Name<input name="name" value={form.name} onChange={handleChange} required /></label>
                <label>Email<input name="email" type="email" value={form.email} onChange={handleChange} required /></label>
                <label>Phone<input name="phone" value={form.phone || ""} onChange={handleChange} /></label>
                <label>Department<select name="department" value={form.department} onChange={handleChange}><option value="">Select</option>{["Engineering","Design","HR","Marketing","Finance","Sales","Operations"].map(x => <option key={x}>{x}</option>)}</select></label>
                <label>Designation / Role<input name="role" value={form.role} onChange={handleChange} /></label>
                <label>Batch / Year<input name="batch" value={form.batch} onChange={handleChange} placeholder="2026" /></label>
                <label>Joining Date<input name="joiningDate" type="date" value={form.joiningDate || ""} onChange={handleChange} /></label>
                <label>Employment Stage<select name="status" value={form.status} onChange={handleChange}><option>Pre-Onboarding</option><option>Joining</option><option>Active</option><option>Inactive</option></select></label>
                <label>Work Location<input name="workLocation" value={form.workLocation || ""} onChange={handleChange} /></label>
                <label>Reporting Manager<input name="reportingManager" value={form.reportingManager || ""} onChange={handleChange} /></label>
              </div>

              <h3 className="form-section-title">Pre-Onboarding</h3>
              <div className="form-grid">
                <label>Offer Status<select name="offerStatus" value={form.offerStatus} onChange={handleChange}>{selectOptions.offerStatus.map(x => <option key={x}>{x}</option>)}</select></label>
                <label>Offer Acceptance Date<input name="offerAcceptanceDate" type="date" value={form.offerAcceptanceDate || ""} onChange={handleChange} /></label>
                <label>Document Collection<select name="documentCollectionStatus" value={form.documentCollectionStatus} onChange={handleChange}>{selectOptions.documentCollectionStatus.map(x => <option key={x}>{x}</option>)}</select></label>
                <label>Document Status<select name="documentStatus" value={form.documentStatus} onChange={handleChange}>{selectOptions.documentStatus.map(x => <option key={x}>{x}</option>)}</select></label>
                <label>Background Verification<select name="backgroundCheckStatus" value={form.backgroundCheckStatus} onChange={handleChange}>{selectOptions.backgroundCheckStatus.map(x => <option key={x}>{x}</option>)}</select></label>
                <label>Onboarding Status<select name="onboardingStatus" value={form.onboardingStatus} onChange={handleChange}>{selectOptions.onboardingStatus.map(x => <option key={x}>{x}</option>)}</select></label>
                <label>Joining Confirmation<select name="joiningConfirmation" value={form.joiningConfirmation} onChange={handleChange}>{selectOptions.joiningConfirmation.map(x => <option key={x}>{x}</option>)}</select></label>
              </div>

              <h3 className="form-section-title">Joining Day</h3>
              <div className="form-grid">
                <label className="checkbox-label">Joining Completed<input type="checkbox" name="joiningCompleted" checked={Boolean(form.joiningCompleted)} onChange={handleChange} /></label>
                <label className="checkbox-label">Documents Verified<input type="checkbox" name="documentVerified" checked={Boolean(form.documentVerified)} onChange={handleChange} /></label>
                <label>Email Access<select name="emailAccessStatus" value={form.emailAccessStatus} onChange={handleChange}>{selectOptions.emailAccessStatus.map(x => <option key={x}>{x}</option>)}</select></label>
                <label>Equipment Status<select name="equipmentStatus" value={form.equipmentStatus} onChange={handleChange}>{selectOptions.equipmentStatus.map(x => <option key={x}>{x}</option>)}</select></label>
                <label>System Access<select name="systemAccessStatus" value={form.systemAccessStatus} onChange={handleChange}>{selectOptions.systemAccessStatus.map(x => <option key={x}>{x}</option>)}</select></label>
                <label>Induction Status<select name="inductionStatus" value={form.inductionStatus} onChange={handleChange}>{selectOptions.inductionStatus.map(x => <option key={x}>{x}</option>)}</select></label>
                <label className="checkbox-label">Employee ID Created<input type="checkbox" name="employeeIdCreated" checked={Boolean(form.employeeIdCreated)} onChange={handleChange} /></label>
                <label className="checkbox-label">Policy Acknowledged<input type="checkbox" name="policyAcknowledgement" checked={Boolean(form.policyAcknowledgement)} onChange={handleChange} /></label>
              </div>

              <h3 className="form-section-title">Post-Onboarding</h3>
              <div className="form-grid">
                <label>Training Status<select name="trainingStatus" value={form.trainingStatus} onChange={handleChange}>{selectOptions.trainingStatus.map(x => <option key={x}>{x}</option>)}</select></label>
                <label>Mentor / Buddy<input name="mentor" value={form.mentor || ""} onChange={handleChange} /></label>
                <label>Probation Start Date<input name="probationStartDate" type="date" value={form.probationStartDate || ""} onChange={handleChange} /></label>
                <label>Probation End Date<input name="probationEndDate" type="date" value={form.probationEndDate || ""} onChange={handleChange} /></label>
                <label>Probation Status<select name="probationStatus" value={form.probationStatus} onChange={handleChange}>{selectOptions.probationStatus.map(x => <option key={x}>{x}</option>)}</select></label>
                <label>Performance Review<select name="performanceReviewStatus" value={form.performanceReviewStatus} onChange={handleChange}>{selectOptions.performanceReviewStatus.map(x => <option key={x}>{x}</option>)}</select></label>
                <label>Configuration Status<select name="configurationStatus" value={form.configurationStatus} onChange={handleChange}>{selectOptions.configurationStatus.map(x => <option key={x}>{x}</option>)}</select></label>
                <label>Feedback<textarea name="feedback" value={form.feedback || ""} onChange={handleChange} rows="3" /></label>
              </div>

              {error && <p className="error-message">{error}</p>}
              <div className="modal-actions"><button type="button" className="secondary-btn" onClick={() => setShowModal(false)}>Cancel</button><button type="submit" className="primary-btn">{editingId ? "Save HR Record" : "Add Employee"}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
