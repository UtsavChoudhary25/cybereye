import sys
import argparse
import getpass
import datetime
from app.database.session import SessionLocal, engine, Base
from app.models.database import User
from app.core.security import hash_password

def create_or_promote_admin(email: str, password: str, full_name: str = "SOC Administrator"):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        clean_email = email.lower().strip()
        user = db.query(User).filter(User.email == clean_email).first()

        if user:
            print(f"[*] User {clean_email} exists. Promoting to 'admin' role and updating credentials...")
            user.role = "admin"
            user.hashed_password = hash_password(password)
            user.is_active = True
            user.is_verified = True
            user.updated_at = datetime.datetime.now(datetime.timezone.utc)
            db.commit()
            print(f"[+] Successfully promoted {clean_email} to Administrator.")
        else:
            print(f"[*] Creating new Administrator account: {clean_email}...")
            new_user = User(
                email=clean_email,
                hashed_password=hash_password(password),
                full_name=full_name,
                role="admin",
                is_active=True,
                is_verified=True,
                created_at=datetime.datetime.now(datetime.timezone.utc)
            )
            db.add(new_user)
            db.commit()
            print(f"[+] Successfully created Administrator account {clean_email}.")
    except Exception as e:
        db.rollback()
        print(f"[-] Error creating admin: {e}", file=sys.stderr)
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="CyberEye Initial Administrator Setup Utility")
    parser.add_argument("--email", help="Administrator email address")
    parser.add_argument("--password", help="Administrator password (min 8 chars)")
    parser.add_argument("--name", default="SOC Administrator", help="Administrator display name")

    args = parser.parse_args()

    email = args.email
    if not email:
        email = input("Enter Administrator Email: ").strip()

    password = args.password
    if not password:
        password = getpass.getpass("Enter Administrator Password (min 8 chars): ").strip()

    if len(password) < 8:
        print("[-] Password must be at least 8 characters.", file=sys.stderr)
        sys.exit(1)

    create_or_promote_admin(email=email, password=password, full_name=args.name)
