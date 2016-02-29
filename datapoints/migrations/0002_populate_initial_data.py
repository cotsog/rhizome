# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
import jsonfield.fields
import django.db.models.deletion
from django.conf import settings

import pandas as pd
from datapoints.models import Location, LocationPolygon
from django.db.models import get_app, get_models

def populate_initial_data(apps, schema_editor):
    '''
    Here, we take an excel file that has the same schema as the database
    we lookup the approriate model and bulk insert.

    We need to ingest the data itself in the same order as the excel
    sheet otherwise we will have foreign key constraint issues.
    '''

    process_meta_data()
    process_geo_json()
    process_initial_source_data()

def process_meta_data():

    xl = pd.ExcelFile('initial_data.xlsx')
    all_sheets = xl.sheet_names

    datapoints_app = get_app('datapoints')
    auth_app = get_app('auth')
    source_data_app = get_app('source_data')

    models_to_process = {}

    all_models = get_models(datapoints_app) + get_models(auth_app) + \
        get_models(source_data_app)

    for model in all_models:
        ## iterate through the models in the datapoints app and create a lookup
        ## for {'sheet_name': Model} .. for instance -> {'indicator': Indicator}

        if model._meta.db_table in all_sheets:
            models_to_process[model._meta.db_table] = model

    for sheet in all_sheets:
        ## if the sheet has a cooresponding model, create a data frame out of
        ## the sheet anf bulk insert the data using the model_df_to_data fn

        try:
            model = models_to_process[sheet]
            print 'processing sheet ' + sheet
            model_df = xl.parse(sheet)
            model_ids = model_df_to_data(model_df,model)
        except KeyError:
            pass

def process_geo_json():

    try:
        geo_json_df = pd.read_csv('geo_json.txt',delimiter = "|")
    except IOError:
        return

    geo_json_df = pd.read_csv('geo_json.txt',delimiter = "|")
    location_df = pd.DataFrame(list(Location.objects.all()\
        .values_list('id','location_code')),columns=['location_id','location_code'])
    merged_df = location_df.merge(geo_json_df)[['location_id','geo_json']]
    model_df_to_data(merged_df, LocationPolygon)

def process_initial_source_data():
    pass

def model_df_to_data(model_df,model):

    meta_ids = []

    non_null_df = model_df.where((pd.notnull(model_df)), None)
    list_of_dicts = non_null_df.transpose().to_dict()

    for row_ix, row_dict in list_of_dicts.iteritems():

        row_id = model.objects.create(**row_dict)
        meta_ids.append(row_id)

    return meta_ids


class Migration(migrations.Migration):

    dependencies = [
        ('datapoints', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(populate_initial_data),
    ]