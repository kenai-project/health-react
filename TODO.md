- [ ] Replace mock `UserManagementPage.jsx` with backend-driven implementation
  - [ ] Remove hardcoded `users` state
  - [ ] Load users via `GET /admin/users` on mount
  - [ ] Create users via `POST /admin/users`
  - [ ] Refresh list after create
  - [ ] Map backend user model `{id, username, role}` into UI model expected by the table
  - [ ] Implement Edit/Delete with backend APIs (or TODO placeholders)
  - [ ] Ensure page refresh keeps created user (backend-driven)

