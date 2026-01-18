import csv
import random
from datetime import datetime, timedelta
from pathlib import Path


SEED = 42
BASE_ROWS = 300
EXACT_DUPES = 15
UPDATES = 35
CONFLICTS = 10


def rand_date(rng: random.Random, start: datetime, days: int) -> str:
    d = start + timedelta(days=rng.randint(0, days), hours=rng.randint(0, 23), minutes=rng.randint(0, 59), seconds=rng.randint(0, 59))
    if rng.random() < 0.5:
        return d.strftime("%d/%m/%Y")
    return d.strftime("%Y-%m-%d %H:%M:%S")


def choose(rng: random.Random, items):
    return items[rng.randrange(0, len(items))]


def main():
    rng = random.Random(SEED)
    start = datetime(2026, 1, 1)

    countries = ["  togo", "Ghana", "BENIN", "", None]
    channels = ["Facebook", "facebook", "WhatsApp", " whatsapp ", None, ""]

    rows = []
    for i in range(1, BASE_ROWS + 1):
        uid = f"U{i:03d}"
        email = f"user{i:03d}@mail.com"
        phone = f"+2289{rng.randint(1000000, 9999999)}"
        row = {
            "user_id": uid,
            "email": email if rng.random() > 0.05 else "",
            "phone": phone if rng.random() > 0.08 else None,
            "country": choose(rng, countries),
            "channel": choose(rng, channels),
            "signup_date": rand_date(rng, start, 20),
            "last_active": rand_date(rng, start, 30),
            "revenue": None if rng.random() < 0.18 else round(rng.uniform(0, 5000), 2),
        }
        rows.append(row)

    # exact duplicates (copy existing rows)
    idxs = random.Random(7).sample(range(len(rows)), EXACT_DUPES)
    for i in idxs:
        rows.append(dict(rows[i]))

    # user_id updates: same user_id with newer last_active and more complete fields
    update_idxs = random.Random(9).sample(range(len(rows)), UPDATES)
    for i in update_idxs:
        base = dict(rows[i])
        base["last_active"] = rand_date(rng, start, 40)
        if base.get("country") in (None, ""):
            base["country"] = "  togo"
        if base.get("channel") in (None, ""):
            base["channel"] = "Facebook"
        rows.append(base)

    # identity conflict: same email on multiple user_id
    conflict_idxs = random.Random(11).sample(range(len(rows)), CONFLICTS)
    for i in conflict_idxs:
        base = dict(rows[i])
        base["user_id"] = f"U{rng.randint(310, 360):03d}"
        rows.append(base)

    out_path = Path(__file__).resolve().parent / "users_identity_messy.csv"
    out_path.parent.mkdir(parents=True, exist_ok=True)

    fieldnames = ["user_id", "email", "phone", "country", "channel", "signup_date", "last_active", "revenue"]
    with out_path.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        for r in rows:
            w.writerow({k: ("" if r.get(k) is None else r.get(k)) for k in fieldnames})

    print("✅ Generated users_identity_messy.csv | rows:", len(rows))


if __name__ == "__main__":
    main()

