"""
apps/users/models.py
Mirrors Spring Boot UserModel — table: users
managed = False (table already exists in Supabase)

Fix: Django's AbstractBaseUser adds last_login, is_superuser automatically.
Since our Spring Boot table doesn't have these columns, we override them
to point to columns that DO exist, or exclude them entirely.
"""
from django.db import models
from django.contrib.auth.base_user import AbstractBaseUser, BaseUserManager


class UserManager(BaseUserManager):
    def create_user(self, email, username, password="", **extra):
        # Remove Django fields that don't exist in our Spring Boot table
        extra.pop("is_staff", None)
        extra.pop("is_superuser", None)
        user = self.model(email=self.normalize_email(email), username=username, **extra)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, username, password="", **extra):
        extra.setdefault("role", "ADMIN")
        extra.pop("is_staff", None)
        extra.pop("is_superuser", None)
        return self.create_user(email, username, password, **extra)

class User(AbstractBaseUser):
    """
    Uses AbstractBaseUser (NOT PermissionsMixin) to avoid
    is_superuser, groups, user_permissions columns that don't
    exist in the Spring Boot users table.
    """

    class Role(models.TextChoices):
        USER = "USER", "User"
        ADMIN = "ADMIN", "Admin"
        RECEPTIONIST = "RECEPTIONIST", "Receptionist"

    # Matches Spring Boot: Long id @GeneratedValue IDENTITY
    id = models.BigAutoField(primary_key=True)

    # Matches Spring Boot: String username unique
    username = models.CharField(max_length=150, unique=True)

    # Matches Spring Boot: String email unique
    email = models.EmailField(unique=True)

    # Matches Spring Boot: String password
    password = models.CharField(max_length=255)

    # Matches Spring Boot: Role role default USER
    role = models.CharField(max_length=12, choices=Role.choices, default=Role.USER)

    # Matches Spring Boot: LocalDateTime createdAt
    created_at = models.DateTimeField(auto_now_add=True, db_column="created_at")

    # Matches Spring Boot: LocalDateTime updatedAt
    updated_at = models.DateTimeField(null=True, blank=True, db_column="updated_at")

    # Django requires these but they are NOT stored in DB
    # We define them as Python properties only
    is_active = True   # always active — not a DB column
    is_staff  = False  # not a DB column

    # Override last_login to prevent Django from querying it
    last_login = None  # removes the last_login column requirement

    objects = UserManager()

    USERNAME_FIELD  = "email"
    REQUIRED_FIELDS = ["username"]

    class Meta:
        db_table = "users"
        managed  = False  # table already exists from Spring Boot

    def __str__(self):
        return self.email

    def has_perm(self, perm, obj=None):
        return self.role == self.Role.ADMIN

    def has_module_perms(self, app_label):
        return self.role == self.Role.ADMIN

"""
OtpToken model — mirrors Spring Boot OtpToken entity exactly.
Table: otp_tokens

Add this class to apps/users/models.py
"""
from django.db import models


class OtpToken(models.Model):
    """
    Java field                    Django field
    ──────────────────────────────────────────────
    Long id (IDENTITY)         →  BigAutoField primary_key
    String email               →  CharField
    String otp                 →  CharField
    LocalDateTime expiresAt    →  DateTimeField
    boolean used default false →  BooleanField default False
    LocalDateTime createdAt    →  DateTimeField auto_now_add
    """

    id         = models.BigAutoField(primary_key=True)
    email      = models.CharField(max_length=255)
    otp        = models.CharField(max_length=6)
    expires_at = models.DateTimeField(db_column="expires_at")
    used       = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True, db_column="created_at")

    class Meta:
        db_table = "otp_tokens"
        managed  = False    # table already exists from Spring Boot

    def __str__(self):
        return f"OTP for {self.email} ({'used' if self.used else 'active'})"