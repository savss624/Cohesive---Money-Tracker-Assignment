"""
Database Models.
"""
from django.db import models
from django.contrib.auth.models import (
    AbstractBaseUser,
    BaseUserManager,
    PermissionsMixin,
)


class UserManager(BaseUserManager):
    """Manager for Users"""

    def create_user(self, email, password=None, **extra_fields):
        """create, save and return a new user."""
        if not email:
            raise ValueError("User must have a email address.")
        user = self.model(email=self.normalize_email(email), **extra_fields)
        user.set_password(password)
        user.save(using=self._db)

        return user

    def create_superuser(self, email, password):
        """create, save and return new superuser."""
        user = self.create_user(email, password)
        user.is_staff = True
        user.is_superuser = True
        user.save(using=self._db)

        return user


class User(AbstractBaseUser, PermissionsMixin):
    """User in the system."""

    email = models.EmailField(max_length=255, unique=True)
    name = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = UserManager()

    USERNAME_FIELD = "email"


class Group(models.Model):
    """Group objects."""

    title = models.CharField(max_length=255)
    budget = models.IntegerField()
    amt_spent = models.IntegerField(default=0)

    def __str__(self):
        return self.title


class NonMember(models.Model):
    """Non-Member objects."""

    name = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True)


class GroupBalances(models.Model):
    """Group Balances objects."""

    member_id = models.IntegerField(default=-1)
    non_member_id = models.IntegerField(default=-1)
    group_id = models.IntegerField()
    owes = models.JSONField(default=dict)
    gets = models.JSONField(default=dict)


class Transaction(models.Model):
    """Transaction objects."""

    category = models.CharField(max_length=255)
    date = models.DateTimeField(auto_now_add=True)
    group_id = models.IntegerField()
    added_by = models.IntegerField()
    amt = models.FloatField()
    payed_by = models.JSONField(default=dict)
    owes_by = models.JSONField(default=dict)

    def __str__(self):
        return self.category


class Settle(models.Model):
    """Settle objects."""

    date = models.DateTimeField(auto_now_add=True)
    group_id = models.IntegerField()
    added_by = models.IntegerField()
    pays = models.CharField(max_length=255)
    gets = models.CharField(max_length=255)
    amt = models.FloatField()
