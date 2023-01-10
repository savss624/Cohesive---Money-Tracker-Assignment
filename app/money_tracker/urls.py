"""
URL mappings for the split app.
"""
from django.urls import path

from money_tracker import views


app_name = "money-tracker"

urlpatterns = [
    path("", views.react_ui),
    path(
        "api/groups/",
        views.GroupViewSet.as_view({"get": "list", "post": "create"}),
        name="group-list-create",
    ),
    path(
        "api/groups/<int:pk>/",
        views.GroupViewSet.as_view({"patch": "update", "delete": "destroy"}),
        name="group-update-destroy",
    ),
    path(
        "api/<int:group_id>/user-transactions-summary/<int:user_id>/",
        views.GroupBalancesViewSet.as_view({"get": "retrieve"}),
        name="user-transaction-summary",
    ),
    path(
        "api/join-group/",
        views.GroupBalancesViewSet.as_view({"post": "create"}),
        name="add-member",
    ),
    path(
        "api/<int:group_id>/members/",
        views.MemberViewSet.as_view({"get": "list"}),
        name="member-list",
    ),
    path(
        "api/<int:group_id>/non-members/",
        views.NonMemberViewSet.as_view({"get": "list"}),
        name="non-member-list",
    ),
    path(
        "api/<int:group_id>/transactions/",
        views.TransactionViewSet.as_view({"get": "list"}),
        name="transaction-list",
    ),
    path(
        "api/transactions/",
        views.TransactionViewSet.as_view({"post": "create"}),
        name="transaction-create",
    ),
    path(
        "api/transactions/<int:pk>/",
        views.TransactionViewSet.as_view(
            {"patch": "update", "delete": "destroy"}
        ),
        name="transaction-update-destroy",
    ),
    path(
        "api/<int:group_id>/settles/",
        views.SettleViewSet.as_view({"get": "list"}),
        name="settle-list",
    ),
    path(
        "api/settles/",
        views.SettleViewSet.as_view({"post": "create"}),
        name="settle-create",
    ),
    path(
        "api/settles/<int:pk>/",
        views.SettleViewSet.as_view({"delete": "destroy"}),
        name="settle-destroy",
    ),
]
