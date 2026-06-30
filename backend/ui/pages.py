import streamlit as st

from auth.session import require_login
from ui.sidebar import render_sidebar, render_page_for_sidebar_selection


def render_app():
    st.markdown(

        """
        <style>
          :root {
            --primary: #4F46E5;
            --secondary: #06B6D4;
            --success: #22C55E;
            --warning: #F59E0B;
            --danger: #EF4444;

            --bg: #0B1120;
            --card: rgba(255,255,255,0.05);
            --border: rgba(255,255,255,0.08);
            --text: rgba(255,255,255,0.92);
            --muted: rgba(255,255,255,0.65);
          }

          html, body, [class*="stApp"] {
            background: var(--bg) !important;
          }

          /* Typography */
          h1, h2, h3, h4 { color: var(--text) !important; }
          p, span { color: var(--text); }

          /* Glass cards */
          .glass {
            background: var(--card);
            border: 1px solid var(--border);
            border-radius: 20px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.30);
            backdrop-filter: blur(10px);
          }

          /* Buttons */
          div.stButton > button:first-child {
            border-radius: 12px;
            padding: 0.45rem 0.9rem;
            background: linear-gradient(135deg,var(--primary),var(--secondary)) !important;
            color: white !important;
            border: none !important;
            transition: transform 0.15s ease, filter 0.15s ease;
          }
          div.stButton > button:first-child:hover {
            transform: translateY(-1px);
            filter: brightness(1.08);
          }

          /* Inputs */
          .stTextInput > div > div,
          .stSelectbox > div > div,
          .stNumberInput > div > div,
          .stDateInput > div > div {
            border-radius: 14px !important;
            background: rgba(255,255,255,0.03) !important;
            border: 1px solid rgba(255,255,255,0.08) !important;
          }

          /* Sidebar */
          section[data-testid="stSidebar"] {
            background: rgba(255,255,255,0.02) !important;
            border-right: 1px solid rgba(255,255,255,0.06) !important;
          }

          /* Card hover */
          .card-hover {
            transition: transform 0.2s ease, box-shadow 0.2s ease;
          }
          .card-hover:hover {
            transform: translateY(-2px) scale(1.01);
            box-shadow: 0 12px 48px rgba(0,0,0,0.40);
          }

          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(6px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .fade-in {
            animation: fadeIn 0.35s ease both;
          }
        </style>
        """,
        unsafe_allow_html=True,
    )

    st.title("🩺 Health Dashboard")


    if "_bootstrapped" not in st.session_state:
        st.session_state._bootstrapped = True

    require_login()
    render_sidebar()

    # Render the selected page in the MAIN content area (not inside st.sidebar)
    render_page_for_sidebar_selection()




