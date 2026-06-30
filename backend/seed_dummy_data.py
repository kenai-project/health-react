from auth.seed_dummy_data import seed_dummy_data


if __name__ == "__main__":
    # Run:
    #   python seed_dummy_data.py
    seed_dummy_data()
    print("Dummy data seed complete (if DB was empty).")

