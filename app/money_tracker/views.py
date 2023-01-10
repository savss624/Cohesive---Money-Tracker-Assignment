"""
Views for the splitapp APIs.
"""
import json

from django.shortcuts import render
from django.contrib.auth import get_user_model

from rest_framework import status
from rest_framework import viewsets
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from core.models import Group, NonMember, GroupBalances, Transaction, Settle
from money_tracker import serializers


def react_ui(request):
    return render(request, "money-tracker.html")


class GroupViewSet(viewsets.ModelViewSet):
    """View for manage group APIs."""

    serializer_class = serializers.GroupSerialzer
    queryset = Group.objects.all()
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Retrieve groups for authenticated user."""

        balances = GroupBalances.objects.filter(member_id=self.request.user.id)
        group_ids = [balance.group_id for balance in balances]
        return self.queryset.filter(id__in=group_ids).order_by("-id")

    def create(self, request, *args, **kwargs):
        """Create group instance and add current user to it."""

        res = super().create(request, *args, **kwargs)
        if res.status_code == status.HTTP_201_CREATED:
            GroupBalances.objects.create(
                member_id=self.request.user.id, group_id=res.data["id"]
            )
        return res

    def destroy(self, request, *args, **kwargs):
        """
        Delete group instance and all transactions, balances and settlements
        associated with it.
        """

        res = super().destroy(request, *args, **kwargs)
        if res.status_code == status.HTTP_204_NO_CONTENT:
            group_id = kwargs.get("pk")
            Transaction.objects.filter(group_id=group_id).delete()
            Settle.objects.filter(group_id=group_id).delete()
            GroupBalances.objects.filter(group_id=group_id).delete()
        return res


class GroupBalancesViewSet(viewsets.ModelViewSet):
    """View for manage Group Balances for users APIs."""

    serializer_class = serializers.GroupBalancesSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def retrieve(self, request, *args, **kwargs):
        """Retrieve group balances."""

        queryset = GroupBalances.objects.get(
            member_id=kwargs.get("user_id"),
            group_id=kwargs.get("group_id"),
        )

        serializer = self.get_serializer(queryset)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        """Create group balance for user."""

        queryset = GroupBalances.objects.create(
            member_id=self.request.data["user_id"],
            group_id=self.request.data["group_id"],
        )
        serializer = self.get_serializer(queryset)
        return Response(serializer.data)


class MemberViewSet(viewsets.ModelViewSet):
    """View for manage members APIs."""

    serializer_class = serializers.MemberSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def list(self, request, *args, **kwargs):
        """List of Members in a particular group."""

        balances = GroupBalances.objects.filter(
            group_id=kwargs.get("group_id")
        )
        user_ids = [balance.member_id for balance in balances]
        queryset = get_user_model().objects.filter(id__in=user_ids)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class NonMemberViewSet(viewsets.ModelViewSet):
    """View for manage non members APIs."""

    serializer_class = serializers.MemberSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def list(self, request, *args, **kwargs):
        """List of Non-Members in a particular group."""

        balances = GroupBalances.objects.filter(
            group_id=kwargs.get("group_id")
        )
        user_ids = [balance.non_member_id for balance in balances]
        queryset = NonMember.objects.filter(id__in=user_ids)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class TransactionViewSet(viewsets.ModelViewSet):
    """View for manage transactions APIs."""

    serializer_class = serializers.TransactionSerialzer
    queryset = Transaction.objects.all()
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def list(self, request, *args, **kwargs):
        """List all transactions of a group."""

        queryset = Transaction.objects.filter(group_id=kwargs.get("group_id"))
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def create_non_member_id(self, name, group_id):
        """Create a non member and a group balance for it."""

        non_member_id = NonMember.objects.create(name=name).id
        GroupBalances.objects.create(
            non_member_id=non_member_id, group_id=group_id
        )
        return non_member_id

    def simplify_group_balance(self, balances):
        """
        Simplify the each user's balance in a group.
        For eg: if a user owes 100 to someone
        and owed by that same person the same amount
        then that cuts down to 0.
        """

        for balance in balances:
            gets = balance.gets
            owes = balance.owes
            common_ids = set(list(gets.keys())).intersection(
                set(list(owes.keys()))
            )
            for id in common_ids:
                if gets[id] > owes[id]:
                    gets[id] -= owes[id]
                    owes[id] = 0
                else:
                    owes[id] -= gets[id]
                    gets[id] = 0
            for id, amt in gets.items():
                if amt < 0:
                    owes[id] = amt * -1
                    gets[id] = 0
            for id, amt in owes.items():
                if amt < 0:
                    gets[id] = amt * -1
                    owes[id] = 0
            balance.save()

    def update_group_balances(self, balances, amt, payed_by_ids, owes_by_ids):
        """Update group balance for all users after a transaction."""

        each_cut = amt / (len(owes_by_ids) * len(payed_by_ids))

        for balance in balances:
            if (
                "m_" + str(balance.member_id) in payed_by_ids
                or "nm_" + str(balance.non_member_id) in payed_by_ids
            ):
                for owes_by in list(set(owes_by_ids) - set(payed_by_ids)):
                    if owes_by == "m_" + str(
                        balance.member_id
                    ) or owes_by == "nm_" + str(balance.non_member_id):
                        continue
                    if owes_by in balance.gets:
                        balance.gets[owes_by] += each_cut
                    else:
                        balance.gets[owes_by] = each_cut
                balance.save()
            elif (
                "m_" + str(balance.member_id) in owes_by_ids
                or "nm_" + str(balance.non_member_id) in owes_by_ids
            ):
                for payed_by in payed_by_ids:
                    if payed_by in balance.owes:
                        balance.owes[payed_by] += each_cut
                    else:
                        balance.owes[payed_by] = each_cut
                balance.save()

    def get_transaction_balances(
        self, amt, payed_by_list, owes_by_list, group_id
    ):
        """
        Formats the the payed by and owed by data front FE
        and create a non member, if a user is not known.
        """

        payed_by_len = len(payed_by_list)
        owes_by_len = len(owes_by_list)

        payed_by = {}
        for id, name, member in payed_by_list:
            if id == "":
                id = "nm_" + str(self.create_non_member_id(name, group_id))
            payed_by[id] = amt / payed_by_len

        print(
            list(
                set(map(tuple, owes_by_list)) - set(map(tuple, payed_by_list))
            )
        )
        owes_by = {}
        for id, name, member in list(
            set(map(tuple, owes_by_list)) - set(map(tuple, payed_by_list))
        ):
            if id == "":
                id = "nm_" + str(self.create_non_member_id(name, group_id))
            owes_by[id] = amt / owes_by_len
        for id in payed_by:
            owes_by[id] = amt / owes_by_len

        return payed_by, owes_by

    def create(self, request, *args, **kwargs):
        """Create a transaction."""

        data = self.request.data
        print(data)
        amt = int(data["amt"])

        group = Group.objects.get(id=data["group_id"])
        group.amt_spent += amt
        group.save()

        payed_by, owes_by = self.get_transaction_balances(
            amt,
            data["payed_by"]["users"],
            data["owes_by"]["users"],
            data["group_id"],
        )
        print(payed_by, owes_by)

        balances = GroupBalances.objects.filter(group_id=data["group_id"])
        self.update_group_balances(
            balances, amt, list(payed_by.keys()), list(owes_by.keys())
        )
        self.simplify_group_balance(balances)

        request.data.update(
            {
                "payed_by": json.dumps(payed_by),
                "owes_by": json.dumps(owes_by),
            }
        )
        return super().create(request, *args, **kwargs)

    def reset_group_balances(self, balances, amt, payed_by_ids, owes_by_ids):
        """Resets group balances for a transaction."""

        each_cut = amt / (len(owes_by_ids) * len(payed_by_ids))

        for balance in balances:
            if (
                "m_" + str(balance.member_id) in payed_by_ids
                or "nm_" + str(balance.non_member_id) in payed_by_ids
            ):
                for owes_by in list(set(owes_by_ids) - set(payed_by_ids)):
                    if owes_by == "m_" + str(
                        balance.member_id
                    ) or owes_by == "nm_" + str(balance.non_member_id):
                        continue
                    if owes_by in balance.gets:
                        balance.gets[owes_by] -= each_cut
                balance.save()
            elif (
                "m_" + str(balance.member_id) in owes_by_ids
                or "nm_" + str(balance.non_member_id) in owes_by_ids
            ):
                for payed_by in payed_by_ids:
                    if payed_by in balance.owes:
                        balance.owes[payed_by] -= each_cut
                balance.save()

    def update(self, request, *args, **kwargs):
        """Updates a transaction."""

        data = self.request.data
        amt = int(data["amt"])

        transaction = self.get_object()

        group = Group.objects.get(id=data["group_id"])
        group.amt_spent -= transaction.amt
        group.amt_spent += amt
        group.save()

        payed_by, owes_by = self.get_transaction_balances(
            amt,
            data["payed_by"]["users"],
            data["owes_by"]["users"],
            data["group_id"],
        )

        balances = GroupBalances.objects.filter(group_id=data["group_id"])
        self.reset_group_balances(
            balances,
            transaction.amt,
            list(json.loads(transaction.payed_by).keys()),
            list(json.loads(transaction.owes_by).keys()),
        )
        self.update_group_balances(
            balances, amt, list(payed_by.keys()), list(owes_by.keys())
        )
        self.simplify_group_balance(balances)

        request.data.update(
            {
                "payed_by": json.dumps(payed_by),
                "owes_by": json.dumps(owes_by),
            }
        )
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        """Deletes a transaction."""

        transaction = Transaction.objects.get(id=kwargs.get("pk"))
        balances = GroupBalances.objects.filter(group_id=transaction.group_id)
        self.reset_group_balances(
            balances,
            transaction.amt,
            list(json.loads(transaction.payed_by).keys()),
            list(json.loads(transaction.owes_by).keys()),
        )
        self.simplify_group_balance(balances)

        return super().destroy(request, *args, **kwargs)


class SettleViewSet(viewsets.ModelViewSet):
    """View for manage settlements APIs."""

    serializer_class = serializers.SettleSerializer
    queryset = Settle.objects.all()
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def list(self, request, *args, **kwargs):
        """List all settlements in a group."""

        queryset = Settle.objects.filter(group_id=kwargs.get("group_id"))
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def get_balance(self, group_id, id):
        """Gets group balance for a user."""

        balances = GroupBalances.objects.filter(group_id=group_id)

        temp_id = int(id.split("_")[-1])
        member = True if id.split("_")[0] == "m" else False
        if member:
            balance = balances.get(member_id=temp_id)
        else:
            balance = balances.get(non_member_id=temp_id)
        return balance

    def create(self, request, *args, **kwargs):
        """Create a settlement."""
        
        res = super().create(request, *args, **kwargs)
        if res.status_code == status.HTTP_201_CREATED:
            data = self.request.data
            pays = data["pays"]
            gets = data["gets"]

            balance = self.get_balance(data["group_id"], pays)
            balance.owes[gets] = 0
            balance.save()
            balance = self.get_balance(data["group_id"], gets)
            balance.gets[pays] = 0
            balance.save()

        return res

    def destroy(self, request, *args, **kwargs):
        """Delete a settlement."""

        settle = Settle.objects.get(id=kwargs.get("pk"))
        pays = settle.pays
        gets = settle.gets

        balance = self.get_balance(settle.group_id, pays)
        balance.owes[gets] += settle.amt
        balance.save()
        balance = self.get_balance(settle.group_id, gets)
        balance.gets[pays] += settle.amt
        balance.save()

        return super().destroy(request, *args, **kwargs)
