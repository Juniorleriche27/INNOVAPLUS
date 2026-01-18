import csv
import random
from datetime import datetime, timedelta


random.seed(42)

N = 350
countries = ["Togo", "Benin", "Ghana", "Cote d'Ivoire", "Nigeria"]
channels = ["facebook", "whatsapp", "google", "referral", "tiktok"]


def rand_dt(start, end):
    delta = end - start
    sec = random.randint(0, int(delta.total_seconds()))
    return start + timedelta(seconds=sec)


start = datetime(2025, 10, 1)
end = datetime(2026, 1, 15)

rows = []
for i in range(N):
    uid = f"U{str(i + 1).zfill(4)}"
    country = random.choice(countries)
    channel = random.choice(channels)

    # inject missing & messy strings
    if random.random() < 0.06:
        country = ""  # empty
    if random.random() < 0.10:
        country = "  " + country.lower()  # leading spaces + lower
    if random.random() < 0.07:
        channel = ""  # empty

    # age with anomalies
    r = random.random()
    if r < 0.10:
        age = ""
    elif r < 0.13:
        age = "0"
    elif r < 0.16:
        age = "999"
    else:
        age = str(random.randint(16, 65))

    signup = rand_dt(start, end)
    last_active = signup + timedelta(days=random.randint(0, 60))

    # dates mixed formats
    if random.random() < 0.5:
        signup_str = signup.strftime("%d/%m/%Y")
    else:
        signup_str = signup.strftime("%Y-%m-%d")

    if random.random() < 0.5:
        last_active_str = last_active.strftime("%d/%m/%Y %H:%M")
    else:
        last_active_str = last_active.strftime("%Y-%m-%dT%H:%M:%S")

    # revenue with missing + negatives
    r2 = random.random()
    if r2 < 0.18:
        revenue = ""
    else:
        val = round(max(0, random.gauss(120, 80)), 2)
        if random.random() < 0.03:
            val = -abs(val)
        revenue = f"{val:.2f}"

    rows.append(
        {
            "user_id": uid,
            "country": country,
            "channel": channel,
            "age": age,
            "signup_date": signup_str,
            "last_active": last_active_str,
            "revenue": revenue,
        }
    )

# inject duplicates on user_id (controlled)
rng = random.Random(7)
dup_indices = rng.sample(range(N), 25)
dups = [dict(rows[i]) for i in dup_indices]
rows = rows + dups

out = "sales_users_messy.csv"
with open(out, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(
        f,
        fieldnames=["user_id", "country", "channel", "age", "signup_date", "last_active", "revenue"],
    )
    writer.writeheader()
    writer.writerows(rows)

print("Generated:", out, "rows:", len(rows))
