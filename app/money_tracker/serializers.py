"""
Serializers for splitapp APIs.
"""
from rest_framework import serializers

from django.contrib.auth import get_user_model

from core.models import Group, GroupBalances, Transaction, NonMember, Settle


class GroupSerialzer(serializers.ModelSerializer):
    """Serializer for Groups."""

    class Meta:
        model = Group
        fields = ["id", "title", "budget", "amt_spent"]
        read_only_fields = ["id"]


class MemberSerializer(serializers.ModelSerializer):
    """Serializers for Members."""

    class Meta:
        model = get_user_model()
        fields = ["id", "name"]
        read_only_fields = ["id"]


class NonMemberSerializer(serializers.ModelSerializer):
    """Serializers for Non-Members."""

    class Meta:
        model = NonMember
        fields = ["id", "name"]
        read_only_fields = ["id"]


class GroupBalancesSerializer(serializers.ModelSerializer):
    """Serializers for Group Balances."""

    class Meta:
        model = GroupBalances
        fields = [
            "id",
            "member_id",
            "non_member_id",
            "group_id",
            "owes",
            "gets",
        ]
        read_only_fields = ["id"]


class TransactionSerialzer(serializers.ModelSerializer):
    """Serializer for Transactions."""

    class Meta:
        model = Transaction
        fields = [
            "id",
            "category",
            "date",
            "group_id",
            "added_by",
            "amt",
            "payed_by",
            "owes_by",
        ]
        read_only_fields = ["id"]


class SettleSerializer(serializers.ModelSerializer):
    """Serializers for Settles."""

    class Meta:
        model = Settle
        fields = ["id", "date", "group_id", "added_by", "pays", "gets", "amt"]
        read_only_fields = ["id"]
