# Generated by Django 3.2.16 on 2023-01-08 17:56

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Group',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=255)),
                ('budget', models.IntegerField()),
                ('amt_spent', models.IntegerField(default=0)),
            ],
        ),
        migrations.CreateModel(
            name='GroupBalances',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('member_id', models.IntegerField(default=-1)),
                ('non_member_id', models.IntegerField(default=-1)),
                ('group_id', models.IntegerField()),
                ('owes', models.JSONField(default=dict)),
                ('gets', models.JSONField(default=dict)),
            ],
        ),
        migrations.CreateModel(
            name='NonMember',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255)),
                ('is_active', models.BooleanField(default=True)),
            ],
        ),
        migrations.CreateModel(
            name='Settle',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('date', models.DateTimeField(auto_now_add=True)),
                ('group_id', models.IntegerField()),
                ('added_by', models.IntegerField()),
                ('pays', models.CharField(max_length=255)),
                ('gets', models.CharField(max_length=255)),
                ('amt', models.IntegerField()),
            ],
        ),
        migrations.CreateModel(
            name='Transaction',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('category', models.CharField(max_length=255)),
                ('date', models.DateTimeField(auto_now_add=True)),
                ('group_id', models.IntegerField()),
                ('added_by', models.IntegerField()),
                ('amt', models.IntegerField()),
                ('payed_by', models.JSONField(default=dict)),
                ('owes_by', models.JSONField(default=dict)),
            ],
        ),
    ]
