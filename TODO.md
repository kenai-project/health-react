- [ ] Identify and remove any hardcoded outdated API base URLs (e.g. http://10.0.2.2:8000) in the frontend.
- [x] Fix RegisterPage.jsx to call Render API (https://health-react-aoax.onrender.com or VITE_API_URL) instead of http://10.0.2.2:8000.
- [ ] Re-run frontend build/deploy to verify Mixed Content/connection issues are gone.
- [ ] If login still returns 401, create/seed an admin user in Render DB or verify auth backend credentials.

