// Sample requirements for seeding a project during demos.
// Mirrors data/seed_requirements.json in the backend.
const seedData = [
  {
    title: "User authentication with multi-factor support",
    description: "The system shall provide user authentication using email and password, with optional multi-factor authentication via OTP. Users must be able to log in within 3 seconds. The system should support session timeout after 30 minutes of inactivity. Passwords must be encrypted using bcrypt with a minimum length of 12 characters.",
    category: "functional",
    type: "must_have",
    business_value: 9,
    user_impact: 10,
    urgency: 9,
    effort: 6,
    risk: 7,
    tags: ["auth", "security", "login"],
    acceptance_criteria: "Given a valid user, when they enter correct credentials, then they are logged in within 3 seconds. Given MFA is enabled, when the user logs in, then an OTP is sent and must be verified."
  },
  {
    title: "Real-time dashboard with key performance metrics",
    description: "The system shall display a dashboard showing key performance metrics including active users, response times, error rates, and throughput. The dashboard must refresh every 30 seconds. It should support filtering by date range and exporting to CSV and PDF formats.",
    category: "functional",
    type: "must_have",
    business_value: 8,
    user_impact: 9,
    urgency: 7,
    effort: 5,
    risk: 4,
    tags: ["dashboard", "monitoring", "metrics"],
    acceptance_criteria: "Given the dashboard is open, when 30 seconds pass, then metrics refresh automatically. Given a date filter is applied, when the user exports, then a CSV or PDF is downloaded."
  },
  {
    title: "Role-based access control",
    description: "The system shall support role-based access control with at least three predefined roles: admin, manager, and viewer. Admins can manage all resources, managers can edit but not delete, and viewers have read-only access. The system must log all permission changes in an audit trail.",
    category: "non_functional",
    type: "must_have",
    business_value: 8,
    user_impact: 7,
    urgency: 6,
    effort: 6,
    risk: 5,
    tags: ["rbac", "security", "permissions"],
    acceptance_criteria: "Given a user with viewer role, when they attempt to delete a resource, then the action is denied. Given an admin changes a role, when the change is saved, then it is recorded in the audit log."
  },
  {
    title: "Responsive mobile interface",
    description: "The user interface should be responsive and work on mobile devices. It needs to be modern and user-friendly with a clean design that is intuitive and seamless across all screen sizes.",
    category: "non_functional",
    type: "should_have",
    business_value: 6,
    user_impact: 8,
    urgency: 4,
    effort: 7,
    risk: 3,
    tags: ["ui", "mobile", "responsive"],
    acceptance_criteria: ""
  },
  {
    title: "Automated email notification system",
    description: "The system shall send automated email notifications for critical events including user registration, password reset, and system alerts. Notifications must be delivered within 60 seconds of the triggering event. The system should support HTML and plain text formats with customizable templates.",
    category: "functional",
    type: "should_have",
    business_value: 7,
    user_impact: 8,
    urgency: 5,
    effort: 4,
    risk: 3,
    tags: ["email", "notifications", "automation"],
    acceptance_criteria: "Given a user registers, when registration completes, then a confirmation email is sent within 60 seconds."
  },
  {
    title: "RESTful API with rate limiting",
    description: "The system shall expose a RESTful API for all core operations. The API must enforce rate limiting of 1000 requests per minute per API key. It should return proper HTTP status codes and support pagination with a default page size of 20 and a maximum of 100.",
    category: "technical",
    type: "must_have",
    business_value: 8,
    user_impact: 6,
    urgency: 7,
    effort: 5,
    risk: 4,
    tags: ["api", "rest", "rate-limiting"],
    acceptance_criteria: "Given an API key, when 1000 requests are made in one minute, then subsequent requests return HTTP 429."
  },
  {
    title: "Dark mode theme support",
    description: "The system could provide a dark mode theme that users can toggle. It should remember the preference using local storage and automatically adapt based on system settings. This is a nice to have feature.",
    category: "functional",
    type: "could_have",
    business_value: 3,
    user_impact: 4,
    urgency: 2,
    effort: 3,
    risk: 1,
    tags: ["ui", "theme", "dark-mode"],
    acceptance_criteria: "Given dark mode is toggled, when the page reloads, then the theme persists from local storage."
  },
  {
    title: "Database backup and disaster recovery",
    description: "The system shall perform automated database backups every 6 hours with a retention period of 30 days. It must support point-in-time recovery with an RTO of 1 hour and RPO of 15 minutes. The recovery process should be tested quarterly.",
    category: "technical",
    type: "must_have",
    business_value: 9,
    user_impact: 3,
    urgency: 8,
    effort: 7,
    risk: 8,
    tags: ["backup", "disaster-recovery", "database"],
    acceptance_criteria: "Given a backup runs, when 6 hours elapse, then a new backup is created. Given a failure, when recovery is initiated, then data is restored within 1 hour."
  },
  {
    title: "Support for multiple languages",
    description: "The system should support multiple languages including English, Spanish, French, and German. The localization should be flexible and allow easy addition of new languages. It needs to handle various date and number formats appropriately.",
    category: "functional",
    type: "could_have",
    business_value: 4,
    user_impact: 6,
    urgency: 2,
    effort: 6,
    risk: 4,
    tags: ["i18n", "localization", "languages"],
    acceptance_criteria: ""
  },
  {
    title: "Audit logging for compliance",
    description: "The system shall maintain an immutable audit log of all user actions including create, update, and delete operations. Logs must include timestamp, user ID, action type, and resource affected. The log must be retained for a minimum of 7 years for regulatory compliance. Logs should be exportable for external audit tools.",
    category: "business",
    type: "must_have",
    business_value: 7,
    user_impact: 3,
    urgency: 6,
    effort: 5,
    risk: 6,
    tags: ["audit", "compliance", "logging"],
    acceptance_criteria: "Given any data modification, when it occurs, then an audit entry is created with user ID, timestamp, and action details."
  }
]

export default seedData
