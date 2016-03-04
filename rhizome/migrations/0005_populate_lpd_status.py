# -*- coding: utf-8 -*-
from __future__ import unicode_literals

import jsonfield.fields
import django.db.models.deletion
from django.db import models, migrations
from django.conf import settings
from django.db.models import get_app, get_models

from pandas import DataFrame
from random import randint, random

from rhizome.cache_meta import minify_geo_json, LocationTreeCache
from rhizome.models import Location, Indicator, Campaign, DataPointComputed
from source_data.models import Document, DocumentDetail, DocDetailType
from source_data.etl_tasks.transform_upload import DocTransform
from source_data.etl_tasks.refresh_master import MasterRefresh
from rhizome.agg_tasks import AggRefresh

def populate_lpd_status(apps, schema_editor):
    '''
    '''

    ind = Indicator.objects.get(name = 'LPD Status')
    lpds = list(Location.objects.filter(lpd_status__in = [1,2])\
        .values_list('id','lpd_status'))
    low_performing_procinves = [[33,1],[5,1],[29,1],[19,1],[25,1],[17,2],\
        [15,2],[32,2],[8,2],[26,2],[30,2],[6,2]]
    ## fix this to take the top half of districts where lpds exist ##

    lpds.extend(low_performing_procinves)

    dwc_batch = []
    for location_id, lpd_status in lpds:
        data_batch = build_lpd_data_batch(location_id, lpd_status, ind.id)
        dwc_batch.extend(data_batch)

    DataPointComputed.objects.filter(indicator_id=ind).delete()
    DataPointComputed.objects.bulk_create(dwc_batch)

def build_lpd_data_batch(location_id, lpd_status, lpd_indicator_id):

    batch = []
    for c in Campaign.objects.all().values_list('id',flat=True):
        dwc_obj = DataPointComputed(**{
            'location_id': location_id,
            'indicator_id': lpd_indicator_id,
            'campaign_id': c,
            'value': lpd_status,
            'cache_job_id': -1
        })
        batch.append(dwc_obj)

    return batch

class Migration(migrations.Migration):

    dependencies = [
        ('rhizome', '0004_populate_fake_computed_data'),
    ]

    operations = [
        migrations.RunPython(populate_lpd_status),
    ]