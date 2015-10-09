# -*- coding: utf-8 -*-
from __future__ import unicode_literals
import json

from django.db import models, migrations
from datapoints.models import CustomDashboard, CustomChart
import jsonfield.fields


class Migration(migrations.Migration):


    dependencies = [
        ('datapoints', '0014_indicator_bound'),
    ]

    operations = [
        migrations.CreateModel(
            name='CustomChart',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('chart_json', jsonfield.fields.JSONField()),
            ],
            options={
                'db_table': 'custom_chart',
            },
        ),
        migrations.AddField(
            model_name='customchart',
            name='dashboard',
            field=models.ForeignKey(to='datapoints.CustomDashboard'),
        ),

    migrations.RemoveField(
        model_name='customdashboard',
        name='dashboard_json',
        ),
    ]
